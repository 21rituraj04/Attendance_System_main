import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { 
  Bell, Send, Trash2, Pin, Info, AlertTriangle, 
  Clock, Filter, Users, GraduationCap, ChevronRight, 
  MessageSquare, MoreHorizontal, Plus, Paperclip
} from "lucide-react";

export default function AdminNotices({ showToast, reloadUnread }) {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("both");
  const [priority, setPriority] = useState("normal");
  const [isPinned, setIsPinned] = useState(false);
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState(null);

  const loadNotices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/notices");
      setNotices(res.data);
    } catch (e) {
      showToast("Failed to load notices", "danger");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { 
    loadNotices(); 
    const iv = setInterval(loadNotices, 15000);
    return () => clearInterval(iv);
  }, [loadNotices]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title || !message) return showToast("Title and message required", "danger");
    
    setSending(true);
    try {
      const payload = { 
        title, message, audience, priority, isPinned,
        attachments: file ? [{ name: file.name, url: "#", type: file.type }] : []
      };
      await api.post("/notices", payload);
      showToast("Notice broadcasted successfully!");
      setTitle(""); setMessage(""); setFile(null); setShowCreate(false);
      loadNotices();
    } catch (e) {
      showToast("Failed to send notice", "danger");
    }
    setSending(false);
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notices/${id}/read`);
      setNotices(prev => prev.map(n => n._id === id ? { ...n, isUnread: false } : n));
      if (reloadUnread) reloadUnread();
    } catch (e) { /* silent */ }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notices/${id}`);
      showToast("Notice deleted", "success");
      loadNotices();
    } catch (e) {
      showToast("Delete failed", "danger");
    }
  };

  const filteredNotices = notices.filter(n => {
    if (activeTab === "pinned") return n.isPinned;
    if (activeTab === "urgent") return n.priority === "urgent";
    return true;
  });

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="font-heading" style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>Notices & Announcements</h1>
          <p style={{ color: "var(--c-text-muted)", fontSize: 13 }}>Broadcast system-wide alerts and information to faculty and students.</p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)} 
          className="btn-premium-primary btn-premium" 
          style={{ background: "var(--c-accent)", color: "#fff" }}
        >
          {showCreate ? "Close Manager" : "Compose Notice"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: showCreate ? "1.2fr 1fr" : "1fr", gap: 24, transition: "var(--transition)" }}>
        
        {/* Left Column: Notice List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Tabs */}
          <div className="premium-glass" style={{ padding: 6, display: "inline-flex", gap: 4, alignSelf: "flex-start" }}>
             {["all", "pinned", "urgent"].map(t => (
               <button 
                key={t}
                onClick={() => setActiveTab(t)}
                className={`btn-premium ${activeTab === t ? "active" : ""}`}
                style={{ 
                  padding: "6px 16px", border: "none", 
                  background: activeTab === t ? "rgba(255,255,255,0.1)" : "transparent",
                  fontSize: 12, textTransform: "capitalize"
                }}
               >
                 {t}
               </button>
             ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <AnimatePresence mode="popLayout">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="shimmer premium-glass" style={{ height: 120, borderRadius: 16 }} />
                ))
              ) : filteredNotices.length === 0 ? (
                <div className="premium-glass" style={{ padding: 60, textAlign: "center", color: "var(--c-text-dim)" }}>
                   <MessageSquare size={48} strokeWidth={1} style={{ marginBottom: 12, opacity: 0.5 }} />
                   <p>No notices found in this category.</p>
                </div>
              ) : filteredNotices.map((notice, idx) => (
                <motion.div 
                  key={notice._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => notice.isUnread && markAsRead(notice._id)}
                  className="premium-glass"
                  style={{ 
                    padding: 24, position: "relative",
                    cursor: notice.isUnread ? "pointer" : "default",
                    background: notice.isUnread ? "rgba(59, 130, 246, 0.03)" : "rgba(255,255,255,0.02)",
                    borderLeft: notice.priority === "urgent" ? "4px solid var(--c-danger)" : notice.isPinned ? "4px solid var(--c-warning)" : "1px solid var(--c-border)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {notice.isPinned && <Pin size={14} color="var(--c-warning)" />}
                      <span style={{ 
                        fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                        padding: "2px 8px", borderRadius: 4, 
                        background: notice.priority === "urgent" ? "rgba(239, 68, 68, 0.15)" : "rgba(255,255,255,0.05)",
                        color: notice.priority === "urgent" ? "var(--c-danger)" : "var(--c-text-muted)"
                      }}>
                        {notice.priority}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--c-text-dim)" }}>
                        To: <span style={{ color: "var(--c-text-muted)", textTransform: "capitalize" }}>{notice.audience}</span>
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "var(--c-text-dim)" }}>{new Date(notice.createdAt).toLocaleString()}</span>
                      {notice.senderId?._id === user?._id && (
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(notice._id); }} style={{ background: "none", border: "none", color: "var(--c-text-dim)", cursor: "pointer" }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{notice.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--c-text-muted)", lineHeight: 1.6, marginBottom: 12 }}>{notice.message}</p>
                  
                  {notice.attachments?.length > 0 && (
                    <div style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
                       {notice.attachments.map((att, ai) => (
                         <a 
                           key={ai} href={att.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                           className="btn-premium"
                           style={{ padding: "4px 10px", fontSize: 10, background: "rgba(255,255,255,0.05)" }}
                         >
                            <Paperclip size={12} /> {att.name || "Attachment"}
                         </a>
                       ))}
                    </div>
                  )}
                  
                  <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                     <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--c-text-dim)" }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--c-bg-3)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--c-border)" }}>
                           <Info size={12} />
                        </div>
                        Sent by {notice.senderId?.name || "Admin"}
                     </div>
                     <button className="btn-premium" style={{ border: "none", background: "transparent", fontSize: 12 }}>
                        View Read Receipts <ChevronRight size={14} />
                     </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Create Notice Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="premium-glass"
              style={{ padding: 32, height: "fit-content", position: "sticky", top: 24 }}
            >
               <h3 className="font-heading" style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                 <Send size={18} color="var(--c-accent)" /> New Broadcast
               </h3>

               <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                 <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--c-text-muted)", marginBottom: 8 }}>Notice Title</label>
                    <input 
                      value={title} onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. End Semester Examination Schedule" 
                      className="premium-input" 
                    />
                 </div>

                 <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--c-text-muted)", marginBottom: 8 }}>Message Body</label>
                    <textarea 
                      value={message} onChange={e => setMessage(e.target.value)}
                      placeholder="Enter detailed announcement here..." 
                      className="premium-input" 
                      style={{ minHeight: 120, resize: "vertical" }}
                    />
                 </div>

                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--c-text-muted)", marginBottom: 8 }}>Audience</label>
                      <select value={audience} onChange={e => setAudience(e.target.value)} className="premium-input">
                         <option value="both">Teachers & Students</option>
                         <option value="teachers">Teachers Only</option>
                         <option value="students">Students Only</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--c-text-muted)", marginBottom: 8 }}>Priority</label>
                      <select value={priority} onChange={e => setPriority(e.target.value)} className="premium-input">
                         <option value="normal">Normal</option>
                         <option value="important">Important</option>
                         <option value="urgent">Urgent</option>
                      </select>
                    </div>
                 </div>

                 <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                     <button 
                       type="button"
                       onClick={() => setIsPinned(!isPinned)}
                       className="btn-premium"
                       style={{ 
                         flex: 1, gap: 8, 
                         background: isPinned ? "rgba(245, 158, 11, 0.1)" : "transparent",
                         borderColor: isPinned ? "var(--c-warning)" : "var(--c-border)",
                         color: isPinned ? "var(--c-warning)" : "var(--c-text-muted)"
                       }}
                     >
                       <Pin size={14} /> {isPinned ? "Pinned" : "Pin Notice"}
                     </button>
                     <div style={{ flex: 1, position: "relative" }}>
                        <button type="button" className="btn-premium" style={{ width: "100%", gap: 8 }}>
                           <Paperclip size={14} /> {file ? "Attached" : "Attach"}
                        </button>
                        <input 
                          type="file" 
                          onChange={e => setFile(e.target.files[0])}
                          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} 
                        />
                     </div>
                  </div>
                  {file && <div style={{ fontSize: 11, color: "var(--c-accent)", marginTop: -12 }}>📎 {file.name}</div>}

                 <div style={{ width: "100%", height: 1, background: "var(--c-border)", margin: "8px 0" }} />

                 <button 
                  disabled={sending}
                  type="submit" 
                  className="btn-premium-primary btn-premium" 
                  style={{ background: "var(--c-accent)", color: "#fff", width: "100%", padding: "12px" }}
                 >
                   {sending ? "Broadcasting..." : "Broadcast Notice"}
                 </button>
               </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
