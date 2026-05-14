import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { 
  ChevronRight, Calendar, Search, Filter, Paperclip, Download, User, Clock, Bell, Pin, MessageSquare
} from "lucide-react";
import { Modal } from "../components.jsx";

export default function NoticeBoard({ compact = false, reloadUnread }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedNotice, setSelectedNotice] = useState(null);

  const loadNotices = useCallback(async () => {
    try {
      const res = await api.get("/notices");
      setNotices(res.data);
    } catch (e) {
      console.error("Failed to load notices");
    }
    setLoading(false);
  }, []);

  useEffect(() => { 
    loadNotices(); 
    const iv = setInterval(loadNotices, 10000);
    return () => clearInterval(iv);
  }, [loadNotices]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notices/${id}/read`);
      setNotices(prev => prev.map(n => n._id === id ? { ...n, isUnread: false } : n));
      if (reloadUnread) reloadUnread();
    } catch (e) { /* ignore */ }
  };

  const handleNoticeClick = (notice) => {
    setSelectedNotice(notice);
    if (notice.isUnread) markAsRead(notice._id);
  };

  const filtered = notices.filter(n => {
    if (filter === "unread") return n.isUnread;
    if (filter === "pinned") return n.isPinned;
    return true;
  });

  if (compact) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
           Array(3).fill(0).map((_, i) => <div key={i} className="shimmer" style={{ height: 60, borderRadius: 12 }} />)
        ) : filtered.length === 0 ? (
           <p style={{ textAlign: "center", color: "var(--c-text-dim)", fontSize: 13, padding: 20 }}>No new notices.</p>
        ) : (
          filtered.slice(0, 5).map(n => (
            <div 
              key={n._id} 
              onClick={() => handleNoticeClick(n)}
              className="premium-glass" 
              style={{ 
                padding: "12px 16px", cursor: "pointer", display: "flex", gap: 12, alignItems: "center",
                borderLeft: n.isUnread ? "3px solid var(--c-accent)" : "1px solid var(--c-border)"
              }}
            >
              <div style={{ 
                width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", justifyContent: "center", color: n.isPinned ? "var(--c-warning)" : "var(--c-text-muted)"
              }}>
                {n.isPinned ? <Pin size={16} /> : <Bell size={16} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.title}</div>
                <div style={{ fontSize: 11, color: "var(--c-text-dim)" }}>{new Date(n.createdAt).toLocaleDateString()}</div>
              </div>
              {n.isUnread && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--c-accent)" }} />}
              {n.attachments?.length > 0 && <Paperclip size={14} color="var(--c-accent)" style={{ marginLeft: 4 }} />}
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="font-heading" style={{ fontSize: 20, fontWeight: 600 }}>Notice Board</h2>
        <div className="premium-glass" style={{ padding: 4, display: "flex", gap: 4 }}>
           {["all", "unread", "pinned"].map(t => (
             <button 
              key={t} onClick={() => setFilter(t)}
              className={`btn-premium ${filter === t ? "active" : ""}`}
              style={{ padding: "4px 12px", fontSize: 11, border: "none", background: filter === t ? "rgba(255,255,255,0.1)" : "transparent" }}
             >
               {t.charAt(0).toUpperCase() + t.slice(1)}
             </button>
           ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        <AnimatePresence>
          {filtered.map((notice, idx) => (
            <motion.div
              key={notice._id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => handleNoticeClick(notice)}
              className="premium-glass"
              style={{ 
                padding: 24, cursor: "pointer", position: "relative",
                borderTop: notice.priority === "urgent" ? "4px solid var(--c-danger)" : "none"
              }}
            >
              {notice.isPinned && <Pin size={14} style={{ position: "absolute", top: 12, right: 12, color: "var(--c-warning)" }} />}
              
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                 <div style={{ 
                   width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.03)", 
                   display: "flex", alignItems: "center", justifyContent: "center" 
                 }}>
                    <MessageSquare size={18} color="var(--c-text-muted)" />
                 </div>
                 <div>
                    <div style={{ fontSize: 11, color: "var(--c-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{notice.priority}</div>
                    <div style={{ fontSize: 12, color: "var(--c-text-muted)" }}>{new Date(notice.createdAt).toLocaleDateString()}</div>
                 </div>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 12 }}>{notice.title}</h3>
              <p style={{ 
                fontSize: 14, color: "var(--c-text-muted)", lineHeight: 1.6, marginBottom: 16,
                display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden"
              }}>
                {notice.message}
              </p>
              {notice.attachments?.length > 0 && (
                <div style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 8 }}>
                   {notice.attachments.map((att, ai) => (
                     <a 
                       key={ai} 
                       href={att.url} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       onClick={(e) => e.stopPropagation()}
                       className="btn-premium"
                       style={{ padding: "6px 12px", fontSize: 10, background: "rgba(59, 130, 246, 0.1)", borderColor: "rgba(59, 130, 246, 0.2)", color: "var(--c-accent)" }}
                     >
                        <Download size={12} /> {att.name || "File"}
                     </a>
                   ))}
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--c-border)", paddingTop: 16 }}>
                 <div style={{ fontSize: 12, color: "var(--c-text-dim)" }}>
                   From: <span style={{ color: "var(--c-text-muted)" }}>{notice.senderId?.name}</span>
                 </div>
                 {notice.isUnread && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--c-accent)", fontWeight: 600 }}>
                       <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--c-accent)" }} />
                       NEW
                    </div>
                 )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Notice Detail Modal */}
      <Modal 
        isOpen={!!selectedNotice} 
        onClose={() => setSelectedNotice(null)}
        title="Announcement Detail"
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
                  <Paperclip size={16} /> Attachments
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

            <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid var(--c-border)", paddingTop: 24, marginTop: 12 }}>
               <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--c-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800 }}>
                 {selectedNotice.senderId?.name?.[0]}
               </div>
               <div>
                  <div style={{ fontSize: 12, color: "var(--c-text-dim)" }}>Sent by</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{selectedNotice.senderId?.name}</div>
               </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
