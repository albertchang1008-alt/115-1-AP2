import { Question, Roster, safeId, validateQuestions, validateRoster } from './model';
export function column(headers: string[], names: string[]) {
  const normalized = headers.map((h) => String(h).replace(/\s/g, '').toLowerCase());
  return names.map((n) => normalized.indexOf(n.replace(/\s/g, '').toLowerCase())).find((i) => i >= 0) ?? -1;
}
function reader(headers: string[], row: unknown[]) {
  return (...names: string[]) => String(row[column(headers, names)] ?? '').trim();
}
export function parseRosterSheet(rows: unknown[][]): Roster[] {
  if (!rows.length) throw Error('名冊分頁沒有欄位');
  const headers = rows[0].map(String);
  for (const aliases of [['課程代碼', '課程', 'courseId'], ['班級代碼', '班級', 'classId'], ['學號', 'studentId'], ['姓名', 'name'], ['學校信箱', 'Gmail', 'email', '信箱']])
    if (column(headers, aliases) < 0) throw Error('名冊缺少欄位：' + aliases[0]);
  const result = rows.slice(1).filter((row) => row.some((v) => String(v ?? '').trim())).map((row, i) => {
    const get = reader(headers, row);
    const courseId = get('課程代碼', '課程', 'courseId');
    if (!safeId(courseId)) throw Error(`名冊第 ${i + 2} 列課程代碼無效`);
    const enabled = get('啟用', 'enabled').toLowerCase();
    if (enabled && !['true', 'false', '1', '0', '是', '否'].includes(enabled)) throw Error(`名冊第 ${i + 2} 列啟用值無效`);
    return { courseId, classId: get('班級代碼', '班級', 'classId'), studentId: get('學號', 'studentId'), name: get('姓名', 'name'), email: get('學校信箱', 'Gmail', 'email', '信箱').toLowerCase(), enabled: !['false', '0', '否'].includes(enabled) };
  });
  const errors = validateRoster(result);
  if (errors.length) throw Error(errors.slice(0, 10).join('；'));
  if (result.length > 3000) throw Error('單次名冊最多 3000 人');
  return result;
}
export function parseBankSheet(rows: unknown[][], unitId: string) {
  if (!safeId(unitId)) throw Error('分頁名稱須為單元代碼');
  if (rows.length < 2) throw Error('分頁沒有題目資料');
  const headers = rows[0].map(String);
  for (const aliases of [['課程代碼', '課程', 'courseId', 'course'], ['題目ID', 'id', '題號'], ['問題', 'text', '題幹', 'question'], ['解答', '答案', 'answer']])
    if (column(headers, aliases) < 0) throw Error('缺少欄位：' + aliases[0]);
  const groups = new Map<string, Question[]>();
  let previousCourse = '', previousImage = '';
  rows.slice(1).forEach((row, i) => {
    if (!row.some((v) => String(v ?? '').trim())) { previousImage = ''; return; }
    const get = reader(headers, row);
    const courseId = get('課程代碼', '課程', 'courseId', 'course');
    if (!safeId(courseId)) throw Error(`第 ${i + 2} 列課程代碼無效`);
    const type = get('題型', 'questionType', 'type').toLowerCase();
    if (type && !['圖片', 'image', '單選', 'single'].includes(type)) throw Error(`第 ${i + 2} 列題型無效`);
    const isImage = ['圖片', 'image'].includes(type);
    let image = get('圖片網址', 'image', 'imageUrl', 'img', 'imgUrl');
    if (isImage && !image && previousCourse === courseId) image = previousImage;
    previousCourse = courseId;
    previousImage = isImage ? image : '';
    const options = 'abcdefgh'.split('').map((id) => ({ id, text: get('選項' + id.toUpperCase(), id, 'option' + id.toUpperCase(), '選項' + (id.charCodeAt(0) - 96)) })).filter((o) => o.text);
    const rawAnswer = get('解答', '答案', 'answer', '正確答案', 'ans');
    let answer = rawAnswer.replace(/^[（(]|[）)]$/g, '').toLowerCase();
    if (/^[1-8]$/.test(answer)) answer = 'abcdefgh'[Number(answer) - 1];
    if (!options.some((o) => o.id === answer)) {
      const matching = options.filter((o) => o.text === rawAnswer);
      if (matching.length !== 1) throw Error(`第 ${i + 2} 列解答無法唯一對應選項`);
      answer = matching[0].id;
    }
    const question: Question = {
      id: get('題目ID', 'id', '題號'), text: get('問題', 'text', '題幹', 'question'), options, answer,
      questionType: isImage || image ? 'image' : 'single', image,
      explanation: get('傳統解析', '解析', 'explanation'), concept: get('concept', '知識點'),
      socratic: { concept: get('核心概念', 'socraticConcept', 'coreConcept'), misconception: get('常見誤解', 'socraticMisconception', 'misconception'), hint1: get('①先看題幹', '先看題幹', '提示1', 'socraticHint1', 'hint1'), hint2: get('②比較觀念', '比較觀念', '提示2', 'socraticHint2', 'hint2'), hint3: get('③推回答案', '推回答案', '提示3', 'socraticHint3', 'hint3') },
      lectureTitle: get('講義標題', 'lectureTitle'), lectureUrl: get('講義連結', 'lectureUrl'), remedialUrl: get('補救資源', '推薦影片', 'remedialUrl'),
    };
    const errors = validateQuestions([question]);
    if (errors.length) throw Error(`Sheet 第 ${i + 2} 列：${errors.join('；')}`);
    groups.set(courseId, [...(groups.get(courseId) || []), question]);
  });
  if (!groups.size) throw Error('沒有題目資料');
  for (const [courseId, questions] of groups) {
    const errors = validateQuestions(questions);
    if (errors.length) throw Error(`${courseId}：${errors.join('；')}`);
  }
  return groups;
}
