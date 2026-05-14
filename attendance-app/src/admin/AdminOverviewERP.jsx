import { motion } from "framer-motion";
import { 
  Users, GraduationCap, BookOpen, Building2, 
  Activity, TrendingUp, CalendarDays, CheckSquare,
  ArrowUpRight, Clock, ChevronRight, Zap, MessageSquare
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 260, 
      damping: 20 
    } 
  }
};

export default function AdminOverviewERP({ stats, setTab, showToast }) {
  const cards = [
    { icon: Users,        label: "Total Teachers",    value: stats.totalTeachers,   color: "#6366f1", tab: "teachers", trend: "+12%" },
    { icon: GraduationCap,label: "Total Students",    value: stats.totalStudents,   color: "#10b981", tab: "students", trend: "+5%" },
    { icon: CalendarDays, label: "Total Sessions",    value: stats.totalSessions,   color: "#f59e0b", tab: "monitoring", trend: "+18%" },
    { icon: Activity,     label: "Active Sessions",   value: stats.activeSessions,  color: "#ef4444", tab: "monitoring", trend: "Live" },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexDirection: "column", gap: 32 }}
    >
      {/* Header Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 className="font-heading" style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.04em", marginBottom: 4 }}>
            Dashboard <span style={{ color: "var(--c-text-dim)", fontWeight: 400 }}>Overview</span>
          </h1>
          <p style={{ color: "var(--c-text-muted)", fontSize: 14 }}>Welcome back, Dean. Here's what's happening today.</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-premium" style={{ gap: 8 }}>
            <Clock size={14} /> Last 24h
          </button>
          <button className="btn-premium-primary btn-premium" style={{ background: "var(--c-accent)", color: "#fff" }}>
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
        gap: 20 
      }}>
        {cards.map((c, i) => (
          <StatCard key={i} {...c} onClick={() => setTab(c.tab)} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        {/* Main Section: Quick Actions & More Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="premium-glass" style={{ padding: 24 }}>
            <h3 className="font-heading" style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={16} color="var(--c-warning)" /> Quick Actions
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              {[
                { label: "Add Teacher", icon: Users, tab: "teachers" },
                { label: "Add Student", icon: GraduationCap, tab: "students" },
                { label: "New Notice", icon: MessageSquare, tab: "notices" },
                { label: "View Analytics", icon: TrendingUp, tab: "analytics" },
              ].map((q, idx) => (
                <button 
                  key={idx}
                  onClick={() => setTab(q.tab)}
                  className="btn-premium" 
                  style={{ 
                    flexDirection: "column", height: 100, gap: 12, 
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--c-border)"
                  }}
                >
                  <q.icon size={24} color="var(--c-text-muted)" />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{q.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Secondary Stats/Chart Placeholder */}
          <motion.div variants={itemVariants} className="premium-glass" style={{ padding: 24, height: 300, position: "relative", overflow: "hidden" }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 className="font-heading" style={{ fontSize: 16, fontWeight: 600 }}>Attendance Trends</h3>
                <TrendingUp size={16} color="var(--c-success)" />
             </div>
             <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "flex-end", gap: 8, paddingBottom: 40 }}>
                {[40, 70, 45, 90, 65, 80, 50, 85, 95, 60, 75, 80].map((h, i) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.8 }}
                    style={{ 
                      flex: 1, 
                      background: i === 8 ? "var(--c-accent)" : "rgba(255,255,255,0.1)", 
                      borderRadius: "4px 4px 0 0",
                      boxShadow: i === 8 ? "0 0 20px var(--c-accent-glow)" : "none"
                    }} 
                  />
                ))}
             </div>
             <div style={{ position: "absolute", bottom: 20, left: 24, right: 24, display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--c-text-dim)" }}>
                <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span><span>JUL</span><span>AUG</span><span>SEP</span><span>OCT</span><span>NOV</span><span>DEC</span>
             </div>
          </motion.div>
        </div>

        {/* Sidebar Section: Activity Timeline */}
        <motion.div variants={itemVariants} className="premium-glass" style={{ padding: 24, display: "flex", flexDirection: "column" }}>
          <h3 className="font-heading" style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Recent Activity</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
            {[
              { type: "attendance", user: "Prof. Sharma", action: "started a session", time: "2 min ago", color: "var(--c-accent)" },
              { type: "student", user: "Rahul K.", action: "marked attendance", time: "5 min ago", color: "var(--c-success)" },
              { type: "notice", user: "Admin", action: "posted a new notice", time: "12 min ago", color: "var(--c-warning)" },
              { type: "system", user: "Database", action: "automated backup successful", time: "1h ago", color: "var(--c-info)" },
              { type: "attendance", user: "Dr. Verma", action: "closed session MCA-3", time: "2h ago", color: "var(--c-danger)" },
            ].map((activity, idx) => (
              <div key={idx} style={{ display: "flex", gap: 12, position: "relative" }}>
                {idx !== 4 && <div style={{ position: "absolute", left: 7, top: 20, bottom: -20, width: 1, background: "var(--c-border)" }} />}
                <div style={{ 
                  width: 16, height: 16, borderRadius: "50%", background: activity.color, 
                  marginTop: 4, zIndex: 1, boxShadow: `0 0 10px ${activity.color}66` 
                }} />
                <div>
                  <div style={{ fontSize: 13, color: "var(--c-text)" }}>
                    <span style={{ fontWeight: 600 }}>{activity.user}</span> {activity.action}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--c-text-dim)", marginTop: 2 }}>{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-premium" style={{ marginTop: "auto", justifyContent: "space-between", width: "100%", fontSize: 12 }}>
            View All Activity <ChevronRight size={14} />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, color, trend, onClick }) {
  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onClick={onClick} 
      className="premium-glass"
      style={{ 
        padding: 24, 
        cursor: "pointer",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Decorative Glow */}
      <div style={{ 
        position: "absolute", top: -20, right: -20, width: 80, height: 80, 
        background: color, filter: "blur(40px)", opacity: 0.1 
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ 
          width: 40, height: 40, borderRadius: 10, background: `${color}15`, 
          border: `1px solid ${color}33`, display: "flex", alignItems: "center", justifyContent: "center" 
        }}>
          <Icon size={20} color={color} />
        </div>
        <div style={{ 
          fontSize: 10, fontWeight: 700, color: color === "#ef4444" ? "#fff" : "var(--c-success)", 
          background: color === "#ef4444" ? "var(--c-danger)" : "rgba(16, 185, 129, 0.1)", 
          padding: "2px 8px", borderRadius: 10, display: "flex", alignItems: "center", gap: 4
        }}>
          {trend === "Live" ? <span className="shimmer" style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} /> : <ArrowUpRight size={10} />}
          {trend}
        </div>
      </div>
      
      <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", marginBottom: 4 }}>
        {value != null ? value : <div className="shimmer" style={{ width: 60, height: 30, borderRadius: 4 }} />}
      </div>
      <div style={{ fontSize: 13, color: "var(--c-text-dim)", fontWeight: 500 }}>{label}</div>
    </motion.div>
  );
}

const MessageSquarePlaceholder = ({ size, color }) => (
  <div style={{ width: size, height: size, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  </div>
);

