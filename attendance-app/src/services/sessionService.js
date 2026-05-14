import { genId, genPin, now, auditLog } from "../utils.js";
import { getSessions, setSessions, getSubjects } from "./db.js";
import api from "./api.js";

// ─── CREATE ──────────────────────────────────────────────────────────────

export async function createSession(user, { subject, section, semester, autoExpire, expireMinutes }) {
  const subjects = getSubjects();
  const finalSubject = subject || subjects[0] || "General";

  const pin = genPin();
  const sessionData = {
    pin,
    subject: finalSubject,
    section,
    semester: String(semester),
    status: "active",
    createdBy: user.name,
    autoExpire: Boolean(autoExpire),
    expireMinutes: parseInt(expireMinutes) || 30,
    expireAt: autoExpire
      ? new Date(Date.now() + parseInt(expireMinutes) * 60000).toISOString()
      : null,
  };

  const res = await api.post('/sessions', sessionData);
  auditLog("CREATE_SESSION", user.name, `Session for ${finalSubject} Sem ${semester} Sec ${section}`);
  return res.data;
}

// ─── UPDATE STATUS ───────────────────────────────────────────────────────

export async function updateSessionStatus(id, status, by = "Admin") {
  await api.patch(`/sessions/${id}/status`, { status });
  auditLog("UPDATE_SESSION", by, `Session ${id} → ${status}`);
}

// ─── DELETE ──────────────────────────────────────────────────────────────

export async function deleteSession(id, by = "Admin") {
  await api.delete(`/sessions/${id}`);
  auditLog("DELETE_SESSION", by, `Session ${id} deleted`);
}

// ─── GETTERS ─────────────────────────────────────────────────────────────

export function getActiveSessions() {
  return getSessions().filter((s) => s.status === "active");
}

export function getSessionsForStudent(semester, section) {
  return getSessions().filter(
    (s) => String(s.semester) === String(semester) && s.section === section
  );
}
