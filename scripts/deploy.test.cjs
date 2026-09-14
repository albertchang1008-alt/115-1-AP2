const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const realGit = execFileSync('which', ['git'], { encoding: 'utf8' }).trim();
const script = fs.readFileSync(path.join(__dirname, 'deploy.sh'));

test('deployment gates and backend-before-frontend ordering (no cloud)', async t => {
  for (const scenario of ['success', 'cancel', 'auth', 'project', 'dirty', 'detached', 'diverged', 'check', 'backend', 'push']) {
    await t.test(scenario, () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'platform-deploy-'));
      try {
        const repo = path.join(dir, 'repo');
        const remote = path.join(dir, 'remote.git');
        const bin = path.join(dir, 'bin');
        fs.mkdirSync(repo); fs.mkdirSync(bin);
        const git = (...args) => execFileSync(realGit, args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
        git('init', '--bare', remote);
        git('init', '-b', 'main');
        git('config', 'user.email', 'test@example.invalid');
        git('config', 'user.name', 'Deployment test');
        git('config', 'commit.gpgsign', 'false');
        fs.mkdirSync(path.join(repo, 'scripts'));
        fs.writeFileSync(path.join(repo, 'scripts/deploy.sh'), script);
        fs.writeFileSync(path.join(repo, '.firebaserc'), JSON.stringify({ projects: { default: 'ap2-7ed91' } }));
        git('add', '.'); git('commit', '-m', 'fixture');
        git('remote', 'add', 'origin', remote); git('push', 'origin', 'main');
        const originalMain = git('rev-parse', 'main');
        git('checkout', '-b', 'feature/test');
        fs.writeFileSync(path.join(repo, 'change'), 'release');
        git('add', '.'); git('commit', '-m', 'release');
        const release = git('rev-parse', 'HEAD');
        if (scenario === 'dirty') fs.writeFileSync(path.join(repo, 'untracked'), 'keep');
        if (scenario === 'detached') git('checkout', '--detach');
        if (scenario === 'diverged') {
          git('checkout', 'main'); git('commit', '--allow-empty', '-m', 'other change');
          git('push', 'origin', 'main'); git('checkout', 'feature/test');
        }
        const before = git('ls-remote', 'origin', 'refs/heads/main');
        const wrappers = {
          git: '#!/bin/bash\nprintf "git %s\\n" "$*" >> "$CALL_LOG"\nif [ "$SCENARIO" = push ] && [ "$1" = push ] && [[ "$3" = *:refs/heads/main ]]; then exit 1; fi\nexec "$REAL_GIT" "$@"\n',
          npm: '#!/bin/bash\nprintf "npm %s\\n" "$*" >> "$CALL_LOG"\nif [ "$SCENARIO" = check ] && [ "$*" = "run check" ]; then exit 1; fi\n',
          firebase: '#!/bin/bash\nprintf "firebase %s\\n" "$*" >> "$CALL_LOG"\nif [ "$1" = projects:list ]; then\n  [ "$SCENARIO" != auth ] || exit 1\n  if [ "$SCENARIO" = project ]; then echo \'{"status":"success","result":[]}\'; else echo \'{"status":"success","result":[{"projectId":"ap2-7ed91"}]}\'; fi\nelif [ "$SCENARIO" = backend ]; then exit 1; fi\n'
        };
        for (const [name, content] of Object.entries(wrappers)) fs.writeFileSync(path.join(bin, name), content, { mode: 0o755 });
        const log = path.join(dir, 'calls');
        const result = spawnSync('bash', [path.join(repo, 'scripts/deploy.sh')], {
          cwd: dir, encoding: 'utf8', input: scenario === 'cancel' ? 'n\n' : 'y\n',
          env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, REAL_GIT: realGit, CALL_LOG: log, SCENARIO: scenario }
        });
        const calls = fs.readFileSync(log, 'utf8');
        const output = result.stdout + result.stderr;
        assert.equal(result.status, ['success', 'cancel'].includes(scenario) ? 0 : 1, output);
        const deployIndex = calls.indexOf('firebase deploy --only functions --project ap2-7ed91 --non-interactive');
        const mainPushIndex = calls.indexOf(`git push origin ${release}:refs/heads/main`);
        if (scenario === 'success') {
          assert.ok(deployIndex > calls.indexOf('npm run check'));
          assert.ok(mainPushIndex > deployIndex);
          assert.ok(git('ls-remote', 'origin', 'refs/heads/main').startsWith(release));
          assert.equal(git('rev-parse', 'main'), originalMain);
          assert.match(output, /尚待 Actions 完成/);
        } else {
          assert.equal(git('ls-remote', 'origin', 'refs/heads/main'), before);
          if (scenario !== 'push') assert.equal(mainPushIndex, -1);
          if (!['backend', 'push'].includes(scenario)) assert.equal(deployIndex, -1);
          if (['backend', 'push'].includes(scenario)) assert.match(output, /後端可能已全部或部分更新/);
        }
        if (scenario !== 'detached') assert.equal(git('branch', '--show-current'), 'feature/test');
      } finally { fs.rmSync(dir, { recursive: true, force: true }); }
    });
  }
});
