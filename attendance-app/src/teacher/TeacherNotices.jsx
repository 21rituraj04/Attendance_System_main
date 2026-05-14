import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { 
  Send, Trash2, Pin, MessageSquare, 
  Users, ChevronRight, Plus, Calendar, Book, 
  GraduationCap, Paperclip, CheckCircle2, AlertCircle,
  Edit3, Layout, Layers, Hash, Download
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { StaggerContainer, StaggerItem, PageTransition, Modal } from "../components.jsx";

export default function TeacherNotices({ showToast, reloadUnread }) {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [semester, setSemester] = useState(""); // empty means All
  const [section, setSection] = useState("");   // empty means All
  const [subject, setSubject] = useState("");   // empty means All
  const [priority, setPriority] = useState("normal");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [subjects, setSubjects] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [noticeRes, subRes] = await Promise.all([
        api.get("/notices"),
        api.get("/subjects")
      ]);
      setNotices(noticeRes.data);
      setSubjects(subRes.data);
    } catch (e) {
      showToast("Failed to load dashboard data", "danger");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title || !message) return showToast("Title and message body are required", "danger");
    
    setSending(true);
    try {
      const payload = { 
        title, 
        message, 
        priority,
        audience: "students", 
        targetSemester: semester || undefined,
        targetSection: section || undefined,
        targetSubjects: subject ? [subject] : [],
        attachments: file ? [{ name: file.name, url: "#", type: file.type }] : []
      };

      if (editingId) {
        await api.patch(`/notices/${editingId}`, payload);
      } else {
        await api.post("/notices", payload);
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setTitle(""); setMessage(""); setFile(null); 
        setSemester(""); setSection(""); setSubject("");
        setEditingId(null);
        setShowCreate(false);
        loadData();
        if (reloadUnread) reloadUnread();
      }, 2000);

    } catch (e) {
      showToast("Failed to process notice. Please check connection.", "danger");
    }
    setSending(false);
  };

  const startEdit = (notice) => {
    setEditingId(notice._id);
    setTitle(notice.title);
    setMessage(notice.message);
    setPriority(notice.priority);
    setSemester(notice.targetSemester || "");
    setSection(notice.targetSection || "");
    setSubject(notice.targetSubjects?.[0] || "");
    setShowCreate(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notice?")) return;
    try {
      await api.delete(`/notices/${id}`);
      showToast("Notice removed permanently");
      loadData();
    } catch (e) {
      showToast("Could not delete notice", "danger");
    }
  };

  return (
    <PageTransition>
      <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 60 }}>
        
        <StaggerContainer>
          {/* Header */}
          <StaggerItem>
            <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ textAlign: "left" }}>
                <h1 className="font-heading" style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, background: "linear-gradient(to right, #fff, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Announcements
                </h1>
                <p style={{ color: "var(--c-text-muted)", fontSize: 14 }}>Broadcast academic updates to your classes.</p>
              </div>
              <button 
                onClick={() => {
                  if (showCreate) { setEditingId(null); setTitle(""); setMessage(""); }
                  setShowCreate(!showCreate);
                }}
                className="btn-premium-primary"
                style={{ 
                  background: showCreate ? "rgba(255,255,255,0.05)" : "var(--c-accent)", 
                  color: "#fff", border: showCreate ? "1px solid var(--c-border)" : "none",
                  padding: "10px 24px", borderRadius: 12, fontWeight: 700, fontSize: 14, display: "flex", gap: 8 
                }}
              >
                {showCreate ? "Close Manager" : <><Plus size={18} /> New Notice</>}
              </button>
            </div>
          </StaggerItem>

          {/* Composer Card */}
          <AnimatePresence>
            {showCreate && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 40 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div className="premium-glass" style={{ padding: 40, position: "relative" }}>
                  <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    style={{ height: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}
                  >
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--c-success)" }}>
                       <CheckCircle2 size={40} color="var(--c-success)" />
                    </div>
                    <h2 className="font-heading" style={{ fontSize: 24, fontWeight: 700 }}>Notice Broadcasted!</h2>
                    <p style={{ color: "var(--c-text-muted)" }}>All relevant students have been notified.</p>
                  </motion.div>
                ) : (
                  <motion.form 
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleSend}
                    style={{ display: "flex", flexDirection: "column", gap: 28 }}
                  >
                    {/* Top Row: Targeting */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                      <div className="form-group">
                        <label style={labelStyle}><Layout size={14} /> Semester</label>
                        <select value={semester} onChange={e => setSemester(e.target.value)} className="premium-input">
                          <option value="">All Semesters</option>
                          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s.toString()}>Semester {s}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={labelStyle}><Layers size={14} /> Section</label>
                        <select value={section} onChange={e => setSection(e.target.value)} className="premium-input">
                          <option value="">All Sections</option>
                          {["A", "B", "C", "D"].map(s => <option key={s} value={s}>Section {s}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={labelStyle}><Book size={14} /> Subject</label>
                        <select value={subject} onChange={e => setSubject(e.target.value)} className="premium-input">
                          <option value="">All Subjects</option>
                          {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Middle Row: Title & Priority */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 20 }}>
                      <div className="form-group">
                        <label style={labelStyle}>Notice Title</label>
                        <input 
                          value={title} onChange={e => setTitle(e.target.value)}
                          placeholder="e.g. Schedule for Mid-Term Examination" 
                          className="premium-input" 
                        />
                      </div>
                      <div className="form-group">
                        <label style={labelStyle}>Priority</label>
                        <select value={priority} onChange={e => setPriority(e.target.value)} className="premium-input">
                          <option value="normal">Normal</option>
                          <option value="important">Important</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="form-group">
                      <label style={labelStyle}>Message Body</label>
                      <textarea 
                        value={message} onChange={e => setMessage(e.target.value)}
                        placeholder="Type your announcement here..." 
                        className="premium-input" 
                        style={{ minHeight: 160, resize: "vertical" }}
                      />
                    </div>

                    {/* Footer Row: Attach & Submit */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--c-border)", paddingTop: 28 }}>
                      <div style={{ position: "relative" }}>
                        <button type="button" className="btn-premium" style={{ gap: 10, background: file ? "rgba(59, 130, 246, 0.1)" : "transparent" }}>
                           <Paperclip size={16} /> {file ? file.name : "Attach Document"}
                        </button>
                        <input type="file" onChange={e => setFile(e.target.files[0])} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                      </div>

                      <div style={{ display: "flex", gap: 12 }}>
                        {editingId && (
                          <button type="button" onClick={() => { setEditingId(null); setTitle(""); setMessage(""); }} className="btn-premium" style={{ borderColor: "var(--c-danger)", color: "var(--c-danger)" }}>
                            Cancel Edit
                          </button>
                        )}
                        <button 
                          type="submit" 
                          disabled={sending}
                          className="btn-premium-primary" 
                          style={{ 
                            background: "var(--c-accent)", color: "#fff", padding: "12px 32px", 
                            fontSize: 15, fontWeight: 700, borderRadius: 12, display: "flex", gap: 10 
                          }}
                        >
                          {sending ? "Processing..." : (editingId ? "Update Notice" : "Broadcast Notice")} <Send size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.form>
                )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History Section */}
          <StaggerItem>
            <div style={{ marginTop: 60 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   <MessageSquare size={20} color="var(--c-text-muted)" />
                </div>
                <h2 className="font-heading" style={{ fontSize: 20, fontWeight: 700 }}>Sent Announcements</h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {loading ? (
                  Array(3).fill(0).map((_, i) => <div key={i} className="shimmer" style={{ height: 120, borderRadius: 20 }} />)
                ) : notices.filter(n => n.senderId?._id === user?._id).length === 0 ? (
                  <div className="premium-glass" style={{ padding: 60, textAlign: "center", color: "var(--c-text-dim)" }}>
                    <p>No notices broadcasted yet. Start by creating one above.</p>
                  </div>
                ) : (
                  notices.filter(n => n.senderId?._id === user?._id).map((notice, idx) => (
                    <motion.div 
                      key={notice._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSelectedNotice(notice)}
                      className="premium-glass card-hover"
                      style={{ padding: 24, cursor: "pointer", borderLeft: notice.priority === "urgent" ? "4px solid var(--c-danger)" : "1px solid var(--c-border)" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div>
                          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                             <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4, color: "var(--c-text-muted)" }}>
                               {notice.priority}
                             </span>
                             <span style={{ fontSize: 11, color: "var(--c-text-dim)" }}>
                               {new Date(notice.createdAt).toLocaleDateString()} at {new Date(notice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                          <h3 style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>{notice.title}</h3>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                           <button onClick={() => startEdit(notice)} style={{ background: "none", border: "none", color: "var(--c-text-dim)", cursor: "pointer", padding: 6 }} title="Edit">
                              <Edit3 size={16} />
                           </button>
                           <button onClick={() => handleDelete(notice._id)} style={{ background: "none", border: "none", color: "var(--c-text-dim)", cursor: "pointer", padding: 6 }} title="Delete">
                              <Trash2 size={16} />
                           </button>
                        </div>
                      </div>

                      <p style={{ 
                        fontSize: 14, color: "var(--c-text-muted)", lineHeight: 1.6, marginBottom: 16,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
                      }}>
                        {notice.message}
                      </p>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 12 }}>
                           <span style={badgeStyle}><GraduationCap size={10} /> Sem {notice.targetSemester || "All"}</span>
                           <span style={badgeStyle}><Hash size={10} /> Sec {notice.targetSection || "All"}</span>
                        </div>
                        {notice.attachments?.length > 0 && (
                          <div style={{ display: "flex", gap: 8 }}>
                             {notice.attachments.map((att, i) => (
                               <a 
                                 key={i} href={att.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                 className="btn-premium"
                                 style={{ padding: "4px 10px", fontSize: 10, color: "var(--c-accent)", background: "rgba(59,130,246,0.05)" }}
                               >
                                  <Download size={12} /> {att.name}
                               </a>
                             ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Sent Detail Modal */}
        <Modal 
          isOpen={!!selectedNotice} 
          onClose={() => setSelectedNotice(null)}
          title="Broadcast Detail"
          maxWidth={700}
        >
          {selectedNotice && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                 <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                       <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4, color: "var(--c-accent)" }}>
                         {selectedNotice.priority}
                       </span>
                       <span style={{ fontSize: 12, color: "var(--c-text-dim)" }}>
                         {new Date(selectedNotice.createdAt).toLocaleDateString()} at {new Date(selectedNotice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                    <h2 className="font-heading" style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{selectedNotice.title}</h2>
                 </div>
              </div>

              <div style={{ padding: 24, background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid var(--c-border)", minHeight: 120 }}>
                 <p style={{ fontSize: 15, color: "var(--c-text-muted)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                   {selectedNotice.message}
                 </p>
              </div>

              {selectedNotice.attachments?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <Paperclip size={16} /> Attached Files
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {selectedNotice.attachments.map((att, i) => (
                      <a 
                        key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                        className="btn-premium"
                        style={{ padding: "10px 16px", background: "rgba(59, 130, 246, 0.1)", borderColor: "rgba(59, 130, 246, 0.2)", color: "var(--c-accent)" }}
                      >
                        <Download size={14} style={{ marginRight: 8 }} /> {att.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--c-border)", paddingTop: 24, marginTop: 12 }}>
                 <div style={{ display: "flex", gap: 12 }}>
                    <span style={badgeStyle}><GraduationCap size={10} /> Semester {selectedNotice.targetSemester || "All"}</span>
                    <span style={badgeStyle}><Hash size={10} /> Section {selectedNotice.targetSection || "All"}</span>
                 </div>
                 <div style={{ display: "flex", gap: 10 }}>
                    <button 
                      onClick={() => { setSelectedNotice(null); startEdit(selectedNotice); }}
                      className="btn-premium"
                      style={{ fontSize: 13, fontWeight: 600, padding: "8px 16px" }}
                    >
                      Edit Notice
                    </button>
                    <button 
                      onClick={() => { setSelectedNotice(null); handleDelete(selectedNotice._id); }}
                      className="btn-premium"
                      style={{ fontSize: 13, fontWeight: 600, padding: "8px 16px", borderColor: "var(--c-danger)", color: "var(--c-danger)" }}
                    >
                      Delete
                    </button>
                 </div>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </PageTransition>
  );
}

const labelStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
  fontWeight: 600,
  color: "var(--c-text-muted)",
  marginBottom: 10
};

const badgeStyle = {
  fontSize: 11,
  fontWeight: 600,
  padding: "4px 10px",
  borderRadius: 6,
  background: "rgba(255,255,255,0.03)",
  color: "var(--c-text-dim)",
  display: "flex",
  alignItems: "center",
  gap: 6,
  border: "1px solid var(--c-border)"
};
