# Установка самообновляющегося Gemini → GitHub → Tampermonkey Gateway

Этот архив — готовый патч для **Ferrum-Sidereum/agi**, ветка **dev**.

## 1. Опубликовать файлы в GitHub

Важно: файлы в этом архиве ЕЩЁ НЕ опубликованы в GitHub автоматически. Сначала перенеси их в ветку `dev` своего репозитория с сохранением путей.

| Файл | Назначение |
|---|---|
| `userscripts/gemini-github-loader.user.js` | Основной Loader с @updateURL/@downloadURL |
| `userscripts/gemini-github-recovery.user.js` | Независимый канал восстановления |
| `daemon_core.js` | Удалённое ядро HUD + scanner, совместимое с Loader v2 |
| `tests/test_browser_gateway.cjs` | Офлайн-тесты Node.js |
| `.github/workflows/swarm-tests.yml` | CI для Python + Node.js |
| `BROWSER_GATEWAY.md` | Полная документация по компонентам, командам и угрозам |

Самый простой вариант из PowerShell с локальным Git:

```powershell
# Установлены Git и Node.js
# Клонировать dev и скопировать туда содержимое распакованного ZIP
# (сохрани структуру каталогов)
git clone -b dev https://github.com/Ferrum-Sidereum/agi.git
cd agi
# скопируй содержимое ZIP в эту папку, разрешив замену daemon_core.js
node --test tests/test_browser_gateway.cjs
git add userscripts daemon_core.js tests/test_browser_gateway.cjs .github/workflows/swarm-tests.yml BROWSER_GATEWAY.md
git commit -m "feat: browser self-update and recovery gateway"
git push origin dev
```

**Не добавляй в GitHub `GITHUB_TOKEN` и любые PAT.** Если у твоего токена нет Workflow permission, загрузку изменённого workflow удобнее сделать через авторизованный GitHub web/обычный git, а не через браузерный Gateway.

## 2. Установить Tampermonkey userscripts (после публикации)

1. В Tampermonkey **отключи старые копии** двух скриптов, чтобы избежать конкурирующих обработчиков.
2. Открой URL в браузере (должны появиться исходники `.user.js`):
   - https://raw.githubusercontent.com/Ferrum-Sidereum/agi/dev/userscripts/gemini-github-loader.user.js
   - https://raw.githubusercontent.com/Ferrum-Sidereum/agi/dev/userscripts/gemini-github-recovery.user.js
3. Подтверди установку **обоих** через Tampermonkey.
4. Открой `gemini.google.com` → меню Tampermonkey → `AGI: установить GitHub-токен` (Loader) и `AGI Recovery: установить GitHub-токен` (Recovery). Для каждого потребуется токен, так как `GM_setValue` изолирован между скриптами. Допускается один и тот же **новый** fine-grained PAT, но лучше отдельные PAT с минимальными правами.
5. Обнови вкладку Gemini.

**Старый токен из исходных файлов, который уже был вставлен в код и передан в переписку, обязательно отзови на GitHub.**

## 3. Как Gemini обновляет свою интеграцию

- `GITHUB_AUTO_PUSH` → Loader. Может изменить `daemon_core.js`, оба `.user.js` или обычные файлы в `dev`. При изменении исполняемого ядра/userscript требуется ручное подтверждение.
- `GITHUB_RECOVERY_PUSH` → независимый Recovery (только `daemon_core.js` и оба `.user.js`). Всегда ручное подтверждение.
- Чтобы обновить установленный userscript, Gemini должен **увеличить `@version`**, сохранив неизменными `@name`, `@namespace`, `@updateURL`, `@downloadURL`. Tampermonkey применит новую версию **при очередной проверке обновлений**, не сразу после коммита. При необходимости запусти проверку обновлений вручную.
- Чтобы обновить `daemon_core.js`, достаточно коммита и перезагрузки вкладки Gemini; он загружается заново из ветки `dev`.
- AUTO/MANUAL в Loader относится только к обычным файлам; для исполняемых обновлений подтверждение обязательно.

## 4. Проверки

`node --check userscripts/gemini-github-loader.user.js`  
`node --check userscripts/gemini-github-recovery.user.js`  
`node --check daemon_core.js`  
`node --test tests/test_browser_gateway.cjs`

В локальной модели Tampermonkey/DOM/GitHub API проходят 12/12 сценариев. Отдельно нужно протестировать на установленном Tampermonkey: загрузку core в изолированном контексте и его периодические обновления.
