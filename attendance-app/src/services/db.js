// Central typed DB accessors — single source of truth
const DB = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

export const getUsers      = () => DB.get("att_users")      || [];
export const getStudents   = () => DB.get("att_students")   || [];
export const getSessions   = () => DB.get("att_sessions")   || [];
export const getAttendance = () => DB.get("att_attendance") || [];
export const getSubjects   = () => DB.get("att_subjects")   || [];
export const getAuditLogs  = () => DB.get("att_audit")      || [];

export const setStudents   = (v) => DB.set("att_students",   v);
export const setSessions   = (v) => DB.set("att_sessions",   v);
export const setAttendance = (v) => DB.set("att_attendance", v);
export const setSubjects   = (v) => DB.set("att_subjects",   v);
export const setAuditLogs  = (v) => DB.set("att_audit",      v);
export const setUsers      = (v) => DB.set("att_users",      v);

export default DB;
