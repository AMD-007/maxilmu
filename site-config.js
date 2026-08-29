// ============================================================
// SITE_CONFIG — everything that changes when this template is
// handed to a different madrasah. Edit values in this file only;
// nothing else in the codebase (index.html, 404.html, app/*.html,
// app/data.js, script.js, styles.css) should need touching for a
// rebrand.
//
// Loaded before every other script on every page (root pages load
// it as "site-config.js", /app pages as "../site-config.js").
// ============================================================
const SITE_CONFIG = {
  name: "Maahad Cahaya Ilmu",
  nameArabic: "معهد نور العلم",
  tagline: "Menghafaz Al-Quran, membina peribadi, menyediakan masa depan.",
  location: "Kuala Terengganu",

  // Public-facing WhatsApp number (every wa.me link on the marketing
  // site) and the separate parent-facing fee-inquiry number used only
  // inside the portal (app/parent.html Yuran section). Digits only,
  // country code first, e.g. Malaysia: 601XXXXXXXX.
  whatsappNumber: "60123456789",
  adminContactNumber: "60123456789",

  // "logo" is the transparent-background mark used everywhere it sits
  // directly on a page background (header, hero, footer, portal
  // headers, login, 404). "logoSocial" is a solid-background version
  // for og:image/twitter:image, since most link-preview scrapers
  // render transparent PNGs on an unpredictable background.
  logo: "logo-transparent.png",
  logoSocial: "logo.png",

  address: {
    line2: "Kuala Terengganu",
    line3: "Terengganu, Malaysia",
    mapQuery: "Kuala Terengganu, Terengganu",
  },

  // Available exam subjects — mirrors the default seed in app/data.js
  // and the "Bab Kedua — Akademik" list on the public site.
  subjects: ["Bahasa Melayu", "Bahasa Inggeris", "Bahasa Arab", "Matematik", "Sains", "Sejarah", "Pendidikan Islam"],

  // Applied as CSS custom properties on :root at load time (see
  // applyThemeColors below) — overrides the fallback values baked
  // into styles.css without editing that file.
  colors: {
    teal: "#1B6B62",
    indigo: "#2A2F5C",
    malachite: "#3D7A5C",
    malachiteInk: "#376E53",
    gold: "#B8934A",
    goldInk: "#816734",
    goldSoft: "#CBAE73",
    parchment: "#F6F0E4",
    parchmentDim: "#EEE4CE",
    parchmentDeep: "#E7DABF",
    ink: "#2B2318",
    inkSoft: "#6B6152",
  },
};

// Resolved from this script's own URL so logo paths work unmodified
// whether the page loaded it as "site-config.js" (site root) or
// "../site-config.js" (/app pages) — must run at top level, not
// inside a function, since document.currentScript is only valid
// during synchronous initial script execution.
const SITE_CONFIG_BASE = document.currentScript.src.replace(/site-config\.js(\?.*)?$/, "");

// Color overrides take effect immediately (not on DOMContentLoaded)
// so there's no flash of the default palette before first paint.
(function applyThemeColors() {
  const root = document.documentElement.style;
  const c = SITE_CONFIG.colors;
  root.setProperty("--teal", c.teal);
  root.setProperty("--indigo", c.indigo);
  root.setProperty("--malachite", c.malachite);
  root.setProperty("--malachite-ink", c.malachiteInk);
  root.setProperty("--gold", c.gold);
  root.setProperty("--gold-ink", c.goldInk);
  root.setProperty("--gold-soft", c.goldSoft);
  root.setProperty("--parchment", c.parchment);
  root.setProperty("--parchment-dim", c.parchmentDim);
  root.setProperty("--parchment-deep", c.parchmentDeep);
  root.setProperty("--ink", c.ink);
  root.setProperty("--ink-soft", c.inkSoft);
})();

// Generic hooks used across all 5 pages:
//   [data-config="dot.path"]      → element.textContent = that value
//   [data-config-alt="dot.path"]  → element.alt = "Lambang " + that value
//   [data-config-logo]            → element.src = SITE_CONFIG_BASE + SITE_CONFIG.logo
// Page-specific composition (titles, meta tags, the contact address
// block, the subject list) is handled in each page's own small
// inline script, right after this file is loaded.
function applySiteConfig() {
  function resolve(path) {
    return path.split(".").reduce((o, k) => (o == null ? o : o[k]), SITE_CONFIG);
  }
  document.querySelectorAll("[data-config]").forEach((el) => {
    const val = resolve(el.getAttribute("data-config"));
    if (val != null) el.textContent = val;
  });
  document.querySelectorAll("[data-config-alt]").forEach((el) => {
    const val = resolve(el.getAttribute("data-config-alt"));
    if (val != null) el.alt = `Lambang ${val}`;
  });
  document.querySelectorAll("[data-config-logo]").forEach((el) => {
    el.src = SITE_CONFIG_BASE + SITE_CONFIG.logo;
  });
}

document.addEventListener("DOMContentLoaded", applySiteConfig);
