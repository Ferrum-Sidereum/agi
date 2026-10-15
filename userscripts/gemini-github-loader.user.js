// ==UserScript==
// @name         Gemini -> GitHub Remote Daemon Loader
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  AGI: GitHub gateway + remote daemon, safe self-updates
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
// @updateURL    https://raw.githubusercontent.com/Ferrum-Sidereum/agi/dev/userscripts/gemini-github-loader.user.js
// @downloadURL  https://raw.githubusercontent.com/Ferrum-Sidereum/agi/dev/userscripts/gemini-github-loader.user.js
// ==/UserScript==

(function () {
    'use strict';

    const REPO = 'Ferrum-Sidereum/agi';
    const BRANCH = 'dev';
    const API = `https://api.github.com/repos/${REPO}`;
    const TOKEN_KEY = 'agi_github_pat';
    const MODE_KEY = 'agi_gateway_auto_mode';
    const SELF_FILES = new Set([
        'daemon_core.js',
        'userscripts/gemini-github-loader.user.js',
        'userscripts/gemini-github-recovery.user.js'
    ]);
    const SCRIPT_NAMES = {
        'userscripts/gemini-github-loader.user.js': 'Gemini -> GitHub Remote Daemon Loader',
        'userscripts/gemini-github-recovery.user.js': 'Gemini -> GitHub Zero-Click Auto-Pusher v3.2'
    };
    const MAX_FILES = 25;
    const MAX_FILE_CHARS = 250000;
    const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/`;

    const token = () => String(GM_getValue(TOKEN_KEY, '') || '').trim();
    const getAutoMode = () => GM_getValue(MODE_KEY, false) === true;
    const setAutoMode = (value) => GM_setValue(MODE_KEY, Boolean(value));

    GM_registerMenuCommand('AGI: установить GitHub-токен', () => {
        const candidate = prompt('Новый GitHub fine-grained PAT для Ferrum-Sidereum/agi (ветка dev):');
        if (candidate === null) return;
        const value = candidate.trim();
        if (!/^(github_pat_|ghp_)[A-Za-z0-9_]+$/.test(value)) {
            alert('Ожидается GitHub PAT вида github_pat_...');
            return;
        }
        GM_setValue(TOKEN_KEY, value);
        alert('Токен сохранён локально для Loader. Обновите Gemini.');
    });
    GM_registerMenuCommand('AGI: удалить GitHub-токен', () => {
        if (confirm('Удалить токен из хранилища Loader?')) {
            GM_deleteValue(TOKEN_KEY);
            alert('Токен удалён из Loader. На стороне GitHub отзыв отдельный.');
        }
    });
    GM_registerMenuCommand('AGI: переключить AUTO / MANUAL', () => {
        setAutoMode(!getAutoMode());
        alert(`Теперь ${getAutoMode() ? 'AUTO' : 'MANUAL'}. Перезагрузите Gemini.`);
    });

    function github(method, path, body = null) {
        const pat = token();
        if (!pat) return Promise.reject(new Error('Не задан PAT: меню Tampermonkey → AGI: установить GitHub-токен'));
        if (!/^\/(git\/|contents\/)/.test(path) || path.includes('..')) {
            return Promise.reject(new Error('Недопустимый GitHub API path'));
        }
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method,
                url: API + path,
                headers: {
                    Authorization: `Bearer ${pat}`,
                    Accept: 'application/vnd.github+json',
                    'Content-Type': 'application/json',
                    'X-GitHub-Api-Version': '2022-11-28'
                },
                data: body === null ? undefined : JSON.stringify(body),
                timeout: 20000,
                onload(res) {
                    if (res.status >= 200 && res.status < 300) {
                        try { resolve(res.responseText ? JSON.parse(res.responseText) : {}); }
                        catch (_) { reject(new Error('GitHub вернул невалидный JSON')); }
                    } else if (res.status === 404 && method === 'GET') {
                        resolve(null);
                    } else {
                        reject(new Error(`GitHub HTTP ${res.status}: ${String(res.responseText).slice(0, 240)}`));
                    }
                },
                ontimeout: () => reject(new Error('GitHub API timeout')),
                onerror: () => reject(new Error('GitHub API network error'))
            });
        });
    }

    function validate(payload) {
        if (!payload || payload.action !== 'GITHUB_AUTO_PUSH' || payload.EOF_READY !== true ||
            payload.repo !== REPO || (payload.branch || BRANCH) !== BRANCH) {
            throw new Error('Разрешены только GITHUB_AUTO_PUSH в Ferrum-Sidereum/agi:dev');
        }
        if (!Array.isArray(payload.files) || !payload.files.length || payload.files.length > MAX_FILES) {
            throw new Error('Недопустимое число файлов');
        }
        const seen = new Set();
        for (const file of payload.files) {
            if (!file || typeof file.path !== 'string' || typeof file.content !== 'string' ||
                !file.path || file.path.length > 180 || file.content.length > MAX_FILE_CHARS ||
                file.path.startsWith('/') || file.path.includes('\\') || file.path.includes('\0') ||
                file.path.split('/').some(x => !x || x === '.' || x === '..') ||
                file.path.startsWith('.github/') || file.path.startsWith('.git/') || seen.has(file.path)) {
                throw new Error('Недопустимый или повторный путь: ' + (file && file.path));
            }
            seen.add(file.path);
        }
        return {files: payload.files, selfUpdate: payload.files.some(f => SELF_FILES.has(f.path))};
    }

    function header(content, key) {
        const match = content.match(new RegExp('^\\s*//\\s*@' + key + '\\s+(.+?)\\s*$', 'm'));
        return match ? match[1].trim() : null;
    }

    function compareVersion(a, b) {
        const parse = v => /^\d+(?:\.\d+){0,3}$/.test(v || '') ? v.split('.').map(Number) : null;
        const x = parse(a), y = parse(b);
        if (!x || !y) throw new Error('Ожидается числовой @version вида 2.1.0');
        for (let i = 0; i < Math.max(x.length, y.length); i++) {
            if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
        }
        return 0;
    }

    function decodeContent(b64) {
        const binary = atob(String(b64).replace(/\s/g, ''));
        return new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0)));
    }

    async function validateScriptUpdates(files) {
        for (const f of files) {
            if (!Object.prototype.hasOwnProperty.call(SCRIPT_NAMES, f.path)) continue;
            const expectedUrl = RAW_BASE + f.path;
            if (header(f.content, 'name') !== SCRIPT_NAMES[f.path] ||
                header(f.content, 'namespace') !== 'http://tampermonkey.net/' ||
                header(f.content, 'updateURL') !== expectedUrl ||
                header(f.content, 'downloadURL') !== expectedUrl ||
                !f.content.trimStart().startsWith('// ==UserScript==')) {
                throw new Error(`Некорректный userscript header: ${f.path}`);
            }
            const existing = await github('GET', `/contents/${f.path}?ref=${BRANCH}`);
            const oldVersion = existing && existing.content ? header(decodeContent(existing.content), 'version') : null;
            if (oldVersion && compareVersion(header(f.content, 'version'), oldVersion) <= 0) {
                throw new Error(`${f.path}: увеличь @version (было ${oldVersion})`);
            }
            if (!header(f.content, 'version')) throw new Error('Отсутствует @version: ' + f.path);
        }
    }

    let inFlight = false;
    async function submit(payload) {
        const parsed = validate(payload);
        if (inFlight) throw new Error('Предыдущий push ещё не завершён');
        inFlight = true;
        try {
            if (parsed.selfUpdate) {
                await validateScriptUpdates(parsed.files);
                const names = parsed.files.filter(f => SELF_FILES.has(f.path)).map(f => f.path).join('\n');
                if (!confirm(`Обновление исполняемого кода:\n${names}\n\nПроверили изменения? Подтвердить запись в dev?`)) {
                    throw new Error('Пользователь отклонил обновление исполняемого кода');
                }
            }
            // One atomic Git commit; no per-file partial writes and no force push.
            const ref = await github('GET', `/git/ref/heads/${BRANCH}`);
            if (!ref || !ref.object || !ref.object.sha) throw new Error('Ветка dev отсутствует');
            const parent = ref.object.sha;
            const commit = await github('GET', `/git/commits/${parent}`);
            if (!commit || !commit.tree || !commit.tree.sha) throw new Error('Не получено дерево коммита');
            const tree = await github('POST', '/git/trees', {
                base_tree: commit.tree.sha,
                tree: parsed.files.map(f => ({path: f.path, mode: '100644', type: 'blob', content: f.content}))
            });
            const next = await github('POST', '/git/commits', {
                message: String(payload.commit_message || 'AGI browser gateway update').slice(0, 200),
                tree: tree.sha,
                parents: [parent]
            });
            await github('PATCH', `/git/refs/heads/${BRANCH}`, {sha: next.sha, force: false});
            return {sha: next.sha, files: parsed.files.length};
        } finally {
            inFlight = false;
        }
    }

    const bridge = Object.freeze({
        submit,
        validate,
        isAuto: getAutoMode,
        setAuto: setAutoMode,
        info: Object.freeze({repo: REPO, branch: BRANCH})
    });

    async function start() {
        try {
            if (!token()) {
                console.warn('[AGI Loader] Введите токен через меню Tampermonkey.');
                return;
            }
            const data = await github('GET', `/contents/daemon_core.js?ref=${BRANCH}`);
            if (!data || !data.content) throw new Error('daemon_core.js не найден');
            // Trusted code from the user's repository. Runs in the userscript context,
            // not by injecting into page window. Keep the core audited.
            const source = decodeContent(data.content);
            new Function('bridge', source + '\n//# sourceURL=agi-daemon-core.js')(bridge);
        } catch (err) {
            console.error('[AGI Loader] Core failed. Recovery userscript remains independent.', err);
        }
    }
    start();
})();
