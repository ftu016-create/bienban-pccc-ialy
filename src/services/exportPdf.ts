import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import saveAs from 'file-saver';
import { ReportData } from '../types';
import { pdfMergeService } from './pdfMergeService';

/**
 * Exports an HTML element as an A4 PDF document with multi-page support,
 * and automatically merges any attached PDF documents into a single complete PDF!
 */
export async function exportElementToPdf(
  element: HTMLElement,
  filename = 'Bien-ban-kiem-tra-PCCC.pdf',
  report?: ReportData
): Promise<void> {
  // Capture canvas with 2x scale for sharp text, photos, and signature rendering
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1200,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // Page 1
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pageHeight;

  // Subsequent pages if content overflows A4 height
  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
  }

  const mainPdfArrayBuffer = pdf.output('arraybuffer');

  // If report has attached PDF documents, merge them directly into this PDF file
  const pdfAttachments = (report?.attachments || []).filter((a) => a.fileType === 'pdf');
  if (pdfAttachments.length > 0) {
    try {
      const mergedPdfBytes = await pdfMergeService.mergeReportPdfWithAttachments(
        mainPdfArrayBuffer,
        pdfAttachments
      );
      const blob = new Blob([mergedPdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      saveAs(blob, filename);
      return;
    } catch (mergeErr) {
      console.error('Failed to merge attachments, downloading main PDF:', mergeErr);
    }
  }

  // Fallback / standard save
  const blob = new Blob([mainPdfArrayBuffer], { type: 'application/pdf' });
  saveAs(blob, filename);
}

export function generatePdfFilename(report: ReportData): string {
  const monthStr = (report.report_month || '07-2026').replace(/[\/\\]/g, '-').trim();
  const soStr = (report.so || '1209').replace(/[\/\\]/g, '-').trim();
  return `Bien-ban-PCCC-Thang-${monthStr}-So-${soStr}.pdf`;
}

