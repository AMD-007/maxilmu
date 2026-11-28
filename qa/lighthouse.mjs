// node run.mjs <port> <label>  -> Lighthouse mobile scores per page (logged in where needed)
import lighthouse from "lighthouse";
import puppeteer from "puppeteer-core";
import path from "path";
const [port, label] = process.argv.slice(2);
const BASE = `http://localhost:${port}`;
const PAGES = [
  ["index", "/index.html"],
  ["app/login", "/app/login.html"],
  ["app/admin", "/app/admin.html", { role: "admin" }],
  ["app/guru (Ahmad)", "/app/guru.html", { role: "guru", teacherId: "g_ahmad" }],
  ["app/parent (s7)", "/app/parent.html", { role: "parent", studentId: "s7" }],
];
const chrome = path.join(process.env.LOCALAPPDATA, "ms-playwright/chromium-1228/chrome-win64/chrome.exe");
const out = {};
for (const [name, url, session] of PAGES) {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: true, timeout: 90000, args: ["--no-first-run"] });
  const page = await browser.newPage();
  if (session) {
    await page.goto(BASE + "/app/login.html");
    await page.evaluate((s) => sessionStorage.setItem("maxilmu_demo_session_v1", JSON.stringify(s)), session);
  }
  const r = await lighthouse(BASE + url, { disableStorageReset: true, logLevel: "error", output: "json" }, undefined, page);
  const c = r.lhr.categories;
  out[name] = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.round(v.score * 100)]));
  out[name].CLS = r.lhr.audits["cumulative-layout-shift"].displayValue;
  out[name].LCP = r.lhr.audits["largest-contentful-paint"].displayValue;
  out[name].finalUrl = r.lhr.finalDisplayedUrl.replace(BASE, "");
  out[name].a11yFails = Object.values(r.lhr.audits).filter((a) => a.score === 0 && r.lhr.categories.accessibility.auditRefs.some((x) => x.id === a.id)).map((a) => a.id);
  await browser.close();
}
console.log(label, JSON.stringify(out, null, 1));
