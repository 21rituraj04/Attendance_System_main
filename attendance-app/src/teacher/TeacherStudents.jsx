// Teacher Students view — shows students relevant to teacher's classes
import AdminStudentsERP from "../admin/AdminStudentsERP.jsx";

export default function TeacherStudents({ showToast }) {
  // Now using the premium ERP view for teachers as well
  return <AdminStudentsERP reload={() => {}} showToast={showToast} />;
}
