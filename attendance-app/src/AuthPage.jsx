import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { LoadingScreen } from "./components.jsx";
import "./AuthPage.css";

export default function AuthPage() {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!form.identifier.trim() || !form.password) {
      setErr("Please enter your email / enrollment / employee ID and password.");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const user = await login(form.identifier.trim(), form.password);
      if (user.role === "admin")   navigate("/admin",   { replace: true });
      else if (user.role === "teacher") navigate("/teacher", { replace: true });
      else navigate("/student", { replace: true });
    } catch (error) {
      setErr(error.response?.data?.msg || "Invalid credentials. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-overlay" />
      <div className="auth-glow auth-glow-1" />
      <div className="auth-glow auth-glow-2" />

      {loading && <LoadingScreen message="Authenticating Secure Session..." />}

      <div className="auth-card" style={{ maxWidth: 460 }}>
        {/* Logo */}
        <div className="auth-logo-section">
          <div className="auth-logo-icon">🎓</div>
          <h1 className="auth-brand">
            Attend<span className="auth-brand-x">X</span>
          </h1>
          <p className="auth-brand-sub">Secure Portal Login</p>
        </div>

        {/* Error */}
        {err && (
          <div className="auth-alert auth-alert-danger">
            <span className="auth-alert-icon">✕</span> {err}
          </div>
        )}

        {/* Form */}
        <p className="auth-form-title">Welcome Back</p>
        <p className="auth-form-subtitle">Sign in with your Email or ID</p>

        <div className="auth-field">
          <label className="auth-label">Email Address / User ID</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">✉</span>
            <input
              className="auth-input"
              value={form.identifier}
              onChange={e => setForm(p => ({ ...p, identifier: e.target.value }))}
              placeholder="name@college.com"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              autoFocus
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label">Password</label>
          <div className="auth-input-wrap">
            <span className="auth-input-icon">🔒</span>
            <input
              className="auth-input"
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="Enter your password"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            <button
              onClick={() => setShowPass(v => !v)}
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#64748b", cursor:"pointer", fontSize:16 }}
            >{showPass ? "🙈" : "👁"}</button>
          </div>
        </div>

        <button className="auth-btn-primary" onClick={handleLogin} disabled={loading} style={{ marginTop: 10 }}>
          {loading ? "Authenticating..." : "Sign In →"}
        </button>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            Are you a new student? <Link to="/register" style={{ color: "#a5b4fc", textDecoration: "none", fontWeight: 700 }}>Register Here</Link>
          </p>
        </div>

        <div className="auth-footer" style={{ marginTop: 20 }}>
          <span style={{ color:"#334155", fontSize:12 }}>AttendX ERP v2.0 — Secure Professional Portal</span>
        </div>
      </div>
    </div>
  );
}
