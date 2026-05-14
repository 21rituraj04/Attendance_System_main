import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, LogOut, Bell, Search, 
  Settings, ChevronLeft, ChevronRight,
  Zap, X
} from "lucide-react";

// ─── PREMIUM NAVBAR ──────────────────────────────────────────────────────────
export function Navbar({ user, onLogout, onToggleSidebar, roleColor = "#3b82f6", roleLabel = "", unreadCount = 0 }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const roleGradient = {
    "Admin Portal":   "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    "Teacher Portal": "linear-gradient(135deg, #10b981, #059669)",
    "Student Portal": "linear-gradient(135deg, #f59e0b, #d97706)",
  }[roleLabel] || `linear-gradient(135deg, ${roleColor}, ${roleColor}cc)`;

  return (
    <nav
      style={{
        height: 60,
        background: isScrolled
          ? "rgba(10, 15, 30, 0.97)"
          : "rgba(10, 15, 30, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${isScrolled ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px 0 0",
        position: "sticky",
        top: 0,
        zIndex: 100,
        transition: "all 0.3s ease",
        boxShadow: isScrolled ? "0 4px 24px rgba(0,0,0,0.4)" : "none",
      }}
    >
      {/* LEFT: Toggle + Brand */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <button
          onClick={onToggleSidebar}
          style={{
            width: 60,
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.5)",
            transition: "color 0.2s",
            flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#fff"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
        >
          <Menu size={20} />
        </button>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: roleGradient,
            borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 20px ${roleColor}50`,
            flexShrink: 0,
          }}>
            <Zap size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{
              fontSize: 16, fontWeight: 800,
              letterSpacing: "-0.03em",
              background: "linear-gradient(to right, #fff, rgba(255,255,255,0.7))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1.1,
              fontFamily: "var(--font-heading)",
            }}>AttendX</div>
            <div style={{
              fontSize: 10, fontWeight: 600,
              color: roleColor,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              lineHeight: 1,
              marginTop: 1,
            }}>{roleLabel}</div>
          </div>
        </div>

        {/* Search Bar Removed */}
      </div>

      {/* RIGHT: Actions + User */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Bell */}
        <button style={{
          width: 36, height: 36,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 10, cursor: "pointer",
          color: "rgba(255,255,255,0.5)",
          transition: "all 0.2s",
          position: "relative",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <div style={{
              position: "absolute", top: -5, right: -5,
              minWidth: 18, height: 18, borderRadius: 9,
              background: "#ef4444",
              border: "2px solid rgba(10,15,30,0.97)",
              color: "#fff", fontSize: 9, fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 10px rgba(239,68,68,0.5)"
            }}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          )}
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.07)", margin: "0 4px" }} />

        {/* User Chip */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "5px 5px 5px 14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 40,
          cursor: "default",
        }}>
          <div style={{ textAlign: "right" }} className="hide-mobile">
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>
              {user?.name?.split(" ")[0]}
            </div>
            <div style={{ fontSize: 10, color: roleColor, fontWeight: 600, letterSpacing: "0.03em" }}>
              {user?.department || roleLabel}
            </div>
          </div>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: roleGradient,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "#fff",
            flexShrink: 0,
            boxShadow: `0 0 14px ${roleColor}50`,
          }}>
            {initials}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          title="Log out"
          style={{
            width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: 10, cursor: "pointer",
            color: "rgba(239,68,68,0.7)",
            marginLeft: 4,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; e.currentTarget.style.color = "rgba(239,68,68,0.7)"; }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </nav>
  );
}

// ─── PREMIUM SIDEBAR ──────────────────────────────────────────────────────────
export function Sidebar({ items, active, setActive, collapsed, roleColor = "#3b82f6" }) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 248 }}
      transition={{ type: "spring", stiffness: 320, damping: 35 }}
      style={{
        background: "rgba(8, 12, 24, 0.95)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 60px)",
        position: "sticky",
        top: 60,
        zIndex: 50,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Nav Groups */}
      <div style={{ flex: 1, paddingTop: 16, overflowY: "auto", overflowX: "hidden" }}>
        {items.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 8 }}>
            {!collapsed && group.label && (
              <div style={{
                fontSize: 10, fontWeight: 700,
                color: "rgba(255,255,255,0.2)",
                padding: "0 20px",
                marginBottom: 4,
                marginTop: gi > 0 ? 16 : 0,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}>
                {group.label}
              </div>
            )}
            {gi > 0 && collapsed && (
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 12px" }} />
            )}
            {group.items.map(item => (
              <SidebarItem
                key={item.id}
                item={item}
                active={active === item.id}
                collapsed={collapsed}
                roleColor={roleColor}
                onClick={() => setActive(item.id)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: "12px 8px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}>
        <SidebarItem
          item={{ id: "settings", label: "Settings", lucideIcon: Settings }}
          active={active === "settings"}
          collapsed={collapsed}
          roleColor={roleColor}
          onClick={() => setActive("settings")}
        />
      </div>
    </motion.aside>
  );
}

function SidebarItem({ item, active, collapsed, roleColor, onClick }) {
  const Icon = item.lucideIcon;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? item.label : undefined}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "2px 8px",
        padding: collapsed ? "10px 0" : "10px 12px",
        borderRadius: 10,
        cursor: "pointer",
        justifyContent: collapsed ? "center" : "flex-start",
        background: active
          ? `${roleColor}18`
          : hovered
            ? "rgba(255,255,255,0.04)"
            : "transparent",
        borderLeft: active ? `3px solid ${roleColor}` : "3px solid transparent",
        transition: "all 0.18s ease",
        minHeight: 40,
      }}
    >
      {/* Icon */}
      <div style={{
        width: 20, height: 20,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: active ? roleColor : hovered ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
        transition: "color 0.18s",
        flexShrink: 0,
      }}>
        {Icon && <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />}
        {!Icon && item.icon && <span style={{ fontSize: 16 }}>{item.icon}</span>}
      </div>

      {/* Label */}
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.15 }}
            style={{
              fontSize: 13.5,
              fontWeight: active ? 600 : 500,
              color: active ? "#fff" : "rgba(255,255,255,0.45)",
              whiteSpace: "nowrap",
              flex: 1,
              transition: "color 0.18s",
            }}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Badge */}
      <AnimatePresence>
        {!collapsed && item.badge && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              background: "#ef4444",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              padding: "1px 6px",
              borderRadius: 20,
              minWidth: 18,
              textAlign: "center",
              boxShadow: "0 0 8px rgba(239,68,68,0.5)",
            }}
          >
            {item.badge}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Collapsed Tooltip */}
      {collapsed && hovered && (
        <div style={{
          position: "absolute",
          left: "calc(100% + 10px)",
          top: "50%",
          transform: "translateY(-50%)",
          background: "rgba(20,25,40,0.98)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: 600,
          color: "#fff",
          whiteSpace: "nowrap",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          zIndex: 200,
          pointerEvents: "none",
        }}>
          {item.label}
          {item.badge && (
            <span style={{
              marginLeft: 6,
              background: "#ef4444",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              padding: "1px 5px",
              borderRadius: 10,
            }}>{item.badge}</span>
          )}
        </div>
      )}
    </div>
  );
}
