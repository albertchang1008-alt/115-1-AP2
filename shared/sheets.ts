import { Question, Roster, safeCode, validateQuestions, validateRoster } from './model';
export function column(headers: string[], names: string[]) {
  const normalized = headers.map((h) => String(h).replace(/\s/g, '').toLowerCase());
  return names.map((n) => normalized.indexOf(n.replace(/\s/g, '').toLowerCase())).find((i) => i >= 0) ?? -1;
}
function reader(headers: string[], row: unknown[]) {
  return (...names: string[]) => String(row[column(headers, names)] ?? '').trim();
}
// 課程代碼通常由題庫分頁名稱推得；單一課程 Sheet 的「班級名冊」不必逐列重複它。
export function parseRosterSheet(rows: unknown[][], testEmails: readonly string[] = [], fallbackCourseId = ''): Roster[] {
  if (!rows.length) throw Error('名冊分頁沒有欄位');
  if (fallbackCourseId && !safeCode(fallbackCourseId)) throw Error('名冊對應的課程代碼無效');
  const headers = rows[0].map(String);
  const required = [['班級代碼', '班級', '授課班級', 'classId'], ['學號', 'studentId'], ['姓名', 'name'], ['學校信箱', 'Gmail', 'email', '信箱']];
  if (!fallbackCourseId) required.unshift(['課程代碼', '課程', 'courseId']);
  for (const aliases of required)
    if (column(headers, aliases) < 0) throw Error('名冊缺少欄位：' + aliases[0]);
  const result = rows.slice(1).filter((row) => row.some((v) => String(v ?? '').trim())).map((row, i) => {
    const get = reader(headers, row);
    const courseId = get('課程代碼', '課程', 'courseId') || fallbackCourseId;
    if (!safeCode(courseId)) throw Error(`名冊第 ${i + 2} 列課程代碼無效`);
    const enabled = get('啟用', 'enabled').toLowerCase();
    if (enabled && !['true', 'false', '1', '0', '是', '否'].includes(enabled)) throw Error(`名冊第 ${i + 2} 列啟用值無效`);
    return { courseId, classId: get('班級代碼', '班級', '授課班級', 'classId'), studentId: get('學號', 'studentId'), name: get('姓名', 'name'), email: get('學校信箱', 'Gmail', 'email', '信箱').toLowerCase(), enabled: !['false', '0', '否'].includes(enabled) };
  });
  const errors = validateRoster(result, testEmails);
  if (errors.length) throw Error(errors.slice(0, 10).join('；'));
  if (result.length > 3000) throw Error('單次名冊最多 3000 人');
  return result;
}
// ⑤追溯原子卡等欄位可能帶 Markdown 反引號與殘留分隔線，畫面是純文字渲染，同步時先清乾淨。
function cleanTrace(s: string) {
  return s.replace(/`/g, '').replace(/\n+-{2,}\s*$/, '').trim();
}
export interface UnitGroup {
  // 單元（大分類，例如「血液」）。多列填了不同值會報錯；全部空白則不分組。
  group?: string;
  questions: Question[];
}
// courseId -> 次單元代碼(=unitId) -> 該次單元的分組與題目。
export type BankGroups = Map<string, Map<string, UnitGroup>>;
// 粗略判斷這個分頁是不是題庫。課程代碼由分頁名稱提供時，表內不必重複放課程欄；
// 正式題庫總表也使用「題目」及「正確答案文字」，須與舊版「問題／解答」相容。
export function looksLikeBankSheet(rows: unknown[][]): boolean {
  if (!rows.length) return false;
  const headers = rows[0].map(String);
  return [['題目ID', 'id', '題號'], ['問題', '題目', 'text', '題幹', 'question'], ['解答', '答案', '正確答案文字', '正確答案', 'answer']]
    .every((aliases) => column(headers, aliases) >= 0);
}
export function parseBankSheet(rows: unknown[][], fallbackUnitId: string, fallbackCourseId = ''): BankGroups {
  if (!safeCode(fallbackUnitId)) throw Error('分頁名稱須為單元代碼');
  if (fallbackCourseId && !safeCode(fallbackCourseId)) throw Error('分頁名稱須為課程代碼');
  if (rows.length < 2) throw Error('分頁沒有題目資料');
  const headers = rows[0].map(String);
  for (const aliases of [['題目ID', 'id', '題號'], ['問題', '題目', 'text', '題幹', 'question'], ['解答', '答案', '正確答案文字', '正確答案', 'answer']])
    if (column(headers, aliases) < 0) throw Error('缺少欄位：' + aliases[0]);
  const groups: BankGroups = new Map();
  let previousCourse = '', previousUnit = '', previousImage = '';
  rows.slice(1).forEach((row, i) => {
    if (!row.some((v) => String(v ?? '').trim())) { previousImage = ''; return; }
    const get = reader(headers, row);
    const courseId = get('課程代碼', '課程', 'courseId', 'course') || fallbackCourseId;
    if (!safeCode(courseId)) throw Error(`第 ${i + 2} 列課程代碼無效`);
    const unitId = get('次單元', 'unitId', 'unit') || fallbackUnitId;
    if (!safeCode(unitId)) throw Error(`第 ${i + 2} 列次單元代碼無效`);
    const rowGroup = get('單元', 'group', '大分類');
    const enabledRaw = get('啟用', 'enabled').toLowerCase();
    if (enabledRaw && !['true', 'false', '1', '0', '是', '否'].includes(enabledRaw)) throw Error(`第 ${i + 2} 列啟用值無效`);
    if (enabledRaw && ['false', '0', '否'].includes(enabledRaw)) { previousImage = ''; return; }
    const type = get('題型', 'questionType', 'type').toLowerCase();
    if (type && !['圖片', 'image', '單選', 'single'].includes(type)) throw Error(`第 ${i + 2} 列題型無效`);
    const isImage = ['圖片', 'image'].includes(type);
    let image = get('圖片網址', 'image', 'imageUrl', 'img', 'imgUrl');
    if (isImage && !image && previousCourse === courseId && previousUnit === unitId) image = previousImage;
    previousCourse = courseId;
    previousUnit = unitId;
    previousImage = isImage ? image : '';
    const options = 'abcdefgh'.split('').map((id) => ({ id, text: get('選項' + id.toUpperCase(), id, 'option' + id.toUpperCase(), '選項' + (id.charCodeAt(0) - 96)) })).filter((o) => o.text);
    // 正式總表以「正確答案文字」為優先；早期匯入列有時只留下原始答案字母，
    // 在文字答案空白時才向後相容採用它，避免覆蓋已校訂的答案文字。
    const rawAnswer = get('解答', '答案', '正確答案文字', '正確答案', 'answer', 'ans')
      || get('原始答案字母(僅對照)', '原始答案字母', 'originalAnswer');
    let answer = rawAnswer.replace(/^[（(]|[）)]$/g, '').toLowerCase();
    if (/^[1-8]$/.test(answer)) answer = 'abcdefgh'[Number(answer) - 1];
    if (!options.some((o) => o.id === answer)) {
      const matching = options.filter((o) => o.text === rawAnswer);
      if (matching.length !== 1) throw Error(`第 ${i + 2} 列解答無法唯一對應選項`);
      answer = matching[0].id;
    }
    const orderRaw = get('題序', '序號', 'order');
    if (orderRaw && !Number.isFinite(Number(orderRaw))) throw Error(`第 ${i + 2} 列題序必須是數字或留白`);
    const order = orderRaw ? Number(orderRaw) : undefined;
    const question: Question = {
      id: get('題目ID', 'id', '題號'), text: get('問題', '題目', 'text', '題幹', 'question'), options, answer,
      questionType: isImage || image ? 'image' : 'single', image, ...(order === undefined ? {} : { order }),
      explanation: get('傳統解析', '解析', 'explanation'), concept: get('concept', '知識點'),
      socratic: {
        concept: get('核心概念', 'socraticConcept', 'coreConcept'),
        misconception: get('常見誤解', 'socraticMisconception', 'misconception'),
        hint1: get('①先看題幹', '先看題幹', '提示1', 'socraticHint1', 'hint1'),
        hint2: get('②比較觀念', '比較觀念', '提示2', 'socraticHint2', 'hint2'),
        hint3: get('③推回答案', '推回答案', '提示3', 'socraticHint3', 'hint3'),
        keyword: get('①先想關鍵字', 'socraticKeyword', 'keyword'),
        chain: get('②提問鏈', 'socraticChain', 'chain'),
        decide: get('③回頭選答案', '③對答案', 'socraticDecide', 'decide'),
        memory: get('④一句話記憶', 'socraticMemory', 'memory'),
        trace: cleanTrace(get('⑤追溯原子卡', 'socraticTrace', 'trace')),
      },
      lectureTitle: get('講義標題', 'lectureTitle'), lectureUrl: get('講義連結', 'lectureUrl'), remedialUrl: get('補救資源', '推薦影片', 'remedialUrl'),
    };
    const errors = validateQuestions([question]);
    if (errors.length) throw Error(`Sheet 第 ${i + 2} 列（次單元 ${unitId}、題目 ${question.id || '未填'}）：${errors.join('；')}`);
    const course = groups.get(courseId) || new Map<string, UnitGroup>();
    groups.set(courseId, course);
    const unit = course.get(unitId) || { questions: [] };
    if (rowGroup) {
      if (unit.group && unit.group !== rowGroup)
        throw Error(`次單元「${unitId}」同時出現在單元「${unit.group}」與「${rowGroup}」，請統一同一次單元的單元欄`);
      unit.group = rowGroup;
    }
    unit.questions.push(question);
    course.set(unitId, unit);
  });
  if (!groups.size) throw Error('沒有題目資料');
  for (const [courseId, units] of groups)
    for (const [unitId, unit] of units) {
      const errors = validateQuestions(unit.questions);
      if (errors.length) throw Error(`${courseId}／次單元 ${unitId}：${errors.join('；')}`);
    }
  return groups;
}
