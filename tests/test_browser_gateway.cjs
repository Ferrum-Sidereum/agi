const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const SRC = {
  loader: fs.readFileSync(path.join(ROOT, 'userscripts/gemini-github-loader.user.js'), 'utf8'),
  recovery: fs.readFileSync(path.join(ROOT, 'userscripts/gemini-github-recovery.user.js'), 'utf8'),
  core: fs.readFileSync(path.join(ROOT, 'daemon_core.js'), 'utf8'),
};

class Element {
  constructor(tag = 'div') {
    this.tagName = tag;
    this.style = {};
    this.children = [];
    this.events = {};
    this.textContent = '';
    this.innerText = '';
    this.id = '';
  }
  append(...nodes) { this.children.push(...nodes); }
  appendChild(node) { this.append(node); return node; }
  addEventListener(name, fn) { this.events[name] = fn; }
  click() { return this.events.click?.(); }
  find(id) {
    if (this.id === id) return this;
    for (const child of this.children) { const result = child.find(id); if (result) return result; }
    return null;
  }
}
const tick = async () => { for (let i = 0; i < 12; i++) await new Promise(r => setImmediate(r)); };

function env({which = 'loader', token = 'github_pat_TEST_123', auto = false, confirmations = true, failPatch = false} = {}) {
  const storage = new Map(token ? [['agi_github_pat', token]] : []);
  storage.set('agi_gateway_auto_mode', auto);
  const root = new Element('body'), messages = [], timers = [], menus = new Map();
  const state = {
    files: {'daemon_core.js': SRC.core,
      'userscripts/gemini-github-loader.user.js': SRC.loader,
      'userscripts/gemini-github-recovery.user.js': SRC.recovery},
    operations: [], commits: 0, patches: 0, confirms: [], alerts: [], logs: []
  };
  const document = {
    body: root,
    createElement: tag => new Element(tag),
    getElementById: id => root.find(id),
    querySelectorAll: () => messages.map(value => ({innerText: value, textContent: value}))
  };
  const gmRequest = opts => {
    const target = opts.url.replace('https://api.github.com/repos/Ferrum-Sidereum/agi', '');
    const method = opts.method.toUpperCase();
    state.operations.push([method, target, opts.data && JSON.parse(opts.data)]);
    let status = 200, content = {};
    if (method === 'GET' && target.startsWith('/contents/')) {
      const p = target.slice('/contents/'.length).split('?')[0];
      if (state.files[p] == null) status = 404;
      else content = {content: Buffer.from(state.files[p]).toString('base64'), sha: 'oldSHA'};
    } else if (method === 'GET' && target === '/git/ref/heads/dev') {
      content = {object: {sha: 'parentSHA'}};
    } else if (method === 'GET' && target === '/git/commits/parentSHA') {
      content = {tree: {sha: 'oldTreeSHA'}};
    } else if (method === 'POST' && target === '/git/trees') {
      content = {sha: 'newTreeSHA'};
    } else if (method === 'POST' && target === '/git/commits') {
      state.commits++;
      content = {sha: 'newCommitSHA'};
    } else if (method === 'PATCH' && target === '/git/refs/heads/dev') {
      if (failPatch) status = 422;
      else { state.patches++; content = {object: {sha: 'newCommitSHA'}}; }
    } else {
      status = 404;
    }
    opts.onload({status, responseText: status === 422 ? 'not fast-forward' : JSON.stringify(content)});
  };
  const sandbox = {
    document, TextDecoder, Uint8Array,
    GM_getValue: (k, d) => storage.has(k) ? storage.get(k) : d,
    GM_setValue: (k, v) => storage.set(k, v),
    GM_deleteValue: k => storage.delete(k),
    GM_registerMenuCommand: (name, cb) => menus.set(name, cb),
    GM_xmlhttpRequest: gmRequest,
    prompt: () => 'github_pat_NEW_TEST_123',
    alert: msg => state.alerts.push(msg),
    confirm: msg => { state.confirms.push(msg); return confirmations; },
    console: {log: ()=>{}, info: () => {}, warn:()=>{}, error:()=>{}},
    setInterval: fn => timers.push(fn),
    atob: s => Buffer.from(s, 'base64').toString('binary'),
    URL,
  };
  vm.createContext(sandbox);
  vm.runInContext(SRC[which], sandbox, {filename: `${which}.user.js`});
  return {state, messages, timers, storage, menus, document, tick, scan: () => timers.forEach(fn=>fn()),
    add: p => messages.push(JSON.stringify(p)),
    click: id => {const btn = document.getElementById(id); assert.ok(btn, `missing ${id}`); return btn.click();}
  };
}
const ordinary = {action:'GITHUB_AUTO_PUSH', EOF_READY:true, repo:'Ferrum-Sidereum/agi',branch:'dev',
    commit_message:'Update docs', files:[{path:'README.md', content:'Hello'}]};
const emergency = {action:'GITHUB_RECOVERY_PUSH', EOF_READY:true, repo:'Ferrum-Sidereum/agi',branch:'dev',
    commit_message:'Restore daemon', files:[{path:'daemon_core.js',content:'/* restore */'}]};

test('metadata supplies persistent GitHub update URLs and stable names', () => {
  for (const name of ['loader', 'recovery']) {
    const url = `https://raw.githubusercontent.com/Ferrum-Sidereum/agi/dev/userscripts/gemini-github-${name}.user.js`;
    assert.ok(SRC[name].includes(`// @updateURL    ${url}`));
    assert.ok(SRC[name].includes(`// @downloadURL  ${url}`));
    assert.ok(SRC[name].includes('// @grant        GM_setValue'));
    assert.ok(!/(ghp_[a-zA-Z0-9]{15,}|github_pat_[a-zA-Z0-9]{30,})/.test(SRC[name]));
  }
});
test('normal changes are not applied until user confirmation (MANUAL default)', async () => {
  const e = env(); await tick(); e.add(ordinary); e.scan();
  assert.equal(e.state.commits, 0);
  await e.click('agi-loader-submit-v2'); await tick();
  assert.equal(e.state.patches, 1);
  assert.equal(e.state.commits, 1);
  assert.equal(e.state.operations.filter(([m,p])=>m==='POST'&&p==='/git/trees').length, 1);
});
test('normal AUTO mode commits ordinary content without click', async () => {
  const e = env({auto:true}); await tick(); e.add(ordinary); e.scan(); await tick();
  assert.equal(e.state.patches, 1);
  e.scan(); await tick(); assert.equal(e.state.patches, 1);
});
test('normal Loader ignores recovery action', async () => {
  const e = env({auto:true}); await tick(); e.add(emergency); e.scan(); await tick();
  assert.equal(e.state.patches, 0);
});
test('recovery ignores ordinary auto-push even if Loader is disabled', async () => {
  const e = env({which:'recovery'}); e.add(ordinary); e.scan(); await tick();
  assert.equal(e.state.patches, 0);
});
test('recovery can independently commit daemon restoration, but only after a click', async () => {
  const e = env({which:'recovery'}); e.add(emergency); e.scan();
  assert.equal(e.state.patches, 0);
  await e.click('agi-recovery-submit-v4'); await tick();
  assert.equal(e.state.patches, 1);
  assert.equal(e.state.confirms.length, 1);
});
test('recovery rejects normal files (restricted allowlist)', async () => {
  const e = env({which:'recovery'});
  e.add({...emergency, files:[{path:'README.md',content:'No'}]}); e.scan();
  assert.equal(e.state.patches, 0);
  assert.notEqual(e.document.getElementById('agi-recovery-submit-v4').style.display, 'block');
});
test('Loader rejects writes outside repo and branch', async () => {
  const e = env({auto:true}); await tick();
  e.add({...ordinary, repo:'another/repo'});
  e.add({...ordinary, branch:'main'});
  e.scan(); await tick();
  assert.equal(e.state.patches, 0);
});
test('Loader always requires confirmation for a userscript update even in AUTO mode', async () => {
  const e = env({auto:true}); await tick();
  const upgrade = SRC.loader.replace('// @version      2.0.0', '// @version      2.1.0');
  e.add({...ordinary, files:[{path:'userscripts/gemini-github-loader.user.js',content:upgrade}]});
  e.scan(); await tick(); assert.equal(e.state.patches, 0);
  await e.click('agi-loader-submit-v2'); await tick();
  assert.equal(e.state.patches, 1);
  assert.equal(e.state.confirms.length, 1);
});
test('userscript update requires increasing version', async () => {
  const e = env({auto:true}); await tick();
  e.add({...ordinary, files:[{path:'userscripts/gemini-github-loader.user.js',content:SRC.loader}]});
  e.scan(); await tick();
  await e.click('agi-loader-submit-v2'); await tick();
  assert.equal(e.state.patches, 0);
});
test('failed GitHub ref update is reported and never marked completed', async () => {
  const e = env({auto:true,failPatch:true}); await tick(); e.add(ordinary); e.scan(); await tick();
  assert.equal(e.state.patches, 0);
  assert.ok(e.state.operations.some(([method,path,body])=>method==='PATCH'&&body.force===false));
  assert.match(e.document.getElementById('agi-loader-status-v2').textContent, /Ошибка/);
});
test('token is local per userscript and can be configured by menu', async () => {
  const e = env({token:null}); await tick();
  assert.equal(e.state.operations.length, 0);
  assert.ok(e.menus.has('AGI: установить GitHub-токен'));
  e.menus.get('AGI: установить GitHub-токен')();
  assert.equal(e.storage.get('agi_github_pat'), 'github_pat_NEW_TEST_123');
  e.menus.get('AGI: удалить GitHub-токен')();
  assert.equal(e.storage.has('agi_github_pat'), false);
});
