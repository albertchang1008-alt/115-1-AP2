import fs from 'node:fs';import path from 'node:path';
import {paletteCss} from '../materials-src/kit/presentation.mjs';
const root=path.resolve(import.meta.dirname,'..'),css=fs.readFileSync(root+'/materials-src/kit/presentation.css','utf8');
for(const id of JSON.parse(fs.readFileSync(root+'/materials-src/manual-presentation-targets.json','utf8'))){
 const file=root+`/public/materials/${id}/index.html`;let s=fs.readFileSync(file,'utf8');
 const style=`<style id="material-presentation">${css}\n${paletteCss(id)}\nheader,.hero,.page>h1,.container>h1{border-top:4px solid var(--accent);background:var(--accent-soft);border-radius:12px;padding:16px}h1{color:var(--accent)}.mode-btn.active,.mode-btn[aria-selected="true"],.filter-btn.active,.filter-btn[aria-pressed="true"],.action-btn,.next,.node[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:#fff}</style>`;
 s=s.replace(/<style id="material-presentation">[\s\S]*?<\/style>/,'');s=s.replace('</head>',style+'</head>');fs.writeFileSync(file,s);
}
