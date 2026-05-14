import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { 
  Search, Plus, MoreHorizontal, Edit2, Trash2, 
  Filter, Download, ChevronDown, UserPlus, 
  Mail, Phone, GraduationCap, Building2, Calendar
} from "lucide-react";

const DEPTS = ["BCA", "MCA", "BTech", "MTech"];
const SEMS  = ["1","2","3","4","5","6","7","8"];
const SECS  = ["A","B","C","D","E"];
const EMPTY = { name:"", enrollment:"", email:"", password:"", semester:"1", section:"A", department:"", phone:"", rollNumber:"", year:"" };

export default function AdminStudentsERP({ showToast, reload }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [semFilter, setSemFilter] = useState("all");
  const [secFilter, setSecFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editStu, setEditStu] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get("/auth/students"); setStudents(res.data); }
    catch (e) { showToast("Failed to load students", "danger"); }
    setLoading(false);
  }, []); // Removed showToast to prevent re-creation on parent re-renders

  useEffect(() => { load(); }, []); // Run once on mount

  const openAdd  = () => { setForm(EMPTY); setEditStu(null); setErr(""); setShowModal(true); };
  const openEdit = (s) => { 
    setForm({ 
      ...EMPTY, name:s.name, enrollment:s.enrollment||"", email:s.email||"", 
      password:"", semester:s.semester||"1", section:s.section||"A", 
      department:s.department||"", phone:s.phone||"", rollNumber:s.rollNumber||"", year:s.year||"" 
    }); 
    setEditStu(s); setErr(""); setShowModal(true); 
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.enrollment.trim()) { setErr("Name and enrollment are required."); return; }
    if (!editStu && !form.password) { setErr("Password is required."); return; }
    setSaving(true); setErr("");
    try {
      if (editStu) {
        const payload = { ...form }; if (!payload.password) delete payload.password;
        await api.put(`/auth/users/${editStu._id}`, payload);
        showToast("Student updated successfully");
      } else {
        await api.post("/auth/register-student", form);
        showToast("Student added successfully");
      }
      setShowModal(false); load(); reload();
    } catch (e) { setErr(e.response?.data?.msg || "Failed to save."); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try { 
      await api.delete(`/auth/users/${confirmDel._id}`); 
      showToast("Student deleted permanently", "danger"); 
      setConfirmDel(null); load(); reload(); 
    } catch (e) { showToast("Failed to delete student", "danger"); }
  };

  const filtered = students.filter(s =>
    (deptFilter==="all" || s.department===deptFilter) &&
    (semFilter==="all" || s.semester===semFilter) &&
    (secFilter==="all" || s.section===secFilter) &&
    (s.name?.toLowerCase().includes(search.toLowerCase()) || 
     s.enrollment?.toLowerCase().includes(search.toLowerCase()) || 
     s.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const f = k => v => setForm(p => ({ ...p, [k]:v }));

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Header & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <h1 className="font-heading" style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>Students</h1>
          <p style={{ color: "var(--c-text-muted)", fontSize: 13 }}>Manage institutional student records and enrollment.</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-premium">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={openAdd} className="btn-premium-primary btn-premium" style={{ background: "var(--c-accent)", color: "#fff" }}>
            <UserPlus size={14} /> Add Student
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="premium-glass" style={{ padding: "16px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        {/* Search bar removed */}
        
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <Filter size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--c-text-dim)" }} />
            <select 
              value={deptFilter} 
              onChange={(e) => setDeptFilter(e.target.value)}
              className="premium-input"
              style={{ paddingLeft: 34, width: 140, appearance: "none" }}
            >
              <option value="all">All Departments</option>
              {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--c-text-dim)", pointerEvents: "none" }} />
          </div>

          <div style={{ position: "relative" }}>
            <Calendar size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--c-text-dim)" }} />
            <select 
              value={semFilter} 
              onChange={(e) => setSemFilter(e.target.value)}
              className="premium-input"
              style={{ paddingLeft: 34, width: 110, appearance: "none" }}
            >
              <option value="all">All Semesters</option>
              {SEMS.map(v => <option key={v} value={v}>Sem {v}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--c-text-dim)", pointerEvents: "none" }} />
          </div>

          <button className="btn-premium" style={{ color: "var(--c-text-dim)" }}>
            Reset
          </button>
        </div>
      </div>

      {/* Modern Table */}
      <div className="modern-table-container premium-glass">
        <table className="modern-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th>Student</th>
              <th>Enrollment</th>
              <th>Department</th>
              <th>Academic</th>
              <th style={{ width: 100 }}>Status</th>
              <th style={{ width: 80, textAlign: "right" }}></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={`loading-${i}`}>
                    <td colSpan={7} style={{ padding: 0 }}>
                      <div className="shimmer" style={{ height: 60, width: "100%", margin: "2px 0" }} />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "60px 0" }}>
                    <div style={{ color: "var(--c-text-dim)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                      <GraduationCap size={48} strokeWidth={1} />
                      <p>No students found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((s, idx) => (
                <motion.tr 
                  key={s._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <td style={{ paddingLeft: 16 }}>
                    <div style={{ 
                      width: 32, height: 32, borderRadius: "50%", 
                      background: "rgba(255,255,255,0.05)", display: "flex", 
                      alignItems: "center", justifyContent: "center",
                      color: "var(--c-text-muted)", fontSize: 12, fontWeight: 700
                    }}>
                      {s.name.charAt(0)}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--c-text)" }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "var(--c-text-dim)", display: "flex", alignItems: "center", gap: 4 }}>
                      <Mail size={10} /> {s.email}
                    </div>
                  </td>
                  <td>
                    <code style={{ fontSize: 12, color: "var(--c-accent)" }}>{s.enrollment}</code>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Building2 size={14} color="var(--c-text-dim)" />
                      <span>{s.department || "General"}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>Sem {s.semester} · {s.section}</div>
                    {s.rollNumber && <div style={{ fontSize: 11, color: "var(--c-text-dim)" }}>Roll: {s.rollNumber}</div>}
                  </td>
                  <td>
                    <div style={{ 
                      display: "inline-flex", alignItems: "center", gap: 6, 
                      padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: s.status === "active" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      color: s.status === "active" ? "var(--c-success)" : "var(--c-danger)"
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
                      {s.status === "active" ? "Active" : "Inactive"}
                    </div>
                  </td>
                  <td style={{ textAlign: "right", paddingRight: 16 }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <button onClick={() => openEdit(s)} className="btn-premium" style={{ padding: 6, border: "none", background: "transparent" }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setConfirmDel(s)} className="btn-premium" style={{ padding: 6, border: "none", background: "transparent", color: "var(--c-danger)" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmDel && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmDel(null)}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="premium-glass"
              style={{ width: 400, padding: 32, position: "relative", zIndex: 1001, textAlign: "center" }}
            >
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(239, 68, 68, 0.1)", color: "var(--c-danger)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Trash2 size={24} />
              </div>
              <h3 className="font-heading" style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Delete Student?</h3>
              <p style={{ color: "var(--c-text-muted)", fontSize: 14, marginBottom: 24 }}>
                This action will permanently delete <strong style={{ color: "#fff" }}>{confirmDel.name}</strong> and all associated data. This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setConfirmDel(null)} className="btn-premium" style={{ flex: 1 }}>Cancel</button>
                <button onClick={handleDelete} className="btn-premium" style={{ flex: 1, background: "var(--c-danger)", color: "#fff", border: "none" }}>Delete Permanently</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
            />
            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              className="premium-glass"
              style={{ width: "100%", maxWidth: 640, padding: 0, position: "relative", zIndex: 1001, overflow: "hidden" }}
            >
              <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className="font-heading" style={{ fontSize: 20, fontWeight: 600 }}>{editStu ? "Edit Student Profile" : "Create New Student"}</h3>
                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "var(--c-text-dim)", cursor: "pointer" }}>
                  <Plus size={24} style={{ transform: "rotate(45deg)" }} />
                </button>
              </div>
              
              <div style={{ padding: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxHeight: "70vh", overflowY: "auto" }}>
                {err && <div style={{ gridColumn: "span 2", padding: "12px 16px", borderRadius: 8, background: "rgba(239, 68, 68, 0.1)", color: "var(--c-danger)", fontSize: 13 }}>{err}</div>}
                
                <div style={{ gridColumn: "span 2" }}>
                   <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--c-text-muted)", marginBottom: 8 }}>Full Name</label>
                   <input value={form.name} onChange={(e) => f("name")(e.target.value)} placeholder="e.g. Rahul Sharma" className="premium-input" />
                </div>
                
                <div>
                   <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--c-text-muted)", marginBottom: 8 }}>Enrollment Number</label>
                   <input value={form.enrollment} onChange={(e) => f("enrollment")(e.target.value)} placeholder="e.g. CS2024001" className="premium-input" />
                </div>
                
                <div>
                   <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--c-text-muted)", marginBottom: 8 }}>Email Address</label>
                   <input value={form.email} onChange={(e) => f("email")(e.target.value)} placeholder="student@university.edu" className="premium-input" />
                </div>

                <div>
                   <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--c-text-muted)", marginBottom: 8 }}>{editStu ? "New Password" : "Account Password"}</label>
                   <input type="password" value={form.password} onChange={(e) => f("password")(e.target.value)} placeholder="••••••••" className="premium-input" />
                </div>

                <div>
                   <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--c-text-muted)", marginBottom: 8 }}>Department</label>
                   <select value={form.department} onChange={(e) => f("department")(e.target.value)} className="premium-input">
                      <option value="">Select Department</option>
                      {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                   </select>
                </div>

                <div>
                   <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--c-text-muted)", marginBottom: 8 }}>Semester</label>
                   <select value={form.semester} onChange={(e) => f("semester")(e.target.value)} className="premium-input">
                      {SEMS.map(v => <option key={v} value={v}>Semester {v}</option>)}
                   </select>
                </div>

                <div>
                   <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--c-text-muted)", marginBottom: 8 }}>Section</label>
                   <select value={form.section} onChange={(e) => f("section")(e.target.value)} className="premium-input">
                      {SECS.map(v => <option key={v} value={v}>Section {v}</option>)}
                   </select>
                </div>
              </div>

              <div style={{ padding: "24px 32px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid var(--c-border)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button onClick={() => setShowModal(false)} className="btn-premium">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-premium-primary btn-premium" style={{ background: "var(--c-accent)", color: "#fff", minWidth: 140 }}>
                  {saving ? "Saving..." : editStu ? "Save Changes" : "Create Student"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

