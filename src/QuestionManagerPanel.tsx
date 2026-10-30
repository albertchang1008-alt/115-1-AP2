import { useEffect, useState } from 'react';
import type { API } from './service';
import type { AnswerKeys, Interaction } from '../shared/classroom';
import type { QuestionManagerSampleData } from '../shared/questionManagerSample';
import { questionSnapshot } from '../shared/questionManager';
import { exportQuestionWorkbook } from './questionWorkbook';
import QuestionManager from './QuestionManager';
import { slideDocument } from './TeachingControl';

type Deck = {
  id?: string;
  deckId?: string;
  title: string;
  slides: { id: string; title: string; html: string; imageUrl?: string }[];
  decks?: { id: string; title: string }[];
};
export default function QuestionManagerPanel({ api, courseId }: { api: API; courseId: string }) {
  const [data, setData] = useState<QuestionManagerSampleData>();
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setData(undefined);
    setError('');
    void (async () => {
      const first = await api.call<Deck>('getTeachingDeck', { courseId });
      const summaries = first.decks?.length
        ? first.decks
        : first.slides.length
          ? [{ id: first.deckId || 'current', title: first.title }]
          : [];
      const decks = await Promise.all(
        summaries.map(async (d) => ({
          ...d,
          ...(d.id === first.deckId || summaries.length === 1
            ? first
            : await api.call<Deck>('getTeachingDeck', { courseId, deckId: d.id })),
          id: d.id,
        })),
      );
      const thumbnails: Record<string, string> = {};
      for (const d of decks)
        for (const s of d.slides)
          thumbnails[s.id] = slideDocument(s.html).replace(
            'width:1920px;height:1080px;position:',
            'width:1920px;height:1080px;transform:scale(.2);transform-origin:top left;position:',
          );
      const allSlides = decks.flatMap((d) => d.slides);
      if (cancelled) return;
      setThumbs(thumbnails);
      const config = await api.call<{
        interactions: Interaction[];
        answerKeys: AnswerKeys;
        roundCounts: Record<string, number>;
      }>('getClassroomConfig', {
        courseId,
        includeAnswerKeys: true,
        includeQuestionManager: true,
        slideIds: allSlides.map((s) => s.id),
      });
      if (cancelled) return;
      setData({
        roundCounts: config.roundCounts,
        serverKeys: structuredClone(config.answerKeys),
        source: 'platform',
        decks: [
          ...decks.map((d) => ({ id: d.id, title: d.title, slideIds: d.slides.map((s) => s.id) })),
          {
            id: 'legacy',
            title: '其他／舊版',
            slideIds: config.interactions
              .filter((q) => !allSlides.some((s) => s.id === q.slideId))
              .map((q) => q.slideId),
          },
        ],
        questions: config.interactions.map((q) => {
          const d = decks.find((d) => d.slides.some((s) => s.id === q.slideId));
          const keys = structuredClone(config.answerKeys[q.slideId] || {});
          // Missing answer keys are editable without choosing an answer for the teacher.
          for (const f of q.fields)
            keys[f.id] ||= { answer: f.kind === 'order' ? [] : '', explanation: '' };
          return {
            interaction: q,
            keys,
            rounds: config.roundCounts[q.slideId] || 0,
            ...(d ? { page: d.slides.findIndex((s) => s.id === q.slideId) + 1 } : {}),
          };
        }),
      } as QuestionManagerSampleData);
    })().catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [api, courseId, revision]);
  if (api.preview) return <p>題目管理需授權教師登入。</p>;
  if (error)
    return (
      <p role="alert">
        {error} <button onClick={() => setRevision((n) => n + 1)}>重新載入</button>
      </p>
    );
  if (!data) return <p role="status">正在讀取題目與投影片…</p>;
  return (
    <>
      <button
        onClick={() => {
          if (window.confirm('捨棄未儲存修改並重新載入？')) setRevision((n) => n + 1);
        }}
      >
        重新載入題目
      </button>
      <QuestionManager
        key={revision}
        data={data}
        thumbnails={thumbs}
        save={async (before, after, slideId) => {
          // Use the original server snapshot, including truly absent keys.
          const original = data.questions.find((q) => q.interaction.slideId === slideId);
          // Retain original keys below: synthetic placeholders are not sent as expected values.
          const expected = questionSnapshot(
            before ? [before.interaction] : [],
            before ? { [slideId]: originalKeys(data, slideId) } : {},
            slideId,
          );

          const result = await api.call<{ snapshot?: { keys: AnswerKeys[string] } }>(
            'updateClassroomQuestions',
            {
              courseId,
              slideId,
              expected,
              next: { interaction: after?.interaction || null, keys: after?.keys || {} },
            },
          );
          if (after && result.snapshot) after.keys = result.snapshot.keys;
          data.serverKeys![slideId] = after?.keys || {};
          if (after) {
            if (original) Object.assign(original, structuredClone(after));
            else data.questions.push(structuredClone(after));
          } else data.questions = data.questions.filter((q) => q.interaction.slideId !== slideId);
        }}
        download={async (deckId, items) => {
          if (deckId === 'legacy')
            throw Error('舊版題目無 PDF 頁碼；可在此直接編輯，xlsx 下載支援有對應頁碼的正式簡報。');
          const bytes = exportQuestionWorkbook(items),
            url = URL.createObjectURL(
              new Blob([bytes as BlobPart], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              }),
            );
          const a = document.createElement('a');
          a.href = url;
          a.download = `${deckId}-questions.xlsx`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}
      />
    </>
  );
}
function originalKeys(data: QuestionManagerSampleData, slideId: string) {
  return data.serverKeys?.[slideId] || {};
}
