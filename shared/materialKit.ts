export interface MaterialQuestion { id: string; stem: string; options: string[]; answer: number; hint: string; nodeId: string }
export interface MaterialNode { id: string; tag: string; title: string; summary: string; figure: string; concept: string; points: string[]; clinical: { title: string; text: string } }
export interface MaterialContent {
  slug: string; version: string; title: string; subtitle: string; label: string;
  stats: { value: string; label: string }[];
  lab: { title: string; intro: string; figure: string; states: { id: string; label: string; explain: string }[]; predict: { question: string; options: string[]; answer: number; feedback: string } };
  nodes: MaterialNode[]; foundation: MaterialQuestion[]; cases: MaterialQuestion[];
  credits?: string[]; rules?: { nodes: number; foundation: number; cases: number };
}
const id = /^[a-z0-9-]+$/;
export function validateMaterialContent(value: unknown): asserts value is MaterialContent {
  const c = value as MaterialContent, errors: string[] = [];
  if (!c || typeof c !== 'object') throw new Error('content：必須是物件');
  for (const key of ['slug', 'version', 'title', 'subtitle', 'label'] as const) if (!c[key] || typeof c[key] !== 'string') errors.push(`${key}：必填文字`);
  if (!id.test(c.slug || '')) errors.push('slug：僅可用 a-z、0-9、-');
  if (!id.test(c.version || '')) errors.push('version：僅可用 a-z、0-9、-');
  if (!Array.isArray(c.stats) || c.stats.length < 2 || c.stats.length > 4) errors.push('stats：需有 2–4 項');
  if (!c.lab?.states?.length || !c.lab.predict || !Array.isArray(c.nodes) || !Array.isArray(c.foundation) || !Array.isArray(c.cases)) errors.push('lab、nodes、foundation、cases：必填');
  const rules = c.rules || { nodes: 6, foundation: 6, cases: 5 };
  for (const [key, rows, count] of [['nodes', c.nodes, rules.nodes], ['foundation', c.foundation, rules.foundation], ['cases', c.cases, rules.cases]] as const) if (rows.length !== count) errors.push(`${key}：預期 ${count} 筆，實得 ${rows.length} 筆`);
  const ids = new Set<string>();
  for (const node of c.nodes || []) { if (!id.test(node.id || '') || ids.has(node.id)) errors.push(`nodes.${node.id || '?'}：ID 無效或重複`); ids.add(node.id); }
  for (const [kind, rows] of [['foundation', c.foundation], ['cases', c.cases]] as const) for (const q of rows || []) {
    if (!id.test(q.id || '') || ids.has(q.id)) errors.push(`${kind}.${q.id || '?'}：ID 無效或全檔重複`); ids.add(q.id);
    if (!Array.isArray(q.options) || !Number.isInteger(q.answer) || !q.options[q.answer]) errors.push(`${kind}.${q.id}：answer 必須是 options 之一`);
    if (!c.nodes?.some((n) => n.id === q.nodeId)) errors.push(`${kind}.${q.id}：nodeId「${q.nodeId}」不存在`);
  }
  if (!Array.isArray(c.lab.predict.options) || !c.lab.predict.options[c.lab.predict.answer]) errors.push('lab.predict.answer：必須是 options 之一');
  if (errors.length) throw new Error(errors.join('\n'));
}
