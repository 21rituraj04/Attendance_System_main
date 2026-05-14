import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { genId, now, fmt } from "./utils.js";
import { getSessions, getAttendance, setAttendance, getStudents } from "./services/db.js";
import { exportCSV } from "./services/attendanceService.js";
import { Btn, Input, Select, Card, Badge, Alert, SectionHeader, EmptyState, SkeletonTable, ProgressBar } from "./components.jsx";

const G = { text:"#f1f5f9", text2:"#94a3b8", text3:"#64748b", mono:"'JetBrains Mono',monospace", warning:"#f59e0b", success:"#10b981", danger:"#ef4444" };

// ─── CONFIRM MODAL (portal so position:fixed is never broken by parent transforms) ───────
function ConfirmModal({ open, title, rows, onConfirm, onCancel }) {
  if (!open) return null;
  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeIn 0.18s ease",
    }}>
      <div style={{
        background: "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(10,15,30,0.98))",
        border: "1px solid rgba(239,68,68,0.35)",
        borderRadius: "20px",
        padding: "32px 36px",
        maxWidth: "440px",
        width: "90%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(239,68,68,0.1)",
        animation: "scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <div style={{
          width: "56px", height: "56px",
          background: "rgba(239,68,68,0.12)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: "16px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "26px", marginBottom: "20px",
        }}>🗑️</div>
        <div style={{ fontSize: "18px", fontWeight: 800, color: G.text, marginBottom: "8px" }}>{title}</div>
        <div style={{ fontSize: "13px", color: G.text2, marginBottom: "20px" }}>
          This action <span style={{ color: "#ef4444", fontWeight: 700 }}>cannot be undone</span>. Please review the details below.
        </div>
        <div style={{
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.15)",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "24px",
          display: "flex", flexDirection: "column", gap: "10px",
        }}>
          {rows.map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "12px", color: G.text3, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: "14px", color: G.text, fontWeight: 600, textAlign: "right" }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: G.text2, fontWeight: 600, cursor: "pointer", fontSize: "14px", transition: "all 0.15s" }}
            onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.06)"}
          >Cancel</button>
          <button onClick={onConfirm}
            style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "linear-gradient(135deg, #ef4444, #dc2626)", border: "1px solid rgba(239,68,68,0.4)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px", boxShadow: "0 4px 16px rgba(239,68,68,0.35)", transition: "all 0.15s" }}
            onMouseEnter={e => e.target.style.transform = "scale(1.03)"}
            onMouseLeave={e => e.target.style.transform = "scale(1)"}
          >Yes, Delete</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── ADMIN ATTENDANCE ────────────────────────────────────────────────────────

export function AdminAttendance({ reload, showToast }) {
  const [attendance, setAtt] = useState([]);
  const [sessions, setSess]  = useState([]);
  const [filterSess, setFilterSess] = useState("all");
  const [search, setSearch]  = useState("");
  const [showManual, setShowManual] = useState(false);
  const [mForm, setMForm]    = useState({ enrollment:"", sessionId:"" });
  const [mResult, setMResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmAtt, setConfirmAtt] = useState(null); // { record }

  const load = () => {
    setAtt(getAttendance());
    setSess(getSessions());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = attendance.filter(a =>
    (filterSess === "all" || a.sessionId === filterSess) &&
    (search === "" || a.enrollment?.toLowerCase().includes(search.toLowerCase()) || a.studentName?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = (record) => {
    setConfirmAtt(record);
  };
  const confirmDeleteAtt = () => {
    const updated = getAttendance().filter(a => a.id !== confirmAtt.id);
    setAttendance(updated); setAtt(updated);
    setConfirmAtt(null);
    showToast("Record deleted", "danger"); reload();
  };

  const handleManual = () => {
    const students = getStudents();
    const student  = students.find(s => s.enrollment === mForm.enrollment);
    if (!student)  { setMResult({type:"danger",msg:"Student not found"}); return; }
    const session  = sessions.find(s => s.id === mForm.sessionId);
    if (!session)  { setMResult({type:"danger",msg:"Session not found"}); return; }
    const existing = getAttendance().find(a => a.enrollment === mForm.enrollment && a.sessionId === mForm.sessionId);
    if (existing)  { setMResult({type:"warning",msg:"Attendance already marked for this session"}); return; }
    const record = { id:genId(), sessionId:mForm.sessionId, enrollment:student.enrollment, studentName:student.name, subject:session.subject, markedAt:now(), method:"manual", semester:student.semester, section:student.section };
    const updated = [...getAttendance(), record];
    setAttendance(updated); setAtt(updated);
    setMResult({type:"success",msg:"Attendance marked manually ✅"});
    showToast("Attendance added manually"); reload();
  };

  const handleExport = () => {
    exportCSV(filtered);
    showToast(`Exported ${filtered.length} records`);
  };

  return (
    <div className="anim-fade-up">
      <ConfirmModal
        open={!!confirmAtt}
        title="Delete Attendance Record?"
        rows={confirmAtt ? [
          { label: "Student",    value: confirmAtt.studentName || "—" },
          { label: "Enrollment", value: confirmAtt.enrollment || "—" },
          { label: "Subject",    value: confirmAtt.subject || "—" },
          { label: "Sem / Sec",  value: `Sem ${confirmAtt.semester} · ${confirmAtt.section}` },
          { label: "Marked At",  value: fmt(confirmAtt.markedAt) },
          { label: "Method",     value: confirmAtt.method || "pin" },
        ] : []}
        onConfirm={confirmDeleteAtt}
        onCancel={() => setConfirmAtt(null)}
      />
      <SectionHeader title="Attendance Records" subtitle={`${attendance.length} total records`}
        action={
          <div style={{ display:"flex", gap:"10px" }}>
            <Btn variant="success" size="sm" onClick={handleExport} icon="📥">Export CSV</Btn>
            <Btn onClick={() => setShowManual(v => !v)} icon="✏️">Manual Entry</Btn>
          </div>
        }
      />

      {showManual && (
        <Card style={{ marginBottom:"20px", border:"1px solid rgba(99,102,241,0.25)" }}>
          <p style={{ fontWeight:700, fontSize:"15px", marginBottom:"16px", color:G.text }}>Manual Attendance Entry</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <Input label="Enrollment Number" value={mForm.enrollment} onChange={v => setMForm(p => ({...p, enrollment:v}))} placeholder="CS2021001" />
            <Select label="Session" value={mForm.sessionId} onChange={v => setMForm(p => ({...p, sessionId:v}))}
              options={[{value:"",label:"Select session…"}, ...sessions.map(s => ({value:s.id,label:`${s.subject} — ${s.pin} (Sem ${s.semester} Sec ${s.section})`}))]} />
          </div>
          {mResult && <Alert type={mResult.type} onClose={() => setMResult(null)}>{mResult.msg}</Alert>}
          <div style={{ display:"flex", gap:"10px" }}>
            <Btn onClick={handleManual} icon="✅">Add Attendance</Btn>
            <Btn variant="ghost" onClick={() => { setShowManual(false); setMResult(null); }}>Close</Btn>
          </div>
        </Card>
      )}

      <div style={{ display:"flex", gap:"12px", marginBottom:"16px" }}>
        <Select value={filterSess} onChange={setFilterSess} style={{ marginBottom:0, flex:1 }}
          options={[{value:"all",label:"All Sessions"}, ...sessions.map(s => ({value:s.id,label:`${s.subject} — ${s.pin}`}))]} />
        <Input value={search} onChange={setSearch} placeholder="Search by name or enrollment…" icon="🔍" style={{ marginBottom:0, flex:2 }} />
      </div>

      <Card style={{ padding:0, overflow:"hidden" }}>
        {loading ? <SkeletonTable rows={5} cols={5} /> : (
          <table className="glass-table">
            <thead>
              <tr>{["Student","Enrollment","Subject","Sem / Sec","Marked At","Method","Action"].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={7}><EmptyState icon="✅" message="No records found" sub="Try adjusting your filters" /></td></tr>
                : filtered.slice(0,100).map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight:600, color:G.text }}>{a.studentName}</td>
                    <td style={{ fontFamily:G.mono, fontSize:"13px", color:"#a5b4fc" }}>{a.enrollment}</td>
                    <td style={{ color:G.text2 }}>{a.subject}</td>
                    <td style={{ color:G.text2, fontSize:"12px" }}>Sem {a.semester} · {a.section}</td>
                    <td style={{ fontSize:"12px", color:G.text3 }}>{fmt(a.markedAt)}</td>
                    <td><Badge color={a.method==="manual"?"warning":a.method==="qr"?"accent":"success"}>{a.method||"pin"}</Badge></td>
                    <td><Btn size="sm" variant="danger" onClick={() => handleDelete(a)} icon="🗑️" /></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ─── ADMIN STUDENTS ──────────────────────────────────────────────────────────
export function AdminStudents({ reload, showToast }) {
  const [students, setStuds] = useState([]);
  const [sessions, setSess]  = useState([]);
  const [attendance, setAtt] = useState([]);
  const [search, setSearch]  = useState("");
  const [semFilter, setSemFilter] = useState("all");
  const [secFilter, setSecFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = () => {
    // Pull students from API-synced localStorage
    const studs = getStudents();
    setStuds(studs);
    setSess(getSessions());
    setAtt(getAttendance());
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Re-load when sync updates localStorage
    const handler = () => load();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const [confirmStu, setConfirmStu] = useState(null); // { student }

  const handleDelete = (student) => {
    setConfirmStu(student);
  };
  const confirmDeleteStu = async () => {
    const student = confirmStu;
    setConfirmStu(null);
    try {
      const api = (await import("./services/api.js")).default;
      await api.delete(`/auth/students/${student.id || student._id}`);
      showToast("Student removed", "danger");
      reload();
    } catch (err) {
      showToast("Failed to delete: " + (err.response?.data?.msg || err.message), "danger");
    }
  };

  // Calculate attendance rate for a student
  const getRate = (enrollment, semester, section) => {
    const cohortSessions = sessions.filter(s =>
      String(s.semester) === String(semester) && s.section === section
    );
    if (cohortSessions.length === 0) return 0;
    const attended = attendance.filter(a =>
      a.enrollment === enrollment && cohortSessions.some(s => (s.id || s._id) === (a.sessionId))
    );
    return Math.min(Math.round((attended.length / cohortSessions.length) * 100), 100);
  };

  const filtered = students.filter(s =>
    (semFilter === "all" || s.semester === semFilter) &&
    (secFilter === "all" || s.section  === secFilter) &&
    (s.name?.toLowerCase().includes(search.toLowerCase()) || s.enrollment?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="anim-fade-up">
      <ConfirmModal
        open={!!confirmStu}
        title="Remove Student?"
        rows={confirmStu ? [
          { label: "Name",       value: confirmStu.name || "—" },
          { label: "Enrollment", value: confirmStu.enrollment || "—" },
          { label: "Email",      value: confirmStu.email || "—" },
          { label: "Semester",   value: `Sem ${confirmStu.semester}` },
          { label: "Section",    value: confirmStu.section || "—" },
        ] : []}
        onConfirm={confirmDeleteStu}
        onCancel={() => setConfirmStu(null)}
      />
      <SectionHeader title={`Students (${students.length})`} subtitle="All registered students" />
      <div style={{ display:"flex", gap:"12px", marginBottom:"16px", flexWrap:"wrap" }}>
        <Input value={search} onChange={setSearch} placeholder="Search name or enrollment…" icon="🔍" style={{ marginBottom:0, flex:2, minWidth:"180px" }} />
        <Select value={semFilter} onChange={setSemFilter} style={{ marginBottom:0 }}
          options={[{value:"all",label:"All Sems"}, ...["1","2","3","4","5","6","7","8"].map(v => ({value:v,label:`Sem ${v}`}))]} />
        <Select value={secFilter} onChange={setSecFilter} style={{ marginBottom:0 }}
          options={[{value:"all",label:"All Secs"}, ...["A","B","C","D"].map(v => ({value:v,label:`Sec ${v}`}))]} />
      </div>
      <Card style={{ padding:0, overflow:"hidden" }}>
        {loading ? <SkeletonTable rows={8} cols={7} /> : (
          <table className="glass-table">
            <thead>
              <tr>{["Name","Enrollment","Email","Sem","Section","Attendance","Action"].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={7}><EmptyState icon="👥" message="No students found" sub="Try adjusting your filters" /></td></tr>
                : filtered.map(s => {
                  const rate = getRate(s.enrollment, s.semester, s.section);
                  return (
                    <tr key={s.id || s._id}>
                      <td style={{ fontWeight:600, color:G.text }}>{s.name}</td>
                      <td style={{ fontFamily:G.mono, fontSize:"13px", color:"#a5b4fc" }}>{s.enrollment}</td>
                      <td style={{ color:G.text3, fontSize:"13px" }}>{s.email}</td>
                      <td style={{ color:G.text2 }}>Sem {s.semester}</td>
                      <td style={{ color:G.text2 }}>{s.section}</td>
                      <td style={{ minWidth:"120px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                          <div style={{ flex:1 }}><ProgressBar value={rate} max={100} /></div>
                          <span style={{ fontSize:"12px", fontWeight:700, color: rate >= 75 ? G.success : rate > 0 ? G.danger : G.text3, width:"36px", textAlign:"right" }}>{rate}%</span>
                        </div>
                      </td>
                      <td><Btn size="sm" variant="danger" onClick={() => handleDelete(s)} icon="🗑️" /></td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ─── ADMIN SUBJECTS ──────────────────────────────────────────────────────────
export function AdminSubjects({ reload, showToast }) {
  const [subjects,   setSubjs]    = useState([]);
  const [loading,    setLoading]  = useState(true);
  const [newName,    setNewName]  = useState("");
  const [newSem,     setNewSem]   = useState("");
  const [filterSem,  setFilterSem] = useState("all");
  const [confirmSub, setConfirmSub] = useState(null);
  const [adding,     setAdding]   = useState(false);

  const loadSubjects = () => {
    const full = JSON.parse(localStorage.getItem("att_subjects_full") || "[]");
    setSubjs(full);
    setLoading(false);
  };

  useEffect(() => {
    loadSubjects();
    const handler = () => loadSubjects();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) { showToast("Enter a subject name", "danger"); return; }
    setAdding(true);
    try {
      const api = (await import("./services/api.js")).default;
      await api.post("/subjects", { name: newName.trim(), semester: newSem });
      setNewName(""); setNewSem("");
      showToast("Subject added ✅");
      reload();
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to add subject", "danger");
    } finally { setAdding(false); }
  };

  const handleRemove = (sub) => {
    const active = getSessions().find(se => se.subject === sub.name && se.status === "active");
    if (active) { showToast("Cannot delete — subject has an active session", "danger"); return; }
    setConfirmSub(sub);
  };

  const confirmRemove = async () => {
    const sub = confirmSub;
    setConfirmSub(null);
    try {
      const api = (await import("./services/api.js")).default;
      await api.delete(`/subjects/${sub._id || sub.id}`);
      showToast("Subject removed", "danger");
      reload();
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to delete", "danger");
    }
  };

  const semOpts = [
    { value: "", label: "All Semesters (global)" },
    ...[1,2,3,4,5,6,7,8].map(v => ({ value: String(v), label: `Semester ${v}` })),
  ];

  const displayed = filterSem === "all"
    ? subjects
    : subjects.filter(s => s.semester === filterSem || s.semester === "");

  return (
    <div className="anim-fade-up">
      <ConfirmModal
        open={!!confirmSub}
        title="Delete Subject?"
        rows={confirmSub ? [
          { label: "Subject",  value: confirmSub.name },
          { label: "Semester", value: confirmSub.semester ? `Semester ${confirmSub.semester}` : "All Semesters" },
        ] : []}
        onConfirm={confirmRemove}
        onCancel={() => setConfirmSub(null)}
      />

      <SectionHeader title="Subjects / Courses" subtitle="Subjects are saved to the database — they never disappear on reload" />

      {/* Add form */}
      <Card style={{ marginBottom:"24px", border:"1px solid rgba(99,102,241,0.2)" }}>
        <p style={{ fontWeight:700, marginBottom:"16px", color:G.text, fontSize:"15px" }}>Add New Subject</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto", gap:"10px", alignItems:"flex-end" }}>
          <Input
            value={newName} onChange={setNewName}
            placeholder="e.g. Data Structures, Operating Systems…"
            style={{ marginBottom:0 }}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
          />
          <Select
            value={newSem} onChange={setNewSem}
            options={semOpts}
            style={{ marginBottom:0, minWidth:"190px" }}
          />
          <Btn onClick={handleAdd} icon="➕" loading={adding} style={{ height:"44px" }}>Add Subject</Btn>
        </div>
        <p style={{ fontSize:"12px", color:G.text3, marginTop:"10px" }}>
          💡 "All Semesters" makes the subject available across every class.
        </p>
      </Card>

      {/* Semester filter tabs */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"20px", flexWrap:"wrap" }}>
        {["all","1","2","3","4","5","6","7","8"].map(v => (
          <button key={v} onClick={() => setFilterSem(v)} style={{
            padding:"6px 16px", borderRadius:"20px", fontSize:"13px", fontWeight:600, cursor:"pointer",
            border: filterSem === v ? "1px solid rgba(99,102,241,0.6)" : "1px solid rgba(255,255,255,0.08)",
            background: filterSem === v ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
            color: filterSem === v ? "#a5b4fc" : G.text2,
            transition:"all 0.15s",
          }}>
            {v === "all" ? "All" : `Sem ${v}`}
          </button>
        ))}
      </div>

      {/* Subject cards */}
      {loading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:"12px" }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:"76px", borderRadius:"16px" }} />)}
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState icon="📚" message="No subjects found"
          sub={subjects.length === 0 ? "Add your first subject above — it will be saved permanently" : "No subjects match this semester filter"} />
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:"12px" }}>
          {displayed.map(s => {
            const activeSess = getSessions().filter(se => se.subject === s.name && se.status === "active").length;
            return (
              <Card key={s._id || s.id} hover style={{ display:"flex", alignItems:"center", padding:"14px 18px", gap:"12px" }}>
                <div style={{ width:"40px", height:"40px", background:"rgba(99,102,241,0.12)", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", border:"1px solid rgba(99,102,241,0.2)", flexShrink:0 }}>📚</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:"14px", color:G.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.name}</div>
                  <div style={{ fontSize:"11px", marginTop:"3px", color: s.semester ? "#a5b4fc" : G.text3 }}>
                    {s.semester ? `Semester ${s.semester}` : "All Semesters"}
                    {activeSess > 0 && <span style={{ marginLeft:"6px", color:G.success }}>🟢 Live</span>}
                  </div>
                </div>
                <Btn size="xs" variant="danger" onClick={() => handleRemove(s)} icon="🗑️" />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN AUDIT ─────────────────────────────────────────────────────────────
export function AdminAudit() {
  const logs = [...(JSON.parse(localStorage.getItem("att_audit")||"[]"))].sort((a,b)=>new Date(b.at)-new Date(a.at));
  return (
    <div className="anim-fade-up">
      <SectionHeader title="Audit Log" subtitle={`${logs.length} recorded actions`} />
      <Card style={{ padding:0, overflow:"hidden" }}>
        <table className="glass-table">
          <thead>
            <tr>{["Action","Performed By","Details","Timestamp"].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {logs.length === 0
              ? <tr><td colSpan={4}><EmptyState icon="🔍" message="No audit logs yet" /></td></tr>
              : logs.map(l => (
                <tr key={l.id}>
                  <td><Badge color="primary">{l.action}</Badge></td>
                  <td style={{ fontWeight:600, color:G.text }}>{l.by}</td>
                  <td style={{ color:G.text3, fontSize:"13px" }}>{l.details}</td>
                  <td style={{ fontSize:"12px", color:G.text3 }}>{fmt(l.at)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </Card>
    </div>
  );
}
