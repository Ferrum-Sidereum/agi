## Браузерный GitHub Gateway и самообновление Tampermonkey

Проект содержит **две разные точки входа** Tampermonkey, которые можно оставить включёнными одновременно. Они **не обрабатывают один и тот же тип команд**.

| Компонент | Где хранится | Когда выполняется | Что делает |
|---|---|---|---|
| **Loader v2** | `userscripts/gemini-github-loader.user.js` | При открытии Gemini | Загружает `daemon_core.js`; выполняет `GITHUB_AUTO_PUSH` через GitHub API |
| **Core v2** | `daemon_core.js` | Загружается Loader из `dev` | Сканирует ответы Gemini, показывает AUTO/MANUAL, делегирует запись Loader |
| **Recovery v4** | `userscripts/gemini-github-recovery.user.js` | При открытии Gemini, независимо от Loader | Принимает **только** `GITHUB_RECOVERY_PUSH`; чинит ядро или userscript даже при поломанном Loader |

```text
Gemini response ── GITHUB_AUTO_PUSH ──→ Loader ──→ GitHub dev
                                       ↑
                          daemon_core.js (HUD, scanner)

Gemini response ── GITHUB_RECOVERY_PUSH ──→ Recovery ──→ GitHub dev
                                            (независимо от Loader)

GitHub dev/userscripts/*.user.js ── Tampermonkey update check ──→ установленная версия
GitHub dev/daemon_core.js ──────── Loader при следующем открытии Gemini
```

### Установка один раз

1. **Отозвать** прежний `ghp_...` токен, который оказался в исходных скриптах/переписке. Создать **новый fine-grained PAT**: `Only select repositories → Ferrum-Sidereum/agi`, `Contents: Read and write`; `Metadata: Read` автоматически. Не выдавать `Administration` или `Actions` для обычных пушей.
2. Удалить либо **отключить старые копии** Auto-Pusher/Loader в Tampermonkey во избежание двойного сканирования.
3. Установить **оба** скрипта из URL GitHub (открыть ссылки и согласиться на установку):
   - [Loader](https://raw.githubusercontent.com/Ferrum-Sidereum/agi/dev/userscripts/gemini-github-loader.user.js)
   - [Recovery](https://raw.githubusercontent.com/Ferrum-Sidereum/agi/dev/userscripts/gemini-github-recovery.user.js)
4. На странице `gemini.google.com` в меню Tampermonkey **дважды** выбрать `AGI: установить GitHub-токен` и `AGI Recovery: установить GitHub-токен`. Хранилище `GM_setValue` **изолировано на каждый userscript**, поэтому для независимого восстановления токен нужно сохранить в обоих.
5. Обновить страницу Gemini. По умолчанию Loader в **MANUAL**. Для обычных обновлений можно включить `AUTO` через HUD или меню; запись userscript и `daemon_core.js` **всегда требует ручного подтверждения**, независимо от AUTO.

**Важно:** запись версии в GitHub и установка обновления в Tampermonkey — разные события. Tampermonkey проверяет `@updateURL`/`@downloadURL` по собственному расписанию. Для немедленной проверки используйте **Tampermonkey → Dashboard → Utilities → Check for userscript updates** (название пункта может отличаться), затем обновите вкладку Gemini. `daemon_core.js` сам подхватывается Loader при новом открытии/обновлении вкладки. Никакого мгновенного горячего обновления установленного userscript здесь нет.

### Команды Gemini

Обычная запись в `dev` (только Loader):

```json
{
  "action": "GITHUB_AUTO_PUSH",
  "repo": "Ferrum-Sidereum/agi",
  "branch": "dev",
  "commit_message": "docs: update README",
  "files": [{"path": "README.md", "content": "FULL FILE CONTENT"}],
  "EOF_READY": true
}
```

Для обновления **самого Loader** или **Recovery** Gemini должен передать полный новый исходник в `files[].content` по пути `userscripts/gemini-github-loader.user.js` или `userscripts/gemini-github-recovery.user.js`; при этом надо **увеличить `@version`**, сохранив `@name`, `@namespace`, `@updateURL`, `@downloadURL`. После ручного подтверждения команда публикует новую версию в `dev`. **Tampermonkey установит её после проверки обновлений**, а не сразу после коммита.

Если Loader перестал функционировать, резервный скрипт принимает **отдельную** команду:

```json
{
  "action": "GITHUB_RECOVERY_PUSH",
  "repo": "Ferrum-Sidereum/agi",
  "branch": "dev",
  "commit_message": "recovery: restore daemon core",
  "files": [{"path": "daemon_core.js", "content": "FULL FIXED CORE SOURCE"}],
  "EOF_READY": true
}
```

Recovery допускает только пути `daemon_core.js` и два `userscripts/*.user.js`, перечисленные выше, и всегда требует явного клика и подтверждения. Recovery не перехватывает `GITHUB_AUTO_PUSH` и не заменяет основной Loader.

### Границы безопасности и надёжности

- Токен хранится в `GM_setValue`, а **не** в коде репозитория, DOM или `localStorage` страницы; `GM_setValue` не является аппаратным сейфом. Токен имеет полномочия изменять *любой файл выбранного репозитория*. Фильтрация путей в браузере — дополнительный барьер, а не серверная гарантия. Для продакшн-подобной архитектуры предпочтительны GitHub App, короткоживущие токены и изолированный relay.
- Новый core — **исполняемый код** из ветки `dev`, загружаемый в контекст userscript. Следовательно, доступ на запись в эту ветку равен возможности исполнять код расширения после следующего запуска. Не включайте непроверенный `AUTO`; все изменения core/userscripts выполняйте после просмотра diff.
- Файлы коммитятся **одной Git Tree / Commit транзакцией** с `force: false`. При конкурентном изменении ветки запись завершится ошибкой, но не перепишет чужую ветку; повторное выполнение после обновления — отдельная операция.
- Скрипт работает **только при открытой вкладке Gemini**. Наличие браузерного gateway не означает непрерывную работу роя или автоматический вызов GPT/Claude/Gemini.
- GitHub **public repo**: не публиковать секреты или приватные payload. Если Core сломался и не работает даже Recovery, восстановление — вручную через GitHub и Tampermonkey.

Для проверки браузерной логики без GitHub-токена: `node --test tests/test_browser_gateway.cjs`. Тесты используют имитацию DOM, Tampermonkey и GitHub API; поведение реального браузера и проверок Tampermonkey на установку требует отдельной ручной end-to-end проверки.
