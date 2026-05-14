import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import api from "../services/api";
import { SectionHeader, Btn, Input, Select, Card, Badge, EmptyState, Alert } from "../components.jsx";

const G = { text:"#f1f5f9", text2:"#94a3b8", text3:"#64748b" };

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return createPortal(
    <div style={{ position:"fixed", inset:0, zIndex:9000, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"linear-gradient(145deg,rgba(15,23,42,0.99),rgba(10,15,30,0.99))", border:"1px solid rgba(6,182,212,0.3)", borderRadius:20, padding:"32px", maxWidth:480, width:"90%" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h3 style={{ color:G.text, margin:0, fontSize:18, fontWeight:800 }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:G.text3, cursor:"pointer", fontSize:22 }}>✕</button>
        </div>
        {children}
      </div>
    </div>, document.body
  );
}

const EMPTY = { name:"", code:"", description:"", hodName:"" };

export default function AdminDepartments({ showToast }) {
  const [depts, setDepts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [form, setForm]   = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try { const res = await api.get("/departments"); setDepts(res.data); }
    catch (e) { showToast("Failed to load departments","danger"); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm(EMPTY); setEditDept(null); setErr(""); setShowModal(true); };
  const openEdit = (d) => { setForm({ name:d.name, code:d.code, description:d.description||"", hodName:d.hodName||"" }); setEditDept(d); setErr(""); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) { setErr("Name and code are required."); return; }
    setSaving(true); setErr("");
    try {
      if (editDept) { await api.put(`/departments/${editDept._id}`, form); showToast("Department updated ✅"); }
      else { await api.post("/departments", form); showToast("Department added ✅"); }
      setShowModal(false); load();
    } catch (e) { setErr(e.response?.data?.msg || "Failed."); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try { await api.delete(`/departments/${confirmDel._id}`); showToast("Department deleted","danger"); setConfirmDel(null); load(); }
    catch (e) { showToast("Failed to delete","danger"); }
  };

  const f = k => v => setForm(p => ({ ...p, [k]:v }));

  return (
    <div className="anim-fade-up">
      {confirmDel && createPortal(
        <div style={{ position:"fixed", inset:0, zIndex:9100, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"linear-gradient(145deg,rgba(15,23,42,0.99),rgba(10,15,30,0.99))", border:"1px solid rgba(239,68,68,0.3)", borderRadius:20, padding:32, maxWidth:380, width:"90%" }}>
            <div style={{ fontSize:40, textAlign:"center", marginBottom:12 }}>⚠️</div>
            <h3 style={{ color:G.text, textAlign:"center", margin:"0 0 8px", fontWeight:800 }}>Delete Department?</h3>
            <p style={{ color:G.text2, textAlign:"center", fontSize:13, marginBottom:24 }}>Deleting "{confirmDel.name}" cannot be undone.</p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setConfirmDel(null)} style={{ flex:1, padding:10, borderRadius:10, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:G.text2, fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex:1, padding:10, borderRadius:10, background:"linear-gradient(135deg,#ef4444,#dc2626)", border:"none", color:"#fff", fontWeight:700, cursor:"pointer" }}>Delete</button>
            </div>
          </div>
        </div>, document.body
      )}

      <Modal open={showModal} title={editDept ? "Edit Department" : "Add Department"} onClose={() => setShowModal(false)}>
        {err && <Alert type="danger" onClose={() => setErr("")}>{err}</Alert>}
        <Input label="Department Name *" value={form.name} onChange={f("name")} placeholder="Computer Science" />
        <Input label="Short Code *" value={form.code} onChange={f("code")} placeholder="CSE" style={{ marginTop:12 }} />
        <Input label="HOD Name" value={form.hodName} onChange={f("hodName")} placeholder="Dr. Ramesh Kumar" style={{ marginTop:12 }} />
        <Input label="Description" value={form.description} onChange={f("description")} placeholder="Brief description…" style={{ marginTop:12 }} />
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <Btn onClick={handleSave} loading={saving} icon="💾" style={{ flex:1 }}>{editDept ? "Update" : "Add Department"}</Btn>
          <Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn>
        </div>
      </Modal>

      <SectionHeader title={`Departments (${depts.length})`} subtitle="Manage academic departments"
        action={<Btn onClick={openAdd} icon="➕">Add Department</Btn>}
      />

      {loading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:16 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:120, borderRadius:16 }} />)}
        </div>
      ) : depts.length === 0 ? (
        <EmptyState icon="🏛️" message="No departments yet" sub="Add your first department above" />
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
          {depts.map(d => (
            <Card key={d._id} hover style={{ padding:"22px 24px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
                <div style={{ width:44, height:44, background:"rgba(6,182,212,0.12)", border:"1px solid rgba(6,182,212,0.25)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🏛️</div>
                <Badge color="accent">{d.code}</Badge>
              </div>
              <div style={{ fontWeight:800, fontSize:15, color:G.text, marginBottom:4 }}>{d.name}</div>
              {d.hodName && <div style={{ fontSize:12, color:G.text3, marginBottom:4 }}>HOD: {d.hodName}</div>}
              {d.description && <div style={{ fontSize:12, color:G.text3, marginBottom:12 }}>{d.description}</div>}
              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                <Btn size="xs" variant="ghost" onClick={() => openEdit(d)} icon="✏️">Edit</Btn>
                <Btn size="xs" variant="danger" onClick={() => setConfirmDel(d)} icon="🗑️" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
