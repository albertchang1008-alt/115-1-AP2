import { parseQuestionTableRows, mergeDeckClassroomConfig } from '../../shared/pptImport';
import React from 'react';
import { createRoot } from 'react-dom/client';
import TeachingControl from '../../src/TeachingControl';
import { patchQuestion, questionSnapshot } from '../../shared/questionManager';
import { parseXlsxQuestionSheet } from '../../src/pptImportFiles';
import type { API } from '../../src/service';
import type { Course } from '../../shared/model';
import '../../src/style.css';
import '../../src/question-manager-sample.css';
const q = {
  slideId: 'demo-P01',
  title: '暖身討論',
  fields: [
    {
      id: 'f1',
      label: '開始活動前先做什麼？',
      kind: 'choice' as const,
      options: ['閱讀題幹', '交換想法', '整理重點'],
    },
  ],
};
const fixture = {
  interactions: [q, { ...q, slideId: 'R-REV-04', title: '舊版暖身' }],
  answerKeys: {
    'demo-P01': { f1: { answer: '閱讀題幹', explanation: '先閱讀題幹。' } },
    'R-REV-04': { f1: { answer: '閱讀題幹' } },
  },
  roundCounts: { 'demo-P01': 3 },
};
const slides = Array.from({ length: 4 }, (_, i) => ({
  id: `demo-P0${i + 1}`,
  title: `課堂投影片 ${i + 1}`,
  html: `<section style="width:1920px;height:1080px;background:#e8f6fa;color:#16384e;padding:100px;font:64px sans-serif"><h1>課堂投影片 ${i + 1}</h1><p>閱讀 → 交換想法 → 整理重點</p></section>`,
  notes: '',
  answerPage: false,
}));
const deck = {
  deckId: 'demo',
  title: '課堂活動示範',
  slides,
  decks: [{ id: 'demo', title: '課堂活動示範', slideCount: 4 }],
};
const calls: string[] = [];
const api = {
  preview: false,
  call: async (name: string, args: any) => {
    calls.push(name);
    if (name === 'getTeachingDeck') return structuredClone(deck);
    if (name === 'getClassroomConfig') return structuredClone(fixture);
    if (name === 'updateClassroomQuestions') {
      const saved = patchQuestion(
        fixture.interactions,
        fixture.answerKeys,
        args.slideId,
        args.expected,
        args.next,
      );
      Object.assign(fixture, saved);
      return {
        ok: true,
        snapshot: questionSnapshot(saved.interactions, saved.answerKeys, args.slideId),
      };
    }
    if (name === 'saveTeachingDeck') {
      const parsed = parseQuestionTableRows(args.questionRows, args.slides.length, args.deckId);
      if (!parsed.canImport) throw Error(parsed.errors.join('；'));
      if (!args.dryRun)
        Object.assign(
          fixture,
          mergeDeckClassroomConfig({
            existingInteractions: fixture.interactions,
            existingAnswerKeys: fixture.answerKeys,
            deckId: args.deckId,
            newDeckInteractions: parsed.interactions,
            newDeckAnswerKeys: parsed.answerKeys,
          }),
        );
      return {
        ok: true,
        deckId: args.deckId,
        slideCount: args.slides.length,
        questionCount: parsed.interactions.length,
      };
    }
    if (name === 'classroomInteractionReport') return { round: null, rounds: [], responses: [] };
    throw Error('Unexpected local API: ' + name);
  },
} as unknown as API;
Object.assign(window, { qmFixture: fixture, qmCalls: calls, qmParse: parseXlsxQuestionSheet });
createRoot(document.getElementById('root')!).render(
  <TeachingControl
    api={api}
    course={
      {
        id: 'local-fixture',
        title: '課堂活動示範',
        classIds: ['A'],
        features: { teachingConsole: true, classroomInteraction: true, assessments: true },
      } as Course
    }
    notify={() => {}}
    changed={async () => {}}
    progress={<p>學生完成度</p>}
  />,
);
