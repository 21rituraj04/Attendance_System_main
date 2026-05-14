import { genId, now, auditLog, deviceFingerprint } from "../utils.js";
import {
  getSessions, setSessions,
  getAttendance, setAttendance,
} from "./db.js";
import api from "./api.js";

// ─── SESSION HELPERS ─────────────────────────────────────────────────────

/** Returns sessions that belong to a student's semester + section */
export function getSessionsForStudent(semester, section) {
  return getSessions().filter(
    (s) => String(s.semester) === String(semester) && s.section === section
  );
}

// ─── MARK ATTENDANCE ─────────────────────────────────────────────────────

/**
 * Attempt to mark attendance for a student via PIN or QR.
 * Returns { ok: true, subject } or { ok: false, reason: string }
 */
export async function markAttendance(user, { pin, sessionId, method }) {
  try {
    const res = await api.post('/attendance/mark', {
      user, pin, sessionId, method, fingerprint: deviceFingerprint()
    });
    
    auditLog("MARK_ATTENDANCE", user.name, `${user.enrollment} marked attendance via ${method}`);
    return { ok: true, subject: res.data.subject };
  } catch (error) {
    return { ok: false, reason: error.response?.data?.reason || "An error occurred." };
  }
}

// ─── CSV EXPORT ──────────────────────────────────────────────────────────

export function exportCSV(records) {
  const header = "Name,Enrollment,Subject,Date,Method,Semester,Section";
  const rows = records.map((r) => {
    const date = new Date(r.markedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    return [
      `"${(r.studentName || "").replace(/"/g, '""')}"`,
      r.enrollment,
      `"${(r.subject || "").replace(/"/g, '""')}"`,
      `"${date}"`,
      r.method || "pin",
      r.semester || "",
      r.section || "",
    ].join(",");
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), {
    href: url,
    download: `attendance_${Date.now()}.csv`,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
