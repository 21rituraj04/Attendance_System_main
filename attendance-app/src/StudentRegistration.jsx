import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import api from "./services/api";
import { LoadingScreen } from "./components.jsx";
import "./AuthPage.css";

export default function StudentRegistration() {
  const [form, setForm] = useState({
    name: "", enrollment: "", email: "", password: "", semester: "1", section: "A", department: ""
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { setToken, fetchUser } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!form.name || !form.enrollment || !form.password) {
      setErr("Name, Enrollment ID, and Password are required.");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const res = await api.post("/auth/register", form);
      if (res.data.token) {
        localStorage.setItem("att_token", res.data.token);
        setToken(res.data.token);
        await fetchUser();
        navigate("/student", { replace: true });
      }
    } catch (error) {
      setErr(error.response?.data?.msg || "Registration failed. Please try again.");
    }
    setLoading(false);
  };

  if (loading) {
    return <LoadingScreen message="Creating Secure Student Account..." />;
  }

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-overlay" />
      <div className="auth-glow auth-glow-1" />
      <div className="auth-glow auth-glow-2" />

      <div className="auth-card" style={{ maxWidth: 500, padding: "40px" }}>
        <div className="auth-logo-section">
          <div className="auth-logo-icon">🎓</div>
          <h1 className="auth-brand">Attend<span className="auth-brand-x">X</span></h1>
          <p className="auth-brand-sub">Student Registration Portal</p>
        </div>

        {err && (
          <div className="auth-alert auth-alert-danger">
            <span className="auth-alert-icon">✕</span> {err}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div className="auth-field" style={{ gridColumn: "1 / -1" }}>
            <label className="auth-label">Full Name</label>
            <div className="auth-input-wrap">
              <input className="auth-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Enrollment ID</label>
            <div className="auth-input-wrap">
              <input className="auth-input" value={form.enrollment} onChange={e => setForm(p => ({ ...p, enrollment: e.target.value }))} placeholder="CS2024001" />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Department</label>
            <div className="auth-input-wrap">
              <input className="auth-input" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} placeholder="Computer Science" />
            </div>
          </div>

          <div className="auth-field" style={{ gridColumn: "1 / -1" }}>
            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrap">
              <input className="auth-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="john@student.attendx.local" />
            </div>
          </div>

          <div className="auth-field" style={{ gridColumn: "1 / -1" }}>
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <input className="auth-input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Choose a strong password" />
            </div>
          </div>
          
          <div className="auth-field">
            <label className="auth-label">Semester</label>
            <div className="auth-input-wrap">
              <input className="auth-input" value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))} placeholder="1" />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Section</label>
            <div className="auth-input-wrap">
              <input className="auth-input" value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} placeholder="A" />
            </div>
          </div>
        </div>

        <button className="auth-btn-primary" onClick={handleRegister} disabled={loading} style={{ marginTop: 24 }}>
          {loading ? "Creating Account..." : "Register Now →"}
        </button>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            Already have an account? <Link to="/login" style={{ color: "#a5b4fc", textDecoration: "none", fontWeight: 700 }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
