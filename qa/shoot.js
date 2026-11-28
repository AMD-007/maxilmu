// Usage: node shoot.js <outDir> [filter] [widths e.g. 375,1280]
// Screenshots every page/state at every viewport and writes audit.json
// (horizontal overflow, clipped text, small inputs, small tap targets).
const path = require("path"), fs = require("fs");
const { chromium } = require(path.join(process.env.APPDATA, "npm/node_modules/@playwright/mcp/node_modules/playwright"));
const BASE = "http://localhost:8787";
const OUT = process.argv[2];
const FILTER = process.argv[3] ? new RegExp(process.argv[3]) : null;
const WIDTHS = process.argv[4] ? process.argv[4].split(",").map(Number) : null;
const VIEWPORTS = [
  [320, 640], [375, 812], [414, 896], [768, 1024], [1024, 768], [1280, 800], [1366, 768], [1440, 900], [1920, 1080],
  [812, 375, "land"],
];

async function login(page, session) {
  await page.goto(BASE + "/app/login.html");
  await page.evaluate((s) => sessionStorage.setItem("maxilmu_demo_session_v1", JSON.stringify(s)), session);
}
async function clickTab(page, tab) { await page.click(`.portal-tabs__btn[data-tab="${tab}"]`); await page.waitForTimeout(150); }
async function guruTab(page, i) { const b = page.locator(".portal-tabs__btn").nth(i); if (await b.count()) { await b.click(); await page.waitForTimeout(150); return true; } return false; }
async function rowBtn(page, sel) { await page.locator(sel).first().click(); await page.waitForTimeout(200); }

const ADMIN = { role: "admin" };
const STATES = [
  { name: "index", url: "/index.html", full: true },
  // Mini header only appears once the hero is off-screen — a full-page shot
  // from the top never shows it (that's how the 375/320 wrap bug got missed).
  { name: "index-scrolled", url: "/index.html", act: async (p) => {
    await p.evaluate(() => { const h = document.querySelector(".hero"); scrollTo(0, h.offsetTop + h.offsetHeight + 200); });
    await p.waitForSelector("#miniHeader.is-visible");
    await p.waitForTimeout(450); // .35s slide-in transition
  } },
  { name: "index-form-errors", url: "/index.html", act: async (p) => { await p.locator("#contact-form").scrollIntoViewIfNeeded(); await p.click('#contact-form button[type="submit"]'); } },
  { name: "404", url: "/nope-404", full: true },
  { name: "404-app", url: "/app/salah", full: true },
  { name: "login", url: "/app/login.html", full: true },
  { name: "admin-pelajar", session: ADMIN, url: "/app/admin.html", full: true },
  { name: "admin-kehadiran-ambil", session: ADMIN, url: "/app/admin.html", full: true, act: (p) => clickTab(p, "kehadiran") },
  { name: "admin-kehadiran-semakan", session: ADMIN, url: "/app/admin.html", full: true, act: async (p) => { await clickTab(p, "kehadiran"); await p.click('[data-subtab="semakan"]'); } },
  { name: "admin-yuran", session: ADMIN, url: "/app/admin.html", full: true, act: (p) => clickTab(p, "yuran") },
  { name: "admin-guru", session: ADMIN, url: "/app/admin.html", full: true, act: (p) => clickTab(p, "guru") },
  { name: "admin-tetapan", session: ADMIN, url: "/app/admin.html", full: true, act: (p) => clickTab(p, "tetapan") },
  { name: "admin-modal-keputusan", session: ADMIN, url: "/app/admin.html", act: (p) => rowBtn(p, '[data-edit-results="s7"]') },
  { name: "admin-modal-kehadiran", session: ADMIN, url: "/app/admin.html", act: (p) => rowBtn(p, '[data-edit-attendance="s7"]') },
  { name: "admin-modal-hafazan", session: ADMIN, url: "/app/admin.html", act: (p) => rowBtn(p, '[data-edit-hafazan="s7"]') },
  { name: "admin-modal-tambah-pelajar", session: ADMIN, url: "/app/admin.html", act: async (p) => { await p.click("#btn-add-student"); await p.click('#student-form button[type="submit"]'); await p.selectOption("#sf-class", "__new__"); } },
  { name: "admin-modal-edit-pelajar", session: ADMIN, url: "/app/admin.html", act: (p) => rowBtn(p, '[data-edit-student="s7"]') },
  { name: "admin-modal-status", session: ADMIN, url: "/app/admin.html", act: (p) => rowBtn(p, '[data-edit-status="s7"]') },
  { name: "admin-modal-yuran", session: ADMIN, url: "/app/admin.html", act: async (p) => { await clickTab(p, "yuran"); await rowBtn(p, "#yuran-table-body button"); } },
  { name: "admin-modal-urus-tugasan", session: ADMIN, url: "/app/admin.html", act: async (p) => { await clickTab(p, "guru"); await rowBtn(p, '[data-guru-assign="g_ahmad"]'); } },
  ...["ahmad", "hakim"].flatMap((g) => ["kehadiran", "markah", "hafazan"].map((t, i) => ({
    name: `guru-${g}-${t}`, session: { role: "guru", teacherId: `g_${g}` }, url: "/app/guru.html", full: true,
    act: async (p) => { const n = await p.locator(".portal-tabs__btn").count(); const b = p.locator(`.portal-tabs__btn`, { hasText: new RegExp(t, "i") }); if (await b.count()) await b.first().click(); else return "skip"; await p.waitForTimeout(150); },
  }))),
  { name: "parent-s1", session: { role: "parent", studentId: "s1" }, url: "/app/parent.html", full: true },
  { name: "parent-s7", session: { role: "parent", studentId: "s7" }, url: "/app/parent.html", full: true },
];

// Runs in the page: collect layout problems.
function audit(mobile) {
  const out = { scrollW: document.documentElement.scrollWidth, innerW: innerWidth, problems: [] };
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
  const desc = (el) => (el.id ? "#" + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : "")) + (el.textContent ? ` "${el.textContent.trim().slice(0, 30)}"` : "");
  const inModal = document.querySelector(".modal-overlay:not([hidden])");
  const scope = inModal || document;
  // elements sticking out past the viewport
  for (const el of scope.querySelectorAll("body *")) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right > innerWidth + 1 && !el.closest(".table-wrap, .register-scroll, .portal-tabs, .sr-only, .torn, .hero__photo")) {
      out.problems.push({ type: "offscreen", el: desc(el), right: Math.round(r.right) });
    }
    const cs = getComputedStyle(el);
    if (cs.textOverflow === "ellipsis" && el.scrollWidth > el.clientWidth + 1) out.problems.push({ type: "truncated", el: desc(el) });
  }
  if (mobile) {
    for (const el of scope.querySelectorAll("input:not([type=checkbox]):not([type=radio]):not([type=hidden]), select, textarea")) {
      if (!vis(el)) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 16) out.problems.push({ type: "input<16px", el: desc(el), fs });
    }
    for (const el of scope.querySelectorAll("button, a[href], select, input, summary, label.checkbox-field")) {
      if (!vis(el) || el.closest(".sr-only") || el.matches("input[type=checkbox]")) continue;
      // inline text links inside paragraphs are exempt (WCAG 2.5.8 inline exception)
      if (el.tagName === "A" && getComputedStyle(el).display === "inline" && el.closest("p")) continue;
      const r = el.getBoundingClientRect();
      if (r.height < 44 || r.width < 44) out.problems.push({ type: "tap<44", el: desc(el), w: Math.round(r.width), h: Math.round(r.height) });
    }
  }
  // dedupe by type+el
  const seen = new Set();
  out.problems = out.problems.filter((p) => { const k = p.type + p.el; if (seen.has(k)) return false; seen.add(k); return true; });
  return out;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: path.join(process.env.LOCALAPPDATA, "ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe") });
  const report = {};
  const consoleErrors = [];
  for (const [w, h, tag] of VIEWPORTS) {
    const mobile = w < 1024 || tag === "land";
    const vpName = tag ? `${w}x${h}-landscape` : `${w}`;
    if (WIDTHS && (tag || !WIDTHS.includes(w))) continue;
    for (const st of STATES) {
      if (FILTER && !FILTER.test(st.name)) continue;
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(`${st.name}@${vpName}: ${m.text()}`); });
      page.on("pageerror", (e) => consoleErrors.push(`${st.name}@${vpName}: PAGEERROR ${e.message}`));
      page.on("dialog", (d) => d.accept());
      try {
        if (st.session) await login(page, st.session);
        await page.goto(BASE + st.url, { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        if (st.act && (await st.act(page)) === "skip") { await ctx.close(); continue; }
        if (st.full) { // trigger lazy images
          await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } scrollTo(0, 0); });
          await page.waitForTimeout(300);
        }
        const a = await page.evaluate(audit, mobile);
        report[`${st.name}@${vpName}`] = a;
        await page.screenshot({ path: path.join(OUT, `${st.name}__${vpName}.png`), fullPage: !!st.full });
      } catch (e) { report[`${st.name}@${vpName}`] = { error: e.message.split("\n")[0] }; }
      await ctx.close();
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, "audit.json"), JSON.stringify({ report, consoleErrors }, null, 1));
  console.log("done", Object.keys(report).length, "states; console errors:", consoleErrors.length);
})();
