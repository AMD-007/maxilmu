// WhatsApp number, subject list, address, etc. now live in
// SITE_CONFIG (site-config.js, loaded before this file) — see that
// file to rebrand for a different madrasah. There is a SECOND,
// separate contact number for parent fee inquiries in app/data.js
// (SITE_CONFIG.adminContactNumber), used only inside the portal.
const CONTACT = {
  whatsappNumber: SITE_CONFIG.whatsappNumber,
};

document.addEventListener("DOMContentLoaded", () => {
  // ── Populate every wa.me link from the single CONTACT source ──
  document.querySelectorAll("[data-wa-link]").forEach((link) => {
    link.href = `https://wa.me/${CONTACT.whatsappNumber}`;
  });

  // ── Title/meta tags — the literal text in index.html <head> is the
  //    static fallback for non-JS crawlers; this brings them in line
  //    with SITE_CONFIG for everything else. ──
  document.title = `${SITE_CONFIG.name} — Tahfiz & Akademik, ${SITE_CONFIG.location}`;
  document.querySelector('meta[name="description"]').content =
    `${SITE_CONFIG.name} di ${SITE_CONFIG.location} — pondok tahfiz yang menggabungkan hafazan Al-Quran dengan pendidikan akademik.`;
  document.querySelector('meta[name="theme-color"]').content = SITE_CONFIG.colors.teal;
  document.querySelector('meta[property="og:site_name"]').content = SITE_CONFIG.name;
  document.querySelector('meta[property="og:title"]').content = document.title;
  document.querySelector('meta[property="og:description"]').content =
    `Pondok tahfiz di ${SITE_CONFIG.location} yang menggabungkan hafazan Al-Quran dengan pendidikan akademik — dengan kemajuan anak dihantar terus ke telefon ibu bapa.`;
  document.querySelector('meta[property="og:image"]').content = SITE_CONFIG_BASE + SITE_CONFIG.logoSocial;
  document.querySelector('meta[name="twitter:title"]').content = document.title;
  document.querySelector('meta[name="twitter:description"]').content =
    `Pondok tahfiz di ${SITE_CONFIG.location} yang menggabungkan hafazan Al-Quran dengan pendidikan akademik.`;
  document.querySelector('meta[name="twitter:image"]').content = SITE_CONFIG_BASE + SITE_CONFIG.logoSocial;

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
  const miniHeader = document.querySelector(".mini-header");
  const hero = document.querySelector(".hero");
  if (miniHeader && hero) {
    const io = new IntersectionObserver(([entry]) => {
      miniHeader.classList.toggle("is-visible", !entry.isIntersecting);
    });
    io.observe(hero);
  }

  // ── Contact form hands off to WhatsApp — no backend needed ──
  const form = document.querySelector("#contact-form");
  if (form) {
    const validateField = (field, errorId) => {
      const errorEl = document.getElementById(errorId);
      if (!field.value.trim()) {
        field.setAttribute("aria-invalid", "true");
        if (errorEl) errorEl.textContent = "Sila isi ruangan ini.";
        return false;
      }
      field.setAttribute("aria-invalid", "false");
      if (errorEl) errorEl.textContent = "";
      return true;
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const nameOk = validateField(form.name, "error-name");
      const phoneOk = validateField(form.phone, "error-phone");
      const messageOk = validateField(form.message, "error-message");

      if (!nameOk || !phoneOk || !messageOk) {
        form.querySelector('[aria-invalid="true"]').focus();
        return;
      }

      const name = form.name.value.trim();
      const phone = form.phone.value.trim();
      const message = form.message.value.trim();
      const text = `Assalamualaikum, saya ${name} (${phone}).\n\n${message}`;
      const url = `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener");
    });
  }
});
