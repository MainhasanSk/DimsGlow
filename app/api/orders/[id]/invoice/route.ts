import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { checkInvoiceEligibility } from '@/lib/invoices/invoiceService';
import { generateInvoicePdf } from '@/lib/invoices/pdfGenerator';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId } = await params;

    // 1. Authorize session
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to download tax invoice' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    const session = await verifyServerSession(idToken);

    // 2. Perform live, multi-factor eligibility verification
    const eligibility = await checkInvoiceEligibility(orderId, {
      uid: session.uid,
      role: session.role,
    });

    if (!eligibility.eligible || !eligibility.invoice) {
      return NextResponse.json(
        {
          success: false,
          error: eligibility.reason,
          status: eligibility.status,
        },
        { status: 403 }
      );
    }

    // 3. Generate high-fidelity official A4 Tax Invoice PDF
    const pdfBytes = await generateInvoicePdf(eligibility.invoice);

    // 4. Stream PDF to client
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Invoice-${eligibility.invoice.invoiceNumber}.pdf"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate tax invoice' },
      { status: 500 }
    );
  }
}
