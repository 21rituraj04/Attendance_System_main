import { useState, useEffect, useRef } from 'react';
import './LandingPage.css';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3, QrCode, Bell, Users, FileText, BookOpen, Shield, Smartphone,
  Lock, LayoutDashboard, ArrowRight, CheckCircle2, Star, Menu, X,
  ExternalLink, MessageSquare, Globe2, Mail, MapPin, Phone, ChevronRight,
  Zap, TrendingUp, Clock, Globe
} from 'lucide-react';

// ─── ANIMATED COUNTER ─────────────────────────────────────────────────────
function AnimatedCounter({ end, duration = 2, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── FEATURE CARD ─────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="feature-card"
    >
      <div className="feature-icon-wrap">
        <Icon size={24} />
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{description}</p>
    </motion.div>
  );
}

// ─── TESTIMONIAL CARD ─────────────────────────────────────────────────────
function TestimonialCard({ name, role, text, rating, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="testimonial-card"
    >
      <div className="testimonial-stars">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
        ))}
      </div>
      <p className="testimonial-text">"{text}"</p>
      <div className="testimonial-author">
        <div className="testimonial-avatar">{name[0]}</div>
        <div>
          <p className="testimonial-name">{name}</p>
          <p className="testimonial-role">{role}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── MAIN LANDING PAGE ───────────────────────────────────────────────────
export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const features = [
    { icon: BarChart3, title: 'Real-time Tracking', description: 'Monitor attendance as it happens with live session dashboards and instant analytics.' },
    { icon: QrCode, title: 'QR-based Attendance', description: 'Generate dynamic QR codes for sessions. Students scan to mark attendance instantly.' },
    { icon: Bell, title: 'Smart Reminders', description: 'Automated alerts for low attendance, upcoming classes, and missing records.' },
    { icon: TrendingUp, title: 'Student Analytics', description: 'Subject-wise breakdowns, attendance trends, and performance insights for every student.' },
    { icon: FileText, title: 'Attendance Reports', description: 'Export detailed reports as CSV. Filter by date, subject, section, or semester.' },
    { icon: BookOpen, title: 'Subject Management', description: 'Create and organize subjects. Link sessions to subjects for structured tracking.' },
    { icon: Users, title: 'Multi-admin System', description: 'Each admin gets an isolated workspace. Complete data separation and privacy.' },
    { icon: Smartphone, title: 'Mobile-friendly', description: 'Fully responsive design that works perfectly on phones, tablets, and desktops.' },
    { icon: Lock, title: 'Secure Authentication', description: 'JWT-based auth with persistent login, encrypted passwords, and session management.' },
    { icon: LayoutDashboard, title: 'Role-based Dashboards', description: 'Dedicated dashboards for admins and students with relevant tools and insights.' },
  ];

  const testimonials = [
    { name: 'Dr. Priya Sharma', role: 'HOD, Computer Science', text: 'AttendX transformed how we track attendance. The QR system saves 10 minutes every lecture. The analytics helped us identify at-risk students early.', rating: 5 },
    { name: 'Rahul Mehta', role: 'Student, B.Tech CSE', text: 'So much easier than paper-based attendance. I can check my attendance percentage anytime and know exactly where I stand in each subject.', rating: 5 },
    { name: 'Prof. Ankit Gupta', role: 'Dean of Academics', text: 'The multi-admin feature means each department manages their own data. Reports are just a click away. This is exactly what we needed.', rating: 5 },
  ];

  const stats = [
    { value: 50000, suffix: '+', label: 'Attendance Marked' },
    { value: 12000, suffix: '+', label: 'Active Students' },
    { value: 5000, suffix: '+', label: 'Classes Managed' },
    { value: 99.9, suffix: '%', label: 'System Accuracy' },
  ];

  return (
    <div className="landing-page">
      {/* ── NAVBAR ────────────────────────────────────────────────────────── */}
      <motion.nav
        className={`landing-nav ${scrolled ? 'scrolled' : ''}`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="nav-inner">
          <Link to="/" className="nav-logo">
            <div className="nav-logo-icon">🎓</div>
            <span className="nav-logo-text">Attend<span className="brand-x">X</span></span>
          </Link>

          <div className="nav-links-desktop">
            <a href="#features" className="nav-link">Features</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#stats" className="nav-link">Stats</a>
            <a href="#testimonials" className="nav-link">Testimonials</a>
            <a href="#contact" className="nav-link">Contact</a>
          </div>

          <div className="nav-actions">
            {user ? (
              <Link to={user.role === 'admin' ? '/admin' : '/student'} className="nav-btn-primary">
                Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="nav-btn-ghost">Log In</Link>
                <Link to="/login?mode=register" className="nav-btn-primary">
                  Get Started <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>

          <button className="nav-mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenu && (
            <motion.div
              className="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <a href="#features" className="mobile-link" onClick={() => setMobileMenu(false)}>Features</a>
              <a href="#about" className="mobile-link" onClick={() => setMobileMenu(false)}>About</a>
              <a href="#stats" className="mobile-link" onClick={() => setMobileMenu(false)}>Stats</a>
              <a href="#testimonials" className="mobile-link" onClick={() => setMobileMenu(false)}>Testimonials</a>
              <a href="#contact" className="mobile-link" onClick={() => setMobileMenu(false)}>Contact</a>
              <div className="mobile-menu-actions">
                <Link to="/login" className="nav-btn-ghost" onClick={() => setMobileMenu(false)}>Log In</Link>
                <Link to="/login?mode=register" className="nav-btn-primary" onClick={() => setMobileMenu(false)}>Get Started</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── HERO SECTION ──────────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-bg-image" />
        <div className="hero-bg-overlay" />
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="hero-glow hero-glow-3" />

        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hero-text"
          >
            <div className="hero-badge">
              <Zap size={14} />
              <span>Next-Generation Attendance Platform</span>
            </div>

            <h1 className="hero-heading">
              Smart Attendance{' '}
              <span className="gradient-text">Management</span>{' '}
              System
            </h1>

            <p className="hero-subtitle">
              Transform how your institution tracks attendance. Real-time analytics,
              QR-based verification, smart reminders, and enterprise-grade security —
              all in one beautiful platform.
            </p>

            <div className="hero-actions">
              <Link to="/login?mode=register" className="hero-btn-primary">
                Get Started Free <ArrowRight size={18} />
              </Link>
              <a href="#features" className="hero-btn-secondary">
                Explore Features <ChevronRight size={18} />
              </a>
            </div>

            <div className="hero-trust">
              <div className="hero-trust-avatars">
                {['P', 'R', 'A', 'S'].map((l, i) => (
                  <div key={i} className="hero-trust-avatar" style={{ zIndex: 4 - i }}>{l}</div>
                ))}
              </div>
              <p className="hero-trust-text">
                Trusted by <strong>500+</strong> institutions worldwide
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hero-visual"
          >
            <div className="dashboard-preview">
              <div className="preview-header">
                <div className="preview-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <span className="preview-title">AttendX Dashboard</span>
              </div>
              <div className="preview-body">
                <div className="preview-sidebar">
                  {['Overview', 'Sessions', 'Students', 'Analytics'].map((item, i) => (
                    <div key={i} className={`preview-sidebar-item ${i === 0 ? 'active' : ''}`}>{item}</div>
                  ))}
                </div>
                <div className="preview-main">
                  <div className="preview-stats">
                    {[
                      { label: 'Students', value: '1,234', color: '#6366f1' },
                      { label: 'Active', value: '12', color: '#10b981' },
                      { label: 'Today', value: '847', color: '#06b6d4' },
                    ].map((s, i) => (
                      <div key={i} className="preview-stat-card" style={{ borderColor: `${s.color}40` }}>
                        <div className="preview-stat-value" style={{ color: s.color }}>{s.value}</div>
                        <div className="preview-stat-label">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="preview-chart">
                    {[65, 85, 45, 92, 78, 55, 88].map((h, i) => (
                      <motion.div
                        key={i}
                        className="preview-bar"
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.8, delay: 0.6 + i * 0.1 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES SECTION ──────────────────────────────────────────────── */}
      <section id="features" className="features-section">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-header"
        >
          <div className="section-badge"><Globe size={14} /> Core Features</div>
          <h2 className="section-title">Everything you need to manage attendance</h2>
          <p className="section-subtitle">
            A complete suite of tools designed for modern educational institutions.
            From real-time tracking to smart analytics.
          </p>
        </motion.div>

        <div className="features-grid">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} delay={i * 0.07} />
          ))}
        </div>
      </section>

      {/* ── ABOUT SECTION ─────────────────────────────────────────────────── */}
      <section id="about" className="about-section">
        <div className="about-inner">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="about-visual"
          >
            <div className="about-card-stack">
              <div className="about-float-card about-card-1">
                <CheckCircle2 size={20} className="about-card-icon success" />
                <div>
                  <p className="about-card-title">Attendance Marked</p>
                  <p className="about-card-sub">Data Structures — Session #142</p>
                </div>
              </div>
              <div className="about-float-card about-card-2">
                <BarChart3 size={20} className="about-card-icon primary" />
                <div>
                  <p className="about-card-title">87% Average Rate</p>
                  <p className="about-card-sub">Across all departments</p>
                </div>
              </div>
              <div className="about-float-card about-card-3">
                <Bell size={20} className="about-card-icon warning" />
                <div>
                  <p className="about-card-title">Low Attendance Alert</p>
                  <p className="about-card-sub">3 students below threshold</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="about-content"
          >
            <div className="section-badge"><Zap size={14} /> About AttendX</div>
            <h2 className="section-title">Built for modern institutions</h2>
            <p className="about-text">
              AttendX is a next-generation attendance management platform designed for
              schools, colleges, coaching centers, and universities. Our system replaces
              outdated paper-based tracking with smart, digital workflows.
            </p>

            <div className="about-benefits">
              {[
                { icon: Clock, text: 'Save 15+ minutes per class with instant digital attendance' },
                { icon: Shield, text: 'Enterprise-grade security with workspace isolation for each admin' },
                { icon: TrendingUp, text: 'AI-powered analytics to identify at-risk students early' },
                { icon: Smartphone, text: 'Works seamlessly on mobile — students mark from their phones' },
              ].map((b, i) => (
                <div key={i} className="about-benefit">
                  <div className="about-benefit-icon"><b.icon size={18} /></div>
                  <p>{b.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS SECTION ─────────────────────────────────────────────────── */}
      <section id="stats" className="stats-section">
        <div className="stats-inner">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="stat-item"
            >
              <div className="stat-value">
                <AnimatedCounter end={s.value} suffix={s.suffix} />
              </div>
              <p className="stat-label">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section id="testimonials" className="testimonials-section">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-header"
        >
          <div className="section-badge"><Star size={14} /> Testimonials</div>
          <h2 className="section-title">Loved by educators and students</h2>
          <p className="section-subtitle">
            See what institutions are saying about their experience with AttendX.
          </p>
        </motion.div>

        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} {...t} delay={i * 0.1} />
          ))}
        </div>
      </section>

      {/* ── CTA SECTION ───────────────────────────────────────────────────── */}
      <section className="cta-section">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="cta-card"
        >
          <h2 className="cta-title">Ready to modernize your attendance system?</h2>
          <p className="cta-subtitle">
            Join hundreds of institutions already using AttendX. Free to get started, no credit card required.
          </p>
          <div className="cta-actions">
            <Link to="/login?mode=register" className="hero-btn-primary">
              Start Free Today <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer id="contact" className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="nav-logo" style={{ marginBottom: 16 }}>
              <div className="nav-logo-icon">🎓</div>
              <span className="nav-logo-text">Attend<span className="brand-x">X</span></span>
            </div>
            <p className="footer-brand-text">
              Smart Attendance Management System for modern educational institutions.
              Built with security, scalability, and simplicity in mind.
            </p>
            <div className="footer-socials">
              <a href="#" className="footer-social"><ExternalLink size={18} /></a>
              <a href="#" className="footer-social"><MessageSquare size={18} /></a>
              <a href="#" className="footer-social"><Globe2 size={18} /></a>
            </div>
          </div>

          <div className="footer-links-group">
            <h4 className="footer-links-title">Product</h4>
            <a href="#features" className="footer-link">Features</a>
            <Link to="/login" className="footer-link">Login</Link>
            <Link to="/login?mode=register" className="footer-link">Sign Up</Link>
            <a href="#stats" className="footer-link">Statistics</a>
          </div>

          <div className="footer-links-group">
            <h4 className="footer-links-title">Company</h4>
            <a href="#about" className="footer-link">About</a>
            <a href="#testimonials" className="footer-link">Testimonials</a>
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
          </div>

          <div className="footer-links-group">
            <h4 className="footer-links-title">Contact</h4>
            <div className="footer-contact-item">
              <Mail size={14} /> support@attendx.io
            </div>
            <div className="footer-contact-item">
              <Phone size={14} /> +91 98765 43210
            </div>
            <div className="footer-contact-item">
              <MapPin size={14} /> New Delhi, India
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} AttendX. All rights reserved. Built with ❤️ for education.</p>
        </div>
      </footer>
    </div>
  );
}
