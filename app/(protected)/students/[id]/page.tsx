import { notFound } from 'next/navigation';
import { StudentDetailsContent } from '@/components/students/student-details-content';
import { getPaymentsByStudent, getStudentById } from '@/lib/queries';

interface StudentDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function StudentDetailsPage({ params }: StudentDetailsPageProps) {
  const studentId = params.id;

  const [student, payments] = await Promise.all([
    getStudentById(studentId),
    getPaymentsByStudent(studentId)
  ]);

  if (!student) {
    notFound();
  }

  return <StudentDetailsContent student={student} initialPayments={payments} />;
}
