import { PDFDocument } from 'pdf-lib';
import { AttachmentItem } from '../types';
import { attachmentService } from './attachmentService';

let pdfjsInstance: any = null;

async function getPdfJs(): Promise<any> {
  if (pdfjsInstance) return pdfjsInstance;
  try {
    const pdfjs = await import('pdfjs-dist');
    if (typeof window !== 'undefined' && pdfjs?.GlobalWorkerOptions) {
      try {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
      } catch {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '6.3.289'}/pdf.worker.min.mjs`;
      }
    }
    pdfjsInstance = pdfjs;
    return pdfjsInstance;
  } catch (e) {
    console.warn('pdfjs-dist could not be loaded dynamically:', e);
    return null;
  }
}

export const pdfMergeService = {
  /**
   * Merges the main generated report PDF with all attached PDF documents into a single standalone PDF.
   * Order:
   * 1. Main Inspection Report PDF pages (Mẫu PC02 + Photo annex)
   * 2. Phụ lục 01 PDF pages
   * 3. Phụ lục 02 PDF pages
   * ...
   */
  async mergeReportPdfWithAttachments(
    mainPdfBytes: Uint8Array | ArrayBuffer,
    pdfAttachments: AttachmentItem[]
  ): Promise<Uint8Array> {
    if (!pdfAttachments || pdfAttachments.length === 0) {
      return new Uint8Array(mainPdfBytes);
    }

    try {
      const mergedPdf = await PDFDocument.load(mainPdfBytes);

      for (const att of pdfAttachments) {
        if (att.fileType !== 'pdf') continue;

        try {
          const fileUrl = attachmentService.getAttachmentViewUrl(att);
          const attBytes = await attachmentService.fetchFileAsArrayBuffer(fileUrl);
          if (!attBytes) {
            console.warn(`Could not fetch PDF attachment from ${fileUrl}`);
            continue;
          }

          const attDoc = await PDFDocument.load(attBytes);
          const pageCount = attDoc.getPageCount();
          const pageIndices = Array.from({ length: pageCount }, (_, i) => i);
          const copiedPages = await mergedPdf.copyPages(attDoc, pageIndices);

          for (const page of copiedPages) {
            mergedPdf.addPage(page);
          }
        } catch (attErr) {
          console.error(`Failed to merge PDF attachment "${att.fileName}":`, attErr);
        }
      }

      return await mergedPdf.save();
    } catch (err) {
      console.error('PDF merge error, returning main PDF as fallback:', err);
      return new Uint8Array(mainPdfBytes);
    }
  },

  /**
   * Renders each page of a PDF attachment to PNG image bytes (Uint8Array)
   * so Word (.docx) can embed every single page of the attached PDF as an image!
   */
  async renderPdfPagesToImages(pdfArrayBuffer: ArrayBuffer): Promise<{ pageNumber: number; imageBytes: Uint8Array; width: number; height: number }[]> {
    const results: { pageNumber: number; imageBytes: Uint8Array; width: number; height: number }[] = [];

    try {
      const pdfjsLib = await getPdfJs();
      if (!pdfjsLib) {
        console.warn('pdfjsLib is not available in this environment');
        return results;
      }
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(pdfArrayBuffer),
        useSystemFonts: true,
      });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 }); // High resolution for sharp print display

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) continue;

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          // Fill white background
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);

          await (page.render as any)({
            canvasContext: context,
            viewport,
            canvas,
          }).promise;

          const dataUrl = canvas.toDataURL('image/png');
          const base64Data = dataUrl.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          results.push({
            pageNumber: pageNum,
            imageBytes: bytes,
            width: viewport.width,
            height: viewport.height,
          });
        } catch (pageErr) {
          console.error(`Error rendering PDF page ${pageNum}:`, pageErr);
        }
      }
    } catch (err) {
      console.error('Error rendering PDF document to images:', err);
    }

    return results;
  },
};
