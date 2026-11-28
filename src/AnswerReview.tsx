import type { ComponentProps } from 'react';
import type { Answer, Question } from '../shared/model';
import { Explanations, QuestionImage } from './QuestionContent';

export function YourAnswerLine({
  options,
  selected,
}: {
  options: Question['options'];
  selected?: string;
}) {
  const choice = options.find((option) => option.id === selected);
  return <p className="your-answer"><strong>你的答案：</strong>{choice?.text ?? '未作答'}</p>;
}

export function AnswerReviewCard({
  question,
  number,
  answer,
  onResearch,
}: {
  question: Question;
  number: number;
  answer: Pick<Answer, 'selected' | 'correct'>;
  onResearch?: ComponentProps<typeof Explanations>['onResearch'];
}) {
  const status = !answer.selected ? 'skip' : answer.correct ? 'ok' : 'bad';
  const verdict = { skip: '⚪ 未作答', ok: '✅ 答對', bad: '❌ 答錯' }[status];
  return (
    <article className={`reviewanswer is-${status}`}>
      <strong className="review-verdict">{verdict}</strong>
      <YourAnswerLine options={question.options} selected={answer.selected} />
      <h3><span className="review-no">Q{number}.</span> {question.text}</h3>
      <ul className="review-options">
        {question.options.map((option) => {
          const picked = answer.selected === option.id;
          const right = question.answer === option.id;
          const label = right ? (picked ? '（正確答案・你的選擇）' : '（正確答案）') : picked ? '（你的選擇）' : '';
          return (
            <li key={option.id} className={right ? 'right' : picked ? 'picked' : undefined}>
              {right ? '✓' : picked ? '✗' : '•'} {option.text}{label && <strong>{label}</strong>}
            </li>
          );
        })}
      </ul>
      <QuestionImage key={question.image} url={question.image} />
      <Explanations q={question} outcome={status === 'ok' ? 'correct' : 'wrong'} onResearch={onResearch} />
    </article>
  );
}
