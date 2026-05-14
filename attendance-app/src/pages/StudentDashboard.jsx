import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Toast, Alert, LoadingScreen, PageTransition } from "../components.jsx";
import { Navbar, Sidebar } from "../Layout.jsx";
import { AnimatePresence } from "framer-motion";
import { StudentOverview, StudentMarkAttendance, StudentRecords, StudentAnalytics } from "../StudentViews.jsx";
import { getStudentSessions, calcAttendanceRate } from "../utils.js";
import { Home, CheckSquare, FileText, BarChart3, Bell } from "lucide-react";
import NoticeBoard from "../components/NoticeBoard.jsx";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("overview");
  const [attendance, setAttendance] = useState([]);
  const [sessions, setSessions]     = useState([]);
  const [toast, setToast]           = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const syncData = useCallback(async () => {
    if (!user) return;
    try {
      const [sessRes, attRes, unreadRes] = await Promise.all([
        api.get("/sessions"),
        api.get("/attendance"),
        api.get("/notices/unread-count")
      ]);
      const mapId = (arr) => arr.map(item => ({ ...item, id: item._id }));
      const allSessions   = mapId(sessRes.data);
      const allAttendance = mapId(attRes.data);
      setSessions(allSessions);
      setAttendance(allAttendance.filter(a => a.enrollment === user.enrollment));
      setUnreadCount(unreadRes.data.count);
      window.dispatchEvent(new Event("storage"));
    } catch (err) { 
      console.error("Sync failed:", err); 
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    syncData();
    const iv = setInterval(syncData, 5000);
    return () => clearInterval(iv);
  }, [syncData]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const cohortSessions = getStudentSessions(sessions, user);
  const overallRate    = calcAttendanceRate(attendance, cohortSessions);

  const sideItems = [
    { label: "Student", items: [
      { id: "overview", lucideIcon: Home,        label: "Overview" },
      { id: "mark",     lucideIcon: CheckSquare, label: "Mark Attendance" },
      { id: "records",  lucideIcon: FileText,    label: "My Records" },
      { id: "notices",  lucideIcon: Bell,        label: "Notices" },
      { id: "analytics",lucideIcon: BarChart3,   label: "Analytics" },
    ]},
  ];

  if (!user || loading) return <LoadingScreen message="Accessing Student Portal..." />;

  return (
    <>
      <Navbar user={user} onLogout={logout} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} roleColor="#f59e0b" roleLabel="Student Portal" unreadCount={unreadCount} />
      <div style={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>
        <Sidebar items={sideItems} active={tab} setActive={setTab} collapsed={sidebarCollapsed} roleColor="#f59e0b" />
        <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto", minWidth: 0 }}>
          {toast && <Toast msg={toast.msg} type={toast.type} />}
          {overallRate < 75 && attendance.length > 0 && tab === "overview" && (
            <Alert type="warning">
              ⚠ Your attendance is <strong>{overallRate}%</strong> — below the required 75%. Contact your teacher.
            </Alert>
          )}
          <AnimatePresence mode="wait">
            <PageTransition key={tab}>
              {tab === "overview"  && <StudentOverview  user={user} attendance={attendance} sessions={sessions} setTab={setTab} />}
              {tab === "mark"      && <StudentMarkAttendance user={user} reload={syncData} showToast={showToast} />}
              {tab === "records"   && <StudentRecords attendance={attendance} sessions={sessions} />}
              {tab === "notices"   && <NoticeBoard reloadUnread={syncData} />}
              {tab === "analytics" && <StudentAnalytics user={user} attendance={attendance} sessions={sessions} />}
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
