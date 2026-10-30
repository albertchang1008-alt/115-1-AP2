import fs from 'node:fs';
export function readabilityPreview(html) {
  return html
    .replace(
      '</head>',
      `<style>${fs.readFileSync(new URL('./readability.css', import.meta.url), 'utf8')}</style></head>`,
    )
    .replace(
      '<body>',
      `<body><script>${fs.readFileSync(new URL('./readability.js', import.meta.url), 'utf8')}</script>`,
    );
}
