import { getSessions, getAttendance, getStudents } from "../services/db.js";
import { SectionHeader, Card, Badge, ProgressBar } from "../components.jsx";

const G = { text:"#f1f5f9", text2:"#94a3b8", text3:"#64748b", success:"#10b981", danger:"#ef4444", warning:"#f59e0b" };

function StatCard({ icon, label, value, color }) {
  return (
    <Card style={{ padding:"20px 22px", borderColor:`${color}25` }}>
      <div style={{ fontSize:28, marginBottom:10 }}>{icon}</div>
      <div style={{ fontSize:28, fontWeight:900, color, letterSpacing:"-0.02em" }}>{value}</div>
      <div style={{ fontSize:12, color:G.text3, fontWeight:600, marginTop:4 }}>{label}</div>
    </Card>
  );
}

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN",{ dateStyle:"medium", timeStyle:"short" });
}

export default function TeacherOverview({ user, setTab }) {
  const sessions   = getSessions();
  const attendance = getAttendance();
  const students   = getStudents();

  const activeSessions = sessions.filter(s => s.status === "active");
  const todayAtt = attendance.filter(a => {
    const d = new Date(a.markedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  // Recent sessions
  const recent = [...sessions].sort((a,b) => new Date(b.createdAt||b.markedAt) - new Date(a.createdAt||a.markedAt)).slice(0,5);

  return (
    <div className="anim-fade-up">
      <SectionHeader
        title={`Welcome, ${user?.name?.split(" ")[0] || "Teacher"} 👋`}
        subtitle={`${user?.department || "Faculty"} · ${user?.designation || "Teacher"}`}
      />

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:16, marginBottom:32 }}>
        <StatCard icon="📡" label="Active Sessions"    value={activeSessions.length} color="#ef4444" />
        <StatCard icon="📋" label="Total Sessions"     value={sessions.length}       color="#6366f1" />
        <StatCard icon="✅" label="Total Attendance"   value={attendance.length}     color="#10b981" />
        <StatCard icon="📅" label="Today's Attendance" value={todayAtt.length}       color="#f59e0b" />
        <StatCard icon="👥" label="Total Students"     value={students.length}       color="#06b6d4" />
      </div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <>
          <SectionHeader title="🔴 Live Sessions" subtitle="Currently active attendance sessions" />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14, marginBottom:28 }}>
            {activeSessions.map(s => (
              <Card key={s._id||s.id} hover style={{ padding:"18px 22px", border:"1px solid rgba(239,68,68,0.3)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <Badge color="danger">🔴 LIVE</Badge>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:900, color:"#a5b4fc", letterSpacing:"0.1em" }}>{s.pin}</span>
                </div>
                <div style={{ fontWeight:800, fontSize:15, color:G.text, marginBottom:4 }}>{s.subject}</div>
                <div style={{ fontSize:12, color:G.text3 }}>Sem {s.semester} · Sec {s.section}</div>
                <div style={{ fontSize:12, color:G.success, marginTop:8 }}>👥 {s.attendeeCount||0} attended</div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Recent Sessions */}
      <SectionHeader title="Recent Sessions" subtitle="Your last few attendance sessions"
        action={<button onClick={() => setTab("sessions")} style={{ background:"none", border:"none", color:"#a5b4fc", cursor:"pointer", fontSize:13, fontWeight:600 }}>View All →</button>}
      />
      <Card style={{ padding:0, overflow:"hidden" }}>
        <table className="glass-table">
          <thead><tr>{["Subject","Sem / Sec","Status","PIN","Attendees","Created"].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {recent.length === 0
              ? <tr><td colSpan={6} style={{ textAlign:"center", color:G.text3, padding:32, fontSize:13 }}>No sessions yet. Start one from Sessions tab.</td></tr>
              : recent.map(s => (
                <tr key={s._id||s.id}>
                  <td style={{ fontWeight:700, color:G.text }}>{s.subject}</td>
                  <td style={{ color:G.text2, fontSize:12 }}>Sem {s.semester} · {s.section}</td>
                  <td><Badge color={s.status==="active"?"success":s.status==="locked"?"warning":"danger"}>{s.status}</Badge></td>
                  <td style={{ fontFamily:"'JetBrains Mono',monospace", color:"#a5b4fc", fontSize:13 }}>{s.pin}</td>
                  <td style={{ color:G.text2 }}>{s.attendeeCount||0}</td>
                  <td style={{ fontSize:12, color:G.text3 }}>{fmt(s.createdAt)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </Card>

      {/* Role note */}
      <div style={{ marginTop:24, background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.15)", borderRadius:14, padding:"16px 20px" }}>
        <p style={{ color:G.text2, fontSize:13, margin:0 }}>
          <strong style={{ color:"#6ee7b7" }}>Teacher Portal:</strong> You can take attendance, manage sessions, view assigned students and subjects.
          Contact your Admin (Dean) to add new subjects or students.
        </p>
      </div>
    </div>
  );
}
