import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ClassroomConfigEditor,
  StudentInteraction,
} from '../../src/ClassroomInteraction';
import {
  AnswerKeys,
  Interaction,
  PollRound,
  Responses,
  StudentHistoryItem,
  judgeResponses,
  studentPromptRound,
  studentResultsRound,
  tally,
  validateAnswerKeys,
  extractValidSlideKey,
  validateInteractions,
  validateResponses,
} from '../../shared/classroom';

const course = {
  id: 'reveal-ui-course',
  title: '課堂互動公佈答案驗收',
  classIds: ['A'],
  features: { assessments: true, teachingConsole: true, classroomInteraction: true },
  units: [],
  chapters: {},
} as any;

let configInteractions: Interaction[] = [
  {
    slideId: 'R-REV-04',
    title: '支氣管樹分支階層與組織構造特徵判斷',
    fields: [
      {
        id: 'f1',
        label: '有關人類支氣管樹由上而下的分支階層與管壁構造變化，下列敘述何者正確？',
        kind: 'choice',
        options: [
          '主支氣管進入肺門後直接分支為終末細支氣管，再進入呼吸細支氣管',
          '主支氣管先分支為次級支氣管（肺葉支氣管），再分支為三級支氣管（肺節支氣管）',
          '主支氣管與次級支氣管管壁完全不含軟骨，僅由平滑肌維持管腔開放',
          '細支氣管管壁具有完整環狀軟骨，以防止呼氣時氣道塌陷',
        ],
      },
    ],
  },
  {
    slideId: 'R-REV-07',
    title: '平靜吸氣週期各階段變化定性順序排列',
    fields: [
      {
        id: 'f1',
        label: '請將正常人平靜吸氣時，由呼吸肌開始收縮到空氣流入肺泡的因果過程依先後順序排列。',
        kind: 'order',
        options: [
          '橫膈膜與外肋間肌收縮使胸腔擴大',
          '胸膜腔密閉負壓增加（胸內壓更負）',
          '肺泡向外擴張，肺內壓降至低於大氣壓',
          '外界空氣順壓力差流入肺泡',
        ],
      },
    ],
  },
  {
    slideId: 'NO-KEY-SLIDE',
    title: '無標準答案之開放討論題',
    fields: [
      {
        id: 'f1',
        label: '本題無設定答案鍵，僅統計分佈',
        kind: 'choice',
        options: ['觀點 A', '觀點 B'],
      },
    ],
  },
];

let configAnswerKeys: AnswerKeys = {
  'R-REV-04': {
    f1: {
      answer: '主支氣管先分支為次級支氣管（肺葉支氣管），再分支為三級支氣管（肺節支氣管）',
      explanation:
        '主支氣管先分支為次級支氣管（肺葉支氣管），再分支為三級支氣管（肺節支氣管）。主支氣管與各級支氣管管壁仍有支持軟骨，至細支氣管軟骨消失。',
    },
  },
  'R-REV-07': {
    f1: {
      answer: [
        '橫膈膜與外肋間肌收縮使胸腔擴大',
        '胸膜腔密閉負壓增加（胸內壓更負）',
        '肺泡向外擴張，肺內壓降至低於大氣壓',
        '外界空氣順壓力差流入肺泡',
      ],
      explanation:
        '呼吸肌收縮擴大胸腔 → 胸內壓更負 → 肺擴張且肺內壓低於大氣壓 → 空氣流入。',
    },
  },
};

let rounds: PollRound[] = [];
const repliesByStudent: Record<string, Record<string, Responses>> = {
  correct: {},
  wrong: {},
  unanswered: {},
};
const now = () => Date.now();

function makeApi(role: 'teacher' | 'correct' | 'wrong' | 'unanswered') {
  return {
    preview: false,
    async call(name: string, d: any = {}) {
      const active = rounds.find((r) => r.status === 'open');
      const round =
        rounds.find((r) => r.id === d.roundId) ||
        [...rounds].reverse().find((r) => !d.slideId || r.slideId === d.slideId);

      if (name === 'getClassroomConfig') {
        return {
          interactions: structuredClone(configInteractions),
          answerKeys: structuredClone(configAnswerKeys),
        };
      }
      if (name === 'saveClassroomConfig') {
        if (d.interactions !== undefined) {
          configInteractions = validateInteractions(d.interactions);
        }
        if (d.answerKeys !== undefined) {
          configAnswerKeys = validateAnswerKeys(configInteractions, d.answerKeys);
        }
        return {
          interactions: structuredClone(configInteractions),
          answerKeys: structuredClone(configAnswerKeys),
        };
      }
      if (name === 'classroomInteractionReport') {
        const decorate = (r: PollRound | undefined) => {
          if (!r) return null;
          const hasKey = Boolean(r.reveal || extractValidSlideKey(r, configAnswerKeys));
          const { hasAnswerKey: _drop, ...clean } = r;
          return {
            ...structuredClone(clean),
            ...(hasKey ? { hasAnswerKey: true } : {}),
          };
        };
        return {
          round: decorate(round),
          activeRound: decorate(active),
          serverNow: now(),
          rounds: [...rounds].reverse().map((r) => decorate(r)!),
        };
      }
      if (name === 'controlClassroomInteraction') {
        if (d.action === 'open') {
          if (active) {
            active.status = 'closed';
            active.closedAt = now();
          }
          const def = configInteractions.find((q) => q.slideId === d.slideId)!;
          const next: PollRound = {
            ...structuredClone(def),
            id: 'round-' + (rounds.length + 1),
            number: rounds.filter((r) => r.slideId === d.slideId).length + 1,
            classIds: d.classIds || ['A'],
            status: 'open',
            openedAt: now(),
            eligibleCount: 3,
            total: 0,
            counts: {},
            ...(extractValidSlideKey(def, configAnswerKeys) ? { hasAnswerKey: true } : {}),
            ...(d.durationSeconds ? { deadlineAt: now() + d.durationSeconds * 1000 } : {}),
          };
          rounds.push(next);
          return { round: structuredClone(next), serverNow: now() };
        }
        if (!round) throw Error('場次不存在');
        if (d.action === 'close') {
          round.status = 'closed';
          round.closedAt = now();
        } else if (d.action === 'reveal') {
          if (round.status !== 'closed') throw Error('請先結束作答再公佈答案');
          const key = extractValidSlideKey(round, configAnswerKeys);
          if (!key) throw Error('此題尚未設定標準答案');
          if (!round.reveal) {
            round.reveal = {
              revealedAt: now(),
              key: structuredClone(key),
            };
          }
        }
        const hasKey = Boolean(round.reveal || extractValidSlideKey(round, configAnswerKeys));
        const { hasAnswerKey: _drop, ...clean } = round;
        return {
          round: {
            ...structuredClone(clean),
            ...(hasKey ? { hasAnswerKey: true } : {}),
          },
          serverNow: now(),
        };
      }
      if (name === 'getClassroomInteraction') {
        const r = rounds.at(-1);
        if (!r) return { round: null, serverNow: now() };
        const studentMap = repliesByStudent[role] || {};
        const ans = studentMap[r.id];
        const submitted = Boolean(ans);
        const prompt = studentPromptRound(r);
        if (r.status === 'closed' && r.reveal) {
          return {
            round: prompt,
            serverNow: now(),
            submitted,
            answers: ans ? structuredClone(ans) : undefined,
            results: studentResultsRound(r),
            reveal: structuredClone(r.reveal),
            judgement: judgeResponses(r, r.reveal.key, ans || null),
          };
        }
        return {
          round: prompt,
          serverNow: now(),
          submitted,
          answers: ans ? structuredClone(ans) : undefined,
          ...(r.status === 'closed' ? { results: studentResultsRound(r) } : {}),
        };
      }
      if (name === 'submitClassroomInteraction') {
        const r = rounds.find((x) => x.id === d.roundId);
        if (!r || r.status !== 'open') throw Error('教師已結束作答');
        const studentMap = repliesByStudent[role] || {};
        if (studentMap[r.id]) return { submitted: true, answers: studentMap[r.id] };
        const answers = validateResponses(r, d.answers);
        studentMap[r.id] = answers;
        rounds = rounds.map((item) => (item.id === r.id ? tally(item, answers) : item));
        return { submitted: true, answers };
      }
      if (name === 'studentClassroomHistory') {
        const studentMap = repliesByStudent[role] || {};
        const items: StudentHistoryItem[] = rounds
          .filter((r) => r.status === 'closed' && r.reveal)
          .map((r) => {
            const ans = studentMap[r.id] || null;
            return {
              id: r.id,
              slideId: r.slideId,
              number: r.number,
              title: r.title,
              fields: structuredClone(r.fields),
              openedAt: r.openedAt,
              ...(r.closedAt ? { closedAt: r.closedAt } : {}),
              revealedAt: r.reveal!.revealedAt,
              reveal: structuredClone(r.reveal!),
              submitted: Boolean(ans),
              answers: ans ? structuredClone(ans) : null,
              judgement: judgeResponses(r, r.reveal!.key, ans),
            };
          });
        return { rounds: items, serverNow: now() };
      }
      return { rows: [] };
    },
  } as any;
}

const teacherApi = makeApi('teacher');
const studentApis = {
  correct: makeApi('correct'),
  wrong: makeApi('wrong'),
  unanswered: makeApi('unanswered'),
};

function Harness() {
  const [viewMode, setViewMode] = useState<'all' | 'teacher' | 'correct' | 'wrong' | 'unanswered'>('all');

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '12px' }}>
      <div className="actions" style={{ marginBottom: 12 }}>
        <label>
          檢視角色：
          <select
            aria-label="切換檢視角色"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
          >
            <option value="all">全部顯示</option>
            <option value="teacher">僅教師端</option>
            <option value="correct">僅答對學生</option>
            <option value="wrong">僅答錯學生</option>
            <option value="unanswered">僅未作答學生</option>
          </select>
        </label>
      </div>

      <div
        data-testid="teacher-pane"
        style={{ marginBottom: 16, display: viewMode === 'all' || viewMode === 'teacher' ? 'block' : 'none' }}
      >
        <ClassroomConfigEditor api={teacherApi} course={course} notify={() => {}} />
      </div>

      <div
        data-testid="student-correct-pane"
        style={{ marginBottom: 16, display: viewMode === 'all' || viewMode === 'correct' ? 'block' : 'none' }}
      >
        <StudentInteraction api={studentApis.correct} course={course} />
      </div>

      <div
        data-testid="student-wrong-pane"
        style={{ marginBottom: 16, display: viewMode === 'all' || viewMode === 'wrong' ? 'block' : 'none' }}
      >
        <StudentInteraction api={studentApis.wrong} course={course} />
      </div>

      <div
        data-testid="student-unanswered-pane"
        style={{ marginBottom: 16, display: viewMode === 'all' || viewMode === 'unanswered' ? 'block' : 'none' }}
      >
        <StudentInteraction api={studentApis.unanswered} course={course} />
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Harness />);
