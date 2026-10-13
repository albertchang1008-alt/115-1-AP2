import type {
  Activity,
  Course,
  Progress,
  ReflectionConfig,
  ReflectionResponse,
  Roster,
} from './model';
import { chapterActivityKey, chaptersOf, forClass, parseCourseTime } from './model';

const control = /[\u0000-\u001f\u007f-\u009f]/;
export function validateReflectionConfig(value: unknown): ReflectionConfig {
  const c = value as ReflectionConfig;
  if (
    !c ||
    !Array.isArray(c.prompts) ||
    c.prompts.length < 1 ||
    c.prompts.length > 8 ||
    (c.allowEdit !== undefined && typeof c.allowEdit !== 'boolean')
  )
    throw Error('反思需設定 1–8 題，並設定是否允許修改');
  const ids = new Set<string>();
  const prompts = c.prompts.map((p) => {
    if (!p || !/^[a-z0-9-]+$/.test(p.id) || p.id.length > 80 || ids.has(p.id))
      throw Error('反思題目 ID 無效或重複');
    ids.add(p.id);
    if (
      typeof p.text !== 'string' ||
      !p.text.trim() ||
      p.text.trim().length > 300 ||
      control.test(p.text) ||
      typeof p.required !== 'boolean'
    )
      throw Error('反思題目需為 1–300 字，並設定必做');
    const base = { id: p.id, kind: p.kind, text: p.text.trim(), required: p.required };
    if (p.kind === 'text') {
      if (p.options !== undefined) throw Error('文字題不能有單選選項');
      const maxLength = p.maxLength ?? 500;
      if (!Number.isInteger(maxLength) || maxLength < 1 || maxLength > 1000)
        throw Error('字數上限需為 1–1000');
      return { ...base, maxLength };
    }
    if (
      p.kind !== 'single' ||
      p.maxLength !== undefined ||
      !Array.isArray(p.options) ||
      p.options.length < 2 ||
      p.options.length > 6 ||
      p.options.some(
        (o) => typeof o !== 'string' || !o.trim() || o.length > 80 || control.test(o),
      ) ||
      new Set(p.options).size !== p.options.length
    )
      throw Error('單選需設定 2–6 個不重複選項，每個 1–80 字');
    const options = p.options.map((o) => o.trim());
    if (new Set(options).size !== options.length) throw Error('單選選項去空白後不能重複');
    return { ...base, options };
  });
  return { prompts, allowEdit: c.allowEdit ?? true };
}
export function validateReflectionAnswers(
  config: ReflectionConfig,
  value: unknown,
): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('反思答案格式錯誤');
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((id) => !config.prompts.some((p) => p.id === id)))
    throw Error('答案包含不在活動內的題目');
  const answers: Record<string, string> = {};
  for (const p of config.prompts) {
    const raw = Object.hasOwn(input, p.id) ? input[p.id] : '';
    if (typeof raw !== 'string') throw Error('答案格式錯誤');
    const normalized = p.kind === 'text' ? raw.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n') : raw;
    if (control.test(p.kind === 'text' ? normalized.replace(/\n/g, '') : normalized)) throw Error('答案不能包含控制字元');
    const answer = normalized.trim();
    if (!answer && p.required) throw Error(`請回答必做題：${p.text}`);
    if (p.kind === 'text' && answer.length > (p.maxLength ?? 500))
      throw Error(`「${p.text}」最多 ${p.maxLength ?? 500} 字`);
    if (p.kind === 'single' && answer && !p.options?.includes(answer))
      throw Error('單選答案不在選項內');
    answers[p.id] = answer;
  }
  return answers;
}
/** Read through forClass so hidden chapters and class restrictions cannot be bypassed. */
export function reflectionActivity(
  course: Course | undefined,
  classId: string,
  chapterId: string,
  activityId: string,
  now = Date.now(),
  writing = false,
) {
  if (!course) throw Error('課程尚未發布');
  const visible = forClass(course, classId),
    chapter = chaptersOf(visible)[chapterId];
  const activity = chapter?.activities.find((a) => a.id === activityId);
  if (!chapter || !activity || activity.type !== 'reflection')
    throw Error('反思活動未發布或該班不可見');
  if (parseCourseTime(chapter.opensAt) > now) throw Error('單元尚未開放');
  if (writing && parseCourseTime(chapter.dueAt) <= now)
    throw Error('單元已截止，反思只能查看，不能修改');
  return { chapter, activity, config: validateReflectionConfig(activity.reflection) };
}
export function reflectionTemplate(): ReflectionConfig {
  return {
    allowEdit: true,
    prompts: [
      {
        id: 'concept-change',
        kind: 'text',
        required: true,
        maxLength: 500,
        text: '今天哪一個概念讓你改變了想法？請用「原本我以為＿＿，現在我知道＿＿」回答。',
      },
      {
        id: 'helpful-activity',
        kind: 'single',
        required: true,
        text: '今天哪一個活動最能幫助你弄懂觀念？',
        options: ['互動資訊圖表', '投票後和鄰座互相說服', '案例討論', '前測、後測與答案回饋'],
      },
      {
        id: 'remaining-question',
        kind: 'text',
        required: false,
        maxLength: 500,
        text: '現在還有哪一個地方不太確定、想再問清楚？',
      },
    ],
  };
}
export function reflectionProgress(progress: Progress, key: string, now: number): Progress {
  return {
    ...progress,
    activities: {
      ...progress.activities,
      [key]: {
        ...progress.activities[key],
        position: progress.activities[key]?.position || 0,
        completed: true,
        updatedAt: now,
      },
    },
  };
}
export function buildReflectionResponse(
  identity: { uid: string; classId: string; studentId?: string; name?: string; email?: string },
  config: ReflectionConfig,
  answers: Record<string, string>,
  old: ReflectionResponse | null,
  now: number,
): ReflectionResponse {
  if (old && !config.allowEdit) throw Error('這份反思已送出，教師設定不允許修改');
  return {
    uid: identity.uid,
    classCode: identity.classId,
    studentId: identity.studentId || '',
    name: identity.name || '',
    email: identity.email || '',
    answers,
    promptsSnapshot: structuredClone(config.prompts),
    submittedAt: old?.submittedAt || now,
    updatedAt: now,
    editCount: old ? old.editCount + 1 : 0,
  };
}
export function summarizeReflections(
  activity: Activity,
  rows: ReflectionResponse[],
  roster: Roster[],
) {
  const missing = roster.filter((r) => !rows.some(x => (r.uid && x.uid === r.uid) || (r.studentId ? x.studentId === r.studentId : x.email === r.email)));
  // Use snapshots so removed/renamed options still appear, rather than silently losing old votes.
  const choices = new Map<string, { id: string; text: string; options: Record<string, number> }>();
  for (const p of activity.reflection?.prompts || [])
    if (p.kind === 'single')
      choices.set(p.id, {
        id: p.id,
        text: p.text,
        options: Object.fromEntries((p.options || []).map((o) => [o, 0])),
      });
  for (const row of rows)
    for (const p of row.promptsSnapshot)
      if (p.kind === 'single') {
        const c = choices.get(p.id) || { id: p.id, text: p.text, options: Object.create(null) };
        const answer = row.answers[p.id];
        if (answer)
          c.options = {
            ...c.options,
            [answer]: (Object.hasOwn(c.options, answer) ? c.options[answer] : 0) + 1,
          };
        choices.set(p.id, c);
      }
  return { rows, missing, rosterCount: roster.length, choiceCounts: [...choices.values()] };
}
export function reflectionCsv(
  rows: (ReflectionResponse & { researchId?: string })[],
  deidentified: boolean,
) {
  const prompts = new Map<string, string>();
  rows.forEach((r) => r.promptsSnapshot.forEach((p) => prompts.set(p.id, p.text)));
  const header = [
    ...(deidentified ? ['研究代碼'] : ['學號', '姓名']),
    '班級',
    ...(deidentified ? [] : ['信箱']),
    '送出時間',
    ...[...prompts].map(([id, text]) => `${text} (${id})`),
  ];
  const csvCell = (value: unknown) => {
    let s = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const lines = rows.map((r) => [
    ...(deidentified ? [r.researchId || ''] : [r.studentId, r.name]),
    r.classCode,
    ...(deidentified ? [] : [r.email]),
    new Date(r.submittedAt).toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' }),
    ...[...prompts.keys()].map((id) => r.answers[id] || ''),
  ]);
  return '\ufeff' + [header, ...lines].map((row) => row.map(csvCell).join(',')).join('\r\n');
}
export function reflectionDraftKey(
  courseId: string,
  uid: string,
  chapterId: string,
  activityId: string,
) {
  return `reflection:${JSON.stringify([courseId, uid, chapterId, activityId])}`;
}
export function reflectionCanEdit(
  config: ReflectionConfig,
  dueAt: string,
  saved: boolean,
  now = Date.now(),
) {
  return !(parseCourseTime(dueAt) <= now) && (!saved || config.allowEdit);
}
export { chapterActivityKey };
