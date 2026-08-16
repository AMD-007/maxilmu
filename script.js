// ============================================================
// REPLACE BEFORE DEMO: real WhatsApp number, digits only,
// country code first (e.g. Malaysia: 601XXXXXXXX).
// This is the madrasah's general public-facing number — every
// wa.me link on this page uses it. There is a SECOND, separate
// placeholder number for parent fee inquiries in app/data.js
// (ADMIN_CONTACT_NUMBER) — replace that one too.
// ============================================================
const WHATSAPP_NUMBER = "60123456789";

const CONTACT = {
  whatsappNumber: WHATSAPP_NUMBER,
};

document.addEventListener("DOMContentLoaded", () => {
  // ── Populate every wa.me link from the single CONTACT source ──
  document.querySelectorAll("[data-wa-link]").forEach((link) => {
    link.href = `https://wa.me/${CONTACT.whatsappNumber}`;
  });

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
