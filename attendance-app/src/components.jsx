// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
export const G = {
  primary: '#6366f1', primaryLight: '#818cf8', primaryDark: '#4f46e5',
  accent: '#06b6d4', accent2: '#8b5cf6',
  success: '#10b981', warning: '#f59e0b', danger: '#ef4444',
  text: '#f1f5f9', text2: '#94a3b8', text3: '#64748b',
  mono: "'JetBrains Mono', monospace",
};

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// ─── BUTTON ──────────────────────────────────────────────────────────────────
export const Btn = ({ children, onClick, variant = 'primary', size = 'md', disabled, style, icon, type = 'button', loading }) => {
  const variants = {
    primary:   { background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', boxShadow:'0 4px 15px rgba(99,102,241,0.35)', border:'1px solid rgba(99,102,241,0.5)' },
    secondary: { background: 'rgba(99,102,241,0.12)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.25)' },
    danger:    { background: 'rgba(239,68,68,0.12)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.25)' },
    ghost:     { background: 'rgba(255,255,255,0.05)', color:G.text2, border:'1px solid rgba(255,255,255,0.1)' },
    success:   { background: 'rgba(16,185,129,0.12)', color:'#6ee7b7', border:'1px solid rgba(16,185,129,0.25)' },
    accent:    { background: 'linear-gradient(135deg,#06b6d4,#0891b2)', color:'#fff', boxShadow:'0 4px 15px rgba(6,182,212,0.3)', border:'1px solid rgba(6,182,212,0.5)' },
    warning:   { background: 'rgba(245,158,11,0.12)', color:'#fcd34d', border:'1px solid rgba(245,158,11,0.25)' },
  };
  const sizes = {
    xs: { padding:'5px 10px',  fontSize:'12px' },
    sm: { padding:'7px 14px',  fontSize:'13px' },
    md: { padding:'10px 20px', fontSize:'14px' },
    lg: { padding:'13px 28px', fontSize:'15px' },
  };
  const isDisabled = disabled || loading;
  return (
    <button type={type} onClick={onClick} disabled={isDisabled} className="btn"
      style={{ ...variants[variant], ...sizes[size], ...style }}>
      {loading
        ? <><Spinner size={14} />{children}</>
        : <>{icon && <span style={{ fontSize: size === 'sm' ? '14px' : '16px', lineHeight: 1 }}>{icon}</span>}{children}</>
      }
    </button>
  );
};

// ─── INPUT ───────────────────────────────────────────────────────────────────
export const Input = ({ label, value, onChange, type = 'text', placeholder, required, icon, style, onKeyDown, autoFocus, error }) => (
  <div style={{ marginBottom: '14px', ...style }}>
    {label && (
      <label style={{ display:'block', fontSize:'12px', fontWeight:600, color: error ? G.danger : G.text2, marginBottom:'6px', letterSpacing:'0.04em', textTransform:'uppercase' }}>
        {label}{required && <span style={{ color:G.danger, marginLeft:'3px' }}>*</span>}
      </label>
    )}
    <div style={{ position:'relative' }}>
      {icon && <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'16px', zIndex:1, lineHeight:1 }}>{icon}</span>}
      <input value={value} onChange={e => onChange(e.target.value)} type={type}
        placeholder={placeholder} required={required} onKeyDown={onKeyDown} autoFocus={autoFocus}
        className="glass-input"
        style={{ padding: icon ? '11px 14px 11px 40px' : '11px 16px', borderColor: error ? 'rgba(239,68,68,0.5)' : undefined }}
      />
    </div>
    {error && <p style={{ fontSize:'11.5px', color:G.danger, marginTop:'5px', fontWeight:500 }}>⚠ {error}</p>}
  </div>
);

// ─── SELECT ──────────────────────────────────────────────────────────────────
export const Select = ({ label, value, onChange, options, style }) => (
  <div style={{ marginBottom:'14px', ...style }}>
    {label && <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:G.text2, marginBottom:'6px', letterSpacing:'0.04em', textTransform:'uppercase' }}>{label}</label>}
    <select value={value} onChange={e => onChange(e.target.value)} className="glass-input"
      style={{ padding:'11px 40px 11px 16px', cursor:'pointer', appearance:'none',
        backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat:'no-repeat', backgroundPosition:'right 14px center' }}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
);

// ─── CARD ────────────────────────────────────────────────────────────────────
export const Card = ({ children, style, onClick, glow, hover, gradientBorder }) => {
  const [lifted, setLifted] = useState(false);
  const cls = ['glass', hover && 'card-hover', gradientBorder && 'card-gradient-border'].filter(Boolean).join(' ');
  return (
    <div onClick={onClick} className={cls}
      onMouseEnter={hover ? () => setLifted(true)  : undefined}
      onMouseLeave={hover ? () => setLifted(false) : undefined}
      style={{
        padding:'24px', cursor: onClick ? 'pointer' : 'default',
        transition:'all 0.2s ease',
        ...(glow && { boxShadow:'0 0 40px rgba(99,102,241,0.18), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' }),
        ...(hover && lifted && { transform:'translateY(-3px)', boxShadow:'0 12px 40px rgba(0,0,0,0.5), 0 0 32px rgba(99,102,241,0.18)' }),
        ...style,
      }}>
      {children}
    </div>
  );
};

// ─── BADGE ───────────────────────────────────────────────────────────────────
export const Badge = ({ children, color = 'primary' }) => {
  const colors = {
    primary: { bg:'rgba(99,102,241,0.2)',  text:'#a5b4fc', border:'rgba(99,102,241,0.3)' },
    success: { bg:'rgba(16,185,129,0.2)',  text:'#6ee7b7', border:'rgba(16,185,129,0.3)' },
    warning: { bg:'rgba(245,158,11,0.2)',  text:'#fcd34d', border:'rgba(245,158,11,0.3)' },
    danger:  { bg:'rgba(239,68,68,0.2)',   text:'#fca5a5', border:'rgba(239,68,68,0.3)'  },
    gray:    { bg:'rgba(100,116,139,0.2)', text:'#94a3b8', border:'rgba(100,116,139,0.3)' },
    accent:  { bg:'rgba(6,182,212,0.2)',   text:'#67e8f9', border:'rgba(6,182,212,0.3)'  },
  };
  const c = colors[color] || colors.primary;
  return <span style={{ background:c.bg, color:c.text, border:`1px solid ${c.border}`, padding:'3px 10px', borderRadius:'20px', fontSize:'11.5px', fontWeight:700, display:'inline-block', letterSpacing:'0.02em' }}>{children}</span>;
};

// ─── ALERT ───────────────────────────────────────────────────────────────────
export const Alert = ({ type = 'info', children, onClose }) => {
  const colors = {
    info:    { bg:'rgba(99,102,241,0.1)',  border:'rgba(99,102,241,0.5)',  text:'#a5b4fc' },
    success: { bg:'rgba(16,185,129,0.1)',  border:'rgba(16,185,129,0.5)',  text:'#6ee7b7' },
    danger:  { bg:'rgba(239,68,68,0.1)',   border:'rgba(239,68,68,0.5)',   text:'#fca5a5' },
    warning: { bg:'rgba(245,158,11,0.1)',  border:'rgba(245,158,11,0.5)',  text:'#fcd34d' },
  };
  const icons = { info:'ℹ️', success:'✅', danger:'❌', warning:'⚠️' };
  const c = colors[type];
  return (
    <div className="anim-slide-d" style={{ background:c.bg, border:`1px solid ${c.border}`, borderLeft:`4px solid ${c.border}`, borderRadius:'10px', padding:'12px 16px', color:c.text, fontSize:'13.5px', fontWeight:500, marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
      <span>{icons[type]}</span>
      <span style={{ flex:1 }}>{children}</span>
      {onClose && <span onClick={onClose} style={{ cursor:'pointer', opacity:0.6, fontSize:'16px', lineHeight:1 }}>×</span>}
    </div>
  );
};

// ─── SPINNER ─────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 18 }) => (
  <div style={{ width:`${size}px`, height:`${size}px`, border:`2px solid rgba(255,255,255,0.15)`, borderTop:`2px solid rgba(255,255,255,0.85)`, borderRadius:'50%', animation:'spin 0.6s linear infinite', display:'inline-block', flexShrink:0 }} />
);

// ─── SKELETON ────────────────────────────────────────────────────────────────
export const Skeleton = ({ width = '100%', height = '20px', style }) => (
  <div className="skeleton" style={{ width, height, ...style }} />
);

export const SkeletonTable = ({ rows = 4, cols = 5 }) => (
  <div style={{ padding:'0' }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:'12px', padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} height="16px" width={j === 0 ? '70%' : '90%'} />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className="glass" style={{ padding:'20px 22px', display:'flex', alignItems:'center', gap:'16px' }}>
    <Skeleton width="48px" height="48px" style={{ borderRadius:'14px', flexShrink:0 }} />
    <div style={{ flex:1 }}>
      <Skeleton height="12px" width="60%" style={{ marginBottom:'8px' }} />
      <Skeleton height="28px" width="40%" />
    </div>
  </div>
);

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
export const ProgressBar = ({ value, max, color }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const col = color || (pct >= 75 ? G.success : pct >= 50 ? G.warning : G.danger);
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width:`${pct}%`, background:`linear-gradient(to right, ${col}, ${col}cc)` }} />
    </div>
  );
};

// ─── STAT CARD ───────────────────────────────────────────────────────────────
export const StatCard = ({ icon, label, value, color, sub, loading: isLoading }) => {
  if (isLoading) return <SkeletonCard />;
  return (
    <div className="glass card-hover" style={{ padding:'20px 22px', display:'flex', alignItems:'center', gap:'16px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'80px', height:'80px', background:`radial-gradient(circle, ${color}25 0%, transparent 70%)`, borderRadius:'50%', pointerEvents:'none' }} />
      <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:`${color}20`, border:`1px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'12px', color:G.text2, fontWeight:500, marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
        <div style={{ fontSize:'28px', fontWeight:800, color:G.text, lineHeight:1, letterSpacing:'-0.02em' }}>{value}</div>
        {sub && <div style={{ fontSize:'11px', color, marginTop:'4px', fontWeight:600 }}>{sub}</div>}
      </div>
    </div>
  );
};

// ─── DONUT CHART ─────────────────────────────────────────────────────────────
export const DonutChart = ({ percent, size = 110 }) => {
  const r = 40, circ = 2 * Math.PI * r;
  const dash  = (Math.min(percent, 100) / 100) * circ;
  const color = percent >= 75 ? G.success : percent >= 50 ? G.warning : G.danger;
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
          style={{ filter:`drop-shadow(0 0 6px ${color}80)`, transition:'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize: size > 90 ? '18px' : '14px', fontWeight:800, color }}>{percent}%</span>
      </div>
    </div>
  );
};

// ─── BAR CHART ───────────────────────────────────────────────────────────────
export const BarChart = ({ data }) => {
  if (!data?.length) return <div style={{ color:G.text3, fontSize:'13px', textAlign:'center', padding:'24px' }}>No data available</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:'8px', height:'100px', padding:'0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', height:'100%', justifyContent:'flex-end' }}>
          <div style={{ width:'100%', height:`${Math.max((d.value/max)*80,4)}px`, background:`linear-gradient(to top,${G.primary},${G.accent})`, borderRadius:'6px 6px 0 0', transition:'height 0.8s cubic-bezier(0.4,0,0.2,1)', boxShadow:`0 0 10px rgba(99,102,241,0.3)`, position:'relative' }}>
            <div style={{ position:'absolute', top:'-18px', left:'50%', transform:'translateX(-50%)', fontSize:'10px', fontWeight:700, color:G.text2, whiteSpace:'nowrap' }}>{d.value}</div>
          </div>
          <div style={{ fontSize:'10px', color:G.text3, textAlign:'center', maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:'100%' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
};

// ─── QR DISPLAY ──────────────────────────────────────────────────────────────
export const QRDisplay = ({ value, size = 150 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      import("qrcode").then(QRCode => {
        QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: {
            dark: '#a5b4fc', // Primary theme color
            light: '#00000000' // Transparent
          }
        }, (error) => {
          if (error) console.error("QR Code Error:", error);
        });
      });
    }
  }, [value, size]);

  return (
    <div style={{ background:'rgba(255,255,255,0.04)', padding:'14px', borderRadius:'16px', display:'inline-block', border:'1px solid rgba(255,255,255,0.1)' }}>
      <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto' }} />
      <div style={{ textAlign:'center', fontSize:'9px', color:G.text3, marginTop:'6px', fontFamily:G.mono, letterSpacing:'0.04em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:`${size}px` }}>
        {value?.substring(0,22)}
      </div>
    </div>
  );
};

// ─── TOAST ───────────────────────────────────────────────────────────────────
export const Toast = ({ msg, type = 'success' }) => {
  const icons  = { success:'✓', danger:'✕', warning:'⚠', info:'ℹ' };
  const colors = {
    success:{ bg:'linear-gradient(135deg,rgba(16,185,129,0.95),rgba(5,150,105,0.95))',   shadow:'rgba(16,185,129,0.4)' },
    danger: { bg:'linear-gradient(135deg,rgba(239,68,68,0.95),rgba(220,38,38,0.95))',   shadow:'rgba(239,68,68,0.4)'  },
    warning:{ bg:'linear-gradient(135deg,rgba(245,158,11,0.95),rgba(217,119,6,0.95))',  shadow:'rgba(245,158,11,0.4)' },
    info:   { bg:'linear-gradient(135deg,rgba(99,102,241,0.95),rgba(79,70,229,0.95))', shadow:'rgba(99,102,241,0.4)' },
  };
  const c = colors[type] || colors.success;
  return (
    <div className="anim-toast" style={{ position:'fixed', top:'80px', right:'24px', zIndex:9999, background:c.bg, backdropFilter:'blur(20px)', color:'#fff', padding:'12px 20px', borderRadius:'12px', fontWeight:600, fontSize:'14px', display:'flex', alignItems:'center', gap:'10px', boxShadow:`0 8px 32px ${c.shadow}`, minWidth:'230px', border:'1px solid rgba(255,255,255,0.2)' }}>
      <span style={{ width:'22px', height:'22px', background:'rgba(255,255,255,0.25)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', flexShrink:0 }}>{icons[type]}</span>
      {msg}
    </div>
  );
};

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, action }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px' }}>
    <div>
      <h2 style={{ fontSize:'20px', fontWeight:800, color:G.text, letterSpacing:'-0.02em' }}>{title}</h2>
      {subtitle && <p style={{ fontSize:'13px', color:G.text2, marginTop:'4px' }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = '📭', message, sub, action }) => (
  <div style={{ textAlign:'center', padding:'48px 24px', color:G.text3 }}>
    <div style={{ fontSize:'40px', marginBottom:'12px', opacity:0.5 }}>{icon}</div>
    <div style={{ fontSize:'15px', fontWeight:600, color:G.text2, marginBottom:'6px' }}>{message}</div>
    {sub    && <div style={{ fontSize:'13px', marginBottom: action ? '16px' : '0' }}>{sub}</div>}
    {action}
  </div>
);

// ─── DIVIDER ─────────────────────────────────────────────────────────────────
export const Divider = ({ style }) => (
  <div style={{ height:'1px', background:'rgba(255,255,255,0.07)', margin:'4px 0', ...style }} />
);

// ─── PREMIUM LOADING SCREEN ──────────────────────────────────────────────────
export const LoadingScreen = ({ message = "Initialising System" }) => (
  <div className="loading-screen">
    <div className="loading-logo">
      <div className="loading-glow" />
      <DotLottieReact
        src="https://lottie.host/7f154994-2720-42c5-b242-fcd10935223b/M0cgKJS4aN.lottie"
        loop
        autoplay
      />
    </div>
    <div className="loading-text">{message}</div>
  </div>
);

// ─── PAGE TRANSITION ──────────────────────────────────────────────────────────
export const PageTransition = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.99 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.99 }}
    transition={{ 
      duration: 0.4, 
      delay, 
      ease: [0.16, 1, 0.3, 1] 
    }}
    style={{ width: '100%', height: '100%' }}
  >
    {children}
  </motion.div>
);

// ─── STAGGER CONTAINER ───────────────────────────────────────────────────────
export const StaggerContainer = ({ children, delay = 0 }) => (
  <motion.div
    initial="hidden"
    animate="show"
    variants={{
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: 0.05,
          delayChildren: delay
        }
      }
    }}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 15 },
      show: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.5 } }
    }}
  >
    {children}
  </motion.div>
);

// ─── PREMIUM MODAL ────────────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, maxWidth = 600 }) => (
  <AnimatePresence>
    {isOpen && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(12px)' }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="premium-glass"
          style={{ position: 'relative', width: '100%', maxWidth, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="font-heading" style={{ fontSize: 20, fontWeight: 700 }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <div style={{ padding: 32, overflowY: 'auto' }}>
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

