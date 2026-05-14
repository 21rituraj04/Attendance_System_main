import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getSubjects, getSessions, getStudents, getAttendance } from "./services/db.js";
import { createSession, updateSessionStatus, deleteSession as svcDelete } from "./services/sessionService.js";
import { Btn, Card, Badge, QRDisplay, Select, Input, SectionHeader, EmptyState } from "./components.jsx";

const G = { primary:"#6366f1", success:"#10b981", warning:"#f59e0b", danger:"#ef4444", text:"#f1f5f9", text2:"#94a3b8", text3:"#64748b", mono:"'JetBrains Mono',monospace" };

// ─── CONFIRM MODAL (portal — avoids position:fixed broken by transforms) ─────
function ConfirmModal({ open, title, rows, onConfirm, onCancel }) {
  if (!open) return null;
  return createPortal(
    <div style={{
      position:"fixed", inset:0, zIndex:9000,
      background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      animation:"fadeIn 0.18s ease",
    }}>
      <div style={{
        background:"linear-gradient(145deg,rgba(15,23,42,0.98),rgba(10,15,30,0.98))",
        border:"1px solid rgba(239,68,68,0.35)", borderRadius:"20px",
        padding:"32px 36px", maxWidth:"440px", width:"90%",
        boxShadow:"0 24px 64px rgba(0,0,0,0.7)",
        animation:"scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <div style={{ width:"56px", height:"56px", background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"16px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"26px", marginBottom:"20px" }}>🗑️</div>
        <div style={{ fontSize:"18px", fontWeight:800, color:G.text, marginBottom:"8px" }}>{title}</div>
        <div style={{ fontSize:"13px", color:G.text2, marginBottom:"20px" }}>
          This action <span style={{ color:"#ef4444", fontWeight:700 }}>cannot be undone</span>. Review the details below.
        </div>
        <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:"12px", padding:"16px", marginBottom:"24px", display:"flex", flexDirection:"column", gap:"10px" }}>
          {rows.map(({ label, value }) => (
            <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:"12px" }}>
              <span style={{ fontSize:"12px", color:G.text3, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:700, flexShrink:0 }}>{label}</span>
              <span style={{ fontSize:"14px", color:G.text, fontWeight:600, textAlign:"right" }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:"10px" }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:"10px", borderRadius:"10px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:G.text2, fontWeight:600, cursor:"pointer", fontSize:"14px" }}
            onMouseEnter={e => e.target.style.background="rgba(255,255,255,0.12)"}
            onMouseLeave={e => e.target.style.background="rgba(255,255,255,0.06)"}
          >Cancel</button>
          <button onClick={onConfirm}
            style={{ flex:1, padding:"10px", borderRadius:"10px", background:"linear-gradient(135deg,#ef4444,#dc2626)", border:"1px solid rgba(239,68,68,0.4)", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:"14px", boxShadow:"0 4px 16px rgba(239,68,68,0.35)" }}
            onMouseEnter={e => e.target.style.transform="scale(1.03)"}
            onMouseLeave={e => e.target.style.transform="scale(1)"}
          >Yes, Delete</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Normalize session: always ensure .id === ._id string
function normalizeSession(s) {
  if (!s) return s;
  return { ...s, id: String(s._id || s.id || "") };
}

export default function AdminSessions({ user, reload, showToast }) {
  const [sessions, setSessions]     = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm]             = useState({ subject:"", section:"A", semester:"1", autoExpire:false, expireMinutes:30 });
  const [confirmSess, setConfirmSess] = useState(null); // session to delete
  const [deleting, setDeleting]     = useState(false);

  // subjects from localStorage (synced from backend)
  const subjectsFull = JSON.parse(localStorage.getItem("att_subjects_full") || "[]");
  const subjectNames = subjectsFull.map(s => s.name);
  const subjects     = subjectNames.length ? subjectNames : getSubjects();

  const load = () => setSessions(getSessions().map(normalizeSession));
  useEffect(() => { load(); }, []);

  // ── CREATE ──────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.subject && !subjects.length) { showToast("Add a subject first", "danger"); return; }
    try {
      const session = await createSession(user, { ...form, subject: form.subject || subjects[0] });
      setActiveSession(normalizeSession(session));
      setShowCreate(false);
      showToast("Session created!");
      reload(); // triggers syncData → storage event
    } catch (err) {
      showToast("Failed to create session: " + (err.response?.data?.msg || err.message), "danger");
    }
  };

  // ── STATUS ──────────────────────────────────────────────────────────────
  const handleStatus = async (id, status) => {
    try {
      await updateSessionStatus(id, status, user.name);
      showToast(`Session ${status}`);
      reload();
      // update activeSession locally too
      if (activeSession?.id === id) setActiveSession(s => ({ ...s, status }));
    } catch (err) {
      showToast("Failed: " + (err.response?.data?.msg || err.message), "danger");
    }
  };

  // ── DELETE ──────────────────────────────────────────────────────────────
  const handleDeleteClick = (session) => {
    setConfirmSess(normalizeSession(session));
  };

  const confirmDelete = async () => {
    const sess = confirmSess;
    setConfirmSess(null);
    setDeleting(true);
    try {
      await svcDelete(sess.id, user.name);
      if (activeSession?.id === sess.id) setActiveSession(null);
      showToast("Session deleted", "danger");
      reload(); // re-syncs from backend
    } catch (err) {
      showToast("Delete failed: " + (err.response?.data?.msg || err.message), "danger");
    } finally {
      setDeleting(false);
    }
  };

  // Re-load local list whenever backend syncs
  useEffect(() => {
    const handler = () => setSessions(getSessions().map(normalizeSession));
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const filtered = sessions.filter(s =>
    (statusFilter === "all" || s.status === statusFilter) &&
    (s.subject?.toLowerCase().includes(search.toLowerCase()) || s.pin?.includes(search))
  );

  return (
    <div className="anim-fade-up">
      {/* Delete confirmation modal */}
      <ConfirmModal
        open={!!confirmSess}
        title="Delete Session?"
        rows={confirmSess ? [
          { label: "Subject",  value: confirmSess.subject },
          { label: "PIN",      value: confirmSess.pin },
          { label: "Semester", value: `Sem ${confirmSess.semester}` },
          { label: "Section",  value: confirmSess.section },
          { label: "Status",   value: confirmSess.status },
          { label: "Attended", value: `${confirmSess.attendeeCount || 0} students` },
        ] : []}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmSess(null)}
      />

      <SectionHeader title="Sessions" subtitle="Manage attendance sessions with PIN & QR"
        action={<Btn onClick={() => setShowCreate(v => !v)} icon="➕">New Session</Btn>} />

      {/* Create Form */}
      {showCreate && (
        <Card style={{ marginBottom:"20px", border:"1px solid rgba(99,102,241,0.3)" }}>
          <p style={{ fontWeight:700, fontSize:"15px", marginBottom:"16px", color:G.text }}>Create New Session</p>
          {subjects.length === 0 && (
            <div style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:"8px", padding:"10px 14px", color:"#fcd34d", fontSize:"13px", marginBottom:"16px" }}>
              ⚠ No subjects configured. Go to Subjects tab to add one first.
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px" }}>
            <Select label="Subject"  value={form.subject || subjects[0] || ""} onChange={v => setForm(p => ({...p, subject:v}))}  options={subjects.length ? subjects.map(s => ({ value:s, label:s })) : [{value:"",label:"No subjects"}]} />
            <Select label="Semester" value={form.semester} onChange={v => setForm(p => ({...p, semester:v}))} options={["1","2","3","4","5","6","7","8"].map(v => ({value:v,label:`Sem ${v}`}))} />
            <Select label="Section"  value={form.section}  onChange={v => setForm(p => ({...p, section:v}))}  options={["A","B","C","D"].map(v => ({value:v,label:`Section ${v}`}))} />
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"16px" }}>
            <label style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"14px", fontWeight:600, color:G.text2, cursor:"pointer" }}>
              <input type="checkbox" checked={form.autoExpire} onChange={e => setForm(p => ({...p, autoExpire:e.target.checked}))} />
              Auto-expire after
            </label>
            {form.autoExpire && <Input value={form.expireMinutes} onChange={v => setForm(p => ({...p, expireMinutes:v}))} type="number" style={{ marginBottom:0, width:"90px" }} />}
            {form.autoExpire && <span style={{ fontSize:"13px", color:G.text2 }}>minutes</span>}
          </div>
          <div style={{ display:"flex", gap:"10px" }}>
            <Btn onClick={handleCreate} icon="🚀" disabled={subjects.length === 0}>Generate PIN & QR</Btn>
            <Btn variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Active Session Panel */}
      {activeSession && (
        <Card glow style={{ marginBottom:"20px" }}>
          <div style={{ display:"flex", gap:"28px", alignItems:"flex-start", flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:"260px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
                <h3 style={{ fontWeight:800, fontSize:"18px", color:G.text }}>{activeSession.subject}</h3>
                <Badge color={activeSession.status==="active"?"success":activeSession.status==="locked"?"warning":"gray"}>{activeSession.status}</Badge>
              </div>
              <p style={{ fontSize:"13px", color:G.text2, marginBottom:"20px" }}>Sem {activeSession.semester} • Section {activeSession.section} • {activeSession.attendeeCount || 0} attended</p>
              <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:"14px", padding:"16px 24px", display:"inline-block", marginBottom:"16px", border:"2px dashed rgba(99,102,241,0.35)" }}>
                <div style={{ fontSize:"10px", fontWeight:700, color:G.text2, letterSpacing:"0.1em", marginBottom:"6px" }}>SESSION PIN</div>
                <div style={{ fontFamily:G.mono, fontSize:"40px", fontWeight:900, background:"linear-gradient(135deg,#a5b4fc,#67e8f9)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"0.2em" }}>
                  {activeSession.pin}
                </div>
              </div>
              <p style={{ fontSize:"12px", color:G.text3 }}>Created by {activeSession.createdBy}</p>
              {activeSession.expireAt && <p style={{ fontSize:"12px", color:G.warning, marginTop:"4px" }}>⏰ Expires: {new Date(activeSession.expireAt).toLocaleString("en-IN",{timeStyle:"short",dateStyle:"medium"})}</p>}
              <div style={{ display:"flex", gap:"8px", marginTop:"16px", flexWrap:"wrap" }}>
                {activeSession.status==="active"  && <Btn variant="warning"   size="sm" onClick={() => handleStatus(activeSession.id,"expired")} icon="⛔">Expire</Btn>}
                {activeSession.status==="expired" && <Btn variant="secondary" size="sm" onClick={() => handleStatus(activeSession.id,"active")}  icon="🔄">Reactivate</Btn>}
                {activeSession.status!=="locked"  && <Btn variant="ghost"     size="sm" onClick={() => handleStatus(activeSession.id,"locked")}  icon="🔒">Lock</Btn>}
                {activeSession.status==="locked"  && <Btn variant="secondary" size="sm" onClick={() => handleStatus(activeSession.id,"active")}  icon="🔓">Unlock</Btn>}
                <Btn variant="danger" size="sm" onClick={() => handleDeleteClick(activeSession)} icon="🗑️" loading={deleting}>Delete</Btn>
              </div>

              {/* LIVE ROLL CALL */}
              <div style={{ marginTop:"24px", paddingTop:"20px", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ fontSize:"13px", fontWeight:700, color:G.text, marginBottom:"12px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Live Roll Call Tracker</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", maxHeight:"200px", overflowY:"auto", paddingRight:"8px" }} className="custom-scroll">
                  {(() => {
                    const cohort = getStudents().filter(s => String(s.semester) === String(activeSession.semester) && s.section === activeSession.section);
                    const atts = getAttendance().filter(a => a.sessionId === activeSession.id);
                    if (cohort.length === 0) return <div style={{ color:G.text3, fontSize:"12px" }}>No students in this class.</div>;
                    
                    return cohort.map(student => {
                      const present = atts.some(a => a.enrollment === student.enrollment);
                      return (
                        <div key={student.id || student._id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background: present ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: present ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(239,68,68,0.2)", padding:"8px 12px", borderRadius:"10px" }}>
                          <div>
                            <div style={{ fontSize:"13px", fontWeight:600, color:G.text }}>{student.name}</div>
                            <div style={{ fontSize:"11px", color:G.text3, fontFamily:G.mono }}>{student.enrollment}</div>
                          </div>
                          <Badge color={present ? "success" : "danger"}>{present ? "Present" : "Inactive"}</Badge>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
            {/* QR */}
            <div style={{ textAlign:"center" }}>
              <p style={{ fontSize:"11px", fontWeight:700, color:G.text2, marginBottom:"10px", letterSpacing:"0.06em" }}>SESSION QR CODE</p>
              <div style={{ position:"relative", display:"inline-block" }}>
                <div className="qr-live-border anim-glow" style={{ borderRadius:"18px", padding:"3px", display:"inline-block" }}>
                  <QRDisplay value={`ATTENDX:${activeSession.pin}`} size={150} />
                </div>
                {activeSession.status==="active" && (
                  <div style={{ position:"absolute", bottom:"-4px", left:"50%", transform:"translateX(-50%)", whiteSpace:"nowrap" }}>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", fontSize:"11px", color:G.success, fontWeight:700, background:"rgba(16,185,129,0.15)", border:"1px solid rgba(16,185,129,0.3)", borderRadius:"20px", padding:"3px 10px" }}>
                      <span style={{ width:"7px", height:"7px", background:G.success, borderRadius:"50%", animation:"pulse 1.5s infinite", boxShadow:`0 0 6px ${G.success}` }} />
                      Live
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div style={{ display:"flex", gap:"12px", marginBottom:"16px" }}>
        <Input value={search} onChange={setSearch} placeholder="Search by subject or PIN…" icon="🔍" style={{ marginBottom:0, flex:2 }} />
        <Select value={statusFilter} onChange={setStatusFilter} style={{ marginBottom:0 }}
          options={[{value:"all",label:"All Statuses"},{value:"active",label:"Active"},{value:"expired",label:"Expired"},{value:"locked",label:"Locked"}]} />
      </div>

      {/* Table */}
      <Card style={{ padding:0, overflow:"hidden" }}>
        <table className="glass-table">
          <thead>
            <tr>{["Subject","PIN","Sem","Section","Attendees","Status","Created","Actions"].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={8}><EmptyState icon="📋" message="No sessions found" sub="Create your first session above" /></td></tr>
              : filtered.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight:600, color:G.text }}>{s.subject}</td>
                  <td style={{ fontFamily:G.mono, fontWeight:700, color:"#a5b4fc", fontSize:"15px", letterSpacing:"0.1em" }}>{s.pin}</td>
                  <td style={{ color:G.text2 }}>Sem {s.semester}</td>
                  <td style={{ color:G.text2 }}>{s.section}</td>
                  <td style={{ color:G.text2 }}>{s.attendeeCount || 0}</td>
                  <td><Badge color={s.status==="active"?"success":s.status==="locked"?"warning":"gray"}>{s.status}</Badge></td>
                  <td style={{ color:G.text3, fontSize:"12px" }}>{new Date(s.createdAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</td>
                  <td>
                    <div style={{ display:"flex", gap:"6px" }}>
                      <Btn size="sm" variant="secondary" onClick={() => setActiveSession(normalizeSession(s))} icon="👁️">View</Btn>
                      {s.status==="active"  && <Btn size="sm" variant="ghost" onClick={() => handleStatus(s.id,"expired")}>Expire</Btn>}
                      {s.status==="locked"  && <Btn size="sm" variant="ghost" onClick={() => handleStatus(s.id,"active")}>Unlock</Btn>}
                      <Btn size="sm" variant="danger" onClick={() => handleDeleteClick(s)} icon="🗑️" loading={deleting} />
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </Card>
    </div>
  );
}
