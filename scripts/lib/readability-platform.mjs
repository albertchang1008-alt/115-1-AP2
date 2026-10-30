import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
const root = path.resolve(import.meta.dirname, '../..');
let bundle;
export async function platformPage(
  browser,
  { viewport, slug, scale = 1, overlay = true, tracking = 'interactive', exclusions = [] },
) {
  bundle ||= (
    await build({
      stdin: {
        contents: `import React from 'react';import{createRoot}from'react-dom/client';import{HtmlMaterial}from'./src/Player';import FontSizePicker from './src/FontSizePicker';const q=new URLSearchParams(location.search),version=q.get('version');let course={features:{readabilityOverlay:q.get('overlay')==='true',readabilityOverlayExclusions:JSON.parse(q.get('exclusions')||'[]')}};const activity={id:'readability-sample',title:version,type:'html',url:'https://albertchang1008-alt.github.io/115-1-AP2/materials/'+version+'/index.html',materialVersion:version,tracking:q.get('tracking')};window.platformMessages=[];window.completedCalls=0;addEventListener('message',e=>{if(e.source===document.querySelector('iframe')?.contentWindow)window.platformMessages.push(e.data)});const api={preview:true};const root=createRoot(document.getElementById('root'));const render=()=>root.render(<main className="reading-page"><header><strong>教材閱讀</strong><FontSizePicker/></header><section className="reading-body"><HtmlMaterial activity={activity} course={course} api={api} uid="sample" courseId="sample" unitId="sample" onSave={()=>window.completedCalls++}/></section></main>);window.configureCourse=features=>{course={features};render()};render();`,
        resolveDir: root,
        loader: 'tsx',
      },
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'browser',
      define: { 'process.env.NODE_ENV': '"production"' },
    })
  ).outputFiles[0].text;
  const page = await browser.newPage({ viewport });
  await page.addInitScript(() => {
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (options) {
      return original.call(this, {
        ...(typeof options === 'object' ? options : {}),
        behavior: 'instant',
      });
    };
  });
  await page.addInitScript(
    ({ scale }) => {
      if (window === window.top)
        localStorage.setItem('course-font-scale', scale === 1 ? 'default' : 'xlarge');
    },
    { scale },
  );
  await page.route('**/*', async (r) => {
    const u = new URL(r.request().url());
    if (u.hostname === '127.0.0.1')
      return r.fulfill({
        contentType: 'text/html',
        body: `<!doctype html><html><head><style>${fs.readFileSync(path.join(root, 'src/style.css'), 'utf8')}</style></head><body><div id="root"></div><script>${bundle.replaceAll('</script', '<\\/script')}</script></body></html>`,
      });
    const match = u.pathname.match(/\/materials\/(.+)$/);
    if (match) {
      const file = path.resolve(root, 'public/materials', match[1]);
      if (
        file.startsWith(path.join(root, 'public/materials') + path.sep) &&
        fs.existsSync(file) &&
        fs.statSync(file).isFile()
      )
        return r.fulfill({
          path: file,
          contentType: file.endsWith('.js')
            ? 'application/javascript'
            : file.endsWith('.css')
              ? 'text/css'
              : file.endsWith('.html')
                ? 'text/html'
                : undefined,
        });
    }
    return r.abort();
  });
  let child;
  const version = slug === 'urinary-route-micturition' ? slug + '-v2' : slug + '-v1';
  const navigate = async () => {
    await page.goto(
      'http://127.0.0.1:4173/reading?' +
        new URLSearchParams({
          version,
          overlay: String(overlay),
          tracking,
          exclusions: JSON.stringify(exclusions),
        }),
    );
    await page.locator('iframe.material').waitFor();
    child = await (await page.locator('iframe.material').elementHandle()).contentFrame();
    await child.waitForLoadState('load');
    await child.waitForFunction(
      () => document.documentElement.style.getPropertyValue('--font-scale') !== '',
    );
    if (
      overlay &&
      ['kidney-anatomy', 'airway-structure', 'cardiac-output'].includes(slug) &&
      !exclusions.includes(version)
    )
      await child.waitForFunction(
        () => !!document.getElementById('course-readability-overlay')?.sheet,
      );
  };
  const parentMethods = new Set([
    'on',
    'route',
    'addInitScript',
    'setDefaultTimeout',
    'viewportSize',
    'screenshot',
    'close',
    'waitForTimeout',
  ]);
  const driver = new Proxy(
    {},
    {
      get(_, key) {
        if (key === 'goto') return navigate;
        if (key === 'platformPage') return page;
        if (key === 'platformFrame') return () => child;
        const target = parentMethods.has(key) ? page : child;
        const value = target?.[key];
        return typeof value === 'function' ? value.bind(target) : value;
      },
    },
  );
  return driver;
}
