import type { API } from './service';
import { safeId, ExplanationResearchEvent } from '../shared/model';
import { eventBatcher } from './EventBatcher';
export function researchBridge(api: API, context: { uid: string; courseId: string; unitId: string; version: string }, failed: (permanent?: boolean, held?: boolean) => void) {
  const { uid, ...request } = context;
  return eventBatcher<ExplanationResearchEvent>({
    key: `explanation-events-v1:${JSON.stringify([uid, request.courseId, request.unitId, request.version])}`,
    valid: (e) => !!e && safeId(e.id) && safeId(e.questionId) && safeId(e.attemptId) &&
      ['guided', 'traditional'].includes(e.format) && ['exposed', 'opened', 'closed'].includes(e.action) &&
      Number.isFinite(e.clientAt) && (e.seconds === undefined || (Number.isFinite(e.seconds) && e.seconds >= 1 && e.seconds <= 600)),
    send: async (events) => (await api.call<{ accepted: string[] }>('saveExplanationResearchEvents', { ...request, events })).accepted,
    failed: () => failed(false),
    rejected: () => failed(true),
    held: () => failed(false, true),
  });
}
