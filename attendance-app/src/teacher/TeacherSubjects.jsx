// Teacher Subjects — view subjects (admin manages them, teacher reads)
import { AdminSubjects } from "../AdminManage.jsx";
export default function TeacherSubjects({ showToast }) {
  return <AdminSubjects reload={() => {}} showToast={showToast} />;
}
