import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
export function auditReadabilityCss(root, allowlist = []) {
  const files = [
      'src/style.css',
      'src/answer-integrity.css',
      ...fs
        .readdirSync(path.join(root, 'materials-src/apply-kit'))
        .filter((x) => x.endsWith('.css'))
        .map((x) => 'materials-src/apply-kit/' + x),
    ],
    issues = [],
    allowed = [];
  for (const file of files) {
    const css = postcss.parse(fs.readFileSync(path.join(root, file), 'utf8'), { from: file });
    css.walkDecls((decl) => {
      if (!['font-size', 'font'].includes(decl.prop) || !/\d/.test(decl.value)) return;
      // A reference alone is insufficient: fixed font sizes must multiply the scale.
      if (/calc\(\s*\d*\.?\d+px\s*\*\s*var\(--font-scale\s*(?:,\s*1)?\s*\)\s*\)/.test(decl.value))
        return;
      const selector = decl.parent.selector || '@' + decl.parent.name,
        record = {
          file,
          line: decl.source.start.line,
          selector,
          property: decl.prop,
          value: decl.value,
        };
      const match = allowlist.find(
        (a) =>
          a.file === file &&
          a.selector === selector &&
          a.property === decl.prop &&
          a.value === decl.value &&
          a.reason?.trim(),
      );
      if (match) allowed.push({ ...record, reason: match.reason });
      else issues.push(record);
    });
  }
  return {
    files,
    issues,
    allowed,
    pass: issues.length === 0,
    warnings: [
      'src/answer-integrity-sample.css：歷史樣張，不是正式學生入口',
      '其他非17份舊教材僅列警告，不列入本輪動態門檻',
    ],
  };
}
