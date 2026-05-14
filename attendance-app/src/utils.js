import DB from "./services/db.js";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
export const MASTER_ADMIN_KEY = "ADMIN@2024";
export { DB };

// ─── SEED DATA ───────────────────────────────────────────────────────────────
export const seedData = () => {
  if (!DB.get("att_initialized")) {
    DB.set("att_users", [
      {
        id: "admin1", role: "admin", name: "Dr. Ramesh Kumar",
        email: "admin@college.edu", password: hash("admin123"),
        department: "Computer Science",
      },
    ]);
    DB.set("att_students",   []);
    DB.set("att_sessions",   []);
    DB.set("att_attendance", []);
    DB.set("att_subjects",   [
      "Data Structures", "DBMS", "Operating Systems",
      "Computer Networks", "Web Technologies",
    ]);
    DB.set("att_initialized", true);
  }
};

// ─── CORE UTILS ──────────────────────────────────────────────────────────────
export const genId  = () => Math.random().toString(36).substr(2, 9).toUpperCase();
export const genPin = () => Math.floor(100000 + Math.random() * 900000).toString();
export const genQR  = (sessionId, rotation) => `${sessionId}-R${rotation}`;
export const hash   = (s) => btoa(s + "||att_salt_2024");
export const now    = () => new Date().toISOString();

export const fmt = (iso) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });

// ─── DEVICE FINGERPRINT ──────────────────────────────────────────────────────
export const deviceFingerprint = () => {
  const raw = [
    navigator.userAgent,
    screen.width,
    screen.height,
    screen.colorDepth,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");
  // Simple hash
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0;
  }
  return h.toString(16);
};

// ─── AUDIT LOG ───────────────────────────────────────────────────────────────
export const auditLog = (action, by, details) => {
  const logs = DB.get("att_audit") || [];
  DB.set("att_audit", [
    ...logs,
    { id: genId(), action, by, details, at: now() },
  ]);
};

// ─── STUDENT SESSION FILTER ──────────────────────────────────────────────────
/** Returns only sessions that match a student's semester and section */
export const getStudentSessions = (sessions, student) =>
  sessions.filter(
    (s) =>
      String(s.semester) === String(student.semester) &&
      s.section === student.section
  );

// ─── ACCURATE RATE CALC ──────────────────────────────────────────────────────
/** Calculates attendance % against cohort-specific sessions only */
export const calcAttendanceRate = (attendance, relevantSessions) => {
  if (!relevantSessions.length) return 0;
  const sessionIds = new Set(relevantSessions.map((s) => s.id));
  const attended = attendance.filter((a) => sessionIds.has(a.sessionId)).length;
  return Math.min(Math.round((attended / relevantSessions.length) * 100), 100);
};
