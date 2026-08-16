// ============================================================
// MaxIlmu — shared data layer for the demo portal
// (login.html / admin.html / parent.html)
//
// This is a dummy-data demo: there is no backend. Everything a
// "madrasah" would normally store in a database instead lives in
// this browser's localStorage, scoped under STORAGE_KEY. Which
// portal role is currently logged in (admin vs a specific parent)
// lives separately in sessionStorage, which is per-tab by design —
// see getSession()/setSession() below for why that matters.
// ============================================================

// Toggle the whole Yuran (fee) module on/off. Flip this one flag
// to show the finance add-on when pitching it, or hide it — DOM and
// all — for madrasah that haven't taken it up. See admin.html and
// parent.html: the Yuran section is only ever built when this is
// true, never just hidden with CSS.
const FEATURES = {
  finance: false,
};

const STORAGE_KEY = "maxilmu_demo_state_v1";
const SESSION_KEY = "maxilmu_demo_session_v1";

// ============================================================
// REPLACE BEFORE DEMO: real WhatsApp number, digits only,
// country code first (e.g. Malaysia: 601XXXXXXXX).
// This is the number parents reach about their OWN fee balance —
// deliberately separate from the general WhatsApp number in the
// public site's script.js (WHATSAPP_NUMBER). See defaultState()
// below, where this seeds settings.adminContactNumber.
// ============================================================
const ADMIN_CONTACT_NUMBER = "60123456789";

const HAFAZAN_UNIT_LABELS = {
  juz: { singular: "Juzuk", plural: "Juzuk" },
  surah: { singular: "Surah", plural: "Surah" },
  hizb: { singular: "Hizb", plural: "Hizb" },
};

const MALAY_MONTHS = ["Januari","Februari","Mac","April","Mei","Jun","Julai","Ogos","September","Oktober","November","Disember"];

// ── Seed data — replaced entirely once an admin edits anything;
//    exists only so the demo has something to show on first load ──
function defaultState() {
  return {
    settings: {
      subjects: ["Bahasa Melayu", "Bahasa Inggeris", "Bahasa Arab", "Matematik", "Sains", "Sejarah", "Pendidikan Islam"],
      hafazan: { unit: "juz", total: 30 },
      adminContactNumber: ADMIN_CONTACT_NUMBER,
    },
    students: [
      {
        id: "s1",
        name: "Ahmad Danish bin Rosli",
        className: "Tahfiz 3",
        parentName: "Rosli bin Ahmad",
        parentPhone: "60191234561",
        marks: { "Bahasa Melayu": 78, "Bahasa Inggeris": 65, "Bahasa Arab": 74, "Matematik": 60, "Sains": 58, "Sejarah": 70, "Pendidikan Islam": 85 },
        // Last month's marks — used only to show a small progress delta
        // in the parent view (see parent.html). Not a full history log.
        previousMarks: { "Bahasa Melayu": 72, "Bahasa Inggeris": 60, "Bahasa Arab": 70, "Matematik": 55, "Sains": 52, "Sejarah": 65, "Pendidikan Islam": 80 },
        attendance: 96,
        hafazan: 12,
        fees: { ledger: [
          { id: "f1a", date: "2026-06-05", description: "Yuran Bulanan Jun 2026", amount: 50, type: "charge" },
          { id: "f1b", date: "2026-06-08", description: "Bayaran diterima", amount: 50, type: "payment" },
          { id: "f1c", date: "2026-07-05", description: "Yuran Bulanan Julai 2026", amount: 50, type: "charge" },
          { id: "f1d", date: "2026-07-10", description: "Bayaran diterima", amount: 50, type: "payment" },
        ] },
      },
      {
        id: "s2",
        name: "Nur Aisyah binti Zulkifli",
        className: "Tahfiz 2",
        parentName: "Zulkifli bin Hassan",
        parentPhone: "60191234562",
        marks: { "Bahasa Melayu": 82, "Bahasa Inggeris": 71, "Bahasa Arab": 66, "Matematik": 74, "Sains": 69, "Sejarah": 77, "Pendidikan Islam": 88 },
        previousMarks: { "Bahasa Melayu": 76, "Bahasa Inggeris": 64, "Bahasa Arab": 60, "Matematik": 68, "Sains": 62, "Sejarah": 71, "Pendidikan Islam": 83 },
        attendance: 91,
        hafazan: 8,
        fees: { ledger: [
          { id: "f2a", date: "2026-06-05", description: "Yuran Bulanan Jun 2026", amount: 50, type: "charge" },
          { id: "f2b", date: "2026-07-05", description: "Yuran Bulanan Julai 2026", amount: 50, type: "charge" },
        ] },
      },
      {
        id: "s3",
        name: "Muhammad Haziq bin Yusof",
        className: "Tahfiz 3",
        parentName: "Yusof bin Ibrahim",
        parentPhone: "60191234563",
        marks: { "Bahasa Melayu": 60, "Bahasa Inggeris": 55, "Bahasa Arab": 72, "Matematik": 48, "Sains": 52, "Sejarah": 63, "Pendidikan Islam": 75 },
        previousMarks: { "Bahasa Melayu": 53, "Bahasa Inggeris": 49, "Bahasa Arab": 66, "Matematik": 41, "Sains": 45, "Sejarah": 57, "Pendidikan Islam": 69 },
        attendance: 88,
        hafazan: 15,
        fees: { ledger: [
          { id: "f3a", date: "2026-07-05", description: "Yuran Bulanan Julai 2026", amount: 50, type: "charge" },
          { id: "f3b", date: "2026-07-15", description: "Bayaran diterima (sebahagian)", amount: 30, type: "payment" },
        ] },
      },
      {
        id: "s4",
        name: "Siti Maryam binti Ismail",
        className: "Tahfiz 1",
        parentName: "Ismail bin Othman",
        parentPhone: "60191234564",
        marks: { "Bahasa Melayu": 90, "Bahasa Inggeris": 84, "Bahasa Arab": 80, "Matematik": 88, "Sains": 85, "Sejarah": 82, "Pendidikan Islam": 92 },
        attendance: 98,
        hafazan: 4,
        fees: { ledger: [] },
      },
      {
        id: "s5",
        name: "Amirul Hakim bin Zainal",
        className: "Tahfiz 1",
        parentName: "Zainal bin Kassim",
        parentPhone: "60191234565",
        marks: { "Bahasa Melayu": 70, "Bahasa Inggeris": 62, "Bahasa Arab": 68, "Matematik": 58, "Sains": 60, "Sejarah": 65, "Pendidikan Islam": 77 },
        attendance: 93,
        hafazan: 6,
        fees: { ledger: [
          { id: "f5a", date: "2026-07-05", description: "Yuran Bulanan Julai 2026", amount: 50, type: "charge" },
        ] },
      },
      {
        id: "s6",
        name: "Nur Fatihah binti Rahman",
        className: "Tahfiz 2",
        parentName: "Rahman bin Salleh",
        parentPhone: "60191234566",
        marks: { "Bahasa Melayu": 75, "Bahasa Inggeris": 68, "Bahasa Arab": 71, "Matematik": 66, "Sains": 64, "Sejarah": 69, "Pendidikan Islam": 80 },
        attendance: 85,
        hafazan: 10,
        fees: { ledger: [
          { id: "f6a", date: "2026-06-05", description: "Yuran Bulanan Jun 2026", amount: 50, type: "charge" },
          { id: "f6b", date: "2026-06-20", description: "Bayaran diterima", amount: 50, type: "payment" },
          { id: "f6c", date: "2026-07-05", description: "Yuran Bulanan Julai 2026", amount: 50, type: "charge" },
        ] },
      },
    ],
  };
}

// ── localStorage state (per-"madrasah" demo data) ──────────────
function isValidState(parsed) {
  return !!parsed
    && typeof parsed === "object"
    && Array.isArray(parsed.students)
    && parsed.settings
    && Array.isArray(parsed.settings.subjects)
    && parsed.settings.hafazan
    && typeof parsed.settings.hafazan.total === "number";
}

function loadState() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    // localStorage can throw in locked-down/private-mode contexts —
    // fall back to an in-memory default rather than crashing the page.
    console.warn("MaxIlmu: localStorage unavailable, using in-memory demo data.", e);
    return defaultState();
  }

  if (!raw) {
    const fresh = defaultState();
    saveState(fresh);
    return fresh;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!isValidState(parsed)) throw new Error("unexpected shape");
    return parsed;
  } catch (e) {
    console.warn("MaxIlmu: saved demo data was unreadable, resetting to defaults.", e);
    const fresh = defaultState();
    saveState(fresh);
    return fresh;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("MaxIlmu: could not save demo data to localStorage.", e);
  }
}

// Wipes the demo back to its original seed data AND signs out
// whichever role/tab called it, since a parent session can otherwise
// point at a student id that no longer exists post-reset.
function resetDemoData() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  clearSession();
  return loadState();
}

// ── Session (which role is logged in) ───────────────────────────
// Intentionally sessionStorage, NOT localStorage: sessionStorage is
// scoped per browser tab, so an admin logged in on one tab and a
// parent logged in on another never see each other's role. A tab
// duplicated from an existing one inherits its sessionStorage — that
// is normal browser behaviour for every site, not specific to this app.
function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setSession(session) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn("MaxIlmu: could not save session.", e);
  }
}

function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
}

// ── Small shared helpers ─────────────────────────────────────────
function uid(prefix) {
  return prefix + "_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

function getStudent(state, id) {
  return state.students.find((s) => s.id === id) || null;
}

function getStudentBalance(student) {
  return student.fees.ledger.reduce((total, entry) => {
    return total + (entry.type === "charge" ? entry.amount : -entry.amount);
  }, 0);
}

function formatMoney(amount) {
  const sign = amount < 0 ? "-" : "";
  return sign + "RM " + Math.abs(amount).toFixed(2);
}

function formatDate(isoString) {
  const d = new Date(isoString + "T00:00:00");
  if (isNaN(d.getTime())) return isoString;
  return `${String(d.getDate()).padStart(2, "0")} ${MALAY_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function hafazanUnitLabel(unit, count) {
  const entry = HAFAZAN_UNIT_LABELS[unit] || HAFAZAN_UNIT_LABELS.juz;
  return count === 1 ? entry.singular : entry.plural;
}

function getClassList(state) {
  return Array.from(new Set(state.students.map((s) => s.className))).sort();
}

// Counts students that would keep orphaned marks under `subject` —
// used to warn an admin before removing it from settings.subjects,
// per the rule: warn, never silently delete a student's recorded data.
function countStudentsWithMarkFor(state, subject) {
  return state.students.filter((s) => Object.prototype.hasOwnProperty.call(s.marks, subject)).length;
}
