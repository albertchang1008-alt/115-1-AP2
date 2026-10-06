import { createRoot } from 'react-dom/client';
import { Bank } from '../../src/App';
import type { Course } from '../../shared/model';
import type { API } from '../../src/service';
const course: Course = {
  id: 'ap2',
  title: '解剖生理學',
  description: '',
  term: '115-1',
  sheetsUrl: '',
  classIds: ['A'],
  units: [
    {
      id: '血液成分',
      title: '血液成分',
      group: '血液',
      description: '',
      required: true,
      threshold: 80,
      opensAt: '',
      dueAt: '',
      activities: [],
      bankVersion: 'v1',
    },
  ],
};
const calls: any[] = [],
  notifications: string[] = [];
let mode = 'carry';
const api: API = {
  preview: false,
  async call(name, data) {
    calls.push({ name, data });
    if (name === 'getSyncStatus') return { sheetId: 'local-fixture-sheet' } as any;
    if (name === 'syncSheet')
      return {
        banks: [
          {
            courseId: 'ap2',
            unitId: '血液成分',
            count: 40,
            carry:
              mode === 'failed'
                ? 'failed'
                : data.resetWrong
                  ? 'reset'
                  : { kept: 37, changed: 2, removed: 1 },
          },
          { courseId: 'ap2', unitId: '沒有改版分類', count: 10 },
        ],
      } as any;
    throw Error('未預期 API ' + name);
  },
};
const root = createRoot(document.getElementById('root')!);
(window as any).carryTest = {
  calls,
  notifications,
  setMode(value: string) {
    mode = value;
  },
  mount() {
    root.render(
      <main className="workspace">
        <Bank
          course={course}
          api={api}
          notify={(s) => notifications.push(s)}
          onSynced={async () => {}}
        />
      </main>,
    );
  },
};
