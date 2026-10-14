/* == Remote Daemon Core v1.0 == */
(function() {
    'use strict';
    console.log('%c[GitHub Daemon Core] Загружен из репозитория Ferrum-Sidereum/agi (dev)', 'color: #10b981; font-weight: bold;');

    const processedHashes = new Set();
    let isAutoMode = localStorage.getItem("gh_daemon_auto_mode") !== "false";
    let pendingPayload = null;

    function createHud() {
        if (document.getElementById("gh-auto-hud")) return;
        const container = document.createElement("div");
        container.id = "gh-auto-hud";
        container.style.cssText = "position:fixed; bottom:16px; right:16px; z-index:999999; display:flex; gap:8px; align-items:center; font-family:monospace; font-size:12px; font-weight:bold;";

        const modeBtn = document.createElement("div");
        modeBtn.id = "gh-hud-mode";
        modeBtn.style.cssText = "padding:8px 12px; border-radius:8px; background:#111827; cursor:pointer; user-select:none; box-shadow:0 4px 12px rgba(0,0,0,0.5);";
        modeBtn.addEventListener("click", () => {
            isAutoMode = !isAutoMode;
            localStorage.setItem("gh_daemon_auto_mode", isAutoMode);
            updateModeUI();
            if (isAutoMode && pendingPayload) {
                const p = pendingPayload;
                pendingPayload = null;
                hideActionBtn();
                window.__pushPayloadToGitHub(p);
            }
        });

        const statusBox = document.createElement("div");
        statusBox.id = "gh-hud-status";
        statusBox.style.cssText = "padding:8px 12px; border-radius:8px; background:#1f2937; color:#9ca3af; border:1px solid #374151;";
        statusBox.textContent = "Удаленный демон активен (dev)...";

        const actionBtn = document.createElement("div");
        actionBtn.id = "gh-hud-action";
        actionBtn.style.cssText = "display:none; padding:8px 12px; border-radius:8px; background:#2563eb; color:#ffffff; cursor:pointer;";
        actionBtn.addEventListener("click", () => {
            if (pendingPayload) {
                const p = pendingPayload;
                pendingPayload = null;
                hideActionBtn();
                window.__pushPayloadToGitHub(p);
            }
        });

        container.appendChild(actionBtn);
        container.appendChild(statusBox);
        container.appendChild(modeBtn);
        document.body.appendChild(container);
        updateModeUI();
    }

    function updateModeUI() {
        const modeBtn = document.getElementById("gh-hud-mode");
        if (!modeBtn) return;
        if (isAutoMode) {
            modeBtn.textContent = "🟢 AUTO: ON";
            modeBtn.style.color = "#10b981";
            modeBtn.style.border = "1px solid #10b981";
        } else {
            modeBtn.textContent = "🟡 MANUAL";
            modeBtn.style.color = "#f59e0b";
            modeBtn.style.border = "1px solid #f59e0b";
        }
    }

    function setStatus(text, color = "#9ca3af") {
        const statusBox = document.getElementById("gh-hud-status");
        if (statusBox) {
            statusBox.textContent = text;
            statusBox.style.color = color;
            statusBox.style.borderColor = color;
        }
    }

    function showActionBtn(payload) {
        const btn = document.getElementById("gh-hud-action");
        if (btn) {
            btn.textContent = `🚀 Запушить (${payload.files.length} ф.)`;
            btn.style.display = "block";
        }
    }

    function hideActionBtn() {
        const btn = document.getElementById("gh-hud-action");
        if (btn) btn.style.display = "none";
    }

    function hashStr(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return hash.toString();
    }

    // Экспортируем функции наружу для обертки
    window.__daemonCore = {
        checkAndRun(payload) {
            const uniqueKey = hashStr(payload.repo + (payload.branch || "dev") + payload.commit_message + JSON.stringify(payload.files));
            if (processedHashes.has(uniqueKey)) return;
            processedHashes.add(uniqueKey);

            if (isAutoMode) {
                window.__pushPayloadToGitHub(payload);
            } else {
                pendingPayload = payload;
                setStatus(`Готов пакет (${payload.branch || "dev"})`, "#fbbf24");
                showActionBtn(payload);
            }
        },
        setStatus
    };

    createHud();
})();
