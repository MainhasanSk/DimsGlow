import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Invoice } from '@/lib/schemas/invoice';

/**
 * Formats integer paise into clean Indian Rupee text (e.g. Rs. 1,299.00)
 */
function formatRupees(paise: number): string {
  const inr = paise / 100;
  return `Rs. ${inr.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Generates an official, GST-compliant A4 Tax Invoice PDF using pdf-lib
 */
export async function generateInvoicePdf(invoice: Invoice): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4 in points
  const { width, height } = page.getSize();

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Palette
  const burgundy = rgb(0.357, 0.075, 0.169); // #5B132B
  const gold = rgb(0.831, 0.686, 0.216); // #D4AF37
  const charcoal = rgb(0.1, 0.09, 0.1); // #19161A
  const muted = rgb(0.45, 0.45, 0.47); // #737373
  const tableHeaderBg = rgb(0.97, 0.95, 0.96);
  const borderLight = rgb(0.85, 0.82, 0.84);
  const voidRed = rgb(0.85, 0.15, 0.15);

  let cursorY = height - 40;

  // 1. Top Luxury Brand Accent Bar
  page.drawRectangle({
    x: 0,
    y: height - 8,
    width,
    height: 8,
    color: burgundy,
  });

  // 2. Void Banner if invoice is voided
  if (invoice.status === 'voided') {
    page.drawRectangle({
      x: 35,
      y: cursorY - 32,
      width: width - 70,
      height: 36,
      color: rgb(1, 0.92, 0.92),
      borderColor: voidRed,
      borderWidth: 1,
    });

    page.drawText('*** VOIDED INVOICE — ORDER CANCELLED / REFUNDED ***', {
      x: 50,
      y: cursorY - 14,
      size: 11,
      font: fontBold,
      color: voidRed,
    });

    const voidDetail = `Reason: ${invoice.voidReason || 'Order Cancelled'} | Credit Note Ref: ${
      invoice.creditNoteReference || 'CRN-PENDING'
    }`;
    page.drawText(voidDetail.slice(0, 80), {
      x: 50,
      y: cursorY - 26,
      size: 8,
      font: fontRegular,
      color: voidRed,
    });

    cursorY -= 48;
  }

  // 3. Header Section: Brand & Tax Invoice Title
  page.drawText('DIMSGLOW', {
    x: 40,
    y: cursorY,
    size: 22,
    font: fontBold,
    color: burgundy,
  });

  page.drawText('LUXURY COSMETICS & BEAUTY', {
    x: 40,
    y: cursorY - 14,
    size: 8,
    font: fontBold,
    color: gold,
  });

  page.drawText('TAX INVOICE', {
    x: width - 180,
    y: cursorY,
    size: 18,
    font: fontBold,
    color: charcoal,
  });

  page.drawText('ORIGINAL FOR RECIPIENT', {
    x: width - 180,
    y: cursorY - 14,
    size: 8,
    font: fontRegular,
    color: muted,
  });

  cursorY -= 36;

  // Divider Line
  page.drawLine({
    start: { x: 40, y: cursorY },
    end: { x: width - 40, y: cursorY },
    thickness: 1,
    color: borderLight,
  });

  cursorY -= 16;

  // 4. Metadata Strip (Invoice No, Date, Order No, Place of Supply)
  const metaBoxY = cursorY;
  page.drawRectangle({
    x: 40,
    y: metaBoxY - 45,
    width: width - 80,
    height: 48,
    color: rgb(0.98, 0.98, 0.98),
    borderColor: borderLight,
    borderWidth: 0.5,
  });

  const colWidth = (width - 80) / 4;

  // Col 1: Invoice No
  page.drawText('INVOICE NUMBER', { x: 50, y: metaBoxY - 16, size: 7, font: fontBold, color: muted });
  page.drawText(invoice.invoiceNumber, { x: 50, y: metaBoxY - 32, size: 10, font: fontBold, color: charcoal });

  // Col 2: Invoice Date
  page.drawText('INVOICE DATE', { x: 50 + colWidth, y: metaBoxY - 16, size: 7, font: fontBold, color: muted });
  page.drawText(formatDate(invoice.issueDate), {
    x: 50 + colWidth,
    y: metaBoxY - 32,
    size: 9,
    font: fontRegular,
    color: charcoal,
  });

  // Col 3: Order Ref
  page.drawText('ORDER REFERENCE', { x: 50 + colWidth * 2, y: metaBoxY - 16, size: 7, font: fontBold, color: muted });
  page.drawText(invoice.orderNumber, {
    x: 50 + colWidth * 2,
    y: metaBoxY - 32,
    size: 9,
    font: fontRegular,
    color: charcoal,
  });

  // Col 4: Place of Supply
  page.drawText('PLACE OF SUPPLY', { x: 50 + colWidth * 3, y: metaBoxY - 16, size: 7, font: fontBold, color: muted });
  page.drawText(`${invoice.seller.state} (Code: ${invoice.seller.stateCode})`, {
    x: 50 + colWidth * 3,
    y: metaBoxY - 32,
    size: 9,
    font: fontRegular,
    color: charcoal,
  });

  cursorY -= 65;

  // 5. Seller & Buyer Columns
  const partiesBoxY = cursorY;
  const partyWidth = (width - 90) / 2;

  // Seller Header
  page.drawText('SOLD BY (SUPPLIER)', {
    x: 40,
    y: partiesBoxY,
    size: 8,
    font: fontBold,
    color: burgundy,
  });

  page.drawText(invoice.seller.legalName, {
    x: 40,
    y: partiesBoxY - 14,
    size: 9,
    font: fontBold,
    color: charcoal,
  });
  page.drawText(invoice.seller.address, {
    x: 40,
    y: partiesBoxY - 26,
    size: 8,
    font: fontRegular,
    color: muted,
  });
  page.drawText(`State: ${invoice.seller.state} (Code: ${invoice.seller.stateCode})`, {
    x: 40,
    y: partiesBoxY - 37,
    size: 8,
    font: fontRegular,
    color: muted,
  });
  if (invoice.seller.gstin) {
    page.drawText(`GSTIN: ${invoice.seller.gstin}`, {
      x: 40,
      y: partiesBoxY - 48,
      size: 8,
      font: fontBold,
      color: charcoal,
    });
  }
  page.drawText(`Contact: ${invoice.seller.contactPhone} | ${invoice.seller.contactEmail}`, {
    x: 40,
    y: partiesBoxY - 59,
    size: 8,
    font: fontRegular,
    color: muted,
  });

  // Buyer Header
  const buyerX = 40 + partyWidth + 10;
  page.drawText('BILL TO & SHIP TO (RECIPIENT)', {
    x: buyerX,
    y: partiesBoxY,
    size: 8,
    font: fontBold,
    color: burgundy,
  });

  page.drawText(invoice.buyer.fullName, {
    x: buyerX,
    y: partiesBoxY - 14,
    size: 9,
    font: fontBold,
    color: charcoal,
  });
  page.drawText(invoice.buyer.addressLine1, {
    x: buyerX,
    y: partiesBoxY - 26,
    size: 8,
    font: fontRegular,
    color: muted,
  });
  if (invoice.buyer.addressLine2) {
    page.drawText(invoice.buyer.addressLine2, {
      x: buyerX,
      y: partiesBoxY - 37,
      size: 8,
      font: fontRegular,
      color: muted,
    });
  }
  page.drawText(`${invoice.buyer.city}, ${invoice.buyer.state} - ${invoice.buyer.postalCode}`, {
    x: buyerX,
    y: partiesBoxY - 48,
    size: 8,
    font: fontRegular,
    color: muted,
  });
  page.drawText(`Phone: +91 ${invoice.buyer.phone}`, {
    x: buyerX,
    y: partiesBoxY - 59,
    size: 8,
    font: fontRegular,
    color: muted,
  });

  cursorY -= 82;

  // 6. Line Items Table Header
  page.drawRectangle({
    x: 40,
    y: cursorY - 18,
    width: width - 80,
    height: 22,
    color: tableHeaderBg,
    borderColor: borderLight,
    borderWidth: 0.5,
  });

  const headerY = cursorY - 12;
  page.drawText('#', { x: 45, y: headerY, size: 8, font: fontBold, color: charcoal });
  page.drawText('ITEM DESCRIPTION', { x: 65, y: headerY, size: 8, font: fontBold, color: charcoal });
  page.drawText('HSN/SAC', { x: 260, y: headerY, size: 8, font: fontBold, color: charcoal });
  page.drawText('QTY', { x: 330, y: headerY, size: 8, font: fontBold, color: charcoal });
  page.drawText('UNIT PRICE', { x: 380, y: headerY, size: 8, font: fontBold, color: charcoal });
  page.drawText('TAX RATE', { x: 455, y: headerY, size: 8, font: fontBold, color: charcoal });
  page.drawText('AMOUNT', { x: 505, y: headerY, size: 8, font: fontBold, color: charcoal });

  cursorY -= 24;

  // 7. Table Rows
  const defaultHsn = '33041000';
  invoice.lineItems.forEach((item, idx) => {
    const rowY = cursorY - 14;

    page.drawText(`${idx + 1}`, { x: 45, y: rowY, size: 8, font: fontRegular, color: muted });

    const itemTitle = item.variantTitle
      ? `${item.productName} (${item.variantTitle})`
      : item.productName;
    page.drawText(itemTitle.slice(0, 38), {
      x: 65,
      y: rowY,
      size: 8,
      font: fontBold,
      color: charcoal,
    });
    page.drawText(`SKU: ${item.sku}`, {
      x: 65,
      y: rowY - 10,
      size: 7,
      font: fontRegular,
      color: muted,
    });

    page.drawText(defaultHsn, { x: 260, y: rowY, size: 8, font: fontRegular, color: muted });
    page.drawText(`${item.quantity}`, { x: 335, y: rowY, size: 8, font: fontRegular, color: charcoal });
    page.drawText(formatRupees(item.unitPricePaise), {
      x: 375,
      y: rowY,
      size: 8,
      font: fontRegular,
      color: charcoal,
    });
    page.drawText('18% GST', { x: 455, y: rowY, size: 8, font: fontRegular, color: muted });
    page.drawText(formatRupees(item.totalPaise), {
      x: 500,
      y: rowY,
      size: 8,
      font: fontBold,
      color: charcoal,
    });

    cursorY -= 26;

    page.drawLine({
      start: { x: 40, y: cursorY },
      end: { x: width - 40, y: cursorY },
      thickness: 0.5,
      color: borderLight,
    });
  });

  cursorY -= 12;

  // 8. Financial Calculation Summary Block
  const summaryX = width - 230;
  const summaryWidth = 190;

  page.drawRectangle({
    x: summaryX,
    y: cursorY - 105,
    width: summaryWidth,
    height: 110,
    color: rgb(0.99, 0.99, 0.99),
    borderColor: borderLight,
    borderWidth: 0.5,
  });

  let sumY = cursorY - 14;

  // Subtotal
  page.drawText('Subtotal (Taxable):', { x: summaryX + 10, y: sumY, size: 8, font: fontRegular, color: muted });
  page.drawText(formatRupees(invoice.subtotalPaise), {
    x: summaryX + 110,
    y: sumY,
    size: 8,
    font: fontRegular,
    color: charcoal,
  });
  sumY -= 16;

  // Discount
  if (invoice.discountPaise > 0) {
    page.drawText('Promotional Discount:', { x: summaryX + 10, y: sumY, size: 8, font: fontRegular, color: muted });
    page.drawText(`- ${formatRupees(invoice.discountPaise)}`, {
      x: summaryX + 110,
      y: sumY,
      size: 8,
      font: fontRegular,
      color: burgundy,
    });
    sumY -= 16;
  }

  // Shipping
  page.drawText('Shipping Charges:', { x: summaryX + 10, y: sumY, size: 8, font: fontRegular, color: muted });
  const shippingText = invoice.shippingFeePaise === 0 ? 'FREE' : formatRupees(invoice.shippingFeePaise);
  page.drawText(shippingText, {
    x: summaryX + 110,
    y: sumY,
    size: 8,
    font: fontRegular,
    color: invoice.shippingFeePaise === 0 ? rgb(0.1, 0.6, 0.2) : charcoal,
  });
  sumY -= 16;

  // Integrated GST Breakdown (18%)
  page.drawText('Integrated GST (18%):', { x: summaryX + 10, y: sumY, size: 8, font: fontRegular, color: muted });
  page.drawText(formatRupees(invoice.taxPaise), {
    x: summaryX + 110,
    y: sumY,
    size: 8,
    font: fontRegular,
    color: charcoal,
  });
  sumY -= 18;

  // Divider
  page.drawLine({
    start: { x: summaryX + 10, y: sumY + 4 },
    end: { x: summaryX + summaryWidth - 10, y: sumY + 4 },
    thickness: 1,
    color: burgundy,
  });

  // Grand Total
  page.drawText('Total Invoice Value:', { x: summaryX + 10, y: sumY - 6, size: 9, font: fontBold, color: charcoal });
  page.drawText(formatRupees(invoice.totalPaise), {
    x: summaryX + 105,
    y: sumY - 6,
    size: 10,
    font: fontBold,
    color: burgundy,
  });

  // 9. Payment Details & Notes on the Left
  const paymentBoxY = cursorY - 14;
  page.drawText('PAYMENT INFORMATION', {
    x: 40,
    y: paymentBoxY,
    size: 8,
    font: fontBold,
    color: burgundy,
  });

  page.drawText('Payment Method: Cash / Pay On Delivery (Manual Reconciliation)', {
    x: 40,
    y: paymentBoxY - 14,
    size: 8,
    font: fontRegular,
    color: charcoal,
  });

  page.drawText(`Status: ${invoice.status === 'voided' ? 'VOIDED / INACTIVE' : 'COMPLETED / VALID'}`, {
    x: 40,
    y: paymentBoxY - 26,
    size: 8,
    font: fontBold,
    color: invoice.status === 'voided' ? voidRed : rgb(0.1, 0.6, 0.2),
  });

  page.drawText('Returns & Exchanges: Contact VIP Support via WhatsApp (+91 361 455 6830)', {
    x: 40,
    y: paymentBoxY - 40,
    size: 7.5,
    font: fontRegular,
    color: muted,
  });

  // 10. Legal Declaration Footer
  const footerY = 55;
  page.drawLine({
    start: { x: 40, y: footerY + 18 },
    end: { x: width - 40, y: footerY + 18 },
    thickness: 0.5,
    color: borderLight,
  });

  page.drawText(
    'Declaration: This is a computer generated tax invoice and does not require a physical signature.',
    {
      x: 40,
      y: footerY + 6,
      size: 7.5,
      font: fontItalic,
      color: muted,
    }
  );

  page.drawText(
    'DIMSGLOW COSMETICS PRIVATE LIMITED | Registered Office: Guwahati, Assam, India | www.dimsglow.com',
    {
      x: 40,
      y: footerY - 6,
      size: 7,
      font: fontRegular,
      color: muted,
    }
  );

  return await doc.save();
}
