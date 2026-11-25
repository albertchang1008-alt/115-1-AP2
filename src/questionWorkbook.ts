import { questionMatrix } from '../shared/questionWorkbook';
import type { SampleQuestion } from '../shared/questionManagerSample';
import { exportWorkbook } from './xlsxWorkbook';

export function exportQuestionWorkbook(items: SampleQuestion[]) {
  return exportWorkbook('題目表', questionMatrix(items));
}
