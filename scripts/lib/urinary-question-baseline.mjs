import fs from 'node:fs';import{createHash}from'node:crypto';
const raw=fs.readFileSync(new URL('./urinary-question-baseline.json',import.meta.url));
if(createHash('sha256').update(raw).digest('hex')!=='84285ceee8ef1cf8b061615b8e77d274caae71125ede1f1de4df0cd3f7bf7ce5')throw Error('c8fb122 question baseline SHA mismatch');
const baseline=JSON.parse(raw);export const questionBaseline=slug=>{if(!baseline[slug])throw Error('Unknown baseline '+slug);return structuredClone(baseline[slug]);};
