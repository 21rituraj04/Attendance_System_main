import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Toast, LoadingScreen, PageTransition } from "../components.jsx";
import { Navbar, Sidebar } from "../Layout.jsx";
import { AnimatePresence } from "framer-motion";
import AdminOverviewERP from "../admin/AdminOverviewERP.jsx";
import AdminTeachers from "../admin/AdminTeachers.jsx";
import AdminStudentsERP from "../admin/AdminStudentsERP.jsx";
import AdminDepartments from "../admin/AdminDepartments.jsx";
import AdminMonitoring from "../admin/AdminMonitoring.jsx";
import AdminSubjectsERP from "../admin/AdminSubjectsERP.jsx";
import AdminAnalyticsERP from "../admin/AdminAnalyticsERP.jsx";
import AdminNotices from "../admin/AdminNotices.jsx";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  Building2, BarChart3, Activity, Bell, Settings,
  Calendar, MessageSquare, FileText, ClipboardList
} from "lucide-react";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState({
    teacherCount: 0,
    studentCount: 0,
    activeSessions: 0,
    attendanceRate: 0,
    departmentCount: 0,
    subjectCount: 0
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, unreadRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/notices/unread-count")
      ]);
      setStats(statsRes.data);
      setUnreadCount(unreadRes.data.count);
    } catch (e) { 
      console.error("Failed to fetch admin stats:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const iv = setInterval(fetchStats, 15000);
    return () => clearInterval(iv);
  }, [fetchStats]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const sideItems = [
    { label: "General", items: [
      { id: "overview",    lucideIcon: LayoutDashboard, label: "Dashboard" },
      { id: "analytics",   lucideIcon: BarChart3,       label: "Analytics" },
    ]},
    { label: "Management", items: [
      { id: "teachers",    lucideIcon: Users,          label: "Teachers" },
      { id: "students",    lucideIcon: GraduationCap,  label: "Students" },
      { id: "subjects",    lucideIcon: BookOpen,       label: "Subjects" },
      { id: "departments", lucideIcon: Building2,      label: "Departments" },
    ]},
    { label: "Academic", items: [
      { id: "monitoring",  lucideIcon: Activity,        label: "Attendance", badge: stats.activeSessions || undefined },
      { id: "timetable",   lucideIcon: Calendar,        label: "Timetable" },
      { id: "notices",     lucideIcon: MessageSquare,   label: "Notices" },
    ]},
    { label: "Analysis", items: [
      { id: "reports",     lucideIcon: FileText,        label: "Reports" },
    ]},
  ];

  if (!user || loading) return <LoadingScreen message="Accessing Admin Portal..." />;

  return (
    <>
      <Navbar
        user={user}
        onLogout={logout}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        roleColor="#3b82f6"
        roleLabel="Admin Portal"
        unreadCount={unreadCount}
      />
      <div style={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>
        <Sidebar
          items={sideItems}
          active={tab}
          setActive={setTab}
          collapsed={sidebarCollapsed}
          roleColor="#3b82f6"
        />
        <main style={{
          flex: 1,
          padding: "40px 48px",
          overflowY: "auto",
          position: "relative",
          minWidth: 0,
          background: "var(--c-bg-0)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <div style={{ width: "100%", maxWidth: "1600px" }}>
            {toast && <Toast msg={toast.msg} type={toast.type} />}

            <AnimatePresence mode="wait">
              <PageTransition key={tab}>
                {tab === "overview"    && <AdminOverviewERP stats={stats} setTab={setTab} showToast={showToast} />}
                {tab === "monitoring"  && <AdminMonitoring showToast={showToast} />}
                {tab === "analytics"   && <AdminAnalyticsERP />}
                {tab === "teachers"    && <AdminTeachers showToast={showToast} reload={fetchStats} />}
                {tab === "students"    && <AdminStudentsERP showToast={showToast} reload={fetchStats} />}
                {tab === "subjects"    && <AdminSubjectsERP showToast={showToast} />}
                {tab === "departments" && <AdminDepartments showToast={showToast} />}
                {tab === "timetable"   && <PlaceholderSection title="Timetable Management" />}
                {tab === "notices"     && <AdminNotices showToast={showToast} reloadUnread={fetchStats} />}
                {tab === "reports"     && <PlaceholderSection title="Academic Reports" />}
                {tab === "settings"    && <PlaceholderSection title="System Settings" />}
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </>
  );
}

function PlaceholderSection({ title }) {
  return (
    <div style={{ 
      height: "400px", display: "flex", alignItems: "center", justifyContent: "center",
      border: "2px dashed var(--c-border)", borderRadius: "var(--radius-lg)",
      color: "var(--c-text-dim)", flexDirection: "column", gap: 16
    }}>
      <div className="shimmer" style={{ width: 64, height: 64, borderRadius: 16 }} />
      <h2 className="font-heading" style={{ fontSize: 24, fontWeight: 600, color: "var(--c-text-muted)" }}>{title}</h2>
      <p style={{ fontSize: 14 }}>This module is currently being optimized for the premium ERP experience.</p>
    </div>
  );
}

