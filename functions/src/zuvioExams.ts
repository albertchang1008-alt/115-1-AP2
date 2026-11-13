/**
 * Zuvio 出題與成績回收（規格 docs/zuvio-exam/ZUVIO_EXAM_SPEC_1.16.0.md 第 9 節；9.10 考卷＋場次、9.11 出題介面）。
 * 全部教師限定；Firestore 規則維持預設全拒，只經這裡存取。
 */
import { Firestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { featureAccess } from './features';
import { reservedQuestionIds } from './assessments';
import { Question, Unit, chapterName, forClass, isReviewUnit, unitVisibility, safeId, safeCode } from '../../shared/model';
import {
  ZExamView, ZItem, ZParsed, ZBlock, ZResult, ZCounts, ZRosterInfo, LIMITS, CSV_FORMAT,
  eligibility, examCsv, matchExam, buildResults, examReport, compareSittings,
} from '../../shared/zuvio';
import {
  MOOD_BY_CODE, MOOD_CODES, MOOD_QUESTION, MOOD_STUDENT_STATES, MOOD_SUBNOTE,
  analyzeExam, buildCareList, classifyPreExamPractice, itemAnalysisCsv, researchCsv, summarizeMoodResults,
  type MoodCode, type PreExamStatus,
} from '../../shared/zuvioExt';

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
    obj(req.data, ['courseId', 'examId', 'label', 'date', 'classIds', 'startsAt'], '場次');
    const id = examIdOf(req.data.examId);
    const label = str(req.data.label, 60, '場次名稱').trim();
    if (!label || label.length > 40 || FORMULA.test(label)) bad('場次名稱需 1–40 字');
    const date = str(req.data.date, 10, '日期');
    if (!DATE.test(date)) bad('日期格式需為 YYYY-MM-DD');
    const classIds = req.data.classIds;
    if (!Array.isArray(classIds) || !classIds.length || classIds.length > 50 || classIds.some((x: any) => typeof x !== 'string' || !safeCode(x))) bad('至少選一個班級');
    const rawStartsAt = req.data.startsAt;
    if (rawStartsAt !== undefined && (typeof rawStartsAt !== 'number' || !Number.isFinite(rawStartsAt) || rawStartsAt <= 0)) bad('開考時間格式錯誤');
    const startsAt = typeof rawStartsAt === 'number' ? Math.floor(rawStartsAt) : Date.now();
    const ref = examRef(courseId, id);
    const usageRef = db.doc(`courses/${courseId}/zuvioMeta/usage`);
    const sitting = { id: randomUUID(), label, date, startsAt, classIds: [...new Set(classIds as string[])] };
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

  const zuvioUpdateSittingStart = onCall(options, async (req) => {
    const { courseId } = await teacher(req);
    obj(req.data, ['courseId', 'examId', 'sittingId', 'startsAt'], '請求');
    const examId = examIdOf(req.data.examId);
    const sittingId = examIdOf(req.data.sittingId);
    const rawStartsAt = req.data.startsAt;
    if (typeof rawStartsAt !== 'number' || !Number.isFinite(rawStartsAt) || rawStartsAt <= 0) bad('開考時間格式錯誤');
    const startsAt = Math.floor(rawStartsAt);
    const ref = examRef(courseId, examId);
    await db.runTransaction(async (tx) => {
      const s = await tx.get(ref);
      if (!s.exists) fail('找不到考卷');
      const e = s.data()!;
      const idx = (e.sittings || []).findIndex((x: any) => x.id === sittingId);
      if (idx < 0) fail('找不到場次');
      const next = (e.sittings || []).map((x: any, i: number) => (i === idx ? { ...x, startsAt } : x));
      tx.update(ref, { sittings: next });
      tx.delete(ref.collection('prep').doc(sittingId));
    });
    return { ok: true, startsAt };
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
      tx.update(ref, { sittings: (e.sittings || []).map((x: any) => (x.id === sittingId ? { id: x.id, label: x.label, date: x.date, ...(x.startsAt ? { startsAt: x.startsAt } : {}), classIds: x.classIds, deletedRevision: (x.results?.revision || x.deletedRevision || 0) + 1 } : x)) });
    });
    await cleanup(ref.collection('results'), sittingId, '');
    return { ok: true };
  });

  // ---------- 考前情緒（zuvioMood） ----------
  const guardedMood = featureAccess(access, 'zuvioMood');
  const moodTeacher = async (req: any) => {
    obj(req.data, Object.keys(req.data || {}), '請求');
    const courseId = req.data.courseId;
    if (typeof courseId !== 'string' || !safeCode(courseId)) bad('課程代碼格式錯誤');
    const r = await guardedMood(req, courseId, true);
    if (!r.p.teacher) throw new HttpsError('permission-denied', '需要教師權限');
    return { ...r, courseId: courseId as string };
  };
  const moodStateRef = (courseId: string) => db.doc(`courses/${courseId}/zuvioMoodState/current`);
  const moodResponsesCol = (courseId: string, examId: string, sittingId: string) =>
    examRef(courseId, examId).collection('moods').doc(sittingId).collection('responses');

  async function classRosterDocs(courseId: string, c: any, classIds: string[]) {
    if (c.rosterVersion !== 2) fail('此課程仍是舊版名冊，請先完成名冊遷移');
    const chunks: string[][] = [];
    for (let i = 0; i < classIds.length; i += 30) chunks.push(classIds.slice(i, i + 30));
    const snaps = await Promise.all(
      chunks.map((ids) =>
        db.collection('enrollments').where('courseId', '==', courseId).where('classId', 'in', ids).get(),
      ),
    );
    return snaps.flatMap((s) => s.docs.map((d) => d.data())).filter((x) => x.enabled === true);
  }

  const zuvioOpenMood = onCall(options, async (req) => {
    const { c, courseId } = await moodTeacher(req);
    obj(req.data, ['courseId', 'examId', 'sittingId', 'durationMinutes'], '請求');
    const examId = examIdOf(req.data.examId);
    const sittingId = examIdOf(req.data.sittingId);
    const mins = req.data.durationMinutes === undefined ? 10 : req.data.durationMinutes;
    if (typeof mins !== 'number' || !Number.isInteger(mins) || mins < 1 || mins > 120) bad('開放分鐘數需為 1–120 整數');
    const snap = await examRef(courseId, examId).get();
    if (!snap.exists) fail('找不到考卷');
    const e = snap.data()!;
    if (e.archived) fail('考卷已封存');
    const sitting = (e.sittings || []).find((s: any) => s.id === sittingId);
    if (!sitting) fail('找不到場次');
    const roster = await classRosterDocs(courseId, c, sitting.classIds);
    const now = Date.now();
    const closesAt = now + mins * 60 * 1000;
    const stateDoc = {
      open: true,
      examId,
      sittingId,
      sittingLabel: sitting.label,
      classIds: sitting.classIds,
      openedAt: now,
      closesAt,
      closedAt: null,
      eligibleCount: roster.length,
    };
    const classroomStateRef = db.doc(`courses/${courseId}/classroomState/current`);
    await db.runTransaction(async (tx) => {
      const cs = await tx.get(classroomStateRef);
      const curUntil = cs.data()?.pollingActiveUntil || 0;
      tx.set(moodStateRef(courseId), stateDoc);
      tx.set(classroomStateRef, { pollingActiveUntil: Math.max(curUntil, now + 3 * 60 * 60 * 1000) }, { merge: true });
    });
    return stateDoc;
  });

  const zuvioCloseMood = onCall(options, async (req) => {
    const { courseId } = await moodTeacher(req);
    obj(req.data, ['courseId', 'sittingId'], '請求');
    const sittingId = req.data.sittingId === undefined ? undefined : examIdOf(req.data.sittingId);
    const ref = moodStateRef(courseId);
    let closed = false;
    await db.runTransaction(async (tx) => {
      const s = await tx.get(ref);
      const d = s.data();
      if (!s.exists || !d) return;
      if (sittingId && d.sittingId !== sittingId) return;
      if (d.open) {
        tx.update(ref, { open: false, closedAt: Date.now() });
        closed = true;
      }
    });
    return { ok: true, closed };
  });

  const zuvioGetMoodLive = onCall(options, async (req) => {
    const { courseId } = await moodTeacher(req);
    obj(req.data, ['courseId', 'examId', 'sittingId'], '請求');
    const stateSnap = await moodStateRef(courseId).get();
    const st = stateSnap.exists ? stateSnap.data()! : null;
    const examId = req.data.examId ? examIdOf(req.data.examId) : st?.examId;
    const sittingId = req.data.sittingId ? examIdOf(req.data.sittingId) : st?.sittingId;
    const counts = Object.fromEntries(MOOD_CODES.map((c) => [c, 0])) as Record<MoodCode, number>;
    let totalResponded = 0;
    if (examId && sittingId) {
      const respSnap = await moodResponsesCol(courseId, examId, sittingId).get();
      for (const d of respSnap.docs) {
        const m = d.data()?.mood as MoodCode;
        if (m && m in counts) {
          counts[m]++;
          totalResponded++;
        }
      }
    }
    const now = Date.now();
    const open = !!st?.open && now <= (st.closesAt || 0);
    return {
      state: st ? { ...st, open } : null,
      eligibleCount: st?.eligibleCount || 0,
      totalResponded,
      counts,
    };
  });

  const zuvioDeleteMood = onCall(options, async (req) => {
    const { courseId } = await moodTeacher(req);
    obj(req.data, ['courseId', 'examId', 'sittingId'], '請求');
    const examId = examIdOf(req.data.examId);
    const sittingId = examIdOf(req.data.sittingId);
    const col = moodResponsesCol(courseId, examId, sittingId);
    const snap = await col.get();
    for (let i = 0; i < snap.docs.length; i += 400) {
      const b = db.batch();
      snap.docs.slice(i, i + 400).forEach((d) => b.delete(d.ref));
      await b.commit();
    }
    const stRef = moodStateRef(courseId);
    await db.runTransaction(async (tx) => {
      const s = await tx.get(stRef);
      if (s.exists && s.data()?.sittingId === sittingId) tx.delete(stRef);
    });
    return { ok: true, deleted: snap.size };
  });

  const zuvioGetActiveMood = onCall(options, async (req) => {
    obj(req.data, ['courseId'], '請求');
    const courseId = req.data.courseId;
    if (typeof courseId !== 'string' || !safeCode(courseId)) bad('課程代碼格式錯誤');
    const { p } = await guardedMood(req, courseId);
    const stSnap = await moodStateRef(courseId).get();
    if (!stSnap.exists) return { active: false };
    const st = stSnap.data()!;
    const now = Date.now();
    const withinWindow = st.open === true && now <= (st.closesAt || 0);
    if (!withinWindow) return { active: false };
    if (!p.teacher && !(st.classIds || []).includes(p.classId)) return { active: false };
    const existing = p.teacher
      ? null
      : await moodResponsesCol(courseId, st.examId, st.sittingId).doc(p.uid).get();
    const myMood = existing?.exists ? (existing.data()?.mood as MoodCode) : undefined;
    return {
      active: true,
      examId: st.examId,
      sittingId: st.sittingId,
      sittingLabel: st.sittingLabel,
      closesAt: st.closesAt,
      submitted: !!myMood,
      ...(myMood ? { myMood, feedback: MOOD_BY_CODE[myMood]?.feedback || '' } : {}),
      question: MOOD_QUESTION,
      subnote: MOOD_SUBNOTE,
      options: MOOD_STUDENT_STATES,
    };
  });

  const zuvioSubmitMood = onCall(options, async (req) => {
    obj(req.data, ['courseId', 'sittingId', 'mood'], '請求');
    const courseId = req.data.courseId;
    if (typeof courseId !== 'string' || !safeCode(courseId)) bad('課程代碼格式錯誤');
    const sittingId = examIdOf(req.data.sittingId);
    const mood = req.data.mood as MoodCode;
    if (!MOOD_CODES.includes(mood)) bad('情緒選項無效');
    const { p } = await guardedMood(req, courseId);
    if (p.teacher) fail('預覽不能寫入正式作答');
    const stRef = moodStateRef(courseId);
    const now = Date.now();
    return db.runTransaction(async (tx) => {
      const stSnap = await tx.get(stRef);
      if (!stSnap.exists) fail('目前沒有開放中的課前情緒簽到');
      const st = stSnap.data()!;
      if (st.sittingId !== sittingId) fail('簽到場次已變更');
      if (!(st.classIds || []).includes(p.classId)) throw new HttpsError('permission-denied', '班級不屬於本場次');
      const closedAt = st.open ? st.closesAt : (st.closedAt ?? st.closesAt);
      const deadline = Math.min(closedAt || 0, st.closesAt || 0) + 3000;
      if (now > deadline) fail('簽到已結束');
      const respRef = moodResponsesCol(courseId, st.examId, sittingId).doc(p.uid);
      const prev = await tx.get(respRef);
      if (prev.exists) {
        const prevMood = prev.data()?.mood as MoodCode;
        return {
          ok: true,
          alreadySubmitted: true,
          mood: prevMood,
          feedback: MOOD_BY_CODE[prevMood]?.feedback || '',
        };
      }
      tx.create(respRef, {
        uid: p.uid,
        studentId: p.studentId || '',
        classId: p.classId,
        mood,
        submittedAt: now,
      });
      return {
        ok: true,
        alreadySubmitted: false,
        mood,
        feedback: MOOD_BY_CODE[mood].feedback,
      };
    });
  });

  // ---------- 考前練習快取（依 startsAt） ----------
  interface SittingPrepRecord {
    uid: string;
    studentId: string;
    name: string;
    classId: string;
    status: PreExamStatus;
    attemptCount: number;
    passedUnitCount: number;
    activityCount: number;
  }

  const tsMs = (v: any): number => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (v && typeof v.toMillis === 'function') return v.toMillis();
    if (v && typeof v.seconds === 'number') return v.seconds * 1000;
    return Number.POSITIVE_INFINITY;
  };

  async function ensureSittingPrep(
    courseId: string,
    c: any,
    ref: FirebaseFirestore.DocumentReference,
    sitting: any,
    unitIds: string[],
  ): Promise<Record<string, SittingPrepRecord>> {
    const startsAt = typeof sitting.startsAt === 'number' ? sitting.startsAt : Date.now();
    const unitIdsKey = [...new Set(unitIds)].sort().join(',');
    const prepRef = ref.collection('prep').doc(sitting.id);
    const cached = await prepRef.get();
    if (cached.exists) {
      const d = cached.data()!;
      if (d.startsAt === startsAt && d.unitIdsKey === unitIdsKey && d.students) {
        return d.students as Record<string, SittingPrepRecord>;
      }
    }

    const roster = await classRosterDocs(courseId, c, sitting.classIds);
    const uniqueUnits = [...new Set(unitIds)];
    const attemptsByUid = new Map<string, Array<{ unitId: string; at: number }>>();
    for (const classId of sitting.classIds as string[]) {
      for (const unitId of uniqueUnits) {
        const snap = await db
          .collection(`courses/${courseId}/attempts`)
          .where('classId', '==', classId)
          .where('unitId', '==', unitId)
          .get();
        for (const doc of snap.docs) {
          const ad = doc.data();
          if (!ad?.uid) continue;
          const at = Math.min(tsMs(ad.receivedAt), tsMs(ad.clientAt));
          const arr = attemptsByUid.get(ad.uid) || [];
          arr.push({ unitId: ad.unitId, at });
          attemptsByUid.set(ad.uid, arr);
        }
      }
    }

    const uids = [...new Set(roster.map((r) => r.uid).filter((u): u is string => typeof u === 'string' && !!u))];
    const progressByUid = new Map<string, any>();
    for (let i = 0; i < uids.length; i += 100) {
      const refs = uids.slice(i, i + 100).map((uid) => db.doc(`courses/${courseId}/progress/${uid}`));
      const snaps = refs.length ? await db.getAll(...refs) : [];
      snaps.forEach((s, idx) => {
        if (s.exists) progressByUid.set(uids[i + idx], s.data());
      });
    }

    const students: Record<string, SittingPrepRecord> = {};
    for (const r of roster) {
      const uid = r.uid || `sid:${r.studentId}`;
      const cls = classifyPreExamPractice({
        startsAt,
        unitIds: uniqueUnits,
        attempts: r.uid ? attemptsByUid.get(r.uid) || [] : [],
        progress: r.uid ? progressByUid.get(r.uid) || null : null,
      });
      students[r.studentId] = {
        uid,
        studentId: r.studentId,
        name: r.name || '',
        classId: r.classId,
        ...cls,
      };
    }

    await prepRef.set({ startsAt, unitIdsKey, computedAt: Date.now(), students });
    return students;
  }

  async function sittingMoods(courseId: string, examId: string, sittingId: string) {
    const snap = await moodResponsesCol(courseId, examId, sittingId).get();
    const byUid = new Map<string, { uid: string; studentId: string; classId: string; mood: MoodCode }>();
    const byStudentId = new Map<string, MoodCode>();
    for (const d of snap.docs) {
      const x = d.data();
      if (MOOD_CODES.includes(x.mood)) {
        byUid.set(d.id, { uid: d.id, studentId: x.studentId || '', classId: x.classId || '', mood: x.mood });
        if (x.studentId) byStudentId.set(x.studentId, x.mood);
      }
    }
    return { byUid, byStudentId };
  }

  async function courseResearchSalt(courseId: string): Promise<string> {
    return db.runTransaction(async (tx) => {
      const root = db.doc(`courses/${courseId}`);
      const doc = await tx.get(root);
      const stored = doc.data()?.reflectionSalt;
      if (stored) return stored as string;
      const next = randomUUID();
      tx.set(root, { reflectionSalt: next }, { merge: true });
      return next;
    });
  }

  // ---------- 報表 ----------
  async function sittingResults(ref: FirebaseFirestore.DocumentReference, s: any) {
    if (!s?.results) return new Map<string, ZResult>();
    const snap = await ref.collection('results').where('sittingId', '==', s.id).where('gen', '==', s.results.gen).get();
    return new Map(snap.docs.map((d) => { const x = d.data(); return [x.studentId, { classId: x.classId, answers: x.answers, correct: x.correct, score: x.score }]; }));
  }
  const zuvioReport = onCall(options, async (req) => {
    const { c, courseId } = await teacher(req);
    obj(req.data, ['courseId', 'examId', 'sittingIds', 'classId', 'threshold'], '請求');
    const examId = examIdOf(req.data.examId);
    const ids = req.data.sittingIds;
    if (!Array.isArray(ids) || !ids.length || ids.length > 10) bad('請選 1–10 個場次');
    ids.forEach(examIdOf);
    if (req.data.classId !== undefined && (typeof req.data.classId !== 'string' || !safeCode(req.data.classId))) bad('班級格式錯誤');
    const threshold = req.data.threshold === undefined ? 80 : req.data.threshold;
    if (typeof threshold !== 'number' || !Number.isFinite(threshold) || threshold < 0 || threshold > 100) bad('門檻需為 0–100');
    const ref = examRef(courseId, examId);
    const snap = await ref.get();
    if (!snap.exists) fail('找不到考卷');
    const e = snap.data()!;
    const sittings = ids.map((id: string) => (e.sittings || []).find((s: any) => s.id === id));
    if (sittings.some((s: any) => !s)) fail('找不到場次');
    if (req.data.classId && !sittings.some((s: any) => s.classIds.includes(req.data.classId))) bad('班級不在所選場次範圍');
    const { view, masked } = await buildView(courseId, e, await protectedIds(courseId, c));
    const maskedView = maskView(view, masked);
    const maps = await Promise.all(sittings.map((s: any) => sittingResults(ref, s)));
    const all = maps.flatMap((m) => [...m.values()]).filter((r) => !req.data.classId || r.classId === req.data.classId);
    const titles = new Map((c.published?.units || []).map((u: Unit) => [u.id, u.title]));
    const report = examReport(maskedView, all, (u) => (titles.get(u) as string) || u);
    const compare = ids.length === 2 ? compareSittings(view, maps[0], maps[1]) : null;
    const analysis = analyzeExam(maskedView, all);

    const unitIds = [...new Set((e.items || []).map((it: ZItem) => it.unitId))] as string[];
    const [prepList, moodList] = await Promise.all([
      Promise.all(sittings.map((s: any) => ensureSittingPrep(courseId, c, ref, s, unitIds))),
      Promise.all(sittings.map((s: any) => sittingMoods(courseId, examId, s.id))),
    ]);

    const preExamCounts: Record<PreExamStatus, number> = { passed: 0, practiced: 0, infographic_only: 0, none: 0 };
    const moodPairs: Array<{ uid: string; mood?: MoodCode; score: number; answers: Record<string, string> }> = [];
    sittings.forEach((_s: any, idx: number) => {
      const resMap = maps[idx];
      const prepMap = prepList[idx];
      const { byStudentId } = moodList[idx];
      for (const rec of Object.values(prepMap)) {
        if (req.data.classId && rec.classId !== req.data.classId) continue;
        preExamCounts[rec.status]++;
      }
      for (const [studentId, res] of resMap.entries()) {
        if (req.data.classId && res.classId !== req.data.classId) continue;
        moodPairs.push({
          uid: studentId,
          mood: byStudentId.get(studentId),
          score: res.score,
          answers: res.answers,
        });
      }
    });

    let prevMoods: Record<string, MoodCode> | undefined;
    if (sittings.length === 2) {
      prevMoods = Object.fromEntries(moodList[0].byStudentId.entries());
    }
    const moodSummary = summarizeMoodResults(maskedView, moodPairs, threshold, prevMoods);
    return { report, compare, analysis, moodSummary, preExamCounts };
  });

  const zuvioCareList = onCall(options, async (req) => {
    const { c, courseId } = await teacher(req);
    obj(req.data, ['courseId', 'examId', 'sittingId', 'classId', 'threshold'], '請求');
    const examId = examIdOf(req.data.examId);
    const sittingId = examIdOf(req.data.sittingId);
    if (req.data.classId !== undefined && (typeof req.data.classId !== 'string' || !safeCode(req.data.classId))) bad('班級格式錯誤');
    const threshold = req.data.threshold === undefined ? 80 : req.data.threshold;
    if (typeof threshold !== 'number' || !Number.isFinite(threshold) || threshold < 0 || threshold > 100) bad('門檻需為 0–100');
    const ref = examRef(courseId, examId);
    const snap = await ref.get();
    if (!snap.exists) fail('找不到考卷');
    const e = snap.data()!;
    const allSittings = [...(e.sittings || [])].sort(
      (a: any, b: any) => (b.startsAt || 0) - (a.startsAt || 0) || b.date.localeCompare(a.date),
    );
    const targetIdx = allSittings.findIndex((s: any) => s.id === sittingId);
    if (targetIdx < 0) fail('找不到場次');
    const recentSittings = allSittings.slice(targetIdx, targetIdx + 3);
    const unitIds = [...new Set((e.items || []).map((it: ZItem) => it.unitId))] as string[];

    const [resMaps, prepMaps, moodMaps] = await Promise.all([
      Promise.all(recentSittings.map((s: any) => sittingResults(ref, s))),
      Promise.all(recentSittings.map((s: any) => ensureSittingPrep(courseId, c, ref, s, unitIds))),
      Promise.all(recentSittings.map((s: any) => sittingMoods(courseId, examId, s.id))),
    ]);

    const curPrep = prepMaps[0];
    const curRes = resMaps[0];
    const curMood = moodMaps[0].byStudentId;
    const inputs = Object.values(curPrep)
      .filter((rec) => !req.data.classId || rec.classId === req.data.classId)
      .map((rec) => ({
        uid: rec.uid,
        studentId: rec.studentId,
        name: rec.name,
        classId: rec.classId,
        score: curRes.get(rec.studentId)?.score ?? null,
        mood: curMood.get(rec.studentId) ?? null,
        preExamStatus: rec.status,
        recentHistory: recentSittings.slice(1).map((_s: any, i: number) => ({
          score: resMaps[i + 1].get(rec.studentId)?.score ?? null,
          mood: moodMaps[i + 1].byStudentId.get(rec.studentId) ?? null,
          preExamStatus: prepMaps[i + 1][rec.studentId]?.status || 'none',
        })),
      }));

    return { entries: buildCareList(inputs, threshold), threshold };
  });

  const zuvioExportCsv = onCall(options, async (req) => {
    const { c, courseId } = await teacher(req);
    obj(req.data, ['courseId', 'examId', 'sittingIds', 'classId', 'kind'], '請求');
    const examId = examIdOf(req.data.examId);
    const ids = req.data.sittingIds;
    if (!Array.isArray(ids) || !ids.length || ids.length > 10) bad('請選 1–10 個場次');
    ids.forEach(examIdOf);
    if (req.data.classId !== undefined && (typeof req.data.classId !== 'string' || !safeCode(req.data.classId))) bad('班級格式錯誤');
    const kind = req.data.kind;
    if (!['itemAnalysis', 'researchAnon', 'researchNamed'].includes(kind)) bad('匯出類型無效');
    const ref = examRef(courseId, examId);
    const snap = await ref.get();
    if (!snap.exists) fail('找不到考卷');
    const e = snap.data()!;
    const sittings = ids.map((id: string) => (e.sittings || []).find((s: any) => s.id === id));
    if (sittings.some((s: any) => !s)) fail('找不到場次');
    const { view, masked } = await buildView(courseId, e, await protectedIds(courseId, c));
    const maskedView = maskView(view, masked);
    const maps = await Promise.all(sittings.map((s: any) => sittingResults(ref, s)));
    const all = maps.flatMap((m) => [...m.values()]).filter((r) => !req.data.classId || r.classId === req.data.classId);

    if (kind === 'itemAnalysis') {
      const analysis = analyzeExam(maskedView, all);
      return {
        filename: `${e.title}-試題分析.csv`,
        csv: itemAnalysisCsv(e.title, analysis),
      };
    }

    const deidentified = kind === 'researchAnon';
    const salt = deidentified ? await courseResearchSalt(courseId) : '';
    const unitIds = [...new Set((e.items || []).map((it: ZItem) => it.unitId))] as string[];
    const [prepList, moodList] = await Promise.all([
      Promise.all(sittings.map((s: any) => ensureSittingPrep(courseId, c, ref, s, unitIds))),
      Promise.all(sittings.map((s: any) => sittingMoods(courseId, examId, s.id))),
    ]);

    const rows = sittings.flatMap((s: any, idx: number) => {
      const resMap = maps[idx];
      const prepMap = prepList[idx];
      const moodMap = moodList[idx].byStudentId;
      const allStudentIds = new Set([...Object.keys(prepMap), ...resMap.keys()]);
      return [...allStudentIds]
        .map((studentId) => {
          const prep = prepMap[studentId];
          const res = resMap.get(studentId);
          const classId = res?.classId || prep?.classId || '';
          if (req.data.classId && classId !== req.data.classId) return null;
          return {
            ...(deidentified
              ? { researchId: createHmac('sha256', salt).update(JSON.stringify([courseId, studentId])).digest('hex') }
              : { studentId, name: prep?.name || '' }),
            classId,
            sittingLabel: s.label,
            startsAt: typeof s.startsAt === 'number' ? s.startsAt : null,
            mood: moodMap.get(studentId) ?? null,
            preExamStatus: prep?.status || 'none',
            score: res?.score ?? null,
            correct: res?.correct ?? null,
            answers: res?.answers || {},
          };
        })
        .filter((x): x is NonNullable<typeof x> => !!x);
    });

    return {
      filename: deidentified ? `${e.title}-研究資料-去識別.csv` : `${e.title}-研究資料-含個資.csv`,
      csv: researchCsv(maskedView, rows, deidentified),
    };
  });

  return {
    zuvioPool,
    zuvioCreateExam,
    zuvioListExams,
    zuvioGetExam,
    zuvioArchiveExam,
    zuvioCreateSitting,
    zuvioUpdateSittingStart,
    zuvioImportResults,
    zuvioDeleteResults,
    zuvioReport,
    zuvioOpenMood,
    zuvioCloseMood,
    zuvioGetMoodLive,
    zuvioDeleteMood,
    zuvioGetActiveMood,
    zuvioSubmitMood,
    zuvioCareList,
    zuvioExportCsv,
  };
}
