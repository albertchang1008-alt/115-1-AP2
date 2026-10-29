import type { Firestore } from 'firebase-admin/firestore';
export async function drainReports(
  db: Firestore,
  cid: string,
  batch: (id: string) => Promise<{ processed: number; hasMore: boolean }>,
  deadline: number,
  now = () => Date.now(),
) {
  let processed = 0,
    batches = 0,
    error = '';
  try {
    while (now() < deadline) {
      const r = await batch(cid);
      processed += r.processed;
      batches++;
      if (!r.hasMore) break;
    }
  } catch (e) {
    error = String(e);
  }
  const pending = await db
      .collection(`courses/${cid}/attempts`)
      .where('processed', '==', false)
      .count()
      .get(),
    backlog = pending.data().count;
  const result = {
    processedRun: processed,
    batches,
    backlog,
    timedOut: backlog > 0 && now() >= deadline,
    error,
    updatedAt: now(),
  };
  await db.doc(`courses/${cid}/jobs/aggregate`).set(result, { merge: true });
  return result;
}
