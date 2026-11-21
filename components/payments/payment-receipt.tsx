import { formatCurrency, formatDate } from '@/lib/utils';
import { PaymentWithStudent } from '@/types';

export function generateReceiptHtml(payment: PaymentWithStudent): string {
  const receiptNo = `REC-${payment.id.slice(0, 8).toUpperCase()}`;
  const studentName = payment.students?.name || 'Student';
  const studentClass = payment.students?.class ? `Class ${payment.students.class}` : '—';
  const phone = payment.students?.phone || '—';
  const paymentType = payment.payment_type === 'yearly' ? 'Yearly Fee' : 'Half-Yearly Fee';
  const amountFormatted = formatCurrency(payment.amount);
  const paymentDate = formatDate(payment.payment_date);
  const period = `${formatDate(payment.period_start)} to ${formatDate(payment.period_end)}`;
  const notes = payment.notes?.trim() || '—';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Fee Receipt - ${receiptNo}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 20mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      background: #ffffff;
      color: #111827;
      padding: 40px;
      max-width: 650px;
      margin: 0 auto;
    }
    .receipt-card {
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 32px;
      background: #ffffff;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f3f4f6;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      font-size: 13px;
      color: #6b7280;
      margin-top: 4px;
    }
    .receipt-tag {
      text-align: right;
    }
    .receipt-tag .badge {
      display: inline-block;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      border-radius: 9999px;
      margin-bottom: 6px;
    }
    .receipt-number {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }
    .date-row {
      font-size: 12px;
      color: #6b7280;
      margin-top: 2px;
    }
    .grid-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
      background: #f9fafb;
      padding: 16px;
      border-radius: 8px;
    }
    .info-group label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .info-group value {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
      padding: 10px 8px;
    }
    th.text-right, td.text-right {
      text-align: right;
    }
    td {
      padding: 12px 8px;
      font-size: 14px;
      border-bottom: 1px solid #f3f4f6;
      color: #1f2937;
    }
    .total-row td {
      border-top: 2px solid #e5e7eb;
      border-bottom: none;
      font-size: 16px;
      font-weight: 700;
      color: #111827;
      padding-top: 16px;
    }
    .notes-box {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 32px;
      padding: 10px 12px;
      background: #f9fafb;
      border-left: 3px solid #d1d5db;
      border-radius: 4px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 24px;
      border-top: 1px dashed #e5e7eb;
    }
    .footer-note {
      font-size: 12px;
      color: #9ca3af;
    }
    .sign-box {
      text-align: center;
    }
    .sign-line {
      width: 160px;
      border-top: 1px solid #374151;
      margin-bottom: 6px;
    }
    .sign-label {
      font-size: 12px;
      color: #4b5563;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="header">
      <div>
        <div class="brand-title">Fee Tracker</div>
        <div class="brand-subtitle">Official Payment Acknowledgment</div>
      </div>
      <div class="receipt-tag">
        <span class="badge">Paid</span>
        <div class="receipt-number">${receiptNo}</div>
        <div class="date-row">Date: ${paymentDate}</div>
      </div>
    </div>

    <div class="grid-info">
      <div class="info-group">
        <label>Student Name</label>
        <value>${studentName}</value>
      </div>
      <div class="info-group">
        <label>Class</label>
        <value>${studentClass}</value>
      </div>
      <div class="info-group">
        <label>Contact Phone</label>
        <value>${phone}</value>
      </div>
      <div class="info-group">
        <label>Payment Cycle</label>
        <value>${paymentType}</value>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Coverage Period</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Tuition Fee (${paymentType})</strong>
            <div style="font-size: 12px; color: #6b7280;">Student: ${studentName} (${studentClass})</div>
          </td>
          <td>${period}</td>
          <td class="text-right">${amountFormatted}</td>
        </tr>
        <tr class="total-row">
          <td colspan="2">Total Amount Paid</td>
          <td class="text-right">${amountFormatted}</td>
        </tr>
      </tbody>
    </table>

    ${notes !== '—' ? `<div class="notes-box"><strong>Notes:</strong> ${notes}</div>` : ''}

    <div class="footer">
      <div class="footer-note">
        This is a computer-generated fee acknowledgment receipt.
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Authorized Signature</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function printPaymentReceipt(payment: PaymentWithStudent) {
  const html = generateReceiptHtml(payment);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1500);
  }, 250);
}
