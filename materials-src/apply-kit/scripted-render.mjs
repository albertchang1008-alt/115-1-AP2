import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileApplyStudentScript } from './scripted-compile.mjs';
import {loadTeacherFigures} from './teacher-figures.mjs';
import { unwrap } from './model.mjs';
const kit = path.dirname(fileURLToPath(import.meta.url));
export function hasStudentPlan(baseDir) {
  return fs.existsSync(path.join(baseDir, 'student-plan.json'));
}
export function renderScriptedApply(data, { baseDir }) {
  const script = compileApplyStudentScript(baseDir),
    c = unwrap(data);
  const assets = loadTeacherFigures(baseDir);
  script.nodes.forEach((node,i)=> { node.teacherFigure=assets.find(e=>e.node===i+1); });
  const payload = JSON.stringify({
    studentScript: script,
    questions: c.learning.questions,
    nodeIds: c.learning.nodes.map((n) => n.id),
  }).replace(/</g, '\\u003c');
  const css = ['student.css', 'scripted.css']
    .map((f) => fs.readFileSync(path.join(kit, f), 'utf8'))
    .join('\n');
  const js = ['student-components.js', 'teacher-figures.js', 'spatial-figure.js', 'student-figures.js', 'scripted-player.js']
    .map((f) => fs.readFileSync(path.join(kit, f), 'utf8'))
    .join('\n');
  return `<!doctype html><html lang="zh-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${c.title}</title><style>${css}</style></head><body><script>${js}\nmountApplyScripted(${payload});</script></body></html>`;
}
