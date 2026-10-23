import {loadTeacherFigures} from './teacher-figures.mjs';
import { compileStudentScript } from './student-script.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAcidbaseModel } from './full-model.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));
export const isFull = (data) => data?.profile === 'acidbase-full-v1';
export function loadFull(data, baseDir, { legacy = false } = {}) {
  const graph = JSON.parse(fs.readFileSync(path.resolve(baseDir, data.mindmapSource), 'utf8'));
  const guidancePath = path.join(baseDir, 'guidance.json');
  const guidance = fs.existsSync(guidancePath)
    ? JSON.parse(fs.readFileSync(guidancePath, 'utf8'))
    : undefined;
  const script = legacy ? compileStudentScript(baseDir) : undefined;
  const nodes = legacy
    ? data.nodes.map((node, i) => {
        const micro = script.nodes[i].micro;
        if (!micro) return { ...node };
        const text = (id) => script.units[id].text;
        return {
          ...node,
          micro: {
            id: `script-n${i + 1}-check`,
            stem: text(micro.stem),
            options: micro.options.map(text),
            answer: micro.answer,
            feedback: ['A', 'B', 'C', 'D'].map((letter) =>
              micro.feedback[letter] ? text(micro.feedback[letter]) : '',
            ),
          },
        };
      })
    : data.nodes;
  return { ...data, nodes, guidance, graph: { nodes: graph.nodes, edges: graph.edges } };
}
export function renderFull(data, { baseDir, labHtml = '', legacy = false } = {}) {
  const config = loadFull(data, baseDir, { legacy });
  const prune = (value) =>
    Array.isArray(value)
      ? value.map(prune)
      : value && typeof value === 'object'
        ? Object.fromEntries(
            Object.entries(value)
              .filter(
                ([key]) =>
                  ![
                    'sources',
                    'uid',
                    'quote',
                    'mindmapSource',
                    'designSource',
                    'legacyApply',
                  ].includes(key),
              )
              .map(([key, val]) => [key, prune(val)]),
          )
        : value;
  if (!legacy) {config.studentScript = compileStudentScript(baseDir); config.teacherFigures=loadTeacherFigures(baseDir);}
  const payload = JSON.stringify({ ...prune(config), labHtml }).replace(/</g, '\\u003c');
  if (!legacy)
    return `<!doctype html><html lang="zh-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>酸鹼互動資訊圖表</title><style>${fs.readFileSync(path.join(dir, 'student.css'), 'utf8')}\n${fs.readFileSync(path.join(dir, 'acidbase-assessment.css'), 'utf8')}</style></head><body><main class="initial-page"><h1>${config.studentScript.units['intro.copy'].text}</h1></main><script>${fs.readFileSync(path.join(dir, 'student-components.js'), 'utf8')}\n${createAcidbaseModel.toString()}
${fs.readFileSync(path.join(dir, 'teacher-figures.js'), 'utf8')}
${fs.readFileSync(path.join(dir, 'student.js'), 'utf8')}
mountStudentScript(${payload});</script></body></html>`;
  return `<!doctype html><html lang="zh-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Code pH｜酸鹼三系統</title><style>${fs.readFileSync(path.join(dir, 'lab.css'), 'utf8')}\n${fs.readFileSync(path.join(dir, 'full.css'), 'utf8')}</style></head><body><script>const Model=(${createAcidbaseModel.toString()})();\n${fs.readFileSync(path.join(dir, 'full.js'), 'utf8')}\nmountAcidbaseFull(${payload});</script></body></html>`;
}
