import { useState, useEffect, useRef } from "react";
import { fmt, getStudentSessions, calcAttendanceRate } from "./utils.js";
import { getAttendance, getSessions } from "./services/db.js";
import { markAttendance, exportCSV } from "./services/attendanceService.js";
import { Btn, Input, Select, Card, Badge, Alert, DonutChart, BarChart, SectionHeader, EmptyState, ProgressBar } from "./components.jsx";
import jsQR from "jsqr";

const G = { primary:"#6366f1", success:"#10b981", warning:"#f59e0b", danger:"#ef4444", accent:"#06b6d4", text:"#f1f5f9", text2:"#94a3b8", text3:"#64748b", mono:"'JetBrains Mono',monospace" };
const MONO = G.mono;
const MAX_PIN_ATTEMPTS = 3;
const COOLDOWN_MS = 30000;

import NoticeBoard from "./components/NoticeBoard.jsx";

// ─── STUDENT OVERVIEW ────────────────────────────────────────────────────────
export function StudentOverview({ user, attendance, sessions, setTab }) {
  const cohortSessions = getStudentSessions(sessions, user);
  const overallRate    = calcAttendanceRate(attendance, cohortSessions);
  const recent = [...attendance].sort((a,b) => new Date(b.markedAt)-new Date(a.markedAt)).slice(0,4);

  return (
    <div className="anim-fade-up">
      <div style={{ marginBottom:"28px" }}>
        <h1 style={{ fontSize:"24px", fontWeight:900, color:G.text, letterSpacing:"-0.02em" }}>
          Welcome, {user.name.split(" ")[0]}! 👋
        </h1>
        <p style={{ color:G.text2, fontSize:"13px", marginTop:"6px" }}>
          {user.enrollment} · Semester {user.semester} · Section {user.section}
        </p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px", marginBottom:"24px" }}>
        {[
          { icon:"✅", label:"Classes Attended",  value:attendance.length,         color:G.success },
          { icon:"📅", label:"Your Cohort Sessions", value:cohortSessions.length,  color:G.primary },
          { icon:"📊", label:"Attendance %",      value:`${overallRate}%`,          color: overallRate>=75?G.success:G.danger },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="glass card-hover" style={{ padding:"20px 22px", display:"flex", alignItems:"center", gap:"14px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:"-20px", right:"-20px", width:"70px", height:"70px", background:`radial-gradient(circle,${color}25 0%,transparent 70%)`, borderRadius:"50%", pointerEvents:"none" }} />
            <div style={{ width:"46px", height:"46px", borderRadius:"14px", background:`${color}20`, border:`1px solid ${color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>{icon}</div>
            <div>
              <p style={{ fontSize:"12px", color:G.text2, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"4px" }}>{label}</p>
              <p style={{ fontSize:"26px", fontWeight:800, color, lineHeight:1 }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.2fr 0.8fr", gap:"20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Card>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
              <p style={{ fontWeight:700, fontSize:"15px", color:G.text }}>Recent Attendance</p>
              <Btn variant="secondary" size="sm" onClick={() => setTab("records")}>View All</Btn>
            </div>
            {recent.length === 0
              ? <EmptyState icon="📋" message="No attendance marked yet" sub="Use the Mark Attendance tab to get started" action={<Btn size="sm" onClick={() => setTab("mark")} icon="✅">Mark Attendance</Btn>} />
              : recent.map(a => (
                <div key={a.id} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ width:"36px", height:"36px", background:"rgba(99,102,241,0.15)", borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", border:"1px solid rgba(99,102,241,0.25)" }}>📚</div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontWeight:600, fontSize:"14px", color:G.text }}>{a.subject}</p>
                    <p style={{ fontSize:"12px", color:G.text3, marginTop:"2px" }}>{fmt(a.markedAt)}</p>
                  </div>
                  <Badge color={a.method==="manual"?"warning":a.method==="qr"?"accent":"success"}>{a.method||"pin"}</Badge>
                </div>
              ))
            }
          </Card>

          <Card style={{ padding: 24, display: "flex", alignItems: "center", gap: 24 }}>
             <DonutChart percent={overallRate} size={80} />
             <div>
                <p style={{ fontWeight: 800, fontSize: "16px", color: G.text }}>Class Standing</p>
                <p style={{ fontSize: "13px", color: overallRate >= 75 ? G.success : G.danger, fontWeight: 700, marginTop: "4px" }}>
                  {overallRate >= 75 ? "Excellent Attendance" : "Action Required: Attendance low"}
                </p>
                <p style={{ fontSize: "12px", color: G.text3, marginTop: "2px" }}>{attendance.length} sessions attended out of {cohortSessions.length}</p>
             </div>
             <Btn size="sm" onClick={() => setTab("mark")} style={{ marginLeft: "auto" }}>Mark Now</Btn>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
           <div className="premium-glass" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                 <p style={{ fontWeight: 700, fontSize: "15px", color: G.text }}>Recent Notices</p>
                 <Btn variant="secondary" size="xs" onClick={() => setTab("notices")}>View All</Btn>
              </div>
              <NoticeBoard compact={true} />
           </div>
        </div>
      </div>
    </div>
  );
}

// ─── STUDENT MARK ATTENDANCE ─────────────────────────────────────────────────
export function StudentMarkAttendance({ user, reload, showToast }) {
  const [method, setMethod]     = useState("pin");
  const [digits, setDigits]     = useState(["","","","","",""]);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanPct, setScanPct]   = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef             = useRef(null);
  const videoRef                = useRef(null);
  const canvasRef               = useRef(null);
  const animFrameRef            = useRef(null);

  // Clean 6-digit PIN assembled from individual slots — no spaces ever
  const pinValue    = digits.join("");
  const pinComplete = digits.every(d => d !== "");

  const resetDigits = () => setDigits(["","","","","",""]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setCooldown(c => { if (c <= 1) { clearInterval(cooldownRef.current); return 0; } return c - 1; });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [cooldown > 0 && attempts >= MAX_PIN_ATTEMPTS]);

  const handlePin = async () => {
    if (attempts >= MAX_PIN_ATTEMPTS && cooldown > 0) return;
    if (!pinComplete) { setResult({type:"danger",msg:"Please enter all 6 digits."}); return; }
    setLoading(true);
    const res = await markAttendance(user, { pin: pinValue, method:"pin" });
    if (res.ok) {
      setResult({ type:"success", msg:`✅ Attendance marked for ${res.subject}!` });
      resetDigits(); setAttempts(0);
      showToast("Attendance marked!"); reload();
    } else {
      const newAtt = attempts + 1;
      setAttempts(newAtt);
      setResult({ type:"danger", msg: res.reason + (newAtt >= MAX_PIN_ATTEMPTS ? ` | Too many attempts — wait ${COOLDOWN_MS/1000}s.` : ` (${MAX_PIN_ATTEMPTS - newAtt} attempts left)`) });
      if (newAtt >= MAX_PIN_ATTEMPTS) setCooldown(COOLDOWN_MS / 1000);
    }
    setLoading(false);
  };

  // Clean up camera
  useEffect(() => {
    return () => stopScan();
  }, [method]);

  const stopScan = () => {
    setScanning(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startScan = async () => {
    setScanning(true); setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", true); // required for iOS
        videoRef.current.play();
        animFrameRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      setScanning(false);
      setResult({ type:"danger", msg:"Camera access denied or unavailable." });
    }
  };

  const tick = async () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
      
      if (code && code.data.startsWith("ATTENDX:")) {
        stopScan();
        const res = await markAttendance(user, { pin: code.data, method: "qr-pin" });
        if (res.ok) {
          setResult({ type:"success", msg:`✅ Attendance marked for ${res.subject}!` });
          showToast("Attendance marked!"); reload();
        } else {
          setResult({ type:"danger", msg:res.reason });
        }
        return;
      }
    }
    if (scanning) {
      animFrameRef.current = requestAnimationFrame(tick);
    }
  };

  const handleDigit = (i, val) => {
    // Accept only numeric, take last char typed (handles paste too)
    const d = val.replace(/\D/g,"").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) document.querySelectorAll(".pin-digit")[i+1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      const next = [...digits];
      if (digits[i]) {
        // Clear current slot
        next[i] = "";
        setDigits(next);
      } else if (i > 0) {
        // Move to previous slot and clear it
        next[i-1] = "";
        setDigits(next);
        document.querySelectorAll(".pin-digit")[i-1]?.focus();
      }
    }
    if (e.key === "Enter" && pinComplete) handlePin();
  };

  const locked = attempts >= MAX_PIN_ATTEMPTS && cooldown > 0;

  return (
    <div className="anim-fade-up">
      <SectionHeader title="Mark Attendance" subtitle="Use your session PIN or QR code to mark attendance" />

      {/* Method toggle */}
      <div style={{ display:"flex", background:"rgba(255,255,255,0.04)", borderRadius:"12px", padding:"5px", marginBottom:"24px", maxWidth:"340px", border:"1px solid rgba(255,255,255,0.08)" }}>
        {[{id:"pin",icon:"🔢",label:"Enter PIN"},{id:"qr",icon:"📷",label:"Scan QR"}].map(m => (
          <div key={m.id} onClick={() => {setMethod(m.id); setResult(null); resetDigits(); setAttempts(0);}}
            style={{ flex:1, textAlign:"center", padding:"10px", borderRadius:"9px", cursor:"pointer", background:method===m.id?"linear-gradient(135deg,#6366f1,#4f46e5)":"transparent", color:method===m.id?"#fff":G.text2, fontWeight:600, fontSize:"14px", transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:"7px", boxShadow:method===m.id?"0 4px 12px rgba(99,102,241,0.35)":"none" }}>
            {m.icon} {m.label}
          </div>
        ))}
      </div>

      {result && <Alert type={result.type} onClose={() => setResult(null)}>{result.msg}</Alert>}
      {locked  && <Alert type="warning">🔒 Too many failed attempts. Try again in {cooldown}s.</Alert>}

      {method === "pin" ? (
        <Card style={{ maxWidth:"420px", border:"1px solid rgba(99,102,241,0.2)" }}>
          <p style={{ fontWeight:700, fontSize:"16px", color:G.text, marginBottom:"6px" }}>Enter Session PIN</p>
          <p style={{ fontSize:"13px", color:G.text2, marginBottom:"22px" }}>Get the 6-digit PIN from your instructor for today's class.</p>
          <div style={{ display:"flex", justifyContent:"center", gap:"8px", marginBottom:"24px" }}>
            {[0,1,2,3,4,5].map(i => (
              <input key={i} maxLength={1} value={digits[i]}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={locked}
                className={`pin-digit${digits[i] ? " filled" : ""}`}
              />
            ))}
          </div>
          <Btn onClick={handlePin} loading={loading} disabled={loading || !pinComplete || locked} size="lg" style={{ width:"100%" }}>
            Submit PIN
          </Btn>
          {attempts > 0 && !locked && (
            <p style={{ textAlign:"center", marginTop:"10px", fontSize:"12px", color:G.warning }}>
              {MAX_PIN_ATTEMPTS - attempts} attempt{MAX_PIN_ATTEMPTS-attempts!==1?"s":""} remaining
            </p>
          )}
        </Card>
      ) : (
        <Card style={{ maxWidth:"380px", textAlign:"center", border:"1px solid rgba(99,102,241,0.2)" }}>
          <p style={{ fontWeight:700, fontSize:"16px", color:G.text, marginBottom:"6px" }}>QR Code Scanner</p>
          <p style={{ fontSize:"13px", color:G.text2, marginBottom:"22px" }}>Point camera at the QR code displayed by your instructor.</p>
          <div className={scanning ? "qr-live-border" : ""} style={{ width:"200px", height:"200px", border: scanning?"none":"2px dashed rgba(99,102,241,0.4)", borderRadius:"16px", margin:"0 auto 20px", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(99,102,241,0.06)", position:"relative", overflow:"hidden" }}>
            <video ref={videoRef} style={{ display: scanning ? "block" : "none", width: "100%", height: "100%", objectFit: "cover" }} />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            {scanning ? (
              <>
                <div style={{ position:"absolute", left:0, right:0, height:"2px", background:"linear-gradient(to right,transparent,#6366f1,transparent)", animation:"scanLine 1.2s ease-in-out infinite", top:0, zIndex:2 }} />
                <div style={{ position:"absolute", bottom:"10px", width:"100%", textAlign:"center", zIndex:2 }}>
                  <span style={{ fontSize:"11px", fontWeight:700, color:"#fff", background:"rgba(0,0,0,0.5)", padding:"4px 8px", borderRadius:"10px" }}>Looking for QR...</span>
                </div>
              </>
            ) : <span style={{ fontSize:"60px", opacity:0.5 }}>📷</span>}
          </div>
          {scanning ? (
            <Btn onClick={stopScan} variant="danger" size="lg" style={{ width:"100%" }} icon="✖️">Stop Scan</Btn>
          ) : (
            <Btn onClick={startScan} size="lg" style={{ width:"100%" }} icon="📷">Start QR Scan</Btn>
          )}
          <p style={{ marginTop:"10px", fontSize:"12px", color:G.text3 }}>Ensure QR code is clearly visible and well-lit</p>
        </Card>
      )}
    </div>
  );
}

// ─── STUDENT RECORDS ──────────────────────────────────────────────────────────
export function StudentRecords({ attendance }) {
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const subjects = [...new Set(attendance.map(a => a.subject))];
  const sorted = [...attendance]
    .filter(a => (filter==="all" || a.subject===filter) && (search===""||a.subject.toLowerCase().includes(search.toLowerCase())))
    .sort((a,b) => new Date(b.markedAt)-new Date(a.markedAt));

  const handleExport = () => exportCSV(sorted);

  return (
    <div className="anim-fade-up">
      <SectionHeader title="Attendance Records" subtitle={`${attendance.length} total records`}
        action={<Btn variant="success" size="sm" onClick={handleExport} icon="📥">Export CSV</Btn>} />
      <div style={{ display:"flex", gap:"12px", marginBottom:"16px" }}>
        <Select value={filter} onChange={setFilter} style={{ marginBottom:0, flex:1 }}
          options={[{value:"all",label:"All Subjects"}, ...subjects.map(s => ({value:s,label:s}))]} />
        <Input value={search} onChange={setSearch} placeholder="Search subject…" icon="🔍" style={{ marginBottom:0, flex:2 }} />
      </div>
      <Card style={{ padding:0, overflow:"hidden" }}>
        <table className="glass-table">
          <thead>
            <tr>{["Subject","Marked At","Method","Session ID"].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {sorted.length === 0
              ? <tr><td colSpan={4}><EmptyState icon="📋" message="No records found" /></td></tr>
              : sorted.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight:600, color:G.text }}>{a.subject}</td>
                  <td style={{ color:G.text2 }}>{fmt(a.markedAt)}</td>
                  <td><Badge color={a.method==="manual"?"warning":a.method==="qr"?"accent":"success"}>{a.method||"pin"}</Badge></td>
                  <td style={{ fontFamily:MONO, fontSize:"11px", color:G.text3 }}>{a.sessionId}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── STUDENT ANALYTICS ───────────────────────────────────────────────────────
export function StudentAnalytics({ user, attendance, sessions }) {
  const cohortSessions = getStudentSessions(sessions, user);
  const overallRate    = calcAttendanceRate(attendance, cohortSessions);
  const subjects       = [...new Set(attendance.map(a => a.subject))];

  const subjectData = subjects.map(s => {
    const sessForSubject = cohortSessions.filter(se => se.subject === s);
    return {
      label: s.substring(0, 8),
      value: attendance.filter(a => a.subject === s).length,
      total: sessForSubject.length,
    };
  });

  const methodData = [
    { label:"PIN",    value:attendance.filter(a => !a.method||a.method==="pin").length },
    { label:"QR Scan",value:attendance.filter(a => a.method==="qr").length },
    { label:"Manual", value:attendance.filter(a => a.method==="manual").length },
  ].filter(d => d.value > 0);

  return (
    <div className="anim-fade-up">
      <SectionHeader title="My Analytics" subtitle="Your personal attendance breakdown against your cohort sessions" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:"16px", marginBottom:"16px" }}>
        <Card style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"14px" }}>
          <DonutChart percent={overallRate} size={130} />
          <div style={{ textAlign:"center" }}>
            <p style={{ fontWeight:800, fontSize:"16px", color:G.text }}>Overall Attendance</p>
            <p style={{ fontSize:"12px", color:G.text2 }}>{attendance.length} of {cohortSessions.length} cohort sessions</p>
            <p style={{ fontSize:"13px", fontWeight:700, color:overallRate>=75?G.success:G.danger, marginTop:"6px" }}>
              {overallRate >= 75 ? "✅ Good Standing" : "⚠️ Below 75% Threshold"}
            </p>
          </div>
        </Card>
        <Card>
          <p style={{ fontWeight:700, fontSize:"15px", color:G.text, marginBottom:"20px" }}>Subject-wise Attendance</p>
          <BarChart data={subjectData} />
          <div style={{ marginTop:"20px", display:"flex", flexDirection:"column", gap:"10px" }}>
            {subjectData.map((s, i) => {
              const pct = s.total > 0 ? Math.round((s.value/s.total)*100) : 0;
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                  <span style={{ width:"90px", fontSize:"12px", fontWeight:600, color:G.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flexShrink:0 }}>{s.label}</span>
                  <div style={{ flex:1 }}><ProgressBar value={s.value} max={s.total} /></div>
                  <span style={{ fontSize:"12px", fontWeight:700, color: pct>=75?G.success:G.danger, width:"44px", textAlign:"right" }}>{s.value}/{s.total}</span>
                </div>
              );
            })}
            {subjectData.length === 0 && <EmptyState icon="📚" message="No subject data yet" />}
          </div>
        </Card>
      </div>
      {methodData.length > 0 && (
        <Card>
          <p style={{ fontWeight:700, fontSize:"15px", color:G.text, marginBottom:"16px" }}>Marking Method Distribution</p>
          <div style={{ display:"flex", gap:"14px" }}>
            {methodData.map((m, i) => (
              <div key={i} style={{ flex:1, background:"rgba(255,255,255,0.04)", borderRadius:"12px", padding:"18px", textAlign:"center", border:"1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ fontSize:"30px", fontWeight:900, color:"#a5b4fc" }}>{m.value}</p>
                <p style={{ fontSize:"13px", color:G.text2, marginTop:"6px", fontWeight:500 }}>{m.label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
