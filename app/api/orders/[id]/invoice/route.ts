import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSession } from '@/lib/auth/serverAuth';
import { checkInvoiceEligibility } from '@/lib/invoices/invoiceService';
import { generateInvoicePdf } from '@/lib/invoices/pdfGenerator';
import type { Invoice } from '@/lib/schemas/invoice';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Authentication required to access invoices.' },
      { status: 401 }
    );
  }

  try {
    const { id: orderId } = await params;

    const idToken = authHeader.split('Bearer ')[1];
    let session;
    try {
      session = await verifyServerSession(idToken);
    } catch (authErr: any) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session. Please sign in again.' },
        { status: 401 }
      );
    }

    // Check eligibility — this enforces order status rules (placed = not eligible)
    const eligibility = await checkInvoiceEligibility(orderId, {
      uid: session.uid,
      role: session.role,
    });

    if (!eligibility.eligible) {
      // Map status to user-friendly HTTP codes
      const statusCodes: Record<string, number> = {
        not_found: 404,
        forbidden: 403,
        not_confirmed: 403,
        cancelled: 403,
        refunded: 403,
        voided: 403,
      };
      return NextResponse.json(
        { success: false, error: eligibility.reason },
        { status: statusCodes[eligibility.status] || 403 }
      );
    }

    const invoice = eligibility.invoice as Invoice;

    // Generate high-fidelity official A4 Tax Invoice PDF
    const pdfBytes = await generateInvoicePdf(invoice);

    // Stream PDF to client
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Invoice-${invoice.invoiceNumber}.pdf"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Invoice-Number': invoice.invoiceNumber,
      },
    });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') throw error;
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate tax invoice' },
      { status: 500 }
    );
  }
}
