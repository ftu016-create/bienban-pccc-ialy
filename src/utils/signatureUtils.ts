/**
 * Utility to convert signature data (SVG data URI, PNG/JPG data URI, or base64)
 * into a Uint8Array PNG buffer suitable for docx ImageRun embedding in Word documents.
 */

export async function signatureToPngBytes(
  dataUrl?: string | null,
  targetWidth = 240,
  targetHeight = 80
): Promise<Uint8Array | null> {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.trim()) {
    return null;
  }

  const trimmed = dataUrl.trim();

  // If already a standard PNG base64 data URL, we can convert directly,
  // BUT rendering via canvas normalizes dimensions and ensures valid PNG headers
  return new Promise<Uint8Array | null>((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const scale = 2; // Crisp resolution for print/Word

          // Determine natural or specified dimensions
          const srcW = img.naturalWidth || targetWidth;
          const srcH = img.naturalHeight || targetHeight;

          // Scale while preserving aspect ratio within max bounds
          const maxW = targetWidth;
          const maxH = targetHeight;
          const ratio = Math.min(maxW / srcW, maxH / srcH, 1);

          const renderW = Math.max(Math.round(srcW * ratio), 60);
          const renderH = Math.max(Math.round(srcH * ratio), 25);

          canvas.width = renderW * scale;
          canvas.height = renderH * scale;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          // Clear transparent
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, renderW, renderH);

          const pngDataUrl = canvas.toDataURL('image/png');
          const base64Part = pngDataUrl.split(',')[1];
          if (!base64Part) {
            resolve(null);
            return;
          }

          const binary = atob(base64Part);
          const len = binary.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
          }

          resolve(bytes);
        } catch (err) {
          console.error('Failed to convert signature on canvas:', err);
          resolve(null);
        }
      };

      img.onerror = () => {
        // Fallback: if it's already a base64 PNG/JPG, try direct atob
        if (trimmed.startsWith('data:image/png;base64,') || trimmed.startsWith('data:image/jpeg;base64,')) {
          try {
            const base64Part = trimmed.split(',')[1];
            const binary = atob(base64Part);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            resolve(bytes);
            return;
          } catch {
            // ignore
          }
        }
        resolve(null);
      };

      // Handle SVG hash encoding for SVG data URIs
      let src = trimmed;
      if (src.startsWith('data:image/svg+xml;utf8,') && src.includes('#') && !src.includes('%23')) {
        src = src.replace(/#/g, '%23');
      }
      img.src = src;
    } catch (e) {
      console.error('Error in signatureToPngBytes:', e);
      resolve(null);
    }
  });
}
