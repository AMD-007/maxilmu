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

const STORAGE_KEY = "maxilmu_demo_state_v3";
const SESSION_KEY = "maxilmu_demo_session_v1";

// Admin fee-inquiry contact number — deliberately separate from the
// public site's general WhatsApp number (SITE_CONFIG.whatsappNumber,
// used in script.js). Both live in SITE_CONFIG (site-config.js,
// loaded before this file) — see defaultState() below, where this
// seeds settings.adminContactNumber.
const ADMIN_CONTACT_NUMBER = SITE_CONFIG.adminContactNumber;

const HAFAZAN_UNIT_LABELS = {
  juz: { singular: "Juzuk", plural: "Juzuk" },
  surah: { singular: "Surah", plural: "Surah" },
  hizb: { singular: "Hizb", plural: "Hizb" },
};

const MALAY_MONTHS = ["Januari","Februari","Mac","April","Mei","Jun","Julai","Ogos","September","Oktober","November","Disember"];

// Three fixed exam sittings per school year — the whole portal is
// built around exactly these three, never an arbitrary list, per
// how the madrasah actually runs its academic calendar.
const EXAM_PERIODS = [
  { key: "awal", label: "Awal Tahun", short: "Awal" },
  { key: "pertengahan", label: "Pertengahan Tahun", short: "Pertengahan" },
  { key: "akhir", label: "Akhir Tahun", short: "Akhir" },
];

// ── Seed data — replaced entirely once an admin edits anything;
//    exists only so the demo has something to show on first load ──
function defaultState() {
  return {
    settings: {
      subjects: SITE_CONFIG.subjects.slice(),
      hafazan: { unit: "juz", total: 30 },
      attendance: { target: 90 },
      adminContactNumber: ADMIN_CONTACT_NUMBER,
    },
    students: [
      {
        id: "s1",
        name: "Ahmad Danish bin Rosli",
        className: "Tahfiz 3",
        parentName: "Rosli bin Ahmad",
        parentPhone: "60191234561",
        // As of "today" (1 Ogos 2026) Akhir Tahun hasn't happened yet —
        // an exam period with no marks entered renders as "—", not 0.
        exams: {
          awal: { "Bahasa Melayu": 70, "Bahasa Inggeris": 58, "Bahasa Arab": 68, "Matematik": 52, "Sains": 50, "Sejarah": 62, "Pendidikan Islam": 78 },
          pertengahan: { "Bahasa Melayu": 78, "Bahasa Inggeris": 65, "Bahasa Arab": 74, "Matematik": 60, "Sains": 58, "Sejarah": 70, "Pendidikan Islam": 85 },
          akhir: {},
        },
        attendanceLog: [
          { id: "a1a", month: "2026-01", rate: 94 },
          { id: "a1b", month: "2026-02", rate: 95 },
          { id: "a1c", month: "2026-03", rate: 93 },
          { id: "a1d", month: "2026-04", rate: 97 },
          { id: "a1e", month: "2026-05", rate: 96 },
          { id: "a1f", month: "2026-06", rate: 95 },
          { id: "a1g", month: "2026-07", rate: 96 },
        ],
        hafazanLog: [
          { id: "h1a", date: "2026-01-12", amount: 0.5, note: "Juz 1, m/s 1-10" },
          { id: "h1b", date: "2026-01-26", amount: 0.5, note: "Juz 1, m/s 11-20" },
          { id: "h1c", date: "2026-02-09", amount: 0.5, note: "" },
          { id: "h1d", date: "2026-02-23", amount: 0.5, note: "" },
          { id: "h1e", date: "2026-03-09", amount: 1, note: "Juz 3 selesai" },
          { id: "h1f", date: "2026-03-23", amount: 0.5, note: "" },
          { id: "h1g", date: "2026-04-13", amount: 0.5, note: "" },
          { id: "h1h", date: "2026-04-27", amount: 1, note: "Juz 5 selesai" },
          { id: "h1i", date: "2026-05-11", amount: 0.5, note: "" },
          { id: "h1j", date: "2026-05-25", amount: 0.5, note: "Rehat pertengahan penggal" },
          { id: "h1k", date: "2026-06-15", amount: 1, note: "Juz 7 selesai" },
          { id: "h1l", date: "2026-06-29", amount: 0.5, note: "" },
          { id: "h1m", date: "2026-07-13", amount: 1, note: "" },
          { id: "h1n", date: "2026-07-27", amount: 1.5, note: "Juz 9-10 selesai" },
        ],
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
        exams: {
          awal: { "Bahasa Melayu": 76, "Bahasa Inggeris": 64, "Bahasa Arab": 60, "Matematik": 68, "Sains": 62, "Sejarah": 71, "Pendidikan Islam": 83 },
          pertengahan: { "Bahasa Melayu": 82, "Bahasa Inggeris": 71, "Bahasa Arab": 66, "Matematik": 74, "Sains": 69, "Sejarah": 77, "Pendidikan Islam": 88 },
          akhir: {},
        },
        attendanceLog: [
          { id: "a2a", month: "2026-01", rate: 89 },
          { id: "a2b", month: "2026-02", rate: 90 },
          { id: "a2c", month: "2026-03", rate: 92 },
          { id: "a2d", month: "2026-04", rate: 91 },
          { id: "a2e", month: "2026-05", rate: 90 },
          { id: "a2f", month: "2026-06", rate: 93 },
          { id: "a2g", month: "2026-07", rate: 91 },
        ],
        hafazanLog: [
          { id: "h2a", date: "2026-01-19", amount: 0.5, note: "" },
          { id: "h2b", date: "2026-02-02", amount: 0.5, note: "" },
          { id: "h2c", date: "2026-02-16", amount: 0.5, note: "" },
          { id: "h2d", date: "2026-03-02", amount: 0.5, note: "Juz 2 selesai" },
          { id: "h2e", date: "2026-03-30", amount: 1, note: "" },
          { id: "h2f", date: "2026-04-20", amount: 0.5, note: "" },
          { id: "h2g", date: "2026-05-18", amount: 0.5, note: "" },
          { id: "h2h", date: "2026-06-08", amount: 0.5, note: "" },
          { id: "h2i", date: "2026-06-22", amount: 1, note: "Juz 5 selesai" },
          { id: "h2j", date: "2026-07-20", amount: 1, note: "" },
          { id: "h2k", date: "2026-08-03", amount: 0.5, note: "" },
        ],
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
        exams: {
          awal: { "Bahasa Melayu": 53, "Bahasa Inggeris": 49, "Bahasa Arab": 66, "Matematik": 41, "Sains": 45, "Sejarah": 57, "Pendidikan Islam": 69 },
          pertengahan: { "Bahasa Melayu": 60, "Bahasa Inggeris": 55, "Bahasa Arab": 72, "Matematik": 48, "Sains": 52, "Sejarah": 63, "Pendidikan Islam": 75 },
          akhir: {},
        },
        attendanceLog: [
          { id: "a3a", month: "2026-01", rate: 85 },
          { id: "a3b", month: "2026-02", rate: 87 },
          { id: "a3c", month: "2026-03", rate: 86 },
          { id: "a3d", month: "2026-04", rate: 90 },
          { id: "a3e", month: "2026-05", rate: 89 },
          { id: "a3f", month: "2026-06", rate: 87 },
          { id: "a3g", month: "2026-07", rate: 88 },
        ],
        hafazanLog: [
          { id: "h3a", date: "2026-01-12", amount: 1, note: "" },
          { id: "h3b", date: "2026-02-02", amount: 1, note: "Juz 2 selesai" },
          { id: "h3c", date: "2026-02-23", amount: 0.5, note: "" },
          { id: "h3d", date: "2026-03-16", amount: 1, note: "" },
          { id: "h3e", date: "2026-04-06", amount: 1, note: "Juz 5 selesai" },
          { id: "h3f", date: "2026-04-27", amount: 1, note: "" },
          { id: "h3g", date: "2026-05-18", amount: 1.5, note: "Juz 7-8 selesai" },
          { id: "h3h", date: "2026-06-15", amount: 1, note: "" },
          { id: "h3i", date: "2026-07-06", amount: 1, note: "" },
          { id: "h3j", date: "2026-07-27", amount: 1, note: "Juz 11 selesai" },
        ],
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
        exams: {
          awal: { "Bahasa Melayu": 85, "Bahasa Inggeris": 79, "Bahasa Arab": 75, "Matematik": 82, "Sains": 80, "Sejarah": 77, "Pendidikan Islam": 88 },
          pertengahan: { "Bahasa Melayu": 90, "Bahasa Inggeris": 84, "Bahasa Arab": 80, "Matematik": 88, "Sains": 85, "Sejarah": 82, "Pendidikan Islam": 92 },
          akhir: {},
        },
        attendanceLog: [
          { id: "a4a", month: "2026-01", rate: 97 },
          { id: "a4b", month: "2026-02", rate: 99 },
          { id: "a4c", month: "2026-03", rate: 98 },
          { id: "a4d", month: "2026-04", rate: 97 },
          { id: "a4e", month: "2026-05", rate: 99 },
          { id: "a4f", month: "2026-06", rate: 98 },
          { id: "a4g", month: "2026-07", rate: 98 },
        ],
        hafazanLog: [
          { id: "h4a", date: "2026-02-02", amount: 0.5, note: "" },
          { id: "h4b", date: "2026-02-23", amount: 0.5, note: "" },
          { id: "h4c", date: "2026-03-16", amount: 0.5, note: "" },
          { id: "h4d", date: "2026-04-13", amount: 0.5, note: "Juz 2 selesai" },
          { id: "h4e", date: "2026-05-11", amount: 0.5, note: "" },
          { id: "h4f", date: "2026-06-08", amount: 0.5, note: "" },
          { id: "h4g", date: "2026-07-13", amount: 0.5, note: "" },
          { id: "h4h", date: "2026-08-03", amount: 0.5, note: "Juz 4 selesai" },
        ],
        fees: { ledger: [] },
      },
      {
        id: "s5",
        name: "Amirul Hakim bin Zainal",
        className: "Tahfiz 1",
        parentName: "Zainal bin Kassim",
        parentPhone: "60191234565",
        exams: {
          awal: { "Bahasa Melayu": 65, "Bahasa Inggeris": 57, "Bahasa Arab": 63, "Matematik": 53, "Sains": 55, "Sejarah": 60, "Pendidikan Islam": 72 },
          pertengahan: { "Bahasa Melayu": 70, "Bahasa Inggeris": 62, "Bahasa Arab": 68, "Matematik": 58, "Sains": 60, "Sejarah": 65, "Pendidikan Islam": 77 },
          akhir: {},
        },
        attendanceLog: [
          { id: "a5a", month: "2026-01", rate: 90 },
          { id: "a5b", month: "2026-02", rate: 92 },
          { id: "a5c", month: "2026-03", rate: 94 },
          { id: "a5d", month: "2026-04", rate: 91 },
          { id: "a5e", month: "2026-05", rate: 93 },
          { id: "a5f", month: "2026-06", rate: 95 },
          { id: "a5g", month: "2026-07", rate: 93 },
        ],
        hafazanLog: [
          { id: "h5a", date: "2026-01-26", amount: 0.5, note: "" },
          { id: "h5b", date: "2026-03-02", amount: 0.5, note: "" },
          { id: "h5c", date: "2026-04-06", amount: 1, note: "Juz 2 selesai" },
          { id: "h5d", date: "2026-05-11", amount: 1, note: "" },
          { id: "h5e", date: "2026-06-15", amount: 1, note: "" },
          { id: "h5f", date: "2026-07-20", amount: 1.5, note: "Juz 6 selesai" },
        ],
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
        exams: {
          awal: { "Bahasa Melayu": 71, "Bahasa Inggeris": 62, "Bahasa Arab": 67, "Matematik": 61, "Sains": 59, "Sejarah": 64, "Pendidikan Islam": 76 },
          pertengahan: { "Bahasa Melayu": 75, "Bahasa Inggeris": 68, "Bahasa Arab": 71, "Matematik": 66, "Sains": 64, "Sejarah": 69, "Pendidikan Islam": 80 },
          akhir: {},
        },
        attendanceLog: [
          { id: "a6a", month: "2026-01", rate: 82 },
          { id: "a6b", month: "2026-02", rate: 84 },
          { id: "a6c", month: "2026-03", rate: 83 },
          { id: "a6d", month: "2026-04", rate: 86 },
          { id: "a6e", month: "2026-05", rate: 85 },
          { id: "a6f", month: "2026-06", rate: 87 },
          { id: "a6g", month: "2026-07", rate: 85 },
        ],
        hafazanLog: [
          { id: "h6a", date: "2026-01-19", amount: 0.5, note: "" },
          { id: "h6b", date: "2026-02-16", amount: 0.5, note: "" },
          { id: "h6c", date: "2026-03-16", amount: 1, note: "Juz 2 selesai" },
          { id: "h6d", date: "2026-04-20", amount: 1, note: "" },
          { id: "h6e", date: "2026-05-25", amount: 1, note: "" },
          { id: "h6f", date: "2026-06-29", amount: 1.5, note: "Juz 6 selesai" },
          { id: "h6g", date: "2026-07-27", amount: 1.5, note: "" },
        ],
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
    && typeof parsed.settings.hafazan.total === "number"
    && parsed.settings.attendance
    && typeof parsed.settings.attendance.target === "number"
    // v3 shape check: students carry exams.{awal,pertengahan,akhir},
    // hafazanLog, and attendanceLog — not the old flat marks/hafazan/
    // attendance fields. A leftover older blob under a different key
    // would fail isValidState anyway (see STORAGE_KEY bump above), but
    // this also guards a hand-edited blob.
    && parsed.students.every((s) => s.exams && Array.isArray(s.hafazanLog) && Array.isArray(s.attendanceLog));
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

function formatDateShort(isoString) {
  const d = new Date(isoString + "T00:00:00");
  if (isNaN(d.getTime())) return isoString;
  return `${String(d.getDate()).padStart(2, "0")} ${MALAY_MONTHS[d.getMonth()].slice(0, 3)}`;
}

// monthStr is "YYYY-MM" (from an <input type="month">), not a full date.
function formatMonth(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  if (!y || !m) return monthStr;
  return `${MALAY_MONTHS[m - 1]} ${y}`;
}

function formatMonthShort(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  if (!y || !m) return monthStr;
  return MALAY_MONTHS[m - 1].slice(0, 3);
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
// Checked across all three exam periods, since a subject can carry
// a mark under any of them independently.
function countStudentsWithMarkFor(state, subject) {
  return state.students.filter((s) =>
    EXAM_PERIODS.some((exam) => Object.prototype.hasOwnProperty.call(s.exams[exam.key], subject))
  ).length;
}

// ── Exam helpers ─────────────────────────────────────────────────
// Average across the active subject list for one exam sitting, or
// null if that sitting has no marks recorded yet (renders as "—",
// never as a misleading 0).
function examAverage(state, student, examKey) {
  const marksForExam = student.exams[examKey] || {};
  const values = state.settings.subjects
    .filter((subj) => Object.prototype.hasOwnProperty.call(marksForExam, subj))
    .map((subj) => marksForExam[subj]);
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

// ── Hafazan helpers ──────────────────────────────────────────────
function sortedHafazanLog(student, order) {
  const list = student.hafazanLog.slice().sort((a, b) => a.date.localeCompare(b.date));
  return order === "desc" ? list.reverse() : list;
}

function getHafazanTotal(student) {
  const total = student.hafazanLog.reduce((sum, entry) => sum + entry.amount, 0);
  return Math.round(total * 100) / 100;
}

// Cumulative running total after each log entry, in chronological
// order — the shape both the weekly table and the progress chart need.
function hafazanCumulativePoints(student) {
  let running = 0;
  return sortedHafazanLog(student, "asc").map((entry) => {
    running += entry.amount;
    return { date: entry.date, cumulative: Math.round(running * 100) / 100, entry };
  });
}

// ── Attendance helpers ────────────────────────────────────────────
// One rate per calendar month, not per day — a real madrasah tracks
// attendance daily, but a year of daily rows isn't something anyone
// reads; the monthly rate is what actually gets reported and acted on.
function sortedAttendanceLog(student, order) {
  const list = student.attendanceLog.slice().sort((a, b) => a.month.localeCompare(b.month));
  return order === "desc" ? list.reverse() : list;
}

// Chronological {month, rate, entry} points — the shape both the
// monthly table and the trend chart need.
function attendanceRatePoints(student) {
  return sortedAttendanceLog(student, "asc").map((entry) => ({ month: entry.month, rate: entry.rate, entry }));
}

// Most recent month on record, or null if nothing's been logged yet —
// this is what roster/dashboard "current" attendance actually means.
function getLatestAttendanceEntry(student) {
  const list = sortedAttendanceLog(student, "desc");
  return list.length ? list[0] : null;
}

function getAttendanceAverage(student) {
  if (!student.attendanceLog.length) return null;
  const total = student.attendanceLog.reduce((sum, entry) => sum + entry.rate, 0);
  return Math.round(total / student.attendanceLog.length);
}
