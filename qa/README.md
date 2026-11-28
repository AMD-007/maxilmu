# QA scripts (local only — not deployed; wrangler serves public/ only)

Uses the Playwright that ships with the global `@playwright/mcp` install
and the Chromium already in `%LOCALAPPDATA%\ms-playwright` (paths are
hard-coded in each script — shortcut: Max's laptop only; switch to a
local `npm i -D playwright` if anyone else runs these).

    node qa/serve.js "%CD%\public" 8787          # static server, mimics Cloudflare (.html fallback, 404.html)
    node qa/shoot.js qa-screens/after            # every page/state x 9 viewports + audit.json
    node qa/regress.js 375 812                   # guru demo regression (Ahmad/Hakim/Rahim, publish, Tambah Guru, reset)

Lighthouse: install `lighthouse@13.6.0 puppeteer-core@25.16.0` in a scratch
folder (`--ignore-scripts`), copy lighthouse.mjs there, `node lighthouse.mjs 8787 AFTER`.
Scores on localhost are noisy (TBT swings 0.1–2.9s run to run) — compare CLS/LCP, run 3x.
