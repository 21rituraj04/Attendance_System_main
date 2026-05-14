import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { SectionHeader, Card } from "../components.jsx";

const G = { text:"#f1f5f9", text2:"#94a3b8", text3:"#64748b" };
const PALETTE = ["#6366f1","#10b981","#f59e0b","#06b6d4","#8b5cf6","#ef4444","#ec4899","#84cc16"];

function BarChart({ data, color = "#6366f1", labelKey = "_id", valueKey = "count" }) {
  if (!data?.length) return <div style={{ color:G.text3, fontSize:13, padding:20, textAlign:"center" }}>No data available</div>;
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:120, fontSize:11, color:G.text2, fontWeight:600, textAlign:"right", flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {d[labelKey] || "Unknown"}
          </div>
          <div style={{ flex:1, height:20, background:"rgba(255,255,255,0.05)", borderRadius:10, overflow:"hidden" }}>
            <div style={{
              height:"100%",
              width:`${Math.round((d[valueKey] / max) * 100)}%`,
              background:`linear-gradient(90deg, ${color}, ${color}99)`,
              borderRadius:10, transition:"width 0.6s ease",
              minWidth: d[valueKey] > 0 ? 4 : 0,
            }} />
          </div>
          <div style={{ width:36, fontSize:12, fontWeight:700, color, textAlign:"right" }}>{d[valueKey]}</div>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data, color = "#6366f1" }) {
  if (!data?.length) return <div style={{ color:G.text3, fontSize:13, padding:20, textAlign:"center" }}>No data available</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  const w = 100 / (data.length - 1 || 1);
  const points = data.map((d, i) => `${i * w},${100 - (d.count / max) * 85}`).join(" ");
  const area   = `0,100 ${points} 100,100`;
  return (
    <div>
      <svg viewBox={`0 0 100 100`} style={{ width:"100%", height:160, overflow:"visible" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#grad-${color.replace("#","")})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => (
          <circle key={i} cx={i * w} cy={100 - (d.count / max) * 85} r="2" fill={color} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
        {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1).map((d, i) => (
          <span key={i} style={{ fontSize:10, color:G.text3 }}>{d._id?.slice(5)}</span>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalyticsERP() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [days, setDays]           = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/analytics?days=${days}`);
      setAnalytics(res.data);
    } catch (e) { /* silent */ }
    setLoading(false);
  }, [days]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="anim-fade-up">
      <SectionHeader title="Analytics & Reports" subtitle="Institutional attendance analytics"
        action={
          <div style={{ display:"flex", gap:8 }}>
            {[7,14,30,90].map(d => (
              <button key={d} onClick={() => setDays(d)} style={{
                padding:"6px 14px", borderRadius:16, fontSize:12, fontWeight:700, cursor:"pointer",
                background: days===d ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                border: days===d ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.08)",
                color: days===d ? "#a5b4fc" : G.text2, transition:"all 0.15s",
              }}>{d}d</button>
            ))}
          </div>
        }
      />

      {loading ? (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:220, borderRadius:16 }} />)}
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <Card>
            <p style={{ fontWeight:800, fontSize:14, color:G.text, marginBottom:16 }}>📈 Daily Attendance Trend</p>
            <LineChart data={analytics?.daily} color="#10b981" />
          </Card>
          <Card>
            <p style={{ fontWeight:800, fontSize:14, color:G.text, marginBottom:16 }}>📊 Daily Sessions Created</p>
            <LineChart data={analytics?.sessionActivity} color="#6366f1" />
          </Card>
          <Card>
            <p style={{ fontWeight:800, fontSize:14, color:G.text, marginBottom:20 }}>📚 Top Subjects by Attendance</p>
            <BarChart data={analytics?.subjectWise} color="#f59e0b" />
          </Card>
          <Card>
            <p style={{ fontWeight:800, fontSize:14, color:G.text, marginBottom:20 }}>🎓 Semester-wise Attendance</p>
            <BarChart data={analytics?.semesterWise?.map(s => ({ ...s, _id: `Semester ${s._id}` }))} color="#06b6d4" />
          </Card>
        </div>
      )}
    </div>
  );
}
