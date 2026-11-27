import { createRoot } from 'react-dom/client';
import { platformScoreDistribution } from '../../shared/platformQuiz';
import App from '../../src/App';
import { Report } from '../../src/ZuvioExams';
import { sampleCourse, type API } from '../../src/service';
import { cloudZuvioApi } from '../../src/zuvioApi';
import '../../src/style.css';
import '../../src/zuvio-exams.css';
import '../../src/platform-quiz.css';
import '../../src/attendance.css';

const params = new URLSearchParams(location.search);
const classId = 'fixture-class';
const course = {
  ...sampleCourse(), id: 'fixture-course', title: '合成課程', units: [], chapters: {},
  classIds: [classId], classNames: { [classId]: '合成甲班' },
  features: { attendance: true, zuvioExams: true },
};
const profile = { uid: 'fixture-teacher', name: '合成教師', teacher: true, enabled: true };
const calls: { name: string; classId?: string }[] = [];
const idle = new Map<number, IdleRequestCallback>();
let idleId = 0;
window.requestIdleCallback = (callback) => { idle.set(++idleId, callback); return idleId; };
window.cancelIdleCallback = (id) => { idle.delete(id); };
Object.assign(window, {
  classListTest: {
    calls,
    idlePending: () => idle.size > 0,
    runIdle() {
      for (const callback of idle.values()) callback({ didTimeout: false, timeRemaining: () => 50 });
      idle.clear();
    },
  },
});
const exam = {
  id: 'fixture-exam', title: '合成小考', answerMode: 'platform', createdAt: 0,
  sittings: [{ id: 'fixture-sitting', label: '第一場', date: '2026-11-28', classIds: [classId] }],
};
const maxScore = Number(params.get('max') ?? 200);
const scores = [0, 50, 60, 70, 80, 90, 92, 100].map((points) => points * maxScore / 100);
const api: API = {
  preview: false,
  async call<T>(name: string, data: { warm?: boolean; classId?: string } = {}): Promise<T> {
    if (data.warm) return {} as T;
    calls.push({ name, classId: data.classId });
    switch (name) {
      case 'bootstrap': return { profile, courses: [course] } as T;
      case 'getReports': return { rows: [] } as T;
      case 'attendanceClassCards':
      case 'zuvioClassDirectory': {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const classes = [
          { classId, name: params.has('rename') ? '合成甲班新名稱' : '合成甲班', test: false },
          { classId: 'fixture-test', name: '合成測試', test: true },
        ];
        return (name === 'attendanceClassCards' ? { classes, active: null, now: Date.now() } : classes) as T;
      }
      case 'attendanceSessions': return { sessions: [], deleted: [], open: null } as T;
      case 'zuvioListExams': return (params.has('chart') ? [exam] : []) as T;
      case 'zuvioReport': return {
        report: { students: scores.length, questions: [], subunits: [], classes: [] },
        compare: null, moodEnabled: false, platformStats: platformScoreDistribution(scores, maxScore),
      } as T;
      default: throw Error('未預期的合成請求 ' + name);
    }
  },
};
document.documentElement.style.setProperty('--font-scale', params.get('scale') ?? '1');
createRoot(document.getElementById('root')!).render(params.has('chart')
  ? <div className="workspace"><div className="zuvio">
    <Report api={cloudZuvioApi(api, course.id)} initial={exam.id} classScope={classId}
      sittingScope={exam.sittings[0].id} moodEnabled={false} />
  </div></div>
  : <App initialApi={api} />);
