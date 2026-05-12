import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const faqs = [
  {
    question: 'How should I import students?',
    answer:
      'Go to Students → Import Students. You can paste a Google Sheet URL or upload CSV/XLSX. Review rows before final import to fix class/date issues.'
  },
  {
    question: 'Why is yearly payment sometimes unavailable?',
    answer:
      'If a student already has a half-yearly installment in history, yearly mode is blocked to avoid overlapping fee cycles. Use half-yearly for continuity.'
  },
  {
    question: 'How is pending due calculated?',
    answer:
      'A student is pending if they have never paid or their latest paid period has ended. Due amount matches class fee rules in Settings.'
  },
  {
    question: 'What if sheet import fails?',
    answer:
      'Check that the URL is publicly accessible CSV export, and verify required columns (name, class). The report highlights skipped/failed rows.'
  }
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & FAQ"
        description="Quick guidance for imports, payments, due logic, and common troubleshooting."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {faqs.map((item) => (
          <Card key={item.question}>
            <CardHeader>
              <CardTitle className="text-base">{item.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Need to jump quickly?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/students">Open Students</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/payments">Open Payments</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pending">Open Pending Dues</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings">Open Settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
