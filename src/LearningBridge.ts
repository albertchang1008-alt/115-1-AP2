import type { API } from './service';
import { LearningEvent, validEvent } from '../shared/learning';
import { eventBatcher } from './EventBatcher';
// One authenticated student's pending events; no identity is passed into the iframe.
export function learningBridge(api: API, context: { courseId: string; unitId: string; chapterName?: string; activityId: string; materialVersion: string; uid: string }, changed: (message: string) => void, completed: () => void) {
  if (api.preview) return {
    async receive(events: LearningEvent[]) {
      if (!Array.isArray(events) || events.length > 30 || events.some((e) => !validEvent(e))) return [];
      if (events.some((e) => e.type === 'completed')) completed();
      changed('預覽紀錄，不寫入正式資料');
      return events.map((e) => e.id);
    },
    close() {},
  };
  let errorShown = false;
  const batch = eventBatcher<LearningEvent>({
    key: `learning-v1:${context.uid}:${context.courseId}:${context.chapterName ? `chapter:${context.chapterName}` : context.unitId}:${context.activityId}:${context.materialVersion}`,
    valid: validEvent,
    send: async (events) => (await api.call<{ accepted: string[] }>('saveLearningEvents', { ...context, events })).accepted,
    pending: () => changed('紀錄待同步'),
    saved: (events, remaining) => {
      if (events.some((e) => e.type === 'completed')) completed();
      changed(remaining ? '紀錄待同步' : '學習紀錄已同步');
    },
    failed: () => { if (!errorShown) changed('學習紀錄暫時無法儲存'); errorShown = true; },
  });
  return {
    async receive(events: LearningEvent[]) {
      if (!Array.isArray(events) || events.length > 30 || events.some((e) => !validEvent(e))) return [];
      return batch.enqueue(events, events.some((e) => e.type === 'completed'));
    },
    close: batch.close,
  };
}
