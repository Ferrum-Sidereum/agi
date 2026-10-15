/* AGI Remote Daemon Core v2.0 — loaded inside Loader's userscript context. */
(function (bridge) {
    'use strict';

    const handled = new Set();
    let pending = null;
    let busy = false;
    const hudId = 'agi-loader-hud-v2';

    function makeHud() {
        if (document.getElementById(hudId) || !document.body) return;
        const hud = document.createElement('div');
        hud.id = hudId;
        hud.style.cssText = 'position:fixed;bottom:14px;right:14px;z-index:2147483640;display:flex;gap:6px;font:12px monospace;color:white';
        const status = document.createElement('div');
        status.id = 'agi-loader-status-v2';
        status.style.cssText = 'background:#17202d;border:1px solid #586477;border-radius:7px;padding:8px 10px;max-width:320px';
        status.textContent = 'AGI Loader: готов';
        const action = document.createElement('button');
        action.type = 'button';
        action.id = 'agi-loader-submit-v2';
        action.style.cssText = 'display:none;background:#265bdf;color:#fff;border:0;border-radius:7px;padding:8px 10px;cursor:pointer';
        action.textContent = 'Записать в GitHub';
        action.addEventListener('click', () => { if (pending) void runPending(); });
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.id = 'agi-loader-mode-v2';
        toggle.style.cssText = 'background:#142134;color:#fff;border:1px solid #50607c;border-radius:7px;padding:8px;cursor:pointer';
        toggle.addEventListener('click', () => {
            bridge.setAuto(!bridge.isAuto());
            updateMode();
            // Manual pending commands still require user click, even after mode flip.
        });
        hud.append(action, status, toggle);
        document.body.appendChild(hud);
        updateMode();
    }

    function updateMode() {
        const btn = document.getElementById('agi-loader-mode-v2');
        if (btn) btn.textContent = bridge.isAuto() ? 'AUTO ON' : 'MANUAL';
    }
    function status(message) {
        const e = document.getElementById('agi-loader-status-v2');
        if (e) e.textContent = message;
        console.info('[AGI Loader]', message);
    }
    function showPending(show) {
        const e = document.getElementById('agi-loader-submit-v2');
        if (e) e.style.display = show ? 'block' : 'none';
    }
    async function runPending() {
        if (!pending || busy) return;
        const {payload, key} = pending;
        pending = null;
        showPending(false);
        busy = true;
        try {
            status('Запись файлов в dev…');
            const r = await bridge.submit(payload);
            handled.add(key);
            status(`Готово: ${r.files} файлов · ${r.sha.slice(0, 8)}`);
        } catch (err) {
            // Do not spin and retry on every DOM scan after a rejection/error.
            handled.add(key);
            status(`Ошибка: ${err.message}`);
        } finally {
            busy = false;
        }
    }
    function scan() {
        makeHud();
        if (pending || busy) return;
        for (const block of document.querySelectorAll('pre, code, code-block')) {
            const raw = block.innerText || block.textContent || '';
            if (!raw.includes('"GITHUB_AUTO_PUSH"') || !raw.includes('"EOF_READY"')) continue;
            const start = raw.indexOf('{'), end = raw.lastIndexOf('}');
            if (start < 0 || end <= start) continue;
            let payload;
            try { payload = JSON.parse(raw.slice(start, end + 1)); }
            catch (_) { continue; }
            if (payload.action !== 'GITHUB_AUTO_PUSH' || payload.EOF_READY !== true) continue;
            const key = JSON.stringify(payload);
            if (handled.has(key)) continue;
            try {
                const result = bridge.validate(payload);
                pending = {payload, key};
                const mustManual = result.selfUpdate || !bridge.isAuto();
                if (mustManual) {
                    showPending(true);
                    status(result.selfUpdate ? 'Обновление кода: нажмите «Записать в GitHub»' : 'Ожидается подтверждение');
                } else {
                    void runPending();
                }
                break;
            } catch (err) {
                handled.add(key);
                status(`Отклонён пакет: ${err.message}`);
            }
        }
    }
    makeHud();
    setInterval(scan, 1500);
})(bridge);
