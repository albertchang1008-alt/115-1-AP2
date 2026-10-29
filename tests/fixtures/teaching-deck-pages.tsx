import React from 'react';
import { createRoot } from 'react-dom/client';
import TeachingControl from '../../src/TeachingControl';
import { StudentInteraction } from '../../src/ClassroomInteraction';
import {
  AnswerKeys,
  Interaction,
  PollRound,
  extractValidSlideKey,
  judgeResponses,
  studentPromptRound,
  studentResultsRound,
  tally,
  validateAnswerKeys,
  validateInteractions,
  validateResponses,
} from '../../shared/classroom';
import {
  computeDeckReimportDiff,
  mergeDeckClassroomConfig,
  normalizeDeckId,
  parseQuestionTableRows,
  splitLegacyCombinedDeck,
} from '../../shared/pptImport';
import {
  loadPdfDocument,
  renderPdfPagesTo1920Images,
  renderPdfPageVectorZoom,
} from '../../src/pdfVectorRenderer';

const w = window as any;
w.__PDF_VECTOR_RENDERER__ = {
  loadPdfDocument,
  renderPdfPagesTo1920Images,
  renderPdfPageVectorZoom,
};
const deck = w.__INITIAL_TEACHING_DECK__ || { title: '合成簡報', slides: [] };
let interactions: Interaction[] = w.__INITIAL_INTERACTIONS__ || [];
let answerKeys: AnswerKeys = w.__INITIAL_ANSWER_KEYS__ || {};
const savedDecks = new Map<string, any>();

const course = {
  id: '115-1-AP2',
  title: '解剖生理學（二）',
  classIds: ['N522', '護527'],
  features: { assessments: true, teachingConsole: true, classroomInteraction: true },
  units: [],
  chapters: {},
} as any;

let rounds: PollRound[] = [];
const replies: Record<string, any> = {};
const now = () => Date.now();

function decorate(r: PollRound | undefined | null): PollRound | null {
  if (!r) return null;
  const hasKey = Boolean(r.reveal || extractValidSlideKey(r, answerKeys));
  const clone = structuredClone(r);
  if (hasKey) clone.hasAnswerKey = true;
  else delete clone.hasAnswerKey;
  return clone;
}

const api = {
  preview: false,
  async call(name: string, d: any = {}) {
    const active = rounds.find((r) => r.status === 'open') || null;
    const round =
      rounds.find((r) => r.id === d.roundId) ||
      [...rounds].reverse().find((r) => !d.slideId || r.slideId === d.slideId) ||
      null;

    if (name === 'getTeachingDeck') {
      const decksSummary = [...savedDecks.values()].map((item) => ({
        id: item.deckId,
        title: item.title,
        slideCount: item.slides.length,
        hasPdf: Boolean(item.pdfUrl),
      }));
      if (d.deckId && savedDecks.has(d.deckId)) {
        const found = savedDecks.get(d.deckId);
        return structuredClone({ ...found, decks: decksSummary });
      }
      return structuredClone({
        ...deck,
        ...(decksSummary.length ? { decks: decksSummary } : {}),
      });
    }
    if (name === 'saveTeachingDeck') {
      if (d.action === 'migrateLegacy28') {
        const split = splitLegacyCombinedDeck(deck);
        for (const item of [split.respiratoryDeck, split.urinaryDeck]) {
          savedDecks.set(item.id, {
            deckId: item.id,
            title: item.title,
            slides: item.slides,
          });
        }
        return {
          ok: true,
          migratedDecks: [split.respiratoryDeck, split.urinaryDeck].map((x) => ({
            id: x.id,
            title: x.title,
            slideCount: x.slides.length,
          })),
        };
      }
      const deckId = normalizeDeckId(d.deckId || d.title);
      const parsed = parseQuestionTableRows(d.questionRows || [], d.slides.length, deckId);
      if (!parsed.canImport) {
        throw new Error(parsed.errors.join('；'));
      }
      const oldDeck = savedDecks.get(deckId);
      const diff = computeDeckReimportDiff({
        deckId,
        existingDeck: oldDeck ? { slides: oldDeck.slides } : null,
        newSlides: d.slides,
        existingInteractions: interactions,
        existingAnswerKeys: answerKeys,
        newInteractions: parsed.interactions,
        newAnswerKeys: parsed.answerKeys,
      });
      if (d.dryRun === true) {
        return {
          ok: true,
          dryRun: true,
          deckId,
          title: d.title,
          slideCount: d.slides.length,
          questionCount: parsed.interactions.length,
          diff,
        };
      }
      const merged = mergeDeckClassroomConfig({
        deckId,
        previousDeckSlideIds: oldDeck ? oldDeck.slides.map((s: any) => s.id) : [],
        existingInteractions: interactions,
        existingAnswerKeys: answerKeys,
        newDeckInteractions: validateInteractions(parsed.interactions),
        newDeckAnswerKeys: validateAnswerKeys(parsed.interactions, parsed.answerKeys),
      });
      interactions = merged.interactions;
      answerKeys = merged.answerKeys;
      savedDecks.set(deckId, {
        deckId,
        title: d.title,
        slides: d.slides,
        pdfUrl: d.pdfDataUrl || undefined,
      });
      return {
        ok: true,
        deckId,
        title: d.title,
        slideCount: d.slides.length,
        questionCount: parsed.interactions.length,
        diff,
        interactions,
        answerKeys,
      };
    }
    if (name === 'getClassroomConfig') {
      return {
        interactions: structuredClone(interactions),
        answerKeys: structuredClone(answerKeys),
      };
    }
    if (name === 'classroomInteractionReport') {
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
        const def = interactions.find((q) => q.slideId === d.slideId);
        if (!def) throw new Error('找不到互動題目：' + d.slideId);
        const next: PollRound = {
          ...structuredClone(def),
          id: 'round-' + (rounds.length + 1),
          number: rounds.filter((r) => r.slideId === d.slideId).length + 1,
          classIds: d.classIds || course.classIds,
          status: 'open',
          openedAt: now(),
          eligibleCount: 48,
          total: 0,
          counts: {},
          ...(d.durationSeconds ? { deadlineAt: now() + d.durationSeconds * 1000 } : {}),
        };
        rounds.push(next);
        return { round: decorate(next)!, serverNow: now() };
      }
      if (!round) throw new Error('場次不存在');
      if (d.action === 'extend') {
        if (round.status !== 'open' || round.deadlineAt === undefined) {
          throw new Error('不能延長');
        }
        round.deadlineAt = Math.max(round.deadlineAt, now()) + 30000;
        return { round: decorate(round)!, serverNow: now() };
      }
      if (d.action === 'close') {
        round.status = 'closed';
        round.closedAt = now();
        return { round: decorate(round)!, serverNow: now() };
      }
      if (d.action === 'reveal') {
        if (round.status !== 'closed') throw new Error('請先結束作答再公佈答案');
        const key = extractValidSlideKey(round, answerKeys);
        if (!key) throw new Error('此題尚未設定答案與解析');
        round.reveal = {
          revealedAt: now(),
          key: structuredClone(key),
        };
        round.hasAnswerKey = true;
        return { round: decorate(round)!, serverNow: now() };
      }
      throw new Error('未知操作：' + d.action);
    }
    if (name === 'getClassroomInteraction') {
      const r = rounds.at(-1);
      if (!r) return { round: null, serverNow: now() };
      const prompt = studentPromptRound(r);
      const ans = replies[r.id] || null;
      const submitted = Boolean(ans);
      if (r.status === 'closed' && r.reveal) {
        return {
          round: prompt,
          serverNow: now(),
          submitted,
          answers: ans,
          results: studentResultsRound(r),
          reveal: structuredClone(r.reveal),
          judgement: judgeResponses(r, r.reveal.key, ans),
        };
      }
      return {
        round: prompt,
        serverNow: now(),
        submitted,
        answers: ans,
        ...(r.status === 'closed' ? { results: studentResultsRound(r) } : {}),
      };
    }
    if (name === 'submitClassroomInteraction') {
      if (!round || round.status !== 'open') throw new Error('教師已結束作答');
      if (replies[round.id]) return { submitted: true, answers: replies[round.id] };
      const validated = validateResponses(round, d.answers);
      replies[round.id] = validated;
      rounds = rounds.map((r) => (r.id === round.id ? tally(r, validated) : r));
      const targetIdx = rounds.findIndex((r) => r.id === round.id);
      if (targetIdx !== -1 && rounds[targetIdx].total === 1) {
        let cur = rounds[targetIdx];
        for (let i = 0; i < 15; i++) {
          const peerAns = Object.fromEntries(
            cur.fields.map((f) => [
              f.id,
              f.kind === 'order'
                ? i % 3 === 0
                  ? [...f.options].reverse()
                  : [...f.options]
                : f.options[i % f.options.length],
            ]),
          );
          cur = tally(cur, peerAns);
        }
        rounds[targetIdx] = cur;
      }
      return { submitted: true, answers: validated };
    }
    if (name === 'studentClassroomHistory') {
      const items = rounds
        .filter((r) => r.status === 'closed' && Boolean(r.reveal))
        .map((r) => {
          const ans = replies[r.id] || null;
          return {
            id: r.id,
            slideId: r.slideId,
            number: r.number,
            title: r.title,
            fields: structuredClone(r.fields),
            openedAt: r.openedAt,
            ...(r.closedAt !== undefined ? { closedAt: r.closedAt } : {}),
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

createRoot(document.getElementById('root')!).render(
  <main style={{ padding: '12px 24px', maxWidth: 1880, margin: '0 auto' }}>
    <div data-testid="console-pane">
      <TeachingControl
        api={api}
        course={course}
        notify={() => {}}
        changed={async () => {}}
        progress={null}
      />
    </div>
    <div data-testid="student-pane" style={{ marginTop: 16 }}>
      <StudentInteraction api={api} course={course} />
    </div>
  </main>,
);
