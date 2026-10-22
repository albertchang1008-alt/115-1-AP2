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
  let errorShown = false, unsaved = false;
  const UNSAVED = '這台裝置無法暫存學習紀錄，請先不要關閉此頁；看到「學習紀錄已同步」後再離開。';
  const batch = eventBatcher<LearningEvent>({
    key: `learning-v1:${context.uid}:${context.courseId}:${context.chapterName ? `chapter:${context.chapterName}` : context.unitId}:${context.activityId}:${context.materialVersion}`,
    valid: validEvent,
    send: async (events) => (await api.call<{ accepted: string[] }>('saveLearningEvents', { ...context, events })).accepted,
    pending: () => changed(unsaved ? UNSAVED : '紀錄待同步'),
    saved: (events, remaining) => {
      if (events.some((e) => e.type === 'completed')) completed();
      if (!remaining) unsaved = false;
      changed(remaining ? (unsaved ? UNSAVED : '紀錄待同步') : '學習紀錄已同步');
    },
    rejected: (error) => {
      const message = String((error as { message?: string })?.message || '');
      changed(message.includes('教材版本已更新')
        ? '教材版本已更新，這批紀錄未儲存，請重新開啟教材。'
        : '學習紀錄遭伺服器拒絕，已停止重送；請重新開啟教材或聯絡教師。');
    },
    failed: () => { if (unsaved) { changed(UNSAVED); return; } if (!errorShown) changed('學習紀錄暫時無法儲存'); errorShown = true; },
    volatile: () => { unsaved = true; changed(UNSAVED); },
    held: () => changed('登入狀態可能已失效，學習紀錄已暫存在這台裝置；請重新登入後再開啟教材，紀錄會自動送出。'),
  });
  return {
    async receive(events: LearningEvent[]) {
      if (!Array.isArray(events) || events.length > 30 || events.some((e) => !validEvent(e))) return [];
      return batch.enqueue(events, events.some((e) => e.type === 'completed'));
    },
    close: batch.close,
  };
}
