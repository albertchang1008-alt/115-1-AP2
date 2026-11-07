// 完成度看板「細目」與一次性補登（2026-11-07）。都只限教師呼叫，不回傳任何作答內容。
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import type { Firestore } from 'firebase-admin/firestore';
import { chaptersOf, chapterActivityKey, type Course } from '../../shared/model';
import { combinedHistory, estimateSessions, mergeEstimatedSessions, BACKFILL_FROM, type ActivityBackfill, type ActivitySession } from '../../shared/activityHistory';

const fail = (message: string): never => { throw new HttpsError('invalid-argument', message); };
const token = (v: unknown, what: string) => typeof v === 'string' && /^[\w-]{1,128}$/.test(v) ? v : fail(`${what}格式錯誤`);
// 分類與活動 id 可能含中文等字元（與 Firestore 文件路徑相同的限制：不得含「/」）。
const key = (v: unknown, what: string) => typeof v === 'string' && v.length > 0 && v.length <= 200 && !v.includes('/') ? v : fail(`${what}格式錯誤`);
const chapterText = (v: unknown) => typeof v === 'string' && v.length > 0 && v.length <= 200 && !v.includes('/') ? v : fail('單元名稱格式錯誤');
const at = (v: any): number => typeof v === 'number' ? v : v && typeof v.toMillis === 'function' ? v.toMillis() : v && typeof v._seconds === 'number' ? v._seconds * 1000 : NaN;
export const ATTEMPT_DETAIL_LIMIT = 50;

/** 只回 17 份新教材（materialVersion 以 -ag1 結尾）。 */
export function backfillVersions(course: Course | undefined) {
  if (!course) return [];
  const versions = new Set<string>();
  for (const chapter of Object.values(chaptersOf(course))) for (const a of chapter.activities || []) if (a.tracking === 'interactive' && /-ag1$/.test(a.materialVersion || '')) versions.add(a.materialVersion!);
  for (const unit of course.units || []) for (const a of unit.activities || []) if (a.tracking === 'interactive' && /-ag1$/.test(a.materialVersion || '')) versions.add(a.materialVersion!);
  return [...versions].sort();
}

export function createActivityHistoryHandlers(db: Firestore, access: (req: any, id: string, teacher?: boolean) => Promise<any>, options: any) {
  return {
    /** 一位學生在一個題目分類的逐次作答：只回時間、分數、模式、是否完整。 */
    getStudentUnitAttempts: onCall(options, async (req) => {
      const courseId = token(req.data?.courseId, '課程'), uid = token(req.data?.uid, '學生'), unitId = key(req.data?.unitId, '分類');
      await access(req, courseId, true);
      const snap = await db.collection(`courses/${courseId}/attempts`).where('uid', '==', uid).where('unitId', '==', unitId).limit(200).get();
      const rows = snap.docs.map((d) => {
        const a = d.data();
        return { clientAt: Number(a.clientAt) || at(a.receivedAt) || 0, score: Number(a.score) || 0, mode: String(a.mode || ''), full: a.full === true, leftScreen: a.integrity === 'left-screen' };
      }).sort((x, y) => x.clientAt - y.clientAt);
      return { rows: rows.slice(-ATTEMPT_DETAIL_LIMIT), total: rows.length, truncated: rows.length > ATTEMPT_DETAIL_LIMIT, reads: Math.max(1, snap.size) };
    }),

    /** 一位學生一份互動教材的逐次開啟：只讀 1（舊格式時最多 2）份 diagnostics。 */
    getActivitySessions: onCall(options, async (req) => {
      const courseId = token(req.data?.courseId, '課程'), uid = token(req.data?.uid, '學生'), activityId = key(req.data?.activityId, '活動');
      const name = chapterText(req.data?.chapterName);
      const { c } = await access(req, courseId, true);
      const published = c.published as Course | undefined;
      const activity = published && chaptersOf(published)[name]?.activities.find((a) => a.id === activityId);
      if (!activity || activity.tracking !== 'interactive') fail('互動教材不存在');
      const version = activity!.materialVersion || 'v1';
      const ids = [`${uid}_chapter-${encodeURIComponent(name)}_${activityId}_${version}`];
      if (typeof req.data?.unitId === 'string') ids.push(`${uid}_${key(req.data.unitId, '分類')}_${activityId}_${version}`);
      for (const docId of ids) {
        const snap = await db.doc(`courses/${courseId}/diagnostics/${docId}`).get();
        if (!snap.exists) continue;
        const d = snap.data()!;
        const sessions = Object.values((d.sessions || {}) as Record<string, ActivitySession>).sort((a, b) => a.startedAt - b.startedAt);
        return {
          found: true, materialVersion: version, nodeTotal: d.nodeTotal || 0, recorded: !!(d.history || d.backfill),
          sessions, history: combinedHistory(d.history, d.backfill), backfilledAt: d.backfill?.backfilledAt || null,
        };
      }
      return { found: false, materialVersion: version, recorded: false, sessions: [], history: null, backfilledAt: null };
    }),

    /** 一次性補登：17 份新教材 11/04 起、沒有 sessionId 的舊事件，以 30 分鐘間隔切成推估的「次」。 */
    backfillActivityHistory: onCall({ ...options, timeoutSeconds: 540, memory: '1GiB' }, async (req) => {
      const courseId = token(req.data?.courseId, '課程'), dryRun = req.data?.dryRun !== false, force = req.data?.force === true;
      const { c } = await access(req, courseId, true);
      const versions = backfillVersions(c.published);
      if (!versions.length) fail('課程沒有 -ag1 互動教材');
      const diags = await db.collection(`courses/${courseId}/diagnostics`).where('materialVersion', 'in', versions).get();
      const stats = { versions: versions.length, diagnostics: diags.size, students: new Set<string>(), skipped: 0, reads: diags.size, writes: 0, estimatedSessions: 0, estimatedCompletions: 0 };
      const now = Date.now();
      const work = async (doc: (typeof diags.docs)[number]) => {
        const d = doc.data();
        if (d.backfill?.backfilledAt && !force) { stats.skipped++; return; }
        const [batches, legacy] = await Promise.all([doc.ref.collection('batches').get(), doc.ref.collection('events').get()]);
        stats.reads += Math.max(1, batches.size) + Math.max(1, legacy.size);
        const seen = new Set<string>(), items: { at: number; events: { type: string; nodeId?: string }[] }[] = [];
        for (const e of legacy.docs) {
          const x = e.data();
          if (seen.has(e.id)) continue;
          seen.add(e.id);
          items.push({ at: at(x.receivedAt), events: [{ type: x.type, nodeId: x.nodeId }] });
        }
        for (const b of batches.docs) {
          const x = b.data();
          const events = ((x.events || []) as any[]).filter((e) => !e.sid && !seen.has(e.id) && !!seen.add(e.id));
          if (events.length) items.push({ at: at(x.receivedAt), events });
        }
        const estimate = estimateSessions(items, BACKFILL_FROM);
        if (!estimate.counters.opens) return;
        stats.students.add(d.uid);
        stats.estimatedSessions += estimate.counters.opens;
        stats.estimatedCompletions += estimate.counters.completions;
        stats.writes += 2;
        if (dryRun) return;
        const key = d.chapterName ? chapterActivityKey(d.chapterName, d.activityId) : `${d.unitId}_${d.activityId}`;
        await db.runTransaction(async (tx) => {
          const fresh = (await tx.get(doc.ref)).data() || {};
          const backfill: ActivityBackfill = { ...estimate.counters, backfilledAt: now };
          // update 會整個取代 sessions 欄位，重跑時舊的推估列不會殘留。
          tx.update(doc.ref, { sessions: mergeEstimatedSessions(fresh.sessions, estimate.sessions), backfill });
          tx.set(db.doc(`courses/${courseId}/progress/${d.uid}`), { activityHistory: { [key]: combinedHistory(fresh.history, backfill) } }, { merge: true });
        });
      };
      // 20 份一組平行處理，避免逐份讀取超過逾時。
      for (let i = 0; i < diags.docs.length; i += 20) await Promise.all(diags.docs.slice(i, i + 20).map(work));
      return { dryRun, versions, diagnostics: stats.diagnostics, students: stats.students.size, skipped: stats.skipped, reads: stats.reads, writes: stats.writes, estimatedSessions: stats.estimatedSessions, estimatedCompletions: stats.estimatedCompletions };
    }),
  };
}
