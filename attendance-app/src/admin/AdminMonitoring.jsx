import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { SectionHeader, Card, Badge, EmptyState } from "../components.jsx";

const G = { text:"#f1f5f9", text2:"#94a3b8", text3:"#64748b", success:"#10b981", danger:"#ef4444", warning:"#f59e0b" };

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { dateStyle:"medium", timeStyle:"short" });
}

function StatPill({ label, value, color }) {
  return (
    <div style={{ textAlign:"center", padding:"12px 16px", borderRadius:12, background:`${color}10`, border:`1px solid ${color}25` }}>
      <div style={{ fontSize:22, fontWeight:900, color }}>{value}</div>
      <div style={{ fontSize:11, color:G.text3, fontWeight:600 }}>{label}</div>
    </div>
  );
}

export default function AdminMonitoring({ showToast }) {
  const [sessions, setSessions]     = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState("sessions"); // sessions | attendance | teachers
  
  const [filterSubject, setFilterSubject] = useState("");
  const [filterClass, setFilterClass] = useState("");

  const load = useCallback(async () => {
    try {
      const [actRes, perfRes] = await Promise.all([
        api.get("/admin/activity"),
        api.get("/admin/teacher-performance"),
      ]);
      setSessions(actRes.data.recentSessions);
      setAttendance(actRes.data.recentAttendance);
      setPerformance(perfRes.data);
    } catch (e) { showToast("Failed to load monitoring data","danger"); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 10000); return () => clearInterval(iv); }, [load]);

  const activeSessions = sessions.filter(s => s.status === "active");

  const filterData = (data) => {
    return data.filter(item => {
      const matchSub = !filterSubject || (item.subject && item.subject.toLowerCase().includes(filterSubject.toLowerCase()));
      const classStr = `Sem ${item.semester || ""} ${item.section || ""}`.toLowerCase();
      const matchClass = !filterClass || classStr.includes(filterClass.toLowerCase());
      return matchSub && matchClass;
    });
  };

  const filteredSessions = filterData(sessions);
  const filteredAttendance = filterData(attendance);

  return (
    <div className="anim-fade-up">
      <SectionHeader title="Live Monitoring" subtitle="Real-time teacher activity and session tracking" />

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:12, marginBottom:24 }}>
        <StatPill label="Active Sessions" value={activeSessions.length} color="#ef4444" />
        <StatPill label="Recent Sessions" value={sessions.length} color="#f59e0b" />
        <StatPill label="Recent Attendance" value={attendance.length} color="#10b981" />
        <StatPill label="Teachers Monitored" value={performance.length} color="#6366f1" />
      </div>

      {/* View Tabs & Filters */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:16, marginBottom:20, alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", gap:8 }}>
          {["sessions","attendance","teachers"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding:"8px 20px", borderRadius:20, fontSize:13, fontWeight:600, cursor:"pointer",
              background: view===v ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
              border: view===v ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.08)",
              color: view===v ? "#a5b4fc" : G.text2, transition:"all 0.15s",
            }}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>
          ))}
        </div>
        
        {view !== "teachers" && (
          <div style={{ display:"flex", gap:12 }}>
            <input 
              type="text" 
              placeholder="Filter by Subject..." 
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              style={{ padding:"8px 16px", borderRadius:12, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(0,0,0,0.2)", color:"#fff", fontSize:13 }}
            />
            <input 
              type="text" 
              placeholder="Filter by Class (e.g. Sem 4 A)..." 
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              style={{ padding:"8px 16px", borderRadius:12, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(0,0,0,0.2)", color:"#fff", fontSize:13 }}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="skeleton" style={{ height:300, borderRadius:16 }} />
      ) : view === "sessions" ? (
        <Card style={{ padding:0, overflow:"hidden" }}>
          <table className="glass-table">
            <thead><tr>{["Subject","Teacher","Sem / Sec","Status","PIN","Started"].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filteredSessions.length === 0
                ? <tr><td colSpan={6}><EmptyState icon="📡" message="No sessions match filters" /></td></tr>
                : filteredSessions.map(s => (
                  <tr key={s._id}>
                    <td style={{ fontWeight:700, color:G.text }}>{s.subject}</td>
                    <td style={{ color:G.text2, fontSize:13 }}>{s.teacherId?.name || "—"}</td>
                    <td style={{ color:G.text3, fontSize:12 }}>Sem {s.semester} · {s.section}</td>
                    <td><Badge color={s.status==="active"?"success":s.status==="locked"?"warning":"danger"}>{s.status}</Badge></td>
                    <td style={{ fontFamily:"'JetBrains Mono',monospace", color:"#a5b4fc", fontSize:13 }}>{s.pin}</td>
                    <td style={{ fontSize:12, color:G.text3 }}>{fmt(s.createdAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      ) : view === "attendance" ? (
        <Card style={{ padding:0, overflow:"hidden" }}>
          <table className="glass-table">
            <thead><tr>{["Student","Enrollment","Subject","Teacher","Method","Marked At"].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filteredAttendance.length === 0
                ? <tr><td colSpan={6}><EmptyState icon="✅" message="No attendance records match filters" /></td></tr>
                : filteredAttendance.map(a => (
                  <tr key={a._id}>
                    <td style={{ fontWeight:700, color:G.text }}>{a.studentName}</td>
                    <td style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:"#a5b4fc" }}>{a.enrollment}</td>
                    <td style={{ color:G.text2 }}>{a.subject}</td>
                    <td style={{ color:G.text3, fontSize:13 }}>{a.teacherId?.name || "—"}</td>
                    <td><Badge color={a.method==="manual"?"warning":"success"}>{a.method}</Badge></td>
                    <td style={{ fontSize:12, color:G.text3 }}>{fmt(a.markedAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
          {performance.length === 0
            ? <EmptyState icon="👩‍🏫" message="No teacher data" />
            : performance.map(p => (
              <Card key={p.teacher._id} hover style={{ padding:"20px 24px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                  <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, color:"#a5b4fc" }}>
                    {p.teacher.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:14, color:G.text }}>{p.teacher.name}</div>
                    <div style={{ fontSize:11, color:G.text3 }}>{p.teacher.department || "—"}</div>
                  </div>
                  <Badge color={p.teacher.status==="active"?"success":"danger"} style={{ marginLeft:"auto" }}>{p.teacher.status}</Badge>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  <StatPill label="Sessions" value={p.sessions} color="#6366f1" />
                  <StatPill label="Active" value={p.activeSessions} color="#ef4444" />
                  <StatPill label="Attendance" value={p.totalAttendance} color="#10b981" />
                </div>
                {p.lastActivity && (
                  <div style={{ fontSize:11, color:G.text3, marginTop:12, textAlign:"center" }}>Last activity: {fmt(p.lastActivity)}</div>
                )}
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
