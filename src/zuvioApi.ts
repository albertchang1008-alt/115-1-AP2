import {
  ZPoolEntry, ZItem, ZExamView, ZParsed, ZResult, ZCounts, examCsv, matchExam, buildResults, examReport, compareSittings,
  eligibility, shuffle, optionOrderFor,
} from '../shared/zuvio';

export interface Sitting { id: string; label: string; date: string; classIds: string[]; results?: { importedAt: number; revision: number; matched: number; counts: ZCounts } }
export interface ExamSummary { id: string; title: string; createdAt: number; count: number; score: number; archived: boolean; sittings: Sitting[] }
export interface ImportPreview { previewId: string; matched: number; counts: ZCounts; blocking: string[]; details: string[]; garbled: number; replaces: boolean }
export interface ZuvioApi {
  sample: boolean;
  pool(): Promise<{ entries: ZPoolEntry[]; excluded: Record<string, number>; usage: Record<string, { n: number; last: number }>; classes: string[]; unitClasses?: Record<string, string[]> }>;
  createExam(input: { examId: string; title: string; score: number; classIds: string[]; items: ZItem[] }): Promise<{ examId: string; csv: string }>;
  listExams(): Promise<ExamSummary[]>;
  getExam(examId: string): Promise<{ summary: ExamSummary; view: ZExamView; csv: string | null; classIds: string[]; masked?: number }>;
  createSitting(examId: string, s: { label: string; date: string; classIds: string[] }): Promise<Sitting>;
  previewImport(examId: string, sittingId: string, parsed: ZParsed): Promise<ImportPreview>;
  confirmImport(examId: string, sittingId: string, previewId: string): Promise<void>;
  deleteResults(examId: string, sittingId: string): Promise<void>;
  report(examId: string, sittingIds: string[], classId?: string): Promise<ReturnType<typeof examReport>>;
  compare(examId: string, a: string, b: string): Promise<ReturnType<typeof compareSittings>>;
  archive(examId: string, archived: boolean): Promise<void>;
}

const uuid = () => (crypto as any).randomUUID?.() || Math.random().toString(16).slice(2) + Date.now().toString(16);

/** 樣張用：全部在記憶體；題目取自 W8 示範題、學生為合成（T001…）。 */
export function sampleZuvioApi(pool: ZPoolEntry[]): ZuvioApi {
  const classes = ['甲班', '乙班', '丙班'];
  const roster = new Map<string, { classId: string; enabled: boolean }>();
  for (let i = 1; i <= 90; i++) roster.set('T' + String(i).padStart(3, '0'), { classId: classes[(i - 1) % 3], enabled: i !== 7 });
  const exams = new Map<string, { summary: ExamSummary; view: ZExamView; classIds: string[]; results: Map<string, Map<string, ZResult>> }>();
  const usage: Record<string, { n: number; last: number }> = {};
  const previews = new Map<string, { examId: string; sittingId: string; results: Map<string, ZResult>; counts: ZCounts; matched: number }>();
  const viewFor = (title: string, score: number, items: ZItem[]): ZExamView => ({
    title, score,
    items: items.map((it) => { const q = pool.find((e) => e.question.id === it.questionId)!.question; return { ...it, text: q.text, options: q.options, answer: q.answer }; }),
  });
  // 預先放一份已考過兩場的示範考卷
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const demoItems: ZItem[] = shuffle(pool.filter((e) => e.group === '呼吸'), rand).slice(0, 10)
    .map((e) => ({ questionId: e.question.id, unitId: e.unitId, version: e.version, optionOrder: optionOrderFor(e.question, true, rand) }));
  const demoView = viewFor('11/3 呼吸小考', 4, demoItems);
  const mk = (skill: number, cls: string[]) => {
    const m = new Map<string, ZResult>();
    for (const [sid, r] of roster) {
      if (!cls.includes(r.classId) || !r.enabled) continue;
      const res: ZResult = { classId: r.classId, answers: {}, correct: 0, score: 0 };
      demoView.items.forEach((it) => {
        const ok = rand() < skill;
        const a = ok ? it.answer : it.optionOrder.filter((x) => x !== it.answer)[Math.floor(rand() * (it.optionOrder.length - 1))];
        res.answers[it.questionId] = a;
        if (ok) { res.correct++; res.score += 4; }
      });
      m.set(sid, res);
    }
    return m;
  };
  const counts0: ZCounts = { notInRoster: 0, disabled: 0, wrongClass: 0, needTextId: 0, duplicate: 0 };
  const s1: Sitting = { id: 's1', label: '甲班 第1次', date: '2026-11-03', classIds: ['甲班'] };
  const s2: Sitting = { id: 's2', label: '甲班 重考', date: '2026-11-05', classIds: ['甲班'] };
  const s3: Sitting = { id: 's3', label: '乙班 第1次', date: '2026-11-04', classIds: ['乙班'] };
  const r1 = mk(0.55, ['甲班']), r2 = mk(0.72, ['甲班']), r3 = mk(0.6, ['乙班']);
  s1.results = { importedAt: Date.now() - 3e8, revision: 1, matched: r1.size, counts: counts0 };
  s2.results = { importedAt: Date.now() - 1e8, revision: 1, matched: r2.size, counts: counts0 };
  s3.results = { importedAt: Date.now() - 2e8, revision: 1, matched: r3.size, counts: counts0 };
  exams.set('demo-exam', {
    summary: { id: 'demo-exam', title: demoView.title, createdAt: Date.now() - 4e8, count: demoItems.length, score: 4, archived: false, sittings: [s1, s3, s2] },
    view: demoView, classIds: classes, results: new Map([['s1', r1], ['s2', r2], ['s3', r3]]),
  });
  demoItems.forEach((it) => (usage[it.questionId] = { n: 3, last: Date.now() - 3e8 }));
  const get = (id: string) => { const e = exams.get(id); if (!e) throw Error('找不到考卷'); return e; };
  return {
    sample: true,
    async pool() {
      const excluded = { image: 0, reserved: 0, unsafe: 0 };
      const entries = pool.filter((e) => { const why = eligibility(e.question, new Set()); if (why) (excluded as any)[why]++; return !why; });
      return { entries, excluded, usage: { ...usage }, classes };
    },
    async createExam({ examId, title, score, classIds, items }) {
      const view = viewFor(title, score, items);
      exams.set(examId, { summary: { id: examId, title, createdAt: Date.now(), count: items.length, score, archived: false, sittings: [] }, view, classIds, results: new Map() });
      return { examId, csv: examCsv(view) };
    },
    async listExams() { return [...exams.values()].map((e) => e.summary).sort((a, b) => b.createdAt - a.createdAt); },
    async getExam(id) { const e = get(id); return { summary: e.summary, view: e.view, csv: examCsv(e.view), classIds: e.classIds }; },
    async createSitting(id, s) {
      const e = get(id);
      const sitting: Sitting = { id: uuid(), ...s };
      e.summary.sittings.push(sitting);
      e.view.items.forEach((it) => (usage[it.questionId] = { n: (usage[it.questionId]?.n || 0) + 1, last: Date.now() }));
      return sitting;
    },
    async previewImport(id, sittingId, parsed) {
      const e = get(id);
      const sitting = e.summary.sittings.find((s) => s.id === sittingId)!;
      const match = matchExam(e.view, parsed);
      const lookup = (sid: string) => roster.get(sid) || (/^\d+$/.test(sid) && [...roster.keys()].some((k) => k.replace(/^0+/, '') === sid) ? { classId: '', enabled: true, numericOnlyMatch: true } : null);
      const r = buildResults(e.view, parsed, match, lookup, sitting.classIds);
      const previewId = uuid();
      previews.set(previewId, { examId: id, sittingId, results: r.results, counts: r.counts, matched: r.results.size });
      return { previewId, matched: r.results.size, counts: r.counts, blocking: r.blocking, details: r.details, garbled: match.garbled, replaces: !!sitting.results };
    },
    async confirmImport(id, sittingId, previewId) {
      const p = previews.get(previewId);
      if (!p || p.examId !== id || p.sittingId !== sittingId) throw Error('預覽已失效，請重新選檔');
      const e = get(id);
      const s = e.summary.sittings.find((x) => x.id === sittingId)!;
      e.results.set(sittingId, p.results);
      s.results = { importedAt: Date.now(), revision: (s.results?.revision || 0) + 1, matched: p.matched, counts: p.counts };
      previews.delete(previewId);
    },
    async deleteResults(id, sittingId) {
      const e = get(id);
      e.results.delete(sittingId);
      const s = e.summary.sittings.find((x) => x.id === sittingId)!;
      delete s.results;
      for (const [k, p] of previews) if (p.sittingId === sittingId) previews.delete(k);
    },
    async report(id, sittingIds, classId) {
      const e = get(id);
      const all = sittingIds.flatMap((s) => [...(e.results.get(s)?.values() || [])]).filter((r) => !classId || r.classId === classId);
      return examReport(e.view, all, (u) => pool.find((p) => p.unitId === u)?.unitTitle || u);
    },
    async compare(id, a, b) { const e = get(id); return compareSittings(e.view, e.results.get(a) || new Map(), e.results.get(b) || new Map()); },
    async archive(id, archived) { get(id).summary.archived = archived; },
  };
}

/** 正式：經教師限定 callable（functions/src/zuvioExams.ts）。 */
export function cloudZuvioApi(api: { call<T = any>(name: string, data?: any): Promise<T> }, courseId: string): ZuvioApi {
  const parsedByPreview = new Map<string, ZParsed>();
  return {
    sample: false,
    pool: () => api.call('zuvioPool', { courseId }),
    createExam: (input) => api.call('zuvioCreateExam', { courseId, ...input }),
    listExams: () => api.call('zuvioListExams', { courseId }),
    getExam: (examId) => api.call('zuvioGetExam', { courseId, examId }),
    createSitting: (examId, s) => api.call('zuvioCreateSitting', { courseId, examId, ...s }),
    async previewImport(examId, sittingId, parsed) {
      const r = await api.call<ImportPreview>('zuvioImportResults', { courseId, examId, sittingId, parsed });
      if (r.previewId) parsedByPreview.set(r.previewId, parsed);
      return r;
    },
    async confirmImport(examId, sittingId, previewId) {
      const parsed = parsedByPreview.get(previewId);
      if (!parsed) throw Error('預覽已失效，請重新選檔');
      await api.call('zuvioImportResults', { courseId, examId, sittingId, parsed, confirm: true, previewId });
      parsedByPreview.delete(previewId);
    },
    deleteResults: (examId, sittingId) => api.call('zuvioDeleteResults', { courseId, examId, sittingId }),
    async report(examId, sittingIds, classId) {
      return (await api.call<any>('zuvioReport', { courseId, examId, sittingIds, ...(classId ? { classId } : {}) })).report;
    },
    async compare(examId, a, b) {
      return (await api.call<any>('zuvioReport', { courseId, examId, sittingIds: [a, b] })).compare;
    },
    archive: (examId, archived) => api.call('zuvioArchiveExam', { courseId, examId, archived }),
  };
}
