import { FieldPath, type DocumentReference, type Firestore, type Transaction } from 'firebase-admin/firestore';
import { emptyLearning, reduceLearning, type LearningEvent } from '../../shared/learning';
import { applySessionEvents, combinedHistory, type ActivityHistoryEntry } from '../../shared/activityHistory';

export const RECENT_LEARNING_EVENT_LIMIT = 600;

export async function saveLearningBatch(
  db: Firestore,
  ref: DocumentReference,
  metadata: Record<string, unknown>,
  events: LearningEvent[],
  /** 這批有新的一次開啟或收到完成時呼叫；completed 為真時才寫入原本的完成欄位。 */
  onProgress: (tx: Transaction, at: number, info: { completed: boolean; newSession: boolean; history: ActivityHistoryEntry }) => void,
) {
  const batches = ref.collection('batches');
  const batch = batches.doc();
  return db.runTransaction(async (tx) => {
    const current = await tx.get(ref);
    const state = current.data();
    const recent: string[] = state?.recentEventIds || [];
    const known = new Set(recent);
    const candidates = events.filter((e) => !known.has(e.id) && !!known.add(e.id));
    const legacy = current.exists && state?.hasLegacyLearningEvents !== false;
    // A legacy writer can replace the diagnostic and erase the cache during a
    // rollout. In that case check persisted batches as well as legacy events.
    const olderBatches = state?.hasOlderLearningBatches === true ||
      (current.exists && !Array.isArray(state?.recentEventIds)) ||
      recent.length >= RECENT_LEARNING_EVENT_LIMIT;
    const ids = candidates.map((e) => e.id);
    const stored = new Set<string>();
    if (ids.length && legacy) {
      const docs = await tx.get(ref.collection('events').where(FieldPath.documentId(), 'in', ids));
      for (const doc of docs.docs) stored.add(doc.id);
    }
    if (ids.length && olderBatches) {
      const remaining = ids.filter((eventId) => !stored.has(eventId));
      if (remaining.length) {
        const docs = await tx.get(batches.where('eventIds', 'array-contains-any', remaining).select('eventIds'));
        for (const doc of docs.docs) for (const eventId of doc.data().eventIds as string[]) stored.add(eventId);
      }
    }
    const fresh = candidates.filter((e) => !stored.has(e.id));
    const summary = reduceLearning(state?.summary || emptyLearning(), fresh);
    if (fresh.length) {
      const receivedAt = Date.now();
      const eventIds = fresh.map((e) => e.id);
      const typeCounts: Partial<Record<LearningEvent['type'], number>> = {};
      for (const { type } of fresh) typeCounts[type] = (typeCounts[type] || 0) + 1;
      const processed = [...recent, ...eventIds];
      const { sessions, history, newSession, completed } = applySessionEvents(state, fresh, receivedAt);
      tx.set(ref, {
        ...metadata, summary, updatedAt: receivedAt,
        ...(Object.keys(sessions).length ? { sessions } : {}),
        history,
        ...(state?.backfill ? { backfill: state.backfill } : {}),
        recentEventIds: processed.slice(-RECENT_LEARNING_EVENT_LIMIT),
        hasLegacyLearningEvents: legacy,
        hasOlderLearningBatches: olderBatches || processed.length > RECENT_LEARNING_EVENT_LIMIT,
      });
      tx.create(batch, { receivedAt, eventIds, typeCounts, events: fresh });
      if (newSession || completed) onProgress(tx, receivedAt, { completed, newSession, history: combinedHistory(history, state?.backfill) });
    }
    return { accepted: events.map((e) => e.id), summary };
  });
}
