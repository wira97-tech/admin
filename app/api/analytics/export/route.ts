import { NextRequest, NextResponse } from 'next/server';

interface ExportData {
  overview: {
    totalRevenue: number;
    newClients: number;
    totalInvoices: number;
    paidInvoices: number;
    completionRate: number;
    averagePaymentTime: number;
  };
  revenueTrend: Array<{
    month: string;
    revenue: number;
    invoices: number;
    clients: number;
  }>;
  projectStatus: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  clientAcquisition: Array<{
    month: string;
    newClients: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { format, startDate, endDate, data }: {
      format: 'pdf' | 'csv';
      startDate: string;
      endDate: string;
      data: ExportData;
    } = await request.json();

    if (!data) {
      return NextResponse.json(
        { error: 'Analytics data is required' },
        { status: 400 }
      );
    }

    if (format === 'csv') {
      const csv = generateCSV(data, startDate, endDate);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${startDate}-${endDate}.csv"`,
        },
      });
    } else if (format === 'pdf') {
      // For PDF, we'll need to implement jsPDF functionality
      // For now, return a simple text-based report
      const pdfContent = generatePDFReport(data, startDate, endDate);
      return new NextResponse(pdfContent, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="analytics-${startDate}-${endDate}.txt"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use csv or pdf' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    );
  }
}

function generateCSV(data: ExportData, startDate: string, endDate: string): string {
  const headers = ['Report Type', 'Metric', 'Value', 'Period'];
  const rows = [];

  // Overview section
  rows.push(['Overview', 'Total Revenue', `IDR ${data.overview.totalRevenue.toLocaleString('id-ID')}`, `${startDate} to ${endDate}`]);
  rows.push(['Overview', 'New Clients', data.overview.newClients.toString(), `${startDate} to ${endDate}`]);
  rows.push(['Overview', 'Total Invoices', data.overview.totalInvoices.toString(), `${startDate} to ${endDate}`]);
  rows.push(['Overview', 'Paid Invoices', data.overview.paidInvoices.toString(), `${startDate} to ${endDate}`]);
  rows.push(['Overview', 'Completion Rate', `${data.overview.completionRate}%`, `${startDate} to ${endDate}`]);
  rows.push(['Overview', 'Average Payment Time', `${data.overview.averagePaymentTime} days`, `${startDate} to ${endDate}`]);

  // Revenue trend section
  rows.push([]); // Empty row
  rows.push(['Revenue Trend', 'Month', 'Revenue', 'Invoices', 'New Clients']);
  data.revenueTrend.forEach(trend => {
    rows.push([
      'Revenue Trend',
      trend.month,
      `IDR ${trend.revenue.toLocaleString('id-ID')}`,
      trend.invoices.toString(),
      trend.clients.toString()
    ]);
  });

  // Project status section
  rows.push([]); // Empty row
  rows.push(['Project Status', 'Status', 'Count', 'Percentage']);
  const totalProjects = data.projectStatus.reduce((sum, status) => sum + status.count, 0);
  data.projectStatus.forEach(status => {
    const percentage = totalProjects > 0 ? ((status.count / totalProjects) * 100).toFixed(1) : '0';
    rows.push([
      'Project Status',
      status.status,
      status.count.toString(),
      `${percentage}%`
    ]);
  });

  // Payment methods section
  rows.push([]); // Empty row
  rows.push(['Payment Methods', 'Method', 'Transactions', 'Total Amount']);
  data.paymentMethods.forEach(method => {
    rows.push([
      'Payment Methods',
      method.method,
      method.count.toString(),
      `IDR ${method.amount.toLocaleString('id-ID')}`
    ]);
  });

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
}

function generatePDFReport(data: ExportData, startDate: string, endDate: string): string {
  const reportDate = new Date().toLocaleDateString('id-ID');

  let report = `
AKUSARA DIGITAL AGENCY - ANALYTICS REPORT
Generated on: ${reportDate}
Period: ${startDate} to ${endDate}
===============================================

OVERVIEW METRICS
===============================================
Total Revenue: IDR ${data.overview.totalRevenue.toLocaleString('id-ID')}
New Clients: ${data.overview.newClients}
Total Invoices: ${data.overview.totalInvoices}
Paid Invoices: ${data.overview.paidInvoices}
Completion Rate: ${data.overview.completionRate}%
Average Payment Time: ${data.overview.averagePaymentTime} days

REVENUE TREND
===============================================
`;

  data.revenueTrend.forEach(trend => {
    const date = new Date(trend.month + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    report += `${date}: IDR ${trend.revenue.toLocaleString('id-ID')} (${trend.invoices} invoices, ${trend.clients} new clients)\n`;
  });

  report += `
PROJECT STATUS DISTRIBUTION
===============================================
`;

  const totalProjects = data.projectStatus.reduce((sum, status) => sum + status.count, 0);
  data.projectStatus.forEach(status => {
    const percentage = totalProjects > 0 ? ((status.count / totalProjects) * 100).toFixed(1) : '0';
    report += `${status.status}: ${status.count} projects (${percentage}%)\n`;
  });

  report += `
PAYMENT METHODS
===============================================
`;

  data.paymentMethods.forEach(method => {
    report += `${method.method}: ${method.count} transactions, IDR ${method.amount.toLocaleString('id-ID')}\n`;
  });

  report += `
===============================================
End of Report
===============================================
`;

  return report;
}