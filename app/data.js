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
  finance: true,
};

// v4 -> v5: fees.ledger entries dropped free-typed `description` for a
// `feeTypeId` (charges) referencing settings.feeTypes, plus an optional
// `note` (both charges and payments) — see getFeeTypeName()/
// feeEntryLabel() below. Bumping the key means any v4 blob in a
// returning browser is simply ignored rather than read and
// misinterpreted (same rationale as the v3->v4 bump above).
const STORAGE_KEY = "maxilmu_demo_state_v5";
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

// Daily attendance status codes — the only four values an
// attendanceLog entry's `status` field can hold. "bersurat" is
// deliberately not teacher-settable (see the Ambil Kehadiran sub-tab
// in admin.html); it is only ever reached by an admin resolving a
// "tidak-hadir" cell in that same page's Rekod & Semakan sub-tab.
const ATTENDANCE_STATUSES = {
  hadir: { label: "Hadir", letter: "H" },
  "tidak-hadir": { label: "Tidak Hadir", letter: "T" },
  lewat: { label: "Lewat", letter: "L" },
  bersurat: { label: "Bersurat", letter: "B" },
};

// Static "today" for this demo build, shared by every /app page that
// needs a default date (attendance entry, hafazan/fee entry) — keeps
// seed data and freshly-added records in the same timeframe. Swap for
// `new Date().toISOString().slice(0,10)` if this ever needs to track
// the real clock.
function todayIso() {
  return "2026-08-01";
}

// Three fixed exam sittings per school year — the whole portal is
// built around exactly these three, never an arbitrary list, per
// how the madrasah actually runs its academic calendar.
const EXAM_PERIODS = [
  { key: "awal", label: "Awal Tahun", short: "Awal" },
  { key: "pertengahan", label: "Pertengahan Tahun", short: "Pertengahan" },
  { key: "akhir", label: "Akhir Tahun", short: "Akhir" },
];

// ── Seed attendance generator ────────────────────────────────────
// Hand-authoring a full school year of daily rows per student isn't
// practical, but a single hardcoded monthly number (the old shape)
// isn't a real migration either. This deterministically fabricates
// one row per school day (Mon-Fri) between start/end, hitting
// approximately targetRate% hadir+lewat vs tidak-hadir, so every
// student ends up with a genuinely daily log whose monthly rollup
// still lands close to that student's original seeded rate. A tiny
// seeded PRNG (not Math.random) keeps the seed byte-for-byte stable
// across reloads and "Reset Data Demo" — same rationale as the
// hand-picked ids everywhere else in this file.
function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// bersuratDates: { "YYYY-MM-DD": "note" } — forced to "bersurat"
// regardless of the random roll, so seed data can guarantee at least
// one real example without leaving it to chance.
function generateAttendanceLog(prefix, start, end, targetRate, seed, bersuratDates) {
  const rand = seededRandom(seed);
  const log = [];
  const endDate = new Date(end + "T00:00:00");
  let n = 0;
  for (let d = new Date(start + "T00:00:00"); d <= endDate; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day === 0 || day === 6) continue; // weekends aren't school days
    // Local Y/M/D, not toISOString() — avoids a UTC-conversion day-shift
    // for timezones behind UTC (see formatDate() above for the same rule).
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    n++;
    let status;
    if (bersuratDates && bersuratDates[iso]) {
      status = "bersurat";
    } else if (rand() < targetRate / 100) {
      status = rand() < 0.08 ? "lewat" : "hadir";
    } else {
      status = "tidak-hadir";
    }
    log.push({ id: `${prefix}_${n}`, date: iso, status, note: status === "bersurat" ? bersuratDates[iso] : "" });
  }
  return log;
}

// ── Seed data — replaced entirely once an admin edits anything;
//    exists only so the demo has something to show on first load ──
function defaultState() {
  return {
    settings: {
      subjects: SITE_CONFIG.subjects.slice(),
      hafazan: { unit: "juz", total: 30 },
      attendance: { target: 90 },
      adminContactNumber: ADMIN_CONTACT_NUMBER,
      // Fee types are admin-managed, referenced by id (never free
      // text) from every charge entry — see settings-feetypes-card in
      // admin.html and getFeeTypeName()/feeEntryLabel() below. These
      // four are just example seed data, not hardcoded categories.
      feeTypes: [
        { id: "ft_bulanan", name: "Yuran Bulanan" },
        { id: "ft_pendaftaran", name: "Yuran Pendaftaran" },
        { id: "ft_asrama", name: "Yuran Asrama" },
        { id: "ft_peperiksaan", name: "Yuran Peperiksaan" },
      ],
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
        // Daily records, Jan-Jul 2026 (same range the old monthly seed
        // covered) at a ~95% target rate, matching this student's
        // original 93-97% monthly spread. Includes this seed's one
        // required "bersurat" example.
        attendanceLog: generateAttendanceLog("a1", "2026-01-05", "2026-07-31", 95, 10501, { "2026-03-11": "Demam" }),
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
        // Deliberately the richest ledger in the seed: one fee type paid
        // off in full (Pendaftaran -> "Selesai" line), one type with one
        // paid month and one still outstanding (Bulanan -> the "· Ogos
        // 2026" breakdown line), and one type never paid at all (Asrama)
        // — so the parent view's breakdown, "Selesai" state, and
        // WhatsApp pre-fill all have something real to show at once.
        fees: { ledger: [
          { id: "f1a", date: "2026-01-08", type: "charge", feeTypeId: "ft_pendaftaran", amount: 100, note: "" },
          { id: "f1b", date: "2026-01-10", type: "payment", amount: 100, note: "" },
          { id: "f1c", date: "2026-06-05", type: "charge", feeTypeId: "ft_bulanan", amount: 50, note: "Jun 2026" },
          { id: "f1d", date: "2026-06-08", type: "payment", amount: 50, note: "" },
          { id: "f1e", date: "2026-07-05", type: "charge", feeTypeId: "ft_bulanan", amount: 50, note: "Julai 2026" },
          { id: "f1f", date: "2026-07-10", type: "payment", amount: 50, note: "" },
          { id: "f1g", date: "2026-07-20", type: "charge", feeTypeId: "ft_asrama", amount: 150, note: "" },
          { id: "f1h", date: "2026-08-01", type: "charge", feeTypeId: "ft_bulanan", amount: 50, note: "Ogos 2026" },
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
        attendanceLog: generateAttendanceLog("a2", "2026-01-05", "2026-07-31", 91, 20502, null),
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
          { id: "f2a", date: "2026-06-05", type: "charge", feeTypeId: "ft_bulanan", amount: 50, note: "Jun 2026" },
          { id: "f2b", date: "2026-07-05", type: "charge", feeTypeId: "ft_bulanan", amount: 50, note: "Julai 2026" },
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
        // Also carries a "bersurat" example, on a different student/month
        // than s1's, so both the parent view and the admin bersurat
        // screen have more than one case to exercise.
        attendanceLog: generateAttendanceLog("a3", "2026-01-05", "2026-07-31", 87, 30503, { "2026-05-20": "Urusan keluarga" }),
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
          { id: "f3a", date: "2026-07-05", type: "charge", feeTypeId: "ft_bulanan", amount: 50, note: "Julai 2026" },
          { id: "f3b", date: "2026-07-15", type: "payment", amount: 30, note: "Bayaran sebahagian" },
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
        attendanceLog: generateAttendanceLog("a4", "2026-01-05", "2026-07-31", 98, 40504, null),
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
        attendanceLog: generateAttendanceLog("a5", "2026-01-05", "2026-07-31", 93, 50505, null),
        hafazanLog: [
          { id: "h5a", date: "2026-01-26", amount: 0.5, note: "" },
          { id: "h5b", date: "2026-03-02", amount: 0.5, note: "" },
          { id: "h5c", date: "2026-04-06", amount: 1, note: "Juz 2 selesai" },
          { id: "h5d", date: "2026-05-11", amount: 1, note: "" },
          { id: "h5e", date: "2026-06-15", amount: 1, note: "" },
          { id: "h5f", date: "2026-07-20", amount: 1.5, note: "Juz 6 selesai" },
        ],
        fees: { ledger: [
          { id: "f5a", date: "2026-07-05", type: "charge", feeTypeId: "ft_bulanan", amount: 50, note: "Julai 2026" },
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
        attendanceLog: generateAttendanceLog("a6", "2026-01-05", "2026-07-31", 85, 60506, null),
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
          { id: "f6a", date: "2026-06-05", type: "charge", feeTypeId: "ft_bulanan", amount: 50, note: "Jun 2026" },
          { id: "f6b", date: "2026-06-20", type: "payment", amount: 50, note: "" },
          { id: "f6c", date: "2026-07-05", type: "charge", feeTypeId: "ft_bulanan", amount: 50, note: "Julai 2026" },
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
    && Array.isArray(parsed.settings.feeTypes)
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

// Falls back gracefully for a charge whose feeType was since removed
// from settings.feeTypes (see removeFeeType() in admin.html) — the
// historical ledger entry is never deleted, just no longer resolvable
// to a live name.
function getFeeTypeName(state, feeTypeId) {
  const ft = state.settings.feeTypes.find((f) => f.id === feeTypeId);
  return ft ? ft.name : "Yuran (jenis dipadam)";
}

// The label shown for one ledger row: the fee type for a charge (there
// is no free-typed description any more — see the v4->v5 note above),
// "Bayaran Diterima" for a payment, plus the optional note either way.
function feeEntryLabel(state, entry) {
  const base = entry.type === "charge" ? getFeeTypeName(state, entry.feeTypeId) : "Bayaran Diterima";
  return entry.note ? `${base} · ${entry.note}` : base;
}

// Counts students that would keep a charge under `feeTypeId` — used to
// warn an admin before removing it from settings.feeTypes, same
// warn-never-silently-delete rule as countStudentsWithMarkFor() above.
function countStudentsWithChargeFor(state, feeTypeId) {
  return state.students.filter((s) => s.fees.ledger.some((e) => e.type === "charge" && e.feeTypeId === feeTypeId)).length;
}

// Per-fee-type outstanding balance for the parent view (Part 3's
// breakdown). Payments aren't tied to a fee type (a lump sum can cover
// several outstanding items at once — see Part 2), so there's no
// literal "payments for this type" to subtract. Instead this runs one
// FIFO waterfall across ALL of the student's charges in date order —
// the student's total payment pool pays off the oldest charge first,
// then the next, and so on — the same convention a real fee ledger
// uses when a lump sum arrives against multiple unpaid items. This is
// a judgment call: the spec didn't say how to reconcile untyped
// payments against typed charges.
// Returns [{ feeTypeId, name, charged, outstanding, notes: Set }],
// only for fee types this student has at least one charge under —
// a type never charged to them isn't listed at all (not even as
// "Selesai"), since that would misleadingly imply it once applied.
function getFeeBreakdown(state, student) {
  const charges = student.fees.ledger
    .filter((e) => e.type === "charge")
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  let pool = student.fees.ledger
    .filter((e) => e.type === "payment")
    .reduce((sum, e) => sum + e.amount, 0);

  const byType = new Map();
  charges.forEach((c) => {
    const applied = Math.min(pool, c.amount);
    pool -= applied;
    const remaining = Math.round((c.amount - applied) * 100) / 100;
    if (!byType.has(c.feeTypeId)) byType.set(c.feeTypeId, { feeTypeId: c.feeTypeId, charged: 0, outstanding: 0, notes: new Set() });
    const bucket = byType.get(c.feeTypeId);
    bucket.charged = Math.round((bucket.charged + c.amount) * 100) / 100;
    bucket.outstanding = Math.round((bucket.outstanding + remaining) * 100) / 100;
    if (remaining > 0 && c.note) bucket.notes.add(c.note);
  });

  return Array.from(byType.values())
    .map((b) => ({ ...b, name: getFeeTypeName(state, b.feeTypeId) }))
    .sort((a, b) => a.name.localeCompare(b.name));
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
// One row per school day per student now (see ATTENDANCE_STATUSES),
// entered via admin.html's Kehadiran > Ambil Kehadiran sub-tab and
// corrected via its Rekod & Semakan sub-tab.
// Everything month-level (the parent chart/table, the roster column,
// the dashboard tile) is a CALCULATED rollup of those daily rows —
// there is no separate typed-in monthly number to keep in sync.
function sortedAttendanceLog(student, order) {
  const list = student.attendanceLog.slice().sort((a, b) => a.date.localeCompare(b.date));
  return order === "desc" ? list.reverse() : list;
}

function getAttendanceForDate(student, date) {
  return student.attendanceLog.find((e) => e.date === date) || null;
}

// Upserts one day's status for one student. Always used from the two
// admin-facing screens (never a raw push to attendanceLog elsewhere),
// so a re-save of an already-recorded day updates in place instead of
// creating a duplicate row for that date.
function setAttendanceForDate(student, date, status, note) {
  const existing = getAttendanceForDate(student, date);
  if (existing) {
    existing.status = status;
    existing.note = status === "bersurat" ? (note || "") : "";
  } else {
    student.attendanceLog.push({ id: uid("att"), date, status, note: status === "bersurat" ? (note || "") : "" });
  }
}

// Rolls daily rows up into one bucket per calendar month:
//   - "bersurat" is excluded from both present and absent (doesn't
//     count for or against the rate — as if not a school day for
//     that student).
//   - "lewat" counts as present.
//   - "tidak-hadir" is the only status counted against the rate.
// rate is null (not 0) for a month with no countable days, e.g. every
// recorded day that month was "bersurat" — same "don't show a
// misleading 0" rule used by examAverage() above.
function monthlyAttendanceStats(student) {
  const byMonth = new Map();
  sortedAttendanceLog(student, "asc").forEach((entry) => {
    const month = entry.date.slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, { month, present: 0, late: 0, absent: 0, excused: 0 });
    const bucket = byMonth.get(month);
    if (entry.status === "bersurat") bucket.excused++;
    else if (entry.status === "tidak-hadir") bucket.absent++;
    else {
      bucket.present++;
      if (entry.status === "lewat") bucket.late++;
    }
  });
  return Array.from(byMonth.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((b) => {
      const countable = b.present + b.absent;
      return { ...b, rate: countable ? Math.round((b.present / countable) * 100) : null };
    });
}

// Chronological {month, rate, entry} points, months with no countable
// days excluded — the shape both the monthly table and the trend
// chart need. `entry` is the monthly bucket itself (it already
// carries `.month` and `.rate`, so existing callers built for the old
// one-entry-per-month shape don't need to change).
function attendanceRatePoints(student) {
  return monthlyAttendanceStats(student)
    .filter((bucket) => bucket.rate !== null)
    .map((bucket) => ({ month: bucket.month, rate: bucket.rate, entry: bucket }));
}

// Most recent month with a calculable rate, or null if nothing's been
// logged yet — this is what roster/dashboard "current" attendance
// actually means.
function getLatestAttendanceEntry(student) {
  const list = attendanceRatePoints(student);
  return list.length ? list[list.length - 1] : null;
}

function getAttendanceAverage(student) {
  const points = attendanceRatePoints(student);
  if (!points.length) return null;
  return Math.round(points.reduce((sum, p) => sum + p.rate, 0) / points.length);
}

