// Guru demo regression: node regress.js <width> <height>
const path = require("path");
const { chromium } = require(path.join(process.env.APPDATA, "npm/node_modules/@playwright/mcp/node_modules/playwright"));
const B = "http://localhost:8787/app/";
const [W, H] = [+(process.argv[2] || 375), +(process.argv[3] || 812)];
const errors = [], results = [];
const ok = (name, cond, extra = "") => { results.push(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`); };

(async () => {
  const browser = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, "ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe") });
  const mobile = W < 1024;
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, isMobile: mobile, hasTouch: mobile });
  const page = async () => {
    const p = await ctx.newPage();
    p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    p.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
    p.on("dialog", (d) => d.accept());
    return p;
  };
  const tabs = (p) => p.$$eval(".portal-tabs__btn", (b) => b.map((x) => x.textContent.trim()));
  const opts = (p, sel) => p.$$eval(`${sel} option`, (o) => o.map((x) => x.textContent.trim()));
  async function loginGuru(p, id) {
    await p.goto(B + "login.html");
    await p.selectOption("#guru-select", id);
    await p.click("#btn-guru-login");
    await p.waitForURL(/guru\.html/);
  }
  async function asAdmin(p) {
    await p.goto(B + "login.html"); await p.click("#btn-admin-login"); await p.waitForURL(/admin\.html/);
  }

  // Fresh demo data
  const a = await page(); await asAdmin(a);
  await a.click('[data-tab="tetapan"]'); await a.click("#btn-reset-demo"); await a.waitForURL(/login\.html/);

  // 1. Ahmad scope
  const g = await page(); await loginGuru(g, "g_ahmad");
  ok("Ahmad: tabs Kehadiran+Markah only", JSON.stringify(await tabs(g)) === '["Kehadiran","Markah"]', JSON.stringify(await tabs(g)));
  ok("Ahmad: classes = Tahfiz 1", JSON.stringify(await opts(g, "#att-class-select")) === '["Tahfiz 1"]');
  await g.click('.portal-tabs__btn:has-text("Markah")');
  const subj = await opts(g, "#mark-subject-select");
  ok("Ahmad: subjects = BA + PI in Tahfiz 1", subj.length === 2 && subj.every((s) => s.startsWith("Tahfiz 1")) && subj.some((s) => /Arab/.test(s)) && subj.some((s) => /Islam/.test(s)), JSON.stringify(subj));
  const gtext = await g.textContent("body");
  ok("Ahmad: no admin-only content", !/Yuran|Tetapan|6010/.test(gtext));

  // 2. Hakim scope + record tasmik
  const h = await page(); await loginGuru(h, "g_hakim");
  ok("Hakim: tab Hafazan only", JSON.stringify(await tabs(h)) === '["Hafazan"]', JSON.stringify(await tabs(h)));
  ok("Hakim: halaqah = Halaqah A", JSON.stringify(await opts(h, "#haf-halaqah-select")) === '["Halaqah A"]');
  const cards = await h.$$(".tasmik-card");
  ok("Hakim: 3 students in Halaqah A", cards.length === 3, String(cards.length));
  await h.click(".tasmik-card summary");
  const metaBefore = await h.textContent(".tasmik-card__meta");
  await h.fill(".tasmik-card[open] input[id^=tasmik-amount]", "1");
  await h.click(".tasmik-card[open] form .btn");
  await h.waitForTimeout(300);
  const metaAfter = await h.textContent(".tasmik-card__meta");
  ok("Hakim: tasmik saved (total changed)", metaBefore !== metaAfter, `${metaBefore} -> ${metaAfter}`);

  // 3. Rahim inactive
  const l = await page(); await l.goto(B + "login.html");
  ok("Rahim: not in login list", !(await opts(l, "#guru-select")).some((o) => /Rahim/.test(o)));
  await l.evaluate(() => sessionStorage.setItem("maxilmu_demo_session_v1", JSON.stringify({ role: "guru", teacherId: "g_rahim" })));
  await l.goto(B + "guru.html"); await l.waitForURL(/login\.html\?keluar=guru-tidak-aktif/);
  ok("Rahim: forced session bounced with notice", await l.isVisible("#login-notice"));

  // 4. Publish -> parent sees (Ahmad enters Akhir Tahun BA marks)
  await g.reload();
  await g.click('.portal-tabs__btn:has-text("Markah")');
  const baVal = await g.$eval("#mark-subject-select", (s) => [...s.options].find((o) => /Arab/.test(o.text)).value);
  await g.selectOption("#mark-subject-select", baVal);
  await g.selectOption("#mark-sitting-select", "akhir");
  ok("Akhir: editable before publish", (await g.$$("#mark-list input.mark-row-input")).length > 0);
  for (const inp of await g.$$("#mark-list input.mark-row-input")) await inp.fill("77");
  await g.click("#btn-guru-save"); await g.waitForTimeout(300);
  const par = await page();
  await par.goto(B + "login.html"); await par.selectOption("#parent-student-select", "s7"); await par.click("#btn-parent-login"); await par.waitForURL(/parent\.html/);
  const parBefore = await par.textContent("body");
  ok("Parent: draft Akhir marks hidden", !/77%/.test(parBefore));
  await a.goto(B + "login.html"); await asAdmin(a);
  await a.click('[data-sitting="akhir"][data-sitting-action="terbit"]'); await a.waitForTimeout(300);
  await par.reload();
  const parAfter = await par.textContent("body");
  ok("Parent: published Akhir shows 77% + Direkod oleh Ustaz Ahmad", /77%/.test(parAfter) && /Direkod oleh Ustaz Ahmad/.test(parAfter));
  await g.reload(); await g.click('.portal-tabs__btn:has-text("Markah")'); await g.selectOption("#mark-subject-select", baVal); await g.selectOption("#mark-sitting-select", "akhir");
  ok("Guru: Akhir now locked", (await g.isVisible("#mark-lock-note")) && (await g.$$("#mark-list input.mark-row-input")).length === 0);

  // 5. Tambah Guru end to end
  await a.click('[data-tab="guru"]');
  await a.fill("#new-guru-name", "Ustazah Aminah"); await a.fill("#new-guru-username", "aminah");
  await a.click('#add-guru-form button[type="submit"]'); await a.waitForTimeout(200);
  const aminahId = await a.$eval("#guru-table-body", (b) => [...b.querySelectorAll("tr")].find((r) => /Aminah/.test(r.textContent)).querySelector("[data-guru-assign]").dataset.guruAssign);
  await a.click(`[data-guru-assign="${aminahId}"]`);
  await a.selectOption("#assign-halaqah-select", { label: "Halaqah B" }); await a.click("#btn-assign-halaqah"); await a.waitForTimeout(200);
  ok("Tambah Guru: modal close button reachable", await a.isVisible(".modal__close"));
  await a.click(".modal__close");
  const n = await page(); await loginGuru(n, aminahId);
  ok("Aminah: logs in, tab Hafazan, Halaqah B", JSON.stringify(await tabs(n)) === '["Hafazan"]' && JSON.stringify(await opts(n, "#haf-halaqah-select")) === '["Halaqah B"]');

  // 6. Deactivate while logged in (cross-tab storage event)
  await a.click(`[data-guru-toggle="g_ahmad"]`);
  await g.waitForURL(/login\.html\?keluar=guru-tidak-aktif/, { timeout: 5000 }).catch(() => {});
  ok("Deactivate Ahmad: open guru tab logged out at once", /keluar=guru-tidak-aktif/.test(g.url()), g.url());

  // 7. Reset Data Demo
  await a.click('[data-tab="tetapan"]'); await a.click("#btn-reset-demo"); await a.waitForURL(/login\.html/);
  const lo = await opts(a, "#guru-select");
  const st = await a.evaluate(() => { const s = loadState(); return { ahmad: getTeacher(s, "g_ahmad").status, aminah: s.settings.teachers.some((t) => t.username === "aminah"), akhir: isSittingPublished(s, CURRENT_ACADEMIC_YEAR, "akhir") }; });
  ok("Reset: seed restored", st.ahmad === "aktif" && !st.aminah && !st.akhir && lo.length === 2, JSON.stringify(st));

  await browser.close();
  console.log(`--- ${W}x${H}\n` + results.join("\n"));
  console.log("console errors:", errors.length, errors.slice(0, 5));
})();
