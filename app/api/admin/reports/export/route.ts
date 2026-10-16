import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { generateExcelReport } from '@/lib/reports/reportService';
import { hasPermission } from '@/lib/auth/roles';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    // Also support token as query param for direct browser download links if needed
    const { searchParams } = new URL(req.url);
    const tokenQuery = searchParams.get('token');
    const idToken = authHeader?.startsWith('Bearer ')
      ? authHeader.split('Bearer ')[1]
      : tokenQuery;

    if (!idToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyServerSession(idToken);

    if (session.role === 'customer' || !hasPermission(session.role, 'reports:export')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const range = (searchParams.get('range') as any) || '30d';
    const excelBuffer = await generateExcelReport(
      { range },
      session.email || 'Admin',
      session.role
    );

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `DIMSGLOW_Financial_Report_${range.toUpperCase()}_${timestamp}.xlsx`;

    return new Response(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error generating Excel report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate Excel report' },
      { status: 500 }
    );
  }
}
