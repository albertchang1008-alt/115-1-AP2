import { useEffect, useState } from 'react';
import { pendingNotificationCount } from '../shared/attendance';
import { featureEnabled } from '../shared/features';
import type { Course } from '../shared/model';
import type { API } from './service';

export default function AttendancePendingBadge({ api, course }: { api: API; course: Course }) {
  const [pending, setPending] = useState<{ courseId: string; count: number } | null>(null);
  const enabled = !api.preview && featureEnabled(course, 'attendance');
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let request = 0;
    const refresh = async () => {
      const current = ++request;
      try {
        const drafts = await api.call<Parameters<typeof pendingNotificationCount>[0]>(
          'attendanceNotifyDrafts',
          { courseId: course.id },
        );
        if (active && current === request)
          setPending({ courseId: course.id, count: pendingNotificationCount(drafts) });
      } catch {
        if (active && current === request) setPending(null);
      }
    };
    const visible = () => {
      if (!document.hidden) void refresh();
    };
    void refresh();
    window.addEventListener('focus', visible);
    document.addEventListener('visibilitychange', visible);
    return () => {
      active = false;
      window.removeEventListener('focus', visible);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [api, course.id, enabled]);
  if (!enabled || pending?.courseId !== course.id || !pending.count) return null;
  return (
    <span className="att-badge" aria-label={`待通知 ${pending.count} 封`}>
      {pending.count}
    </span>
  );
}
