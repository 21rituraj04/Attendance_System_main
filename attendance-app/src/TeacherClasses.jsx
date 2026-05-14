import { useState, useMemo } from "react";
import { getSessions, getStudents, getAttendance } from "./services/db.js";
import { Card, Badge, Btn, SectionHeader, DonutChart, ProgressBar, EmptyState } from "./components.jsx";

const G = {
  primary:"#6366f1", success:"#10b981", warning:"#f59e0b", danger:"#ef4444",
  accent:"#06b6d4", text:"#f1f5f9", text2:"#94a3b8", text3:"#64748b",
  mono:"'JetBrains Mono',monospace",
};

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────
function getTodayStr() {
  return new Date().toDateString();
}

function sessionToday(session) {
  return new Date(session.createdAt).toDateString() === getTodayStr();
}

// ─── CLASS CARD ───────────────────────────────────────────────────────────────
function ClassCard({ cohort, onViewAttendance, onCreateSession }) {
  const { subject, semester, section, sessions, students, attendance } = cohort;
  const [expanded, setExpanded] = useState(false);

  const totalStudents = students.length;
  const totalSessions = sessions.length;
  const activeSess    = sessions.filter(s => s.status === "active").length;

  // Present count per session → avg rate
  let totalSlots = 0, totalPresent = 0;
  students.forEach(stu => {
    const sessIds = sessions.map(s => s.id || s._id);
    const attended = attendance.filter(a =>
      a.enrollment === stu.enrollment && sessIds.includes(a.sessionId)
    ).length;
    totalSlots   += sessions.length;
    totalPresent += attended;
  });
  const rate = totalSlots > 0 ? Math.round((totalPresent / totalSlots) * 100) : 0;

  // Today's session attendance
  const todaySessions = sessions.filter(sessionToday);
  const todayPresent  = todaySessions.reduce((acc, s) => {
    return acc + attendance.filter(a => a.sessionId === (s.id || s._id)).length;
  }, 0);

  // Low-attendance students (<75%)
  const atRisk = students.filter(stu => {
    if (sessions.length === 0) return false;
    const attended = attendance.filter(a =>
      a.enrollment === stu.enrollment && sessions.some(s => (s.id||s._id) === a.sessionId)
    ).length;
    return (attended / sessions.length) < 0.75;
  });

  const rateColor = rate >= 75 ? G.success : rate >= 50 ? G.warning : G.danger;
  const subjectColor = stringToColor(subject + semester + section);

  return (
    <div style={{
      background:"rgba(255,255,255,0.03)",
      border:`1px solid rgba(255,255,255,0.08)`,
      borderRadius:"20px",
      overflow:"hidden",
      transition:"transform 0.2s ease, box-shadow 0.2s ease",
      boxShadow:"0 4px 24px rgba(0,0,0,0.3)",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 40px rgba(0,0,0,0.5), 0 0 24px rgba(99,102,241,0.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 24px rgba(0,0,0,0.3)"; }}
    >
      {/* Color bar */}
      <div style={{ height:"4px", background:`linear-gradient(to right, ${subjectColor}, ${rateColor})` }} />

      <div style={{ padding:"20px" }}>
        {/* Header Row */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
              <span style={{ fontSize:"15px", fontWeight:800, color:G.text }}>{subject}</span>
              {activeSess > 0 && (
                <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", fontSize:"10px", color:G.success, background:"rgba(16,185,129,0.12)", border:"1px solid rgba(16,185,129,0.3)", borderRadius:"20px", padding:"2px 8px", fontWeight:700 }}>
                  <span style={{ width:"5px", height:"5px", background:G.success, borderRadius:"50%", animation:"pulse 1.5s infinite" }} />
                  LIVE
                </span>
              )}
            </div>
            <div style={{ fontSize:"12px", color:G.text3, marginTop:"4px" }}>
              Semester {semester} &nbsp;·&nbsp; Section <strong style={{ color:G.text2 }}>{section}</strong>
            </div>
          </div>
          <DonutChart percent={rate} size={70} />
        </div>

        {/* Stats Row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"16px" }}>
          <MiniStat label="Students" value={totalStudents} icon="👥" />
          <MiniStat label="Sessions" value={totalSessions} icon="📋" />
          <MiniStat label="Avg Rate" value={`${rate}%`} icon="📈" color={rateColor} />
        </div>

        {/* Today's attendance highlight */}
        {todaySessions.length > 0 && (
          <div style={{
            background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)",
            borderRadius:"12px", padding:"10px 14px", marginBottom:"14px",
            display:"flex", alignItems:"center", justifyContent:"space-between",
          }}>
            <div>
              <div style={{ fontSize:"11px", color:G.text3, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:"2px" }}>Today's Attendance</div>
              <div style={{ fontSize:"18px", fontWeight:900, color:G.text }}>
                {todayPresent}
                <span style={{ fontSize:"13px", fontWeight:500, color:G.text2 }}> / {totalStudents} students</span>
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:"11px", color:G.text3, marginBottom:"4px" }}>
                {todaySessions.length} session{todaySessions.length > 1 ? "s" : ""} today
              </div>
              <ProgressBar value={todayPresent} max={Math.max(totalStudents, 1)} />
            </div>
          </div>
        )}

        {/* At-risk alert */}
        {atRisk.length > 0 && (
          <div style={{
            background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.18)",
            borderRadius:"10px", padding:"8px 12px", marginBottom:"14px",
            display:"flex", alignItems:"center", gap:"8px", cursor:"pointer",
          }} onClick={() => setExpanded(v => !v)}>
            <span style={{ fontSize:"14px" }}>⚠️</span>
            <span style={{ fontSize:"12px", color:"#fca5a5", fontWeight:600, flex:1 }}>
              {atRisk.length} student{atRisk.length > 1 ? "s" : ""} below 75% attendance
            </span>
            <span style={{ fontSize:"11px", color:G.text3 }}>{expanded ? "▲" : "▼"}</span>
          </div>
        )}

        {/* Expandable at-risk list */}
        {expanded && atRisk.length > 0 && (
          <div style={{ marginBottom:"14px", display:"flex", flexDirection:"column", gap:"6px" }}>
            {atRisk.slice(0, 5).map(stu => {
              const att = attendance.filter(a =>
                a.enrollment === stu.enrollment && sessions.some(s => (s.id||s._id) === a.sessionId)
              ).length;
              const r = sessions.length > 0 ? Math.round((att / sessions.length) * 100) : 0;
              return (
                <div key={stu.enrollment} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 10px", background:"rgba(239,68,68,0.05)", borderRadius:"8px" }}>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:600, color:G.text }}>{stu.name}</div>
                    <div style={{ fontSize:"11px", color:G.text3, fontFamily:G.mono }}>{stu.enrollment}</div>
                  </div>
                  <span style={{ fontSize:"13px", fontWeight:800, color:G.danger }}>{r}%</span>
                </div>
              );
            })}
            {atRisk.length > 5 && (
              <div style={{ fontSize:"11px", color:G.text3, textAlign:"center" }}>+{atRisk.length - 5} more</div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display:"flex", gap:"8px" }}>
          <Btn size="sm" variant="secondary" onClick={() => onViewAttendance(subject, semester, section)} icon="📊">
            Attendance
          </Btn>
          <Btn size="sm" variant="primary" onClick={() => onCreateSession(subject, semester, section)} icon="➕">
            New Session
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── MINI STAT ────────────────────────────────────────────────────────────────
function MiniStat({ label, value, icon, color }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"10px", padding:"10px 12px", textAlign:"center" }}>
      <div style={{ fontSize:"16px", marginBottom:"4px" }}>{icon}</div>
      <div style={{ fontSize:"16px", fontWeight:800, color: color || G.text, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:"10px", color:G.text3, marginTop:"3px", textTransform:"uppercase", letterSpacing:"0.04em" }}>{label}</div>
    </div>
  );
}

// Deterministic color from string
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue},65%,60%)`;
}

// ─── ATTENDANCE BREAKDOWN PANEL ───────────────────────────────────────────────
function AttendanceBreakdown({ subject, semester, section, onClose }) {
  const sessions   = getSessions().filter(s => s.subject === subject && String(s.semester) === String(semester) && s.section === section);
  const students   = getStudents().filter(s => String(s.semester) === String(semester) && s.section === section);
  const attendance = getAttendance();
  const [search, setSearch] = useState("");

  const rows = students
    .filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.enrollment?.toLowerCase().includes(search.toLowerCase()))
    .map(stu => {
      const attended = attendance.filter(a =>
        a.enrollment === stu.enrollment && sessions.some(s => (s.id||s._id) === a.sessionId)
      ).length;
      const rate = sessions.length > 0 ? Math.round((attended / sessions.length) * 100) : 0;
      const lastSeen = attendance
        .filter(a => a.enrollment === stu.enrollment && sessions.some(s => (s.id||s._id) === a.sessionId))
        .sort((a, b) => new Date(b.markedAt) - new Date(a.markedAt))[0]?.markedAt;
      return { ...stu, attended, rate, lastSeen };
    })
    .sort((a, b) => b.rate - a.rate);

  const presentToday = attendance.filter(a =>
    sessions.some(s => (s.id||s._id) === a.sessionId) &&
    new Date(a.markedAt).toDateString() === getTodayStr()
  ).length;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:200,
      background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"20px",
    }}>
      <div style={{
        background:"linear-gradient(145deg, rgba(15,23,42,0.99), rgba(10,15,30,0.99))",
        border:"1px solid rgba(255,255,255,0.1)", borderRadius:"24px",
        width:"100%", maxWidth:"780px", maxHeight:"85vh",
        display:"flex", flexDirection:"column",
        boxShadow:"0 32px 80px rgba(0,0,0,0.7)",
        animation:"scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {/* Modal Header */}
        <div style={{ padding:"24px 28px 0", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"20px" }}>
            <div>
              <div style={{ fontSize:"18px", fontWeight:900, color:G.text }}>{subject}</div>
              <div style={{ fontSize:"13px", color:G.text2, marginTop:"4px" }}>
                Semester {semester} · Section {section} &nbsp;·&nbsp;
                <span style={{ color:G.accent }}>{sessions.length} sessions</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", padding:"8px 14px", color:G.text2, cursor:"pointer", fontWeight:600, fontSize:"13px" }}>
              ✕ Close
            </button>
          </div>

          {/* Quick stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px", marginBottom:"20px" }}>
            <QuickStat label="Enrolled" value={students.length} icon="👥" color={G.primary} />
            <QuickStat label="Today Present" value={presentToday} icon="✅" color={G.success} />
            <QuickStat label="Sessions" value={sessions.length} icon="📋" color={G.accent} />
            <QuickStat label="At Risk" value={rows.filter(r => r.rate < 75).length} icon="⚠️" color={G.danger} />
          </div>

          {/* Search */}
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search student…"
            style={{ width:"100%", background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"10px", padding:"10px 16px", color:G.text, fontSize:"14px", outline:"none", marginBottom:"12px", fontFamily:"Inter, system-ui", boxSizing:"border-box" }}
          />
        </div>

        {/* Table */}
        <div style={{ overflowY:"auto", flex:1, padding:"0 28px 24px" }}>
          {rows.length === 0
            ? <EmptyState icon="👥" message="No students found" />
            : (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  {["#","Student","Enrollment","Attended","Rate","Status","Last Seen"].map(h => (
                    <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:"10px", fontWeight:700, color:G.text3, textTransform:"uppercase", letterSpacing:"0.08em", borderBottom:"1px solid rgba(255,255,255,0.07)", position:"sticky", top:0, background:"rgba(10,15,30,0.95)", backdropFilter:"blur(8px)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((stu, i) => {
                  const rateColor = stu.rate >= 75 ? G.success : stu.rate >= 50 ? G.warning : G.danger;
                  return (
                    <tr key={stu.enrollment} style={{ transition:"background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.03)"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}
                    >
                      <td style={{ padding:"12px 12px", color:G.text3, fontSize:"12px" }}>{i+1}</td>
                      <td style={{ padding:"12px 12px" }}>
                        <div style={{ fontWeight:600, color:G.text, fontSize:"14px" }}>{stu.name}</div>
                      </td>
                      <td style={{ padding:"12px 12px", fontFamily:G.mono, fontSize:"12px", color:"#a5b4fc" }}>{stu.enrollment}</td>
                      <td style={{ padding:"12px 12px", color:G.text2 }}>{stu.attended} / {sessions.length}</td>
                      <td style={{ padding:"12px 12px", minWidth:"100px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                          <div style={{ flex:1 }}><ProgressBar value={stu.rate} max={100} /></div>
                          <span style={{ fontSize:"12px", fontWeight:800, color:rateColor, width:"34px", textAlign:"right" }}>{stu.rate}%</span>
                        </div>
                      </td>
                      <td style={{ padding:"12px 12px" }}>
                        <Badge color={stu.rate >= 75 ? "success" : stu.rate >= 50 ? "warning" : "danger"}>
                          {stu.rate >= 75 ? "Good" : stu.rate >= 50 ? "Warning" : "At Risk"}
                        </Badge>
                      </td>
                      <td style={{ padding:"12px 12px", fontSize:"12px", color:G.text3 }}>
                        {stu.lastSeen ? new Date(stu.lastSeen).toLocaleDateString("en-IN", { day:"numeric", month:"short" }) : "Never"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value, icon, color }) {
  return (
    <div style={{ background:`${color}12`, border:`1px solid ${color}30`, borderRadius:"12px", padding:"12px", textAlign:"center" }}>
      <div style={{ fontSize:"18px", marginBottom:"4px" }}>{icon}</div>
      <div style={{ fontSize:"22px", fontWeight:900, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:"10px", color:G.text3, marginTop:"3px", textTransform:"uppercase", letterSpacing:"0.04em" }}>{label}</div>
    </div>
  );
}

// ─── MAIN: TEACHER CLASSES VIEW ───────────────────────────────────────────────
export default function TeacherClasses({ setTab, showToast, onQuickSession }) {
  const sessions   = getSessions();
  const students   = getStudents();
  const attendance = getAttendance();

  const [viewAtt, setViewAtt] = useState(null); // { subject, semester, section }
  const [filterSem, setFilterSem] = useState("all");
  const [filterSec, setFilterSec] = useState("all");
  const [searchSubj, setSearchSubj] = useState("");

  // Build unique cohorts from sessions
  const cohorts = useMemo(() => {
    const map = {};
    sessions.forEach(s => {
      const key = `${s.subject}|${s.semester}|${s.section}`;
      if (!map[key]) map[key] = { subject:s.subject, semester:String(s.semester), section:s.section, sessions:[], students:[], attendance:[] };
      map[key].sessions.push(s);
    });
    Object.values(map).forEach(c => {
      c.students   = students.filter(s => String(s.semester) === c.semester && s.section === c.section);
      c.attendance = attendance.filter(a => c.sessions.some(s => (s.id||s._id) === a.sessionId));
    });
    return Object.values(map);
  }, [sessions, students, attendance]);

  const filtered = cohorts.filter(c =>
    (filterSem === "all" || c.semester === filterSem) &&
    (filterSec === "all" || c.section  === filterSec) &&
    c.subject.toLowerCase().includes(searchSubj.toLowerCase())
  );

  // Overall teacher stats
  const totalUnique = new Set(cohorts.map(c => c.subject)).size;
  const activeLive  = sessions.filter(s => s.status === "active").length;
  const totalStudentsManaged = new Set(students.map(s => s.enrollment)).size;
  const totalSessionsToday = sessions.filter(sessionToday).length;

  return (
    <div className="anim-fade-up">
      {/* Breakdown Modal */}
      {viewAtt && (
        <AttendanceBreakdown
          subject={viewAtt.subject} semester={viewAtt.semester} section={viewAtt.section}
          onClose={() => setViewAtt(null)}
        />
      )}

      {/* Page Header */}
      <div style={{ marginBottom:"28px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"12px" }}>
          <div>
            <h1 style={{ fontSize:"24px", fontWeight:900, color:G.text, letterSpacing:"-0.02em" }}>My Classes</h1>
            <p style={{ color:G.text2, fontSize:"13px", marginTop:"6px" }}>
              All subjects & sections you manage — attendance at a glance.
            </p>
          </div>
          <Btn onClick={() => setTab("sessions")} icon="➕">New Session</Btn>
        </div>
      </div>

      {/* Teacher-level stats bar */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px", marginBottom:"24px" }}>
        <TeacherStat icon="📚" label="Subjects" value={totalUnique} color={G.primary} />
        <TeacherStat icon="🏫" label="Classes" value={cohorts.length} color={G.accent} />
        <TeacherStat icon="👥" label="Students" value={totalStudentsManaged} color={G.success} />
        <TeacherStat icon="🟢" label="Live Now" value={activeLive} color={activeLive > 0 ? G.success : G.text3} pulse={activeLive > 0} />
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:"10px", marginBottom:"20px", flexWrap:"wrap" }}>
        <input
          value={searchSubj} onChange={e => setSearchSubj(e.target.value)}
          placeholder="🔍  Filter by subject…"
          style={{ flex:2, minWidth:"160px", background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"10px", padding:"10px 16px", color:G.text, fontSize:"14px", outline:"none", fontFamily:"Inter, system-ui" }}
        />
        <select value={filterSem} onChange={e => setFilterSem(e.target.value)} style={{ background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"10px", padding:"10px 14px", color:G.text2, fontSize:"14px", cursor:"pointer", outline:"none", fontFamily:"Inter, system-ui" }}>
          <option value="all">All Semesters</option>
          {["1","2","3","4","5","6","7","8"].map(v => <option key={v} value={v}>Sem {v}</option>)}
        </select>
        <select value={filterSec} onChange={e => setFilterSec(e.target.value)} style={{ background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"10px", padding:"10px 14px", color:G.text2, fontSize:"14px", cursor:"pointer", outline:"none", fontFamily:"Inter, system-ui" }}>
          <option value="all">All Sections</option>
          {["A","B","C","D"].map(v => <option key={v} value={v}>Section {v}</option>)}
        </select>
      </div>

      {/* Class Cards Grid */}
      {filtered.length === 0 ? (
        <EmptyState icon="🏫" message="No classes found"
          sub={cohorts.length === 0 ? "Create sessions to see your classes here" : "Try adjusting your filters"}
          action={cohorts.length === 0 && <Btn onClick={() => setTab("sessions")} icon="➕" style={{ marginTop:"12px" }}>Create First Session</Btn>}
        />
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:"16px" }}>
          {filtered.map(cohort => (
            <ClassCard
              key={`${cohort.subject}|${cohort.semester}|${cohort.section}`}
              cohort={cohort}
              onViewAttendance={(subject, semester, section) => setViewAtt({ subject, semester, section })}
              onCreateSession={(subject, semester, section) => {
                if (onQuickSession) onQuickSession(subject, semester, section);
                else setTab("sessions");
              }}
            />
          ))}
        </div>
      )}

      {/* Today's Summary strip */}
      {totalSessionsToday > 0 && (
        <div style={{ marginTop:"24px", background:"rgba(99,102,241,0.06)", border:"1px solid rgba(99,102,241,0.15)", borderRadius:"16px", padding:"16px 20px", display:"flex", alignItems:"center", gap:"16px", flexWrap:"wrap" }}>
          <span style={{ fontSize:"22px" }}>📅</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, color:G.text, fontSize:"14px" }}>Today's Activity</div>
            <div style={{ color:G.text2, fontSize:"13px", marginTop:"2px" }}>
              {totalSessionsToday} session{totalSessionsToday > 1 ? "s" : ""} held today across all your classes
            </div>
          </div>
          <Btn size="sm" variant="secondary" onClick={() => setTab("attendance")} icon="📊">View All Records</Btn>
        </div>
      )}
    </div>
  );
}

// ─── TEACHER STAT PILL ────────────────────────────────────────────────────────
function TeacherStat({ icon, label, value, color, pulse }) {
  return (
    <div className="glass card-hover" style={{ padding:"16px 18px", display:"flex", alignItems:"center", gap:"12px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:"-16px", right:"-16px", width:"70px", height:"70px", background:`radial-gradient(circle, ${color}22 0%, transparent 70%)`, borderRadius:"50%", pointerEvents:"none" }} />
      <div style={{ width:"42px", height:"42px", borderRadius:"12px", background:`${color}18`, border:`1px solid ${color}35`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0, position:"relative" }}>
        {icon}
        {pulse && <span style={{ position:"absolute", top:"-3px", right:"-3px", width:"8px", height:"8px", background:color, borderRadius:"50%", animation:"pulse 1.5s infinite", boxShadow:`0 0 6px ${color}` }} />}
      </div>
      <div>
        <div style={{ fontSize:"11px", color:G.text2, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</div>
        <div style={{ fontSize:"24px", fontWeight:800, color:G.text, lineHeight:1 }}>{value}</div>
      </div>
    </div>
  );
}
