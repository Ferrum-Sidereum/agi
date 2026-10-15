// ==UserScript==
// @name         Gemini -> GitHub Zero-Click Auto-Pusher v3.2
// @namespace    http://tampermonkey.net/
// @version      4.0.0
// @description  AGI independent manual recovery channel; GITHUB_RECOVERY_PUSH only
// @match        https://gemini.google.com/app*
// @match        https://gemini.google.com/chat*
// @run-at       document-idle
// @sandbox      JavaScript
// @noframes
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @connect      api.github.com
// @updateURL    https://raw.githubusercontent.com/Ferrum-Sidereum/agi/dev/userscripts/gemini-github-recovery.user.js
// @downloadURL  https://raw.githubusercontent.com/Ferrum-Sidereum/agi/dev/userscripts/gemini-github-recovery.user.js
// ==/UserScript==

(function () {
    'use strict';
    const REPO = 'Ferrum-Sidereum/agi';
    const BRANCH = 'dev';
    const BASE = `https://api.github.com/repos/${REPO}`;
    const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;
    const TOKEN_KEY = 'agi_github_pat';
    const ALLOWED = Object.freeze({
        'daemon_core.js': null,
        'userscripts/gemini-github-loader.user.js': 'Gemini -> GitHub Remote Daemon Loader',
        'userscripts/gemini-github-recovery.user.js': 'Gemini -> GitHub Zero-Click Auto-Pusher v3.2'
    });
    let pending = null;
    let busy = false;
    const handled = new Set();

    GM_registerMenuCommand('AGI Recovery: установить GitHub-токен', () => {
        const input = prompt('GitHub fine-grained PAT для аварийного канала (только agi:dev):');
        if (input === null) return;
        const pat = input.trim();
        if (!/^(github_pat_|ghp_)[A-Za-z0-9_]+$/.test(pat)) return alert('Неверный формат GitHub PAT');
        GM_setValue(TOKEN_KEY, pat);
        alert('Токен сохранён отдельно для Recovery.');
    });
    GM_registerMenuCommand('AGI Recovery: удалить GitHub-токен', () => {
        if (confirm('Удалить резервный токен из Tampermonkey?')) GM_deleteValue(TOKEN_KEY);
    });

    function github(method, path, body = null) {
        const pat = String(GM_getValue(TOKEN_KEY, '') || '').trim();
        if (!pat) return Promise.reject(new Error('Установите PAT через меню AGI Recovery'));
        if (!/^\/(git\/|contents\/)/.test(path) || path.includes('..')) return Promise.reject(new Error('Недопустимый API path'));
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method,
                url: BASE + path,
                headers: {
                    Authorization: `Bearer ${pat}`,
                    Accept: 'application/vnd.github+json',
                    'Content-Type': 'application/json',
                    'X-GitHub-Api-Version': '2022-11-28'
                },
                data: body === null ? undefined : JSON.stringify(body),
                timeout: 20000,
                onload: response => {
                    if (response.status >= 200 && response.status < 300) {
                        try { resolve(response.responseText ? JSON.parse(response.responseText) : {}); }
                        catch (_) { reject(new Error('Невалидный JSON GitHub API')); }
                    } else if (method === 'GET' && response.status === 404) {
                        resolve(null);
                    } else {
                        reject(new Error(`GitHub HTTP ${response.status}: ${String(response.responseText).slice(0, 240)}`));
                    }
                },
                ontimeout: () => reject(new Error('GitHub API timeout')),
                onerror: () => reject(new Error('GitHub API network error'))
            });
        });
    }
    function validate(payload) {
        if (!payload || payload.action !== 'GITHUB_RECOVERY_PUSH' || payload.EOF_READY !== true ||
            payload.repo !== REPO || (payload.branch || BRANCH) !== BRANCH ||
            !Array.isArray(payload.files) || !payload.files.length || payload.files.length > 3) {
            throw new Error('Recovery принимает только GITHUB_RECOVERY_PUSH в agi:dev');
        }
        const seen = new Set();
        for (const file of payload.files) {
            if (!file || !Object.prototype.hasOwnProperty.call(ALLOWED, file.path) ||
                typeof file.content !== 'string' || file.content.length > 250000 || seen.has(file.path)) {
                throw new Error('Recovery: неподдерживаемый путь или содержимое');
            }
            seen.add(file.path);
        }
        return payload.files;
    }
    function header(content, key) {
        const hit = content.match(new RegExp('^\\s*//\\s*@' + key + '\\s+(.+?)\\s*$', 'm'));
        return hit ? hit[1].trim() : null;
    }
    function decodeContent(b64) {
        const raw = atob(String(b64).replace(/\s/g, ''));
        return new TextDecoder().decode(Uint8Array.from(raw, c => c.charCodeAt(0)));
    }
    function newer(a, b) {
        if (!/^\d+(?:\.\d+){0,3}$/.test(a || '') || !/^\d+(?:\.\d+){0,3}$/.test(b || '')) return false;
        const x = a.split('.').map(Number), y = b.split('.').map(Number);
        for (let i = 0; i < Math.max(x.length, y.length); i++) {
            if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
        }
        return false;
    }
    async function inspect(files) {
        for (const file of files) {
            if (ALLOWED[file.path] === null) continue;
            const url = RAW_BASE + file.path;
            if (header(file.content, 'name') !== ALLOWED[file.path] ||
                header(file.content, 'namespace') !== 'http://tampermonkey.net/' ||
                header(file.content, 'updateURL') !== url || header(file.content, 'downloadURL') !== url) {
                throw new Error('Восстановление запрещено: неверный userscript header');
            }
            const current = await github('GET', `/contents/${file.path}?ref=${BRANCH}`);
            if (current && current.content && !newer(header(file.content, 'version'),
                    header(decodeContent(current.content), 'version'))) {
                throw new Error('Увеличьте @version у ' + file.path);
            }
            if (!header(file.content, 'version')) throw new Error('Отсутствует @version');
        }
    }
    async function push(payload) {
        const files = validate(payload);
        await inspect(files);
        const ref = await github('GET', `/git/ref/heads/${BRANCH}`);
        if (!ref || !ref.object || !ref.object.sha) throw new Error('Ветка dev отсутствует');
        const parent = ref.object.sha;
        const oldCommit = await github('GET', `/git/commits/${parent}`);
        if (!oldCommit || !oldCommit.tree || !oldCommit.tree.sha) throw new Error('Неизвестное дерево');
        const tree = await github('POST', '/git/trees', {
            base_tree: oldCommit.tree.sha,
            tree: files.map(f => ({path: f.path, mode: '100644', type: 'blob', content: f.content}))
        });
        const commit = await github('POST', '/git/commits', {
            tree: tree.sha,
            message: String(payload.commit_message || 'AGI emergency recovery').slice(0, 200),
            parents: [parent]
        });
        await github('PATCH', `/git/refs/heads/${BRANCH}`, {sha: commit.sha, force: false});
        return commit.sha;
    }
    function status(msg) {
        const e = document.getElementById('agi-recovery-status-v4');
        if (e) e.textContent = msg;
        console.info('[AGI Recovery]', msg);
    }
    function setup() {
        if (!document.body || document.getElementById('agi-recovery-status-v4')) return;
        const wrap = document.createElement('div');
        wrap.style.cssText = 'position:fixed;bottom:52px;right:14px;z-index:2147483641;display:flex;gap:6px;font:12px monospace';
        const info = document.createElement('span');
        info.id = 'agi-recovery-status-v4';
        info.textContent = 'AGI recovery standby';
        info.style.cssText = 'display:none;background:#4f260d;color:white;padding:8px;border-radius:6px';
        const button = document.createElement('button');
        button.id = 'agi-recovery-submit-v4';
        button.style.cssText = 'display:none;background:#a13a16;color:white;border:0;padding:8px;cursor:pointer;border-radius:6px';
        button.textContent = 'RECOVERY: записать';
        button.addEventListener('click', async () => {
            if (!pending || busy) return;
            const {payload, key} = pending;
            // Must be a user gesture, even if an AUTO mode is configured in Loader.
            if (!confirm('RECOVERY: перезаписать исполняемый код в agi:dev? Проверили содержимое?')) return;
            busy = true;
            pending = null;
            button.style.display = 'none';
            status('Recovery: пишу в dev…');
            try { const sha = await push(payload); status('Recovery: ' + sha.slice(0, 8)); }
            catch (error) { status('Recovery ошибка: ' + error.message); }
            finally { busy = false; handled.add(key); }
        });
        wrap.append(info, button);
        document.body.appendChild(wrap);
    }
    function scan() {
        setup();
        if (busy || pending) return;
        for (const block of document.querySelectorAll('pre, code, code-block')) {
            const text = block.innerText || block.textContent || '';
            if (!text.includes('"GITHUB_RECOVERY_PUSH"') || !text.includes('"EOF_READY"')) continue;
            const first = text.indexOf('{'), last = text.lastIndexOf('}');
            if (first < 0 || last <= first) continue;
            let payload;
            try { payload = JSON.parse(text.slice(first, last + 1)); }
            catch (_) { continue; }
            if (payload.action !== 'GITHUB_RECOVERY_PUSH' || payload.EOF_READY !== true) continue;
            const key = JSON.stringify(payload);
            if (handled.has(key)) continue;
            try { validate(payload); }
            catch (error) { handled.add(key); console.warn('[AGI Recovery]', error.message); continue; }
            pending = {payload, key};
            document.getElementById('agi-recovery-submit-v4').style.display = 'block';
            document.getElementById('agi-recovery-status-v4').style.display = 'inline';
            status('RECOVERY ожидает ручного подтверждения');
            break;
        }
    }
    setup();
    setInterval(scan, 1500);
})();
