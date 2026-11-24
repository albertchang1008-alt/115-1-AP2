import { ZExamView } from './zuvio';

/** 產生與 Zuvio「下載數據」相同版型的矩陣（合成學生；供樣張與測試，不含真實資料） */
export function fakeZuvioExport(
  view: ZExamView,
  students: { studentId: string; name: string }[],
  answer: (studentIndex: number, itemIndex: number) => number | null, // 回傳選項位置（0 起），null＝未答
  opts: { garble?: { item: number; option: number }; titleOverride?: string } = {},
): string[][] {
  const m: string[][] = [];
  m.push(['資料夾名稱', '未分類題目'], ['問題題型', '測驗題目'], ['是否分組', '否'], ['是否匿名', '否'], ['總分', String(view.items.length * view.score)], ['題幹', opts.titleOverride ?? view.title], [], ['平均', '0'], [], ['分數', '1~15'], ['人數', '0'], []);
  m.push(['學號', '姓名', '作答時間', '總分', ...view.items.map((_, i) => `第${i + 1}題`)]);
  students.forEach((s) => m.push([s.studentId, s.name, '2026-11-10 08:00:00', '0']));
  m.push([], [], []);
  view.items.forEach((it, i) => {
    const texts = it.optionOrder.map((id) => it.options.find((o) => o.id === id)!.text);
    if (opts.garble && opts.garble.item === i) texts[opts.garble.option] = '瘞?恣';
    m.push([`第${i + 1}題:單選題`], ['問題敘述', it.text], ['配分', String(view.score)], ['平均', '0'], ['正解', String(it.optionOrder.indexOf(it.answer) + 1)], ['問題敘述', it.text], ['選項編號', '選項', '正解', '票數', '作答人名']);
    texts.forEach((t, k) => m.push([String(k + 1), t, it.optionOrder[k] === it.answer ? 'YES' : 'NO', '0']));
    m.push([]);
    m.push(['學號', '姓名', '對O/錯X', '得分', '回答']);
    students.forEach((s, si) => {
      const a = answer(si, i);
      m.push([s.studentId, s.name, '', '', a === null ? '' : texts[a]]);
    });
    m.push([]);
  });
  return m;
}
