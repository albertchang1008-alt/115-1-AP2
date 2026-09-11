import fs from 'node:fs';
const v = fs.readFileSync('VERSION', 'utf8').trim();
if (!/^\d+\.\d+\.\d+$/.test(v)) throw Error('VERSION 必須為 x.y.z');
const check = process.argv.includes('--check');
let bad = false;
for (const path of ['package.json', 'functions/package.json']) {
  const json = JSON.parse(fs.readFileSync(path, 'utf8'));
  if (check) {
    if (json.version !== v) {
      console.error(path + ' 版本不一致');
      bad = true;
    }
  } else {
    json.version = v;
    fs.writeFileSync(path, JSON.stringify(json, null, 2) + '\n');
  }
}
for (const [path, text] of [
  ['shared/version.ts', `export const VERSION = '${v}';\n`],
  ['apps-script/version.gs', `var PLATFORM_VERSION = '${v}';\n`],
  ['public/version.json', JSON.stringify({ version: v }) + '\n'],
]) {
  if (check) {
    if (!fs.existsSync(path) || fs.readFileSync(path, 'utf8') !== text) {
      console.error(path + ' 版本未同步');
      bad = true;
    }
  } else {
    fs.mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true });
    fs.writeFileSync(path, text);
  }
}
for (const path of ['README.md', 'DEVELOPMENT_LOG.md', 'handoff.md']) {
  if (!fs.existsSync(path)) {
    if (check) {
      bad = true;
      console.error('缺少 ' + path);
    }
    continue;
  }
  const s = fs.readFileSync(path, 'utf8');
  if (check) {
    if (!s.includes(`目前版本：${v}`)) {
      bad = true;
      console.error(path + ' 版本未同步');
    }
  } else fs.writeFileSync(path, s.replace(/目前版本：\d+\.\d+\.\d+/, `目前版本：${v}`));
}
for (const path of ['package-lock.json', 'functions/package-lock.json']) {
  if (!fs.existsSync(path)) continue;
  const j = JSON.parse(fs.readFileSync(path, 'utf8'));
  if (check) {
    if (j.version !== v || j.packages?.['']?.version !== v) {
      bad = true;
      console.error(path + ' 版本未同步');
    }
  } else {
    j.version = v;
    if (j.packages?.['']) j.packages[''].version = v;
    fs.writeFileSync(path, JSON.stringify(j, null, 2) + '\n');
  }
}
if (bad) process.exit(1);
console.log(check ? '版本一致：' + v : '已同步版本：' + v);
