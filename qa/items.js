// QA-fixes item checks (H1-L3): a bad-input and a good-input case each.
// node qa/items.js <width> <height>   (server on :8787 — wrangler dev or serve.js)
const path = require("path");
const { chromium } = require(path.join(process.env.APPDATA, "npm/node_modules/@playwright/mcp/node_modules/playwright"));
const ORIGIN = "http://localhost:8787";
const B = ORIGIN + "/app/";
const [W, H] = [+(process.argv[2] || 375), +(process.argv[3] || 812)];
const errors = [], results = [];
const ok = (item, name, cond, extra = "") => results.push(`${cond ? "PASS" : "FAIL"}  ${item}  ${name}${extra ? "  — " + extra : ""}`);
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = new Date(), tomorrow = new Date(Date.now() + 864e5), lastWeek = new Date(Date.now() - 7 * 864e5);

(async () => {
  const browser = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, "ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe") });
  const mobile = W < 1024;
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, isMobile: mobile, hasTouch: mobile });
  // Each page records dialogs; p.answer decides accept/dismiss for the next ones.
  const page = async () => {
    const p = await ctx.newPage();
    p.dialogs = []; p.answer = true;
    p.on("console", (m) => { if (m.type() !== "error") return; const u = m.location().url; if (/Failed to load resource: .*404/.test(m.text()) && /\/(app\/)?salah$/.test(u)) return; errors.push(m.text() + " @ " + u); }); // the deliberate 404 document itself is expected
    p.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
    p.on("dialog", (d) => { p.dialogs.push(d.message()); p.answer ? d.accept() : d.dismiss(); });
    return p;
  };
  const lastDialog = (p) => p.dialogs[p.dialogs.length - 1] || "";
  const st = (p) => p.evaluate(() => JSON.parse(localStorage.getItem(STORAGE_KEY)));
  const asAdmin = async (p) => { await p.goto(B + "login.html"); await p.click("#btn-admin-login"); await p.waitForURL(/admin\.html/); };
  const loginGuru = async (p, id) => { await p.goto(B + "login.html"); await p.selectOption("#guru-select", id); await p.click("#btn-guru-login"); await p.waitForURL(/guru\.html/); };
  const tab = (p, t) => p.click(`.portal-tabs__btn[data-tab="${t}"]`);
  const clickRow = async (p, sel) => { await p.locator(sel).scrollIntoViewIfNeeded(); await p.click(sel); };

  const a = await page();
  await asAdmin(a);
  await tab(a, "tetapan"); await a.click("#btn-reset-demo"); await a.waitForURL(/login\.html/);
  await asAdmin(a);

  // ── H1 Tambah / Edit Pelajar ────────────────────────────────────
  const count0 = (await st(a)).students.length;
  await a.click("#btn-add-student");
  ok("HID", "Tambah opens on Tahfiz 1 -> 'Nama kelas baharu' hidden", (await a.inputValue("#sf-class")) === "Tahfiz 1" && await a.isHidden("#sf-newclass-field"));
  await a.click('#student-form button[type="submit"]');
  ok("H1", "bad: empty Nama -> inline error, aria-invalid, not saved",
    (await a.textContent("#sf-name-err")).length > 0 && (await a.getAttribute("#sf-name", "aria-invalid")) === "true" && (await st(a)).students.length === count0);
  await a.fill("#sf-name", "Ali bin Abu");
  await a.fill("#sf-phone", "0123456789");
  await a.click('#student-form button[type="submit"]');
  ok("H1", "bad: phone 0123456789 -> 601X error", /601/.test(await a.textContent("#sf-phone-err")) && (await st(a)).students.length === count0);
  await a.selectOption("#sf-class", "__new__"); await a.fill("#sf-phone", "");
  ok("HID", "pick 'Kelas baharu…' -> field shown", await a.isVisible("#sf-newclass-field"));
  await a.click('#student-form button[type="submit"]');
  ok("H1", "bad: Kelas baharu with no name -> error", (await a.textContent("#sf-newclass-err")).length > 0 && (await st(a)).students.length === count0);
  await a.selectOption("#sf-class", "Tahfiz 1"); await a.selectOption("#sf-halaqah", "hq_a");
  ok("HID", "back to Tahfiz 1 -> field hidden again", await a.isHidden("#sf-newclass-field"));
  await a.fill("#sf-parent", "Abu bin Bakar"); await a.fill("#sf-phone", "60123456789");
  await a.click('#student-form button[type="submit"]');
  let s = await st(a); const ali = s.students.find((x) => x.name === "Ali bin Abu");
  ok("H1", "good: Ali added with empty records", !!ali && ali.className === "Tahfiz 1" && ali.halaqahId === "hq_a" && ali.parentPhone === "60123456789"
    && !ali.examRecords.length && !ali.attendanceLog.length && !ali.hafazanLog.length && !ali.fees.ledger.length && await a.isHidden("#modal-overlay"));
  ok("H1", "good: Ali in roster", (await a.textContent("#student-table-body")).includes("Ali bin Abu"));

  // duplicate name: dismiss -> not added
  a.answer = false;
  await a.click("#btn-add-student"); await a.fill("#sf-name", "ahmad danish bin rosli"); await a.click('#student-form button[type="submit"]');
  ok("H1", "bad: duplicate name -> warning, dismiss saves nothing", /sudah ada/.test(lastDialog(a)) && (await st(a)).students.length === count0 + 1);
  a.answer = true;
  await a.click("[data-close]");

  // Kelas baharu
  await a.click("#btn-add-student"); await a.fill("#sf-name", "Siti Baharu"); await a.selectOption("#sf-class", "__new__"); await a.fill("#sf-newclass", "Tahfiz 4");
  await a.click('#student-form button[type="submit"]');
  await tab(a, "kehadiran");
  const ambilOpts = await a.$$eval("#ambil-class-select option", (o) => o.map((x) => x.value));
  ok("H1", "good: Kelas baharu 'Tahfiz 4' selectable in Ambil Kehadiran", ambilOpts.includes("Tahfiz 4"), JSON.stringify(ambilOpts));
  await tab(a, "pelajar");

  // parent login list + guru lists
  const lp = await page(); await lp.goto(B + "login.html");
  const parentOpts = await lp.$$eval("#parent-student-select option", (o) => o.map((x) => x.textContent));
  ok("H1", "good: Ali in parent login list", parentOpts.some((t) => t.startsWith("Ali bin Abu")));
  await loginGuru(lp, "g_ahmad");
  ok("H1", "good: Ali in Ustaz Ahmad's Tahfiz 1 attendance", (await lp.textContent("body")).includes("Ali bin Abu"));
  await loginGuru(lp, "g_hakim");
  ok("H1", "good: Ali in Ustaz Hakim's Halaqah A", (await lp.$$eval(".tasmik-card__name", (n) => n.map((x) => x.textContent))).includes("Ali bin Abu"));
  await lp.close();

  // [hidden] beats display rules elsewhere too
  await clickRow(a, '[data-edit-student="s7"]');
  ok("HID", "Edit s7 -> 'Nama kelas baharu' hidden", (await a.inputValue("#sf-class")) === "Tahfiz 1" && await a.isHidden("#sf-newclass-field"));
  await a.click("[data-close]");
  await clickRow(a, '[data-edit-status="s7"]');
  const reasonHiddenAtOpen = await a.isHidden("#status-reason-custom-field");
  await a.selectOption("#status-reason-select", "__custom__");
  ok("HID", "Status modal: 'Nyatakan sebab' hidden until Lain-lain", reasonHiddenAtOpen && await a.isVisible("#status-reason-custom-field"));
  await a.click("[data-close]");

  // Empty states: one "Belum ada rekod" note each, empty chart area hidden
  const notes = (p, scope, text) => p.$$eval(`${scope} .empty-note`, (els, t) => els.filter((e) => e.textContent.trim() === t && e.getClientRects().length).length, text);
  await clickRow(a, `[data-edit-hafazan="${ali.id}"]`);
  ok("EMPTY", "admin hafazan modal (no records): note once, chart hidden", (await notes(a, "#modal-root", "Belum ada rekod hafazan mingguan.")) === 1 && await a.isHidden("#hafazan-chart-mount"));
  await a.click("[data-close]");
  await clickRow(a, `[data-edit-attendance="${ali.id}"]`);
  ok("EMPTY", "admin kehadiran modal (no records): note once, chart hidden", (await notes(a, "#modal-root", "Belum ada rekod kehadiran bulanan.")) === 1 && await a.isHidden("#attendance-chart-mount"));
  await a.click("[data-close]");
  await clickRow(a, '[data-edit-hafazan="s7"]');
  ok("EMPTY", "admin hafazan modal (with records): chart shown", await a.isVisible("#hafazan-chart-mount svg"));
  await a.click("[data-close]");
  const pp = await page();
  for (const [sid, empty] of [[ali.id, true], ["s7", false]]) {
    await pp.goto(B + "login.html"); await pp.selectOption("#parent-student-select", sid); await pp.click("#btn-parent-login"); await pp.waitForURL(/parent.html/);
    const att = await notes(pp, "body", "Belum ada rekod kehadiran bulanan."), haf = await notes(pp, "body", "Belum ada rekod hafazan mingguan.");
    const charts = [await pp.isVisible("#attendance-chart-mount"), await pp.isVisible("#hafazan-chart-mount")];
    ok("EMPTY", `parent ${empty ? "no records: each note once, charts hidden" : "s7: no notes, charts shown"}`,
      empty ? att === 1 && haf === 1 && !charts[0] && !charts[1] : att === 0 && haf === 0 && charts[0] && charts[1], JSON.stringify({ att, haf, charts }));
  }
  await pp.close();

  // Edit: s5 Tahfiz 1 -> Tahfiz 2; old records keep classAtTime
  await a.reload();
  await clickRow(a, '[data-edit-student="s5"]');
  ok("H1", "edit: same modal prefilled", (await a.inputValue("#sf-name")) === "Amirul Hakim bin Zainal" && (await a.inputValue("#sf-class")) === "Tahfiz 1");
  await a.fill("#sf-name", ""); await a.click('#student-form button[type="submit"]');
  ok("H1", "edit bad: blank name rejected", (await st(a)).students.find((x) => x.id === "s5").name === "Amirul Hakim bin Zainal");
  await a.fill("#sf-name", "Amirul Hakim bin Zainal");
  await a.selectOption("#sf-class", "Tahfiz 2"); await a.click('#student-form button[type="submit"]');
  s = await st(a); let s5 = s.students.find((x) => x.id === "s5");
  ok("H1", "edit good: class changed, old classAtTime untouched", s5.className === "Tahfiz 2" && s5.attendanceLog.every((e) => e.classAtTime === "Tahfiz 1") && s5.hafazanLog.every((e) => e.classAtTime === "Tahfiz 1"));
  await tab(a, "kehadiran"); await a.selectOption("#ambil-class-select", "Tahfiz 2"); await a.click("#btn-save-attendance");
  s5 = (await st(a)).students.find((x) => x.id === "s5");
  const todays = s5.attendanceLog.find((e) => e.date === iso(today));
  ok("H1", "edit good: new record uses new class", todays && todays.classAtTime === "Tahfiz 2", todays && todays.classAtTime);

  // ── M3 Ambil future date ────────────────────────────────────────
  a.dialogs = [];
  await a.fill("#ambil-date-input", iso(tomorrow)); await a.dispatchEvent("#ambil-date-input", "change");
  ok("M3", "bad: Ambil future date refused + reverted", /masa depan/.test(lastDialog(a)) && (await a.inputValue("#ambil-date-input")) === iso(today), lastDialog(a));
  ok("M3", "Ambil date has max=today", (await a.getAttribute("#ambil-date-input", "max")) === iso(today));
  await a.fill("#ambil-date-input", iso(lastWeek)); await a.dispatchEvent("#ambil-date-input", "change");
  ok("M3", "good: past date allowed, 'bukan hari ini' banner", await a.isVisible("#ambil-date-banner") && /bukan hari ini/.test(await a.textContent("#ambil-date-banner")));
  await tab(a, "pelajar");

  // ── M1 Keputusan marks ──────────────────────────────────────────
  const markSel = '#mark_akhir_Bahasa_Melayu';
  for (const bad of ["150", "72.5", "-1"]) {
    await a.reload(); a.dialogs = [];
    await clickRow(a, '[data-edit-results="s7"]');
    if (await a.isVisible('[data-show-sitting="akhir"]')) await a.click('[data-show-sitting="akhir"]'); // phone switcher
    await a.fill(markSel, bad);
    await a.fill("#mark_akhir_Sains", "66"); // a good cell in the same save
    await a.click("#btn-save-student");
    s = await st(a); const r = s.students.find((x) => x.id === "s7").examRecords[0].marks.akhir;
    ok("M1", `bad: ${bad} -> guru message, highlighted, nothing saved`, lastDialog(a) === "Markah mesti nombor bulat 0 hingga 100."
      && (await a.getAttribute(markSel, "aria-invalid")) === "true" && !("Bahasa Melayu" in r) && !("Sains" in r) && await a.isVisible("#modal-overlay"), lastDialog(a));
  }
  await a.fill(markSel, "88"); await a.click("#btn-save-student");
  s = await st(a); const ak = s.students.find((x) => x.id === "s7").examRecords[0].marks.akhir;
  ok("M1", "good: 88 + 66 saved", ak["Bahasa Melayu"] === 88 && ak["Sains"] === 66);
  const direct = await a.evaluate(() => { const st = loadState(); const s = getStudent(st, "s7"); return [setExamMark(st, s, "akhir", "Sejarah", 150, ADMIN_ACTOR), setExamMark(st, s, "akhir", "Sejarah", 99.5, ADMIN_ACTOR), "Sejarah" in s.examRecords[0].marks.akhir]; });
  ok("M1", "setExamMark rejects 150 / 99.5 (no clamp)", direct[0] === false && direct[1] === false && direct[2] === false, JSON.stringify(direct));

  // ── M2 + M3 admin hafazan ───────────────────────────────────────
  await a.reload(); a.dialogs = [];
  s = await st(a);
  const s3total = s.students.find((x) => x.id === "s3").hafazanLog.reduce((n, e) => n + e.amount, 0);
  const remaining = s.settings.hafazan.total - s3total;
  await clickRow(a, '[data-edit-hafazan="s3"]');
  ok("M2", "admin amount input max = remaining", Number(await a.getAttribute("#hafazan-entry-amount", "max")) === remaining, `${remaining}`);
  await a.fill("#hafazan-entry-amount", String(remaining + 1)); await a.click("#btn-add-hafazan-entry");
  const adminOver = lastDialog(a);
  ok("M2", `bad: admin +${remaining + 1} over target refused`, /^Tambahan melebihi sasaran 30 Juzuk\. Baki untuk Muhammad Haziq bin Yusof: 20 Juzuk\.$/.test(adminOver) && (await st(a)).students.find((x) => x.id === "s3").hafazanLog.length === s.students.find((x) => x.id === "s3").hafazanLog.length, adminOver);
  await a.fill("#hafazan-entry-amount", "1"); await a.fill("#hafazan-entry-date", iso(tomorrow)); await a.click("#btn-add-hafazan-entry");
  ok("M3", "bad: admin hafazan future date refused", /bukan masa depan/.test(lastDialog(a)) && (await st(a)).students.find((x) => x.id === "s3").hafazanLog.length === s.students.find((x) => x.id === "s3").hafazanLog.length);
  ok("M3", "admin hafazan date has max=today", (await a.getAttribute("#hafazan-entry-date", "max")) === iso(today));
  await a.fill("#hafazan-entry-date", iso(today)); await a.fill("#hafazan-entry-amount", String(remaining)); await a.click("#btn-add-hafazan-entry");
  const s3 = (await st(a)).students.find((x) => x.id === "s3");
  ok("M2", `good: admin +${remaining} (exactly remaining) saved`, s3.hafazanLog.reduce((n, e) => n + e.amount, 0) === 30);
  await a.fill("#hafazan-entry-amount", "0.25"); await a.click("#btn-add-hafazan-entry");
  ok("M2", "bad: at target, any entry refused", /sudah mencapai sasaran/.test(lastDialog(a)), lastDialog(a));
  await a.click("[data-close]");

  // guru side, same template
  const g = await page(); await loginGuru(g, "g_hakim");
  s = await st(g);
  const s1rem = s.settings.hafazan.total - s.students.find((x) => x.id === "s1").hafazanLog.reduce((n, e) => n + e.amount, 0);
  const card = g.locator('.tasmik-card[data-haf-student="s1"]');
  await card.locator("summary").click();
  await card.locator("input[name=amount]").fill(String(s1rem + 0.5)); await card.locator("button[type=submit]").click();
  const guruOver = lastDialog(g);
  ok("M2", "bad: guru over target -> same message template", guruOver === `Tambahan melebihi sasaran 30 Juzuk. Baki untuk Ahmad Danish bin Rosli: ${s1rem} Juzuk.`, guruOver);
  await card.locator("input[name=amount]").fill("1"); await card.locator("button[type=submit]").click();
  const s1after = (await st(g)).students.find((x) => x.id === "s1").hafazanLog.length;
  ok("M2", "good: guru +1 saved", s1after === s.students.find((x) => x.id === "s1").hafazanLog.length + 1);
  await g.close();

  // ── M4 remove subject ───────────────────────────────────────────
  await a.reload(); await tab(a, "tetapan");
  a.answer = false; a.dialogs = [];
  await a.click('[data-remove-subject="Bahasa Arab"]');
  const m4msg = lastDialog(a);
  s = await st(a);
  ok("M4", "confirm names mark count + assigned guru", /\d+ markah sedia ada/.test(m4msg) && /Ustaz Ahmad \(Tahfiz 1\)/.test(m4msg), m4msg.replace(/\n/g, " | "));
  ok("M4", "bad (cancel): nothing removed", s.settings.subjects.includes("Bahasa Arab") && s.settings.teachers.find((t) => t.id === "g_ahmad").assignments.some((x) => x.subject === "Bahasa Arab"));
  a.answer = true;
  await a.click('[data-remove-subject="Bahasa Arab"]');
  s = await st(a);
  const ahmad = s.settings.teachers.find((t) => t.id === "g_ahmad");
  ok("M4", "good (confirm): subject + Ahmad's BA task removed, marks kept",
    !s.settings.subjects.includes("Bahasa Arab") && !ahmad.assignments.some((x) => x.subject === "Bahasa Arab") && ahmad.assignments.some((x) => x.subject === "Pendidikan Islam")
    && s.students.find((x) => x.id === "s1").examRecords[0].marks.awal["Bahasa Arab"] === 68);

  // ── M5 hafazan unit ─────────────────────────────────────────────
  a.dialogs = [];
  await a.selectOption("#hafazan-unit-select", "surah"); await a.click("#btn-save-hafazan");
  s = await st(a);
  ok("M5", "bad: unit change with records blocked + explained", s.settings.hafazan.unit === "juz" && /tidak boleh ditukar/.test(lastDialog(a)) && (await a.inputValue("#hafazan-unit-select")) === "juz", lastDialog(a).slice(0, 60));
  await a.fill("#hafazan-total-input", "40"); await a.click("#btn-save-hafazan");
  ok("M5", "good: target change (same unit) still saves", (await st(a)).settings.hafazan.total === 40);
  await a.evaluate(() => { const st = loadState(); st.students.forEach((s) => { s.hafazanLog = []; }); saveState(st); });
  await a.reload(); await tab(a, "tetapan");
  await a.selectOption("#hafazan-unit-select", "surah"); await a.click("#btn-save-hafazan");
  ok("M5", "good: unit change allowed with zero records", (await st(a)).settings.hafazan.unit === "surah");

  // ── L3 Tambah Guru duplicate name ───────────────────────────────
  await tab(a, "guru");
  const gcount = (await st(a)).settings.teachers.length;
  a.answer = false; a.dialogs = [];
  await a.fill("#new-guru-name", "ustaz ahmad"); await a.fill("#new-guru-username", "ahmad2"); await a.click('#add-guru-form button[type="submit"]');
  ok("L3", "bad: same display name -> warning, cancel adds nothing", /sudah ada/.test(lastDialog(a)) && (await st(a)).settings.teachers.length === gcount, lastDialog(a));
  a.answer = true; a.dialogs = [];
  await a.fill("#new-guru-name", "Ustazah Aminah"); await a.fill("#new-guru-username", "aminah"); await a.click('#add-guru-form button[type="submit"]');
  ok("L3", "good: unique name added with no warning", a.dialogs.length === 0 && (await st(a)).settings.teachers.length === gcount + 1);

  // ── M6 seed ─────────────────────────────────────────────────────
  await tab(a, "tetapan"); await a.click("#btn-reset-demo"); await a.waitForURL(/login\.html/);
  s = await st(a);
  const s4 = s.students.find((x) => x.id === "s4");
  const s4last = s4.attendanceLog.map((e) => e.date).sort().pop();
  ok("M6", "s4 attendance ends 2026-08-07", s4last === "2026-08-07", s4last);
  ok("M6", "no inactive student has attendance after leftOn", s.students.filter((x) => x.status !== "aktif").every((x) => x.leftOn && x.attendanceLog.every((e) => e.date <= x.leftOn)));
  ok("M6", "active students still run to yesterday", s.students.find((x) => x.id === "s1").attendanceLog.map((e) => e.date).sort().pop() === iso(new Date(Date.now() - 864e5)) || today.getDay() === 1 || today.getDay() === 0);

  // ── H2 / L1 / L2 index ──────────────────────────────────────────
  const ix = await page();
  await ix.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
  await ix.goto(ORIGIN + "/");
  await ix.locator("#contact-form").scrollIntoViewIfNeeded();
  await ix.click('#contact-form button[type="submit"]');
  const inv = await ix.$$eval("#contact-form [aria-invalid]", (els) => els.map((e) => e.name + "=" + e.getAttribute("aria-invalid")));
  ok("H2", "bad: all empty -> 3 inline errors, no WhatsApp", inv.join() === "name=true,phone=true,message=true" && (await ix.evaluate(() => window.__opened.length)) === 0
    && await ix.isVisible("#err-name") && (await ix.evaluate(() => document.activeElement.name)) === "name");
  await ix.fill("[name=name]", "Fatimah"); await ix.fill("[name=phone]", "   "); await ix.fill("[name=message]", "Soalan");
  await ix.click('#contact-form button[type="submit"]');
  ok("H2", "bad: whitespace-only phone still blocked", (await ix.getAttribute("[name=phone]", "aria-invalid")) === "true" && (await ix.getAttribute("[name=name]", "aria-invalid")) === "false" && (await ix.evaluate(() => window.__opened.length)) === 0);
  await ix.fill("[name=phone]", "0123456789"); await ix.click('#contact-form button[type="submit"]');
  const opened = await ix.evaluate(() => window.__opened);
  ok("H2", "good: filled -> opens wa.me with text, errors cleared", opened.length === 1 && /wa\.me\/\d+\?text=/.test(opened[0]) && !(await ix.isVisible("#err-phone")));
  ok("L1", "eyebrow reads 'Untuk Ibu Bapa'", (await ix.textContent("#maxilmu .eyebrow")).trim() === "Untuk Ibu Bapa");
  const tiles = await ix.$$eval("#maxilmu .stat-tile", (t) => t.map((x) => x.textContent.replace(/\s+/g, " ").trim()));
  const akhir = (await ix.textContent("#maxilmu .report__exam:nth-child(3)")).replace(/\s+/g, " ");
  ok("L2", "July preview: Purata = Pertengahan 70%, Akhir —", tiles[1].includes("70%") && tiles[1].includes("Pertengahan") && !tiles.join().includes("Akhir") && akhir.includes("—"), tiles[1] + " | " + akhir);
  await ix.close();

  // ── H3 404 ──────────────────────────────────────────────────────
  for (const url of ["/salah", "/app/salah"]) {
    const p = await page();
    const failed = []; p.on("requestfailed", (r) => failed.push(r.url())); p.on("response", (r) => { if (r.status() >= 400 && r.url() !== ORIGIN + url) failed.push(r.status() + " " + r.url()); });
    const resp = await p.goto(ORIGIN + url, { waitUntil: "load" });
    const info = await p.evaluate(() => ({
      styled: getComputedStyle(document.querySelector(".error-page")).display !== "block" || getComputedStyle(document.querySelector(".btn")).backgroundColor !== "rgba(0, 0, 0, 0)",
      logo: document.querySelector(".error-card__mark img").naturalWidth,
      href: document.querySelector(".error-card .btn").href,
      title: document.title,
    }));
    ok("H3", `${url}: 404, styled, logo loads, no broken assets`, resp.status() === 404 && info.styled && info.logo > 0 && failed.filter((u) => !/fonts\.g/.test(u)).length === 0, JSON.stringify({ status: resp.status(), ...info, failed }));
    await p.click(".error-card .btn"); await p.waitForLoadState("load");
    ok("H3", `${url}: home link -> /`, new URL(p.url()).pathname === "/" && (await p.locator("#contact-form").count()) === 1);
    await p.close();
  }

  await browser.close();
  console.log(`items @ ${W}x${H}`);
  results.forEach((r) => console.log(r));
  console.log(`console errors: ${errors.length}`); errors.forEach((e) => console.log("  ", e));
  process.exitCode = results.some((r) => r.startsWith("FAIL")) || errors.length ? 1 : 0;
})().catch((e) => { console.error(e); process.exit(2); });
