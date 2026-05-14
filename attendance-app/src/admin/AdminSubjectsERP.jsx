import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import api from "../services/api";
import { SectionHeader, Btn, Input, Select, Card, Badge, EmptyState, Alert } from "../components.jsx";
import { getSessions } from "../services/db.js";

const G = { text:"#f1f5f9", text2:"#94a3b8", text3:"#64748b" };
const SEMS = ["1","2","3","4","5","6","7","8"];
const DEPTS = ["Computer Science","Electronics","Mechanical","Civil","Electrical","Information Technology","Mathematics","Physics","Chemistry","MBA","MCA"];
const EMPTY = { name:"", code:"", semester:"", departmentName:"" };

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return createPortal(
    <div style={{ position:"fixed", inset:0, zIndex:9000, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"linear-gradient(145deg,rgba(15,23,42,0.99),rgba(10,15,30,0.99))", border:"1px solid rgba(245,158,11,0.3)", borderRadius:20, padding:32, maxWidth:440, width:"90%" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ color:G.text, margin:0, fontSize:18, fontWeight:800 }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:G.text3, cursor:"pointer", fontSize:22 }}>✕</button>
        </div>
        {children}
      </div>
    </div>, document.body
  );
}

export default function AdminSubjectsERP({ showToast }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [semFilter, setSemFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editSub, setEditSub]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [form, setForm]   = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/subjects");
      setSubjects(res.data);
      localStorage.setItem("att_subjects_full", JSON.stringify(res.data.map(s => ({ ...s, id: s._id }))));
      localStorage.setItem("att_subjects", JSON.stringify(res.data.map(s => s.name)));
    } catch (e) { showToast("Failed to load subjects","danger"); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm(EMPTY); setEditSub(null); setErr(""); setShowModal(true); };
  const openEdit = (s) => { setForm({ name:s.name, code:s.code||"", semester:s.semester||"", departmentName:s.departmentName||"" }); setEditSub(s); setErr(""); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { setErr("Subject name is required."); return; }
    setSaving(true); setErr("");
    try {
      if (editSub) { await api.put(`/subjects/${editSub._id}`, form); showToast("Subject updated ✅"); }
      else { await api.post("/subjects", form); showToast("Subject added ✅"); }
      setShowModal(false); load();
    } catch (e) { setErr(e.response?.data?.msg || "Failed."); }
    setSaving(false);
  };

  const handleDelete = async () => {
    const active = getSessions().find(s => s.subject === confirmDel.name && s.status === "active");
    if (active) { showToast("Cannot delete — subject has an active session","danger"); setConfirmDel(null); return; }
    try { await api.delete(`/subjects/${confirmDel._id}`); showToast("Subject deleted","danger"); setConfirmDel(null); load(); }
    catch (e) { showToast(e.response?.data?.msg || "Failed","danger"); }
  };

  const filtered = subjects.filter(s =>
    (semFilter==="all" || s.semester===semFilter || s.semester==="") &&
    s.name?.toLowerCase().includes(search.toLowerCase())
  );
  const f = k => v => setForm(p => ({ ...p, [k]:v }));

  return (
    <div className="anim-fade-up">
      {confirmDel && createPortal(
        <div style={{ position:"fixed", inset:0, zIndex:9100, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"linear-gradient(145deg,rgba(15,23,42,0.99),rgba(10,15,30,0.99))", border:"1px solid rgba(239,68,68,0.3)", borderRadius:20, padding:32, maxWidth:380, width:"90%" }}>
            <div style={{ fontSize:40, textAlign:"center", marginBottom:12 }}>⚠️</div>
            <h3 style={{ color:G.text, textAlign:"center", margin:"0 0 8px", fontWeight:800 }}>Delete Subject?</h3>
            <p style={{ color:G.text2, textAlign:"center", fontSize:13, marginBottom:24 }}>Delete "{confirmDel.name}"? This cannot be undone.</p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setConfirmDel(null)} style={{ flex:1, padding:10, borderRadius:10, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:G.text2, fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex:1, padding:10, borderRadius:10, background:"linear-gradient(135deg,#ef4444,#dc2626)", border:"none", color:"#fff", fontWeight:700, cursor:"pointer" }}>Delete</button>
            </div>
          </div>
        </div>, document.body
      )}

      <Modal open={showModal} title={editSub ? "Edit Subject" : "Add Subject"} onClose={() => setShowModal(false)}>
        {err && <Alert type="danger" onClose={() => setErr("")}>{err}</Alert>}
        <Input label="Subject Name *" value={form.name} onChange={f("name")} placeholder="Data Structures" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:12 }}>
          <Input label="Subject Code" value={form.code} onChange={f("code")} placeholder="CS301" />
          <Select label="Semester" value={form.semester} onChange={f("semester")} options={[{value:"",label:"All Sems"},...SEMS.map(v=>({value:v,label:`Sem ${v}`}))]} />
        </div>
        <Select label="Department" value={form.departmentName} onChange={f("departmentName")} options={[{value:"",label:"Select dept…"},...DEPTS.map(d=>({value:d,label:d}))]} style={{ marginTop:12 }} />
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <Btn onClick={handleSave} loading={saving} icon="💾" style={{ flex:1 }}>{editSub ? "Update" : "Add Subject"}</Btn>
          <Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn>
        </div>
      </Modal>

      <SectionHeader title={`Subjects (${subjects.length})`} subtitle="Manage academic subjects"
        action={<Btn onClick={openAdd} icon="➕">Add Subject</Btn>}
      />

      <div style={{ display:"flex", gap:12, marginBottom:16 }}>
        <Input value={search} onChange={setSearch} placeholder="Search subjects…" icon="🔍" style={{ marginBottom:0, flex:2 }} />
        <Select value={semFilter} onChange={setSemFilter} style={{ marginBottom:0 }} options={[{value:"all",label:"All Sems"},...SEMS.map(v=>({value:v,label:`Sem ${v}`}))]} />
      </div>

      {loading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:80, borderRadius:16 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📚" message="No subjects found" sub="Add your first subject above" />
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
          {filtered.map(s => (
            <Card key={s._id} hover style={{ display:"flex", alignItems:"center", padding:"14px 18px", gap:12 }}>
              <div style={{ width:40, height:40, background:"rgba(245,158,11,0.12)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, border:"1px solid rgba(245,158,11,0.2)", flexShrink:0 }}>📚</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14, color:G.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.name}</div>
                <div style={{ fontSize:11, color: s.semester ? "#a5b4fc" : G.text3, marginTop:2 }}>
                  {s.semester ? `Sem ${s.semester}` : "All Semesters"}
                  {s.code && <span style={{ marginLeft:6, color:G.text3 }}>· {s.code}</span>}
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <Btn size="xs" variant="ghost" onClick={() => openEdit(s)} icon="✏️" />
                <Btn size="xs" variant="danger" onClick={() => setConfirmDel(s)} icon="🗑️" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
