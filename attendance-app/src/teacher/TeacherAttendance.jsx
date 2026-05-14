// Teacher Attendance — re-uses the AdminAttendance component
import { AdminAttendance } from "../AdminManage.jsx";
export default function TeacherAttendance({ reload, showToast }) {
  return <AdminAttendance reload={reload} showToast={showToast} />;
}
