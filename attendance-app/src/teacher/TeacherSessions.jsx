// Teacher Sessions — re-uses the well-tested AdminSessions component
// The teacher takes attendance sessions, creates PINs, QR codes etc.
import AdminSessions from "../AdminSessions.jsx";
export default function TeacherSessions({ user, reload, showToast }) {
  return <AdminSessions user={user} reload={reload} showToast={showToast} />;
}
