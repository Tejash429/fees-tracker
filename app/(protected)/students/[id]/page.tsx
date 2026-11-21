import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StudentDetailsContent } from '@/components/students/student-details-content';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={student.name}
        description={`Class ${student.class} • Phone: ${student.phone || '—'}`}
        actions={
          <Button asChild variant="outline">
            <Link href="/students">Back to Students</Link>
          </Button>
        }
      />

      <StudentDetailsContent student={student} initialPayments={payments} />
    </div>
  );
}
