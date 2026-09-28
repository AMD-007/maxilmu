// index.html-specific behaviour. SITE_CONFIG (site-config.js) is
// loaded before this file — see that file to rebrand for a
// different madrasah. The generic [data-config] / [data-config-alt]
// / [data-config-logo] hooks in site-config.js handle simple text/
// alt/logo swaps on their own; this file handles the composition
// that needs more than a straight textContent swap: wa.me links,
// the subject list, the contact address/map, and the page title.
document.addEventListener("DOMContentLoaded", () => {
  document.title = `${SITE_CONFIG.name} — Tahfiz & Akademik, ${SITE_CONFIG.location}`;

  // ── WhatsApp links (mini-header CTA, contact button) ──
  document.querySelectorAll("[data-wa-link]").forEach((link) => {
    link.href = `https://wa.me/${SITE_CONFIG.whatsappNumber}`;
  });

  // ── Subject list ("Bab Kedua — Akademik") ──
  const subjectList = document.getElementById("subject-list");
  if (subjectList) {
    subjectList.innerHTML = "";
    SITE_CONFIG.subjects.forEach((subj) => {
      const li = document.createElement("li");
      li.textContent = subj;
      subjectList.appendChild(li);
    });
  }

  // ── Contact address + map (city-level query, not a pinned address) ──
  const addressEl = document.getElementById("contact-address");
  if (addressEl) {
    const addr = SITE_CONFIG.address;
    addressEl.innerHTML = `${SITE_CONFIG.name}<br>${addr.line2}<br>${addr.line3}`;
    const mapQuery = encodeURIComponent(addr.mapQuery);
    document.getElementById("contact-map-link").href = `https://www.google.com/maps?q=${mapQuery}`;
    const mapFrame = document.getElementById("contact-map-frame");
    mapFrame.src = `https://www.google.com/maps?q=${mapQuery}&z=12&output=embed`;
    mapFrame.title = `Peta kawasan ${addr.mapQuery} (ilustrasi, bukan lokasi sebenar)`;
  }

  // ── Mini header appears once the hero has scrolled past ──
  const miniHeader = document.getElementById("miniHeader");
  const hero = document.querySelector(".hero");
  if (miniHeader && hero) {
    const io = new IntersectionObserver(([entry]) => miniHeader.classList.toggle("is-visible", !entry.isIntersecting));
    io.observe(hero);
  }

  // ── Contact form hands off to WhatsApp — no backend needed ──
  const form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const text = `Assalamualaikum, saya ${d.get("name")} (${d.get("phone")}).\n\n${d.get("message")}`;
      window.open(`https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    });
  }
});
