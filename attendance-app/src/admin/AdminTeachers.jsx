import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import api from "../services/api";
import { SectionHeader, Btn, Input, Select, Card, Badge, EmptyState, SkeletonTable, Alert } from "../components.jsx";

const G = { text:"#f1f5f9", text2:"#94a3b8", text3:"#64748b", success:"#10b981", danger:"#ef4444", warning:"#f59e0b" };
const DEPTS = ["BCA", "MCA", "BTech", "MTech"]; // FOCT Departments
const DESIGS = ["Assistant Professor","Associate Professor","Professor","HOD","Dean","Lab Instructor","Guest Faculty"];

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return createPortal(
    <div style={{ position:"fixed", inset:0, zIndex:9000, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"linear-gradient(145deg,rgba(15,23,42,0.99),rgba(10,15,30,0.99))", border:"1px solid rgba(99,102,241,0.3)", borderRadius:20, padding:"32px", maxWidth:560, width:"90%", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h3 style={{ color:G.text, margin:0, fontSize:18, fontWeight:800 }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:G.text3, cursor:"pointer", fontSize:22, lineHeight:1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return createPortal(
    <div style={{ position:"fixed", inset:0, zIndex:9100, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"linear-gradient(145deg,rgba(15,23,42,0.99),rgba(10,15,30,0.99))", border:"1px solid rgba(239,68,68,0.3)", borderRadius:20, padding:"32px", maxWidth:420, width:"90%" }}>
        <div style={{ fontSize:40, marginBottom:16, textAlign:"center" }}>⚠️</div>
        <h3 style={{ color:G.text, margin:"0 0 8px", fontSize:18, fontWeight:800, textAlign:"center" }}>{title}</h3>
        <p style={{ color:G.text2, fontSize:13, textAlign:"center", marginBottom:24 }}>{message}</p>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"10px", borderRadius:10, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:G.text2, fontWeight:600, cursor:"pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, padding:"10px", borderRadius:10, background:"linear-gradient(135deg,#ef4444,#dc2626)", border:"none", color:"#fff", fontWeight:700, cursor:"pointer" }}>Yes, Delete</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const EMPTY_FORM = { name:"", email:"", password:"", employeeId:"", department:"", designation:"", specialization:"", qualification:"", phone:"" };

export default function AdminTeachers({ showToast, reload }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [showModal, setShowModal]   = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);
  const [confirmDel, setConfirmDel]   = useState(null);
  const [form, setForm]   = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/auth/teachers");
      setTeachers(res.data);
    } catch (e) { showToast("Failed to load teachers", "danger"); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditTeacher(null); setErr(""); setShowModal(true); };
  const openEdit = (t) => {
    setForm({ name:t.name, email:t.email, password:"", employeeId:t.employeeId||"", department:t.department||"", designation:t.designation||"", specialization:t.specialization||"", qualification:t.qualification||"", phone:t.phone||"" });
    setEditTeacher(t);
    setErr(""); setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { setErr("Name and email are required."); return; }
    if (!editTeacher && !form.password) { setErr("Password is required."); return; }
    setSaving(true); setErr("");
    try {
      if (editTeacher) {
        const payload = { ...form }; if (!payload.password) delete payload.password;
        await api.put(`/auth/users/${editTeacher._id}`, payload);
        showToast("Teacher updated ✅");
      } else {
        await api.post("/auth/register-teacher", form);
        showToast("Teacher added ✅");
      }
      setShowModal(false); load(); reload();
    } catch (e) { setErr(e.response?.data?.msg || "Failed to save."); }
    setSaving(false);
  };

  const handleToggleStatus = async (t) => {
    try {
      const res = await api.patch(`/auth/users/${t._id}/status`);
      showToast(`Teacher ${res.data.status}`);
      load();
    } catch (e) { showToast("Failed to update status", "danger"); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/auth/users/${confirmDel._id}`);
      showToast("Teacher deleted", "danger");
      setConfirmDel(null); load(); reload();
    } catch (e) { showToast("Failed to delete", "danger"); }
  };

  const filtered = teachers.filter(t =>
    (deptFilter === "all" || t.department === deptFilter) &&
    (t.name?.toLowerCase().includes(search.toLowerCase()) || t.email?.toLowerCase().includes(search.toLowerCase()) || t.employeeId?.toLowerCase().includes(search.toLowerCase()))
  );

  const f = k => v => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="anim-fade-up">
      <ConfirmModal open={!!confirmDel} title="Delete Teacher?" message={`This will permanently delete ${confirmDel?.name}'s account.`} onConfirm={handleDelete} onCancel={() => setConfirmDel(null)} />
      <Modal open={showModal} title={editTeacher ? "Edit Teacher" : "Add New Teacher"} onClose={() => setShowModal(false)}>
        {err && <Alert type="danger" onClose={() => setErr("")}>{err}</Alert>}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Input label="Full Name *" value={form.name} onChange={f("name")} placeholder="Dr. Anita Sharma" />
          <Input label="Email *" value={form.email} onChange={f("email")} placeholder="teacher@college.com" />
          <Input label={editTeacher ? "New Password (leave blank to keep)" : "Password *"} value={form.password} onChange={f("password")} placeholder="Min 6 chars" type="password" />
          <Input label="Employee ID" value={form.employeeId} onChange={f("employeeId")} placeholder="TCH001" />
          <Select label="Department" value={form.department} onChange={f("department")} options={[{value:"",label:"Select dept…"}, ...DEPTS.map(d=>({value:d,label:d}))]} />
          <Select label="Designation" value={form.designation} onChange={f("designation")} options={[{value:"",label:"Select…"}, ...DESIGS.map(d=>({value:d,label:d}))]} />
          <Input label="Specialization" value={form.specialization} onChange={f("specialization")} placeholder="Data Structures, ML…" />
          <Input label="Qualification" value={form.qualification} onChange={f("qualification")} placeholder="Ph.D., M.Tech…" />
        </div>
        <Input label="Phone" value={form.phone} onChange={f("phone")} placeholder="+91 9876543210" style={{ marginTop:12 }} />
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <Btn onClick={handleSave} loading={saving} icon="💾" style={{ flex:1 }}>{editTeacher ? "Update Teacher" : "Add Teacher"}</Btn>
          <Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn>
        </div>
      </Modal>

      <SectionHeader title={`FOCT Teachers (${teachers.length})`} subtitle="Manage FOCT faculty accounts"
        action={<Btn onClick={openAdd} icon="➕">Add Teacher</Btn>}
      />

      <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap", alignItems: "center" }}>
        <Select value={deptFilter} onChange={setDeptFilter} style={{ marginBottom:0, minWidth:220 }}
          options={[{value:"all",label:"All Departments (Select One)"}, ...DEPTS.map(d=>({value:d,label:`Department of ${d}`}))]}
        />
        {/* Search bar removed */}
      </div>

      <Card style={{ padding:0, overflow:"hidden" }}>
        {loading ? <SkeletonTable rows={5} cols={6} /> : (
          <table className="glass-table">
            <thead>
              <tr>{["Name","Employee ID","Department","Designation","Status","Actions"].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6}><EmptyState icon="👩‍🏫" message="No teachers found" sub="Click 'Add Teacher' to create one" /></td></tr>
                : filtered.map(t => (
                  <tr key={t._id}>
                    <td>
                      <div style={{ fontWeight:700, color:G.text }}>{t.name}</div>
                      <div style={{ fontSize:11, color:G.text3 }}>{t.email}</div>
                    </td>
                    <td style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:"#a5b4fc" }}>{t.employeeId || "—"}</td>
                    <td style={{ color:G.text2, fontSize:13 }}>{t.department || "—"}</td>
                    <td style={{ color:G.text2, fontSize:13 }}>{t.designation || "—"}</td>
                    <td><Badge color={t.status==="active"?"success":"danger"}>{t.status}</Badge></td>
                    <td>
                      <div style={{ display:"flex", gap:6 }}>
                        <Btn size="xs" variant="ghost" onClick={() => openEdit(t)} icon="✏️" />
                        <Btn size="xs" variant={t.status==="active"?"warning":"success"} onClick={() => handleToggleStatus(t)} icon={t.status==="active"?"🔒":"🔓"} />
                        <Btn size="xs" variant="danger" onClick={() => setConfirmDel(t)} icon="🗑️" />
                      </div>
                    </td>
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
