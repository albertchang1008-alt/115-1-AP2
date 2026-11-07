/**
 * Zuvio 出題與成績回收（規格 docs/zuvio-exam/ZUVIO_EXAM_SPEC_1.16.0.md 第 9 節；9.10 考卷＋場次、9.11 出題介面）。
 * 全部教師限定；Firestore 規則維持預設全拒，只經這裡存取。
 */
import { Firestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { createHash, randomUUID } from 'node:crypto';
import { featureAccess } from './features';
import { reservedQuestionIds } from './assessments';
import { Question, Unit, chapterName, forClass, isReviewUnit, unitVisibility, safeId, safeCode } from '../../shared/model';
import {
  ZExamView, ZItem, ZParsed, ZBlock, ZResult, ZCounts, ZRosterInfo, LIMITS, CSV_FORMAT,
  eligibility, examCsv, matchExam, buildResults, examReport, compareSittings,
} from '../../shared/zuvio';

function fail(m: string): never { throw new HttpsError('failed-precondition', m); }
function bad(m: string): never { throw new HttpsError('invalid-argument', m); }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const FORMULA = /^[=+\-@\t\r]/;
const BAD_KEY = /^(__proto__|constructor|prototype)$|[/.]/;
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const PREVIEW_MS = 15 * 60 * 1000;
const USAGE_CAP = 6000;

function obj(x: any, keys: string[], what: string) {
  if (!x || typeof x !== 'object' || Array.isArray(x)) bad(`${what}格式錯誤`);
  for (const k of Object.keys(x)) if (!keys.includes(k)) bad(`${what}含有不允許的欄位：${k}`);
  return x;
}
const str = (v: any, max: number, what: string) => {
  if (typeof v !== 'string' || v.length > max) bad(`${what}格式錯誤`);
  return v as string;
};
const qid = (v: any) => { const s = str(v, 100, '題目ID'); if (!safeId(s)) bad('題目ID格式錯誤'); return s; };
const sid = (v: any) => { const s = str(v, 40, '學號').trim(); if (!s || BAD_KEY.test(s)) bad('學號格式錯誤'); return s; };

interface Bank { questions: Map<string, Question>; answers: Map<string, string> }

export function createZuvioHandlers(db: Firestore, access: (req: any, id: string, teacher?: boolean) => Promise<any>, options: any) {
  const guarded = featureAccess(access, 'zuvioExams');
  const teacher = async (req: any) => {
    obj(req.data, Object.keys(req.data || {}), '請求');
    const courseId = req.data.courseId;
    if (typeof courseId !== 'string' || !safeCode(courseId)) bad('課程代碼格式錯誤');
    const r = await guarded(req, courseId, true);
    if (!r.p.teacher) throw new HttpsError('permission-denied', '需要教師權限');
    return { ...r, courseId: courseId as string };
  };
  const examRef = (courseId: string, examId: string) => db.doc(`courses/${courseId}/zuvioExams/${examId}`);
  const examIdOf = (v: any) => { if (typeof v !== 'string' || !UUID.test(v)) bad('考卷識別碼格式錯誤'); return v as string; };

  async function loadBank(courseId: string, unitId: string, version: string): Promise<Bank> {
    const ref = db.doc(`banks/${courseId}_${unitId}_${version}`);
    const man = await ref.get();
    if (!man.exists) fail(`題庫版本不存在：${unitId}`);
    const m = man.data()!;
    if (m.unitId !== unitId || m.version !== version) fail(`題庫版本身分不符：${unitId}`);
    const chunks = await Promise.all((m.chunks || []).map((c: string) => ref.collection('chunks').doc(c).get()));
    if (chunks.some((c: any) => !c.exists)) fail(`題庫版本缺件：${unitId}`);
    const qs: Question[] = chunks.flatMap((c: any) => c.data()?.questions || []);
    const questions = new Map(qs.map((q) => [q.id, q]));
    if (questions.size !== qs.length) fail(`題庫題目ID重複：${unitId}`);
    const grading = await ref.collection('grading').doc('answers').get();
    let answers: Map<string, string>;
    if (grading.exists) {
      answers = new Map(Object.entries(grading.data()!.answers || {}) as [string, string][]);
      for (const q of qs) if (!answers.has(q.id)) fail(`題庫正解缺題：${unitId}`);
    } else answers = new Map(qs.map((q) => [q.id, q.answer]));
    for (const q of qs) {
      const ids = q.options.map((o) => o.id);
      if (new Set(ids).size !== ids.length || !ids.includes(answers.get(q.id)!)) fail(`題庫題目選項或正解不完整：${q.id}`);
    }
    return { questions, answers };
  }
  /** 保護名單：保留題＋正式場次凍結題（有界讀取） */
  async function protectedIds(courseId: string, c: any) {
    const ids = reservedQuestionIds(c);
    const sessions = await db.collection(`courses/${courseId}/assessments`).limit(51).get();
    if (sessions.docs.length > 50) fail('正式測驗場次超過 50 筆，無法確認保護名單，請聯絡開發者');
    for (const d of sessions.docs) for (const q of d.data()?.questions || []) if (q?.id) ids.add(q.id);
    return ids;
  }
  const publishedUnits = (c: any): Unit[] => (c.published?.units || []).filter((u: Unit) => !!u.bankVersion && !isReviewUnit(u) && unitVisibility(u) !== 'hidden' && !(c.assessmentSourceUnits || []).includes(u.id));
  const visibleTo = (c: any, unitId: string, classIds: string[]) => classIds.every((cl) => forClass(c.published, cl).units.some((u) => u.id === unitId));

  async function buildView(courseId: string, e: any, guard: Set<string>): Promise<{ view: ZExamView; masked: string[] }> {
    const keys = [...new Set(e.items.map((it: ZItem) => it.unitId + '|' + it.version))] as string[];
    const banks = new Map<string, Bank>();
    for (const k of keys) { const [u, v] = k.split('|'); banks.set(k, await loadBank(courseId, u, v)); }
    const masked: string[] = [];
    const items = e.items.map((it: ZItem) => {
      const b = banks.get(it.unitId + '|' + it.version)!;
      const q = b.questions.get(it.questionId);
      if (!q) fail(`舊版題庫缺題：${it.questionId}`);
      if (guard.has(it.questionId)) masked.push(it.questionId);
      return { ...it, text: q!.text, options: q!.options.map((o) => ({ id: o.id, text: o.text })), answer: b.answers.get(it.questionId)! };
    });
    return { view: { title: e.title, score: e.score, items }, masked };
  }
  const summary = (id: string, e: any) => ({ id, title: e.title, createdAt: e.createdAt, count: e.items.length, score: e.score, archived: !!e.archived, sittings: e.sittings || [] });
  const maskView = (v: ZExamView, masked: string[]) => ({
    ...v,
    items: v.items.map((it) => (masked.includes(it.questionId) ? { ...it, text: '（此題已列為正式測驗保留題，不顯示）', options: it.options.map((o) => ({ ...o, text: '—' })) } : it)),
  });

  // ---------- 出題 ----------
  const zuvioPool = onCall(options, async (req) => {
    const { c, courseId } = await teacher(req);
    if (!c.published) fail('課程尚未更新到學生端');
    const guard = await protectedIds(courseId, c);
    const entries: any[] = [];
    const excluded: Record<string, number> = { image: 0, reserved: 0, unsafe: 0, invalid: 0 };
    const classes: string[] = c.published.classIds || [];
    const unitClasses: Record<string, string[]> = {};
    for (const u of publishedUnits(c)) {
      unitClasses[u.id] = classes.filter((cl) => visibleTo(c, u.id, [cl]));
      const b = await loadBank(courseId, u.id, u.bankVersion);
      for (const q of b.questions.values()) {
        const why = eligibility({ ...q, answer: b.answers.get(q.id)! }, guard);
        if (why) { excluded[why]++; continue; }
        entries.push({ unitId: u.id, unitTitle: u.title, group: chapterName(u), version: u.bankVersion, question: { id: q.id, text: q.text, options: q.options.map((o) => ({ id: o.id, text: o.text })), answer: b.answers.get(q.id) } });
      }
    }
    const usage = (await db.doc(`courses/${courseId}/zuvioMeta/usage`).get()).data()?.q || {};
    return { entries, excluded, usage, classes, unitClasses };
  });

  const zuvioCreateExam = onCall(options, async (req) => {
    const { p, c, courseId } = await teacher(req);
    obj(req.data, ['courseId', 'examId', 'title', 'score', 'classIds', 'items'], '考卷');
    const examId = examIdOf(req.data.examId);
    const title = str(req.data.title, 80, '考卷名稱').trim();
    if (!title || title.length > 60 || FORMULA.test(title)) bad('考卷名稱需 1–60 字，且不能以 = + - @ 開頭');
    const score = req.data.score;
    if (!Number.isInteger(score) || score < 1 || score > 100) bad('每題配分需為 1–100 的整數');
    if (!c.published) fail('課程尚未更新到學生端');
    const published: string[] = c.published.classIds || [];
    const classIds = req.data.classIds;
    if (!Array.isArray(classIds) || !classIds.length || classIds.length > 50) bad('至少選一個班級');
    for (const cl of classIds) if (typeof cl !== 'string' || !safeCode(cl) || !published.includes(cl)) bad('班級不屬於本課程的發布班級');
    const raw = req.data.items;
    if (!Array.isArray(raw) || !raw.length || raw.length > LIMITS.blocks) bad(`題數需為 1–${LIMITS.blocks}`);
    const units = new Map(publishedUnits(c).map((u) => [u.id, u]));
    const guard = await protectedIds(courseId, c);
    const banks = new Map<string, Bank>();
    const seen = new Set<string>();
    const items: ZItem[] = [];
    for (const r of raw) {
      obj(r, ['questionId', 'unitId', 'version', 'optionOrder'], '題目');
      const questionId = qid(r.questionId);
      const unitId = str(r.unitId, 50, '次單元');
      const version = str(r.version, 100, '題庫版本');
      if (seen.has(questionId)) bad('考卷內有重複題目');
      seen.add(questionId);
      const u = units.get(unitId);
      if (!u || u.bankVersion !== version) fail('題目不屬於目前發布的題庫版本，請重新整理後再出題');
      if (!visibleTo(c, unitId, classIds)) fail(`「${u.title}」不是所有選取班級都看得到`);
      if (!banks.has(unitId)) banks.set(unitId, await loadBank(courseId, unitId, version));
      const b = banks.get(unitId)!;
      const q = b.questions.get(questionId);
      if (!q) fail('題目不存在於該題庫版本');
      const why = eligibility({ ...q!, answer: b.answers.get(questionId)! }, guard);
      if (why) fail(`題目 ${questionId} 不能輸出（${why === 'reserved' ? '正式測驗保留題' : why === 'image' ? '圖片題' : '內容無法安全輸出'}）`);
      const order = r.optionOrder;
      const ids = q!.options.map((o) => o.id);
      if (!Array.isArray(order) || order.length !== ids.length || new Set(order).size !== ids.length || order.some((x: any) => !ids.includes(x))) bad('選項順序不合法');
      items.push({ questionId, unitId, version, optionOrder: [...order] });
    }
    const base = { title, score, classIds: [...classIds], items, csvFormat: CSV_FORMAT, createdAt: Date.now(), createdBy: p.uid, archived: false, sittings: [] as any[] };
    const { view } = await buildView(courseId, base, new Set());
    const csv = examCsv(view);
    const exam = { ...base, csvSha256: sha(csv) };
    const ref = examRef(courseId, examId);
    await db.runTransaction(async (tx) => {
      const old = await tx.get(ref);
      if (old.exists) {
        if (old.data()!.csvSha256 === sha(csv) && old.data()!.createdBy === p.uid) return; // 冪等重送
        fail('考卷識別碼已被使用');
      }
      tx.create(ref, exam);
    });
    return { examId, csv };
  });

  // ---------- 考卷與場次 ----------
  const zuvioListExams = onCall(options, async (req) => {
    const { courseId } = await teacher(req);
    obj(req.data, ['courseId', 'includeArchived'], '請求');
    if (req.data.includeArchived !== undefined && typeof req.data.includeArchived !== 'boolean') bad('includeArchived 需為布林');
    const snap = await db.collection(`courses/${courseId}/zuvioExams`).orderBy('createdAt', 'desc').limit(200).get();
    return snap.docs.map((d) => summary(d.id, d.data())).filter((e) => req.data.includeArchived || !e.archived);
  });

  const zuvioGetExam = onCall(options, async (req) => {
    const { c, courseId } = await teacher(req);
    obj(req.data, ['courseId', 'examId'], '請求');
    const id = examIdOf(req.data.examId);
    const snap = await examRef(courseId, id).get();
    if (!snap.exists) fail('找不到考卷');
    const e = snap.data()!;
    const { view, masked } = await buildView(courseId, e, await protectedIds(courseId, c));
    let csv: string | null = null;
    if (!masked.length) {
      csv = examCsv(view);
      if (sha(csv) !== e.csvSha256) fail('重建的 CSV 與建立時不同，已停止下載，請聯絡開發者');
    }
    return { summary: summary(id, e), view: maskView(view, masked), csv, classIds: e.classIds, masked: masked.length };
  });

  const zuvioArchiveExam = onCall(options, async (req) => {
    const { courseId } = await teacher(req);
    obj(req.data, ['courseId', 'examId', 'archived'], '請求');
    const id = examIdOf(req.data.examId);
    if (typeof req.data.archived !== 'boolean') bad('archived 需為布林');
    const ref = examRef(courseId, id);
    await db.runTransaction(async (tx) => {
      const s = await tx.get(ref);
      if (!s.exists) fail('找不到考卷');
      tx.update(ref, { archived: req.data.archived });
    });
    return { ok: true };
  });

  const zuvioCreateSitting = onCall(options, async (req) => {
    const { c, courseId } = await teacher(req);
    obj(req.data, ['courseId', 'examId', 'label', 'date', 'classIds'], '場次');
    const id = examIdOf(req.data.examId);
    const label = str(req.data.label, 60, '場次名稱').trim();
    if (!label || label.length > 40 || FORMULA.test(label)) bad('場次名稱需 1–40 字');
    const date = str(req.data.date, 10, '日期');
    if (!DATE.test(date)) bad('日期格式需為 YYYY-MM-DD');
    const classIds = req.data.classIds;
    if (!Array.isArray(classIds) || !classIds.length || classIds.length > 50 || classIds.some((x: any) => typeof x !== 'string' || !safeCode(x))) bad('至少選一個班級');
    const ref = examRef(courseId, id);
    const usageRef = db.doc(`courses/${courseId}/zuvioMeta/usage`);
    const sitting = { id: randomUUID(), label, date, classIds: [...new Set(classIds as string[])] };
    await db.runTransaction(async (tx) => {
      const [s, u] = [await tx.get(ref), await tx.get(usageRef)];
      if (!s.exists) fail('找不到考卷');
      const e = s.data()!;
      if (e.archived) fail('考卷已封存');
      const published: string[] = c.published?.classIds || [];
      if (sitting.classIds.some((x) => !e.classIds.includes(x) || !published.includes(x))) fail('場次班級需屬於這份考卷的班級且仍在發布名單');
      if ((e.sittings || []).length >= 30) fail('場次數已達上限 30');
      const q = { ...(u.data()?.q || {}) };
      for (const it of e.items) q[it.questionId] = { n: (q[it.questionId]?.n || 0) + 1, last: Date.now() };
      if (Object.keys(q).length > USAGE_CAP) fail('出題紀錄過多，請聯絡開發者清理');
      tx.update(ref, { sittings: [...(e.sittings || []), sitting] });
      tx.set(usageRef, { q });
    });
    return sitting;
  });

  // ---------- 成績匯入 ----------
  function sanitizeParsed(raw: any): ZParsed {
    if (Buffer.byteLength(JSON.stringify(raw ?? null)) > 1_000_000) bad('成績資料超過 1 MB');
    obj(raw, ['title', 'blocks', 'summaryIds', 'problems'], '成績資料');
    const title = str(raw.title, 200, '考卷名稱');
    if (!Array.isArray(raw.blocks) || raw.blocks.length > LIMITS.blocks) bad('題數超過上限');
    const blocks: ZBlock[] = raw.blocks.map((b: any) => {
      obj(b, ['n', 'stem', 'score', 'correctNo', 'options', 'responses'], '題目區塊');
      if (!Number.isInteger(b.n) || !Number.isInteger(b.correctNo)) bad('題目區塊格式錯誤');
      if (!Array.isArray(b.options) || b.options.length > LIMITS.options) bad('選項過多');
      if (!Array.isArray(b.responses) || b.responses.length > LIMITS.students) bad('作答人數超過上限');
      return {
        n: b.n, stem: str(b.stem, 2000, '題幹'), score: str(b.score, 20, '配分'), correctNo: b.correctNo,
        options: b.options.map((o: any) => { obj(o, ['no', 'text'], '選項'); if (!Number.isInteger(o.no)) bad('選項格式錯誤'); return { no: o.no, text: str(o.text, 1000, '選項') }; }),
        responses: b.responses.map((r: any) => { obj(r, ['studentId', 'answerText', 'row'], '作答'); return { studentId: sid(r.studentId), answerText: str(r.answerText, 1000, '回答'), row: Number.isInteger(r.row) ? r.row : 0 }; }),
      };
    });
    const summaryIds = Array.isArray(raw.summaryIds) ? raw.summaryIds.slice(0, LIMITS.students).map(sid) : [];
    const problems = Array.isArray(raw.problems) ? raw.problems.slice(0, 20).map((x: any) => str(x, 200, '問題')) : [];
    return { title, blocks, summaryIds, problems };
  }
  async function rosterLookup(courseId: string, ids: string[], c: any) {
    if (c.rosterVersion !== 2) fail('此課程仍是舊版名冊，請先完成名冊遷移再匯入 Zuvio 成績');
    const published: string[] = c.published?.classIds || [];
    const map = new Map<string, ZRosterInfo | null>();
    await Promise.all(ids.map(async (s) => {
      const key = await db.doc(`courses/${courseId}/studentIds/${s}`).get();
      const email = key.data()?.email;
      if (!email) return map.set(s, null);
      const en = (await db.doc(`enrollments/${courseId}__${email}`).get()).data();
      if (!en || en.courseId !== courseId || en.studentId !== s) return map.set(s, null);
      map.set(s, { classId: en.classId, enabled: en.enabled === true && published.includes(en.classId) });
    }));
    return map;
  }
  async function computeImport(courseId: string, c: any, examId: string, sittingId: string, parsed: ZParsed) {
    const snap = await examRef(courseId, examId).get();
    if (!snap.exists) fail('找不到考卷');
    const e = snap.data()!;
    if (e.archived) fail('考卷已封存');
    const sitting = (e.sittings || []).find((s: any) => s.id === sittingId);
    if (!sitting) fail('找不到場次');
    const { view } = await buildView(courseId, e, new Set());
    const match = matchExam(view, parsed);
    const ids = [...new Set(parsed.blocks.flatMap((b) => b.responses.map((r) => r.studentId)))];
    const roster = await rosterLookup(courseId, ids, c);
    const built = buildResults(view, parsed, match, (s) => roster.get(s) || null, sitting.classIds);
    const rosterSha = sha(JSON.stringify([...roster].sort(([a], [b]) => a.localeCompare(b))));
    return { e, sitting, built, match, rosterSha };
  }
  const zuvioImportResults = onCall({ ...options, timeoutSeconds: 120 }, async (req) => {
    const { p, c, courseId } = await teacher(req);
    obj(req.data, ['courseId', 'examId', 'sittingId', 'parsed', 'confirm', 'previewId'], '請求');
    const examId = examIdOf(req.data.examId);
    const sittingId = examIdOf(req.data.sittingId);
    if (req.data.confirm !== undefined && typeof req.data.confirm !== 'boolean') bad('confirm 需為布林');
    const parsed = sanitizeParsed(req.data.parsed);
    const payloadSha = sha(JSON.stringify(parsed));
    const { sitting, built, match, rosterSha } = await computeImport(courseId, c, examId, sittingId, parsed);
    const ref = examRef(courseId, examId);
    if (req.data.confirm !== true) {
      const previewId = randomUUID();
      if (!built.blocking.length)
        await ref.collection('previews').doc(previewId).set({ teacherUid: p.uid, sittingId, payloadSha, rosterSha, revision: sitting.results?.revision || 0, expiresAt: Date.now() + PREVIEW_MS });
      return { previewId: built.blocking.length ? '' : previewId, matched: built.results.size, counts: built.counts, blocking: built.blocking, details: built.details, garbled: match.garbled, replaces: !!sitting.results };
    }
    const previewId = examIdOf(req.data.previewId);
    if (built.blocking.length) fail('資料仍有問題，不能匯入');
    const prevRef = ref.collection('previews').doc(previewId);
    const nextRevision = Math.max(sitting.results?.revision || 0, sitting.deletedRevision || 0) + 1;
    const gen = previewId;
    const resultsCol = ref.collection('results');
    // 先寫新一代（以 revision 區分），再於交易中切換有效版本；舊代之後清掉。
    const entries = [...built.results];
    for (let i = 0; i < entries.length; i += 400) {
      const batch = db.batch();
      for (const [s, r] of entries.slice(i, i + 400))
        batch.set(resultsCol.doc(`${gen}_${s}`), { sittingId, gen, revision: nextRevision, studentId: s, classId: r.classId, answers: r.answers, correct: r.correct, score: r.score });
      await batch.commit();
    }
    await db.runTransaction(async (tx) => {
      const [pv, es] = [await tx.get(prevRef), await tx.get(ref)];
      const v = pv.data();
      const e = es.data()!;
      const cur = (e.sittings || []).find((s: any) => s.id === sittingId);
      if (!v || v.teacherUid !== p.uid || v.sittingId !== sittingId || v.expiresAt < Date.now()) fail('預覽已失效，請重新選檔');
      if (v.payloadSha !== payloadSha || v.rosterSha !== rosterSha) fail('檔案或名冊已變更，請重新預覽');
      if (!cur || (cur.results?.revision || 0) !== v.revision || e.archived) fail('成績已被其他操作變更，請重新預覽');
      const results = { importedAt: Date.now(), revision: nextRevision, gen, matched: built.results.size, counts: built.counts as ZCounts };
      tx.update(ref, { sittings: e.sittings.map((s: any) => (s.id === sittingId ? { ...s, results } : s)) });
      tx.delete(prevRef);
    });
    await cleanup(resultsCol, sittingId, gen);
    return { ok: true, matched: built.results.size };
  });
  async function cleanup(col: FirebaseFirestore.CollectionReference, sittingId: string, keepGen: string) {
    const snap = await col.where('sittingId', '==', sittingId).get();
    const stale = snap.docs.filter((d) => d.data().gen !== keepGen);
    for (let i = 0; i < stale.length; i += 400) {
      const b = db.batch();
      stale.slice(i, i + 400).forEach((d) => b.delete(d.ref));
      await b.commit();
    }
  }
  const zuvioDeleteResults = onCall(options, async (req) => {
    const { courseId } = await teacher(req);
    obj(req.data, ['courseId', 'examId', 'sittingId'], '請求');
    const examId = examIdOf(req.data.examId);
    const sittingId = examIdOf(req.data.sittingId);
    const ref = examRef(courseId, examId);
    await db.runTransaction(async (tx) => {
      const s = await tx.get(ref);
      if (!s.exists) fail('找不到考卷');
      const e = s.data()!;
      tx.update(ref, { sittings: (e.sittings || []).map((x: any) => (x.id === sittingId ? { id: x.id, label: x.label, date: x.date, classIds: x.classIds, deletedRevision: (x.results?.revision || x.deletedRevision || 0) + 1 } : x)) });
    });
    await cleanup(ref.collection('results'), sittingId, '');
    return { ok: true };
  });

  // ---------- 報表 ----------
  async function sittingResults(ref: FirebaseFirestore.DocumentReference, s: any) {
    if (!s?.results) return new Map<string, ZResult>();
    const snap = await ref.collection('results').where('sittingId', '==', s.id).where('gen', '==', s.results.gen).get();
    return new Map(snap.docs.map((d) => { const x = d.data(); return [x.studentId, { classId: x.classId, answers: x.answers, correct: x.correct, score: x.score }]; }));
  }
  const zuvioReport = onCall(options, async (req) => {
    const { c, courseId } = await teacher(req);
    obj(req.data, ['courseId', 'examId', 'sittingIds', 'classId'], '請求');
    const examId = examIdOf(req.data.examId);
    const ids = req.data.sittingIds;
    if (!Array.isArray(ids) || !ids.length || ids.length > 10) bad('請選 1–10 個場次');
    ids.forEach(examIdOf);
    if (req.data.classId !== undefined && (typeof req.data.classId !== 'string' || !safeCode(req.data.classId))) bad('班級格式錯誤');
    const ref = examRef(courseId, examId);
    const snap = await ref.get();
    if (!snap.exists) fail('找不到考卷');
    const e = snap.data()!;
    const sittings = ids.map((id: string) => (e.sittings || []).find((s: any) => s.id === id));
    if (sittings.some((s: any) => !s)) fail('找不到場次');
    if (req.data.classId && !sittings.some((s: any) => s.classIds.includes(req.data.classId))) bad('班級不在所選場次範圍');
    const { view, masked } = await buildView(courseId, e, await protectedIds(courseId, c));
    const maps = await Promise.all(sittings.map((s: any) => sittingResults(ref, s)));
    const all = maps.flatMap((m) => [...m.values()]).filter((r) => !req.data.classId || r.classId === req.data.classId);
    const titles = new Map((c.published?.units || []).map((u: Unit) => [u.id, u.title]));
    const report = examReport(maskView(view, masked), all, (u) => (titles.get(u) as string) || u);
    const compare = ids.length === 2 ? compareSittings(view, maps[0], maps[1]) : null;
    return { report, compare };
  });

  return { zuvioPool, zuvioCreateExam, zuvioListExams, zuvioGetExam, zuvioArchiveExam, zuvioCreateSitting, zuvioImportResults, zuvioDeleteResults, zuvioReport };
}
