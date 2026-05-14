import { fmtDate, now } from "./utils.js";
import { getSessions, getStudents, getAttendance, getSubjects } from "./services/db.js";
import { getSessionsForStudent } from "./services/sessionService.js";
import { StatCard, DonutChart, BarChart, Card, Badge, Btn, SectionHeader, EmptyState, SkeletonCard } from "./components.jsx";

const G = { primary:"#6366f1", success:"#10b981", warning:"#f59e0b", danger:"#ef4444", accent:"#06b6d4", text:"#f1f5f9", text2:"#94a3b8", text3:"#64748b", mono:"'JetBrains Mono',monospace" };

// ─── ADMIN OVERVIEW ──────────────────────────────────────────────────────────
export function AdminOverview({ setTab }) {
  const sessions   = getSessions();
  const students   = getStudents();
  const attendance = getAttendance();
  const subjects   = getSubjects();

  const activeSessions = sessions.filter(s => s.status === "active").length;
  const todayAtt = attendance.filter(a => fmtDate(a.markedAt) === fmtDate(now())).length;

  // Accurate rate: for each student, count their cohort sessions, sum attendance
  let totalSlots = 0, totalAttended = 0;
  students.forEach(stu => {
    const cohortSessions = getSessionsForStudent(stu.semester, stu.section);
    totalSlots += cohortSessions.length;
    totalAttended += attendance.filter(a =>
      a.enrollment === stu.enrollment && cohortSessions.some(s => s.id === a.sessionId)
    ).length;
  });
  const attendanceRate = totalSlots > 0 ? Math.min(Math.round((totalAttended / totalSlots) * 100), 100) : 0;

  const recent = [...sessions].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,4);

  return (
    <div className="anim-fade-up">
      <div style={{ marginBottom:"28px" }}>
        <h1 style={{ fontSize:"24px", fontWeight:900, color:G.text, letterSpacing:"-0.02em" }}>Dashboard Overview</h1>
        <p style={{ color:G.text2, fontSize:"13px", marginTop:"6px" }}>Welcome back! Here's today's real-time snapshot.</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"24px" }}>
        <StatCard icon="👥" label="Total Students"      value={students.length}  color={G.primary} />
        <StatCard icon="🟢" label="Active Sessions"     value={activeSessions}   color={G.success} sub={activeSessions > 0 ? "Live now" : undefined} />
        <StatCard icon="✅" label="Today's Attendance"  value={todayAtt}         color={G.accent}  />
        <StatCard icon="📚" label="Subjects"            value={subjects.length}  color={G.warning} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:"16px" }}>
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
            <p style={{ fontWeight:700, fontSize:"15px", color:G.text }}>Recent Sessions</p>
            <Btn variant="secondary" size="sm" onClick={() => setTab("sessions")}>View All</Btn>
          </div>
          {recent.length === 0
            ? <EmptyState icon="📋" message="No sessions yet" sub="Create your first session from the Sessions tab" />
            : recent.map(s => (
              <div key={s.id} style={{ display:"flex", alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:600, fontSize:"14px", color:G.text }}>{s.subject}</p>
                  <p style={{ fontSize:"12px", color:G.text3, marginTop:"2px" }}>
                    Sem {s.semester} • Sec {s.section} • PIN:{" "}
                    <span style={{ fontFamily:G.mono, color:"#a5b4fc", fontWeight:700 }}>{s.pin}</span>
                  </p>
                </div>
                <Badge color={s.status==="active"?"success":s.status==="locked"?"warning":"gray"}>{s.status}</Badge>
              </div>
            ))
          }
        </Card>

        <Card style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px" }}>
          <DonutChart percent={attendanceRate} size={130} />
          <div style={{ textAlign:"center" }}>
            <p style={{ fontWeight:800, fontSize:"15px", color:G.text }}>Overall Attendance</p>
            <p style={{ fontSize:"12px", color:G.text2, marginTop:"4px" }}>{totalAttended} / {totalSlots} cohort slots filled</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── ADMIN ANALYTICS ─────────────────────────────────────────────────────────
export function AdminAnalytics() {
  const attendance = getAttendance();
  const students   = getStudents();
  const subjects   = getSubjects();

  const subjectData = subjects.map(s => ({
    label: s.substring(0, 8),
    value: attendance.filter(a => a.subject === s).length,
  }));

  const sectionData = ["A","B","C","D"].map(sec => ({
    label: `Sec ${sec}`,
    value: attendance.filter(a => a.section === sec).length,
  })).filter(d => d.value > 0);

  // Accurate overall rate
  let totalSlots = 0, totalAttended = 0;
  students.forEach(stu => {
    const cohortSessions = getSessionsForStudent(stu.semester, stu.section);
    totalSlots    += cohortSessions.length;
    totalAttended += attendance.filter(a =>
      a.enrollment === stu.enrollment && cohortSessions.some(s => s.id === a.sessionId)
    ).length;
  });
  const rate = totalSlots > 0 ? Math.min(Math.round((totalAttended / totalSlots) * 100), 100) : 0;

  const enrollCounts = {};
  attendance.forEach(a => { enrollCounts[a.enrollment] = (enrollCounts[a.enrollment]||0) + 1; });
  const topStudents = Object.entries(enrollCounts)
    .sort((a,b) => b[1]-a[1]).slice(0,5)
    .map(([enroll, count]) => {
      const st = students.find(s => s.enrollment === enroll);
      return { name: st?.name || enroll, count };
    });

  // Semester distribution
  const semData = ["1","2","3","4","5","6","7","8"].map(sem => ({
    label: `S${sem}`,
    value: attendance.filter(a => String(a.semester) === sem).length,
  })).filter(d => d.value > 0);

  return (
    <div className="anim-fade-up">
      <SectionHeader title="Analytics" subtitle="Attendance insights and trends across cohorts" />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px" }}>
        <Card>
          <p style={{ fontWeight:700, fontSize:"15px", color:G.text, marginBottom:"20px" }}>By Subject</p>
          <BarChart data={subjectData} />
        </Card>
        <Card>
          <p style={{ fontWeight:700, fontSize:"15px", color:G.text, marginBottom:"20px" }}>By Section</p>
          <BarChart data={sectionData} />
        </Card>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 2fr", gap:"16px" }}>
        <Card style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"14px" }}>
          <DonutChart percent={rate} size={120} />
          <div style={{ textAlign:"center" }}>
            <p style={{ fontWeight:800, fontSize:"15px", color:G.text }}>Cohort Rate</p>
            <p style={{ fontSize:"12px", color:G.text2 }}>{totalAttended} / {totalSlots} slots</p>
          </div>
        </Card>
        <Card>
          <p style={{ fontWeight:700, fontSize:"15px", color:G.text, marginBottom:"16px" }}>By Semester</p>
          <BarChart data={semData} />
        </Card>
        <Card>
          <p style={{ fontWeight:700, fontSize:"15px", color:G.text, marginBottom:"16px" }}>🏆 Top Attendees</p>
          {topStudents.length === 0
            ? <EmptyState icon="🏆" message="No data yet" />
            : topStudents.map((s, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 0", borderBottom: i < topStudents.length-1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{ width:"28px", height:"28px", background: i===0?"rgba(245,158,11,0.2)":"rgba(99,102,241,0.15)", border:`1px solid ${i===0?"rgba(245,158,11,0.4)":"rgba(99,102,241,0.3)"}`, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"13px", color: i===0?G.warning:"#a5b4fc" }}>{i+1}</div>
                <span style={{ flex:1, fontWeight:600, fontSize:"14px", color:G.text }}>{s.name}</span>
                <Badge color="primary">{s.count} sessions</Badge>
              </div>
            ))
          }
        </Card>
      </div>
    </div>
  );
}
