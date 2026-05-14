import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Toast, LoadingScreen, PageTransition } from "../components.jsx";
import { Navbar, Sidebar } from "../Layout.jsx";
import { AnimatePresence } from "framer-motion";
import { getSessions, getAttendance } from "../services/db.js";
import TeacherOverview from "../teacher/TeacherOverview.jsx";
import TeacherSessions from "../teacher/TeacherSessions.jsx";
import TeacherAttendance from "../teacher/TeacherAttendance.jsx";
import TeacherStudents from "../teacher/TeacherStudents.jsx";
import TeacherAnalytics from "../teacher/TeacherAnalytics.jsx";
import TeacherSubjects from "../teacher/TeacherSubjects.jsx";
import TeacherNotices from "../teacher/TeacherNotices.jsx";
import {
  LayoutDashboard, CalendarDays, CheckSquare, Users,
  BookOpen, BarChart3, MessageSquare
} from "lucide-react";

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("overview");
  const [toast, setToast] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const syncData = useCallback(async () => {
    try {
      const [sessRes, attRes, subRes, unreadRes] = await Promise.all([
        api.get("/sessions"),
        api.get("/attendance"),
        api.get("/subjects"),
        api.get("/notices/unread-count")
      ]);
      const mapId = (arr) => arr.map(item => ({ ...item, id: item._id }));
      localStorage.setItem("att_sessions",      JSON.stringify(mapId(sessRes.data)));
      localStorage.setItem("att_attendance",    JSON.stringify(mapId(attRes.data)));
      localStorage.setItem("att_subjects",      JSON.stringify(subRes.data.map(s => s.name)));
      localStorage.setItem("att_subjects_full", JSON.stringify(mapId(subRes.data)));
      setUnreadCount(unreadRes.data.count);
      window.dispatchEvent(new Event("storage"));
    } catch (err) { 
      console.error("Sync failed:", err); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncData();
    const iv = setInterval(syncData, 6000);
    return () => clearInterval(iv);
  }, [syncData]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const activeBadge = getSessions().filter(s => s.status === "active").length || undefined;

  const sideItems = [
    { label: "Teacher", items: [
      { id: "overview",   lucideIcon: LayoutDashboard, label: "Overview" },
      { id: "sessions",   lucideIcon: CalendarDays,    label: "Sessions", badge: activeBadge },
      { id: "attendance", lucideIcon: CheckSquare,     label: "Attendance" },
    ]},
    { label: "Classroom", items: [
      { id: "students",  lucideIcon: Users,    label: "Students" },
      { id: "subjects",  lucideIcon: BookOpen, label: "Subjects" },
      { id: "notices",   lucideIcon: MessageSquare, label: "Notices" },
      { id: "analytics", lucideIcon: BarChart3, label: "Analytics" },
    ]},
  ];

  if (!user || loading) return <LoadingScreen message="Accessing Teacher Portal..." />;

  return (
    <>
      <Navbar user={user} onLogout={logout} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} roleColor="#10b981" roleLabel="Teacher Portal" unreadCount={unreadCount} />
      <div style={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>
        <Sidebar items={sideItems} active={tab} setActive={setTab} collapsed={sidebarCollapsed} roleColor="#10b981" />
        <main style={{ 
          flex: 1, 
          padding: "40px 48px", 
          overflowY: "auto", 
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
                {tab === "overview"   && <TeacherOverview user={user} setTab={setTab} />}
                {tab === "sessions"   && <TeacherSessions user={user} reload={syncData} showToast={showToast} />}
                {tab === "attendance" && <TeacherAttendance reload={syncData} showToast={showToast} />}
                {tab === "students"   && <TeacherStudents showToast={showToast} />}
                {tab === "subjects"   && <TeacherSubjects showToast={showToast} />}
                {tab === "notices"    && <TeacherNotices showToast={showToast} reloadUnread={syncData} />}
                {tab === "analytics"  && <TeacherAnalytics user={user} />}
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </>
  );
}
