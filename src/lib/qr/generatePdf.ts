import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { BRAND } from '@/lib/brand';

/** Builds a printable PDF with one QR code + table label per cell, 3x4 grid per page,
 *  and triggers a browser download. Runs client-side only (uses `window.location.origin`). */
export async function downloadTableQrPdf(tableNumbers: number[]) {
  const origin = window.location.origin;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const cols = 3;
  const rows = 4;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 10;
  const marginY = 15;
  const cellW = (pageWidth - marginX * 2) / cols;
  const cellH = (pageHeight - marginY * 2) / rows;
  const qrSize = Math.min(cellW, cellH) * 0.6;

  for (let i = 0; i < tableNumbers.length; i++) {
    const indexOnPage = i % (cols * rows);
    if (indexOnPage === 0 && i !== 0) doc.addPage();

    const col = indexOnPage % cols;
    const row = Math.floor(indexOnPage / cols);
    const cellX = marginX + col * cellW;
    const cellY = marginY + row * cellH;

    const tableNumber = tableNumbers[i];
    const url = `${origin}/order?table=${tableNumber}`;
    const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 256 });

    const qrX = cellX + (cellW - qrSize) / 2;
    const qrY = cellY + 6;
    doc.addImage(dataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(BRAND.name, cellX + cellW / 2, cellY + 4, { align: 'center' });

    doc.setFontSize(13);
    doc.text(`Table ${tableNumber}`, cellX + cellW / 2, qrY + qrSize + 6, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Scan to view menu & order', cellX + cellW / 2, qrY + qrSize + 11, { align: 'center' });
  }

  doc.save(`${BRAND.slug}-table-qr-codes.pdf`);
}
