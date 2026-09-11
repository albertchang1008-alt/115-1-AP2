import { API } from './service';
import { LearningEvent, validEvent } from '../shared/learning';
// One authenticated student's pending events; no identity is passed into the iframe.
export function learningBridge(api: API, context: { courseId: string; unitId: string; activityId: string; materialVersion: string; uid: string }, changed: (message: string) => void, completed: () => void) {
  const key = `learning-v1:${context.uid}:${context.courseId}:${context.unitId}:${context.activityId}:${context.materialVersion}`;
  let queue: LearningEvent[] = [], sending = false, active = true;
  try { if (!api.preview) { const raw = JSON.parse(localStorage.getItem(key) || '[]'); if (Array.isArray(raw)) queue = raw.filter(validEvent).slice(0, 2000); } } catch {}
  const save = () => { if (!api.preview) try { localStorage.setItem(key, JSON.stringify(queue)); } catch { changed('瀏覽器無法保存離線紀錄，請保持此頁開啟並連線'); } };
  const flush = async () => {
    if (sending || !queue.length || !active) return;
    sending = true;
    try {
      while (queue.length && active) {
        const events = queue.slice(0, 30);
        if (!api.preview) await api.call('saveLearningEvents', { ...context, events });
        queue = queue.filter((e) => !events.some((sent) => sent.id === e.id)); save();
        if (events.some((e) => e.type === 'completed') && active) completed();
      }
      if (active) changed(api.preview ? '預覽紀錄，不寫入正式資料' : '學習紀錄已同步');
    } catch (e) { if (active) changed('紀錄待同步，將自動重試：' + (e as Error).message); }
    finally { sending = false; }
  };
  const timer = setInterval(flush, 15000);
  window.addEventListener('online', flush);
  void flush();
  return {
    async receive(events: LearningEvent[]) {
      if (!Array.isArray(events) || events.length > 30 || events.some((e) => !validEvent(e))) throw Error('教材事件格式無效');
      if (queue.length + events.length > 2000) throw Error('待同步紀錄已滿，請連線後再繼續');
      for (const event of events) if (!queue.some((e) => e.id === event.id)) queue.push(event);
      save(); changed('紀錄待同步'); await flush();
      return events.filter((e) => !queue.some((pending) => pending.id === e.id)).map((e) => e.id);
    },
    close() { active = false; clearInterval(timer); window.removeEventListener('online', flush); save(); },
  };
}
