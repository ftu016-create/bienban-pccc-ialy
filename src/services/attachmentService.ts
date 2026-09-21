import { AttachmentItem, AiInspectionAnalysis, UserRole } from '../types';
import { adminAuthService } from './adminAuth';

function getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const currentPin = adminAuthService.getPin();
  const headers: Record<string, string> = {
    ...extraHeaders,
  };
  if (adminAuthService.getUserRole() === 'admin') {
    headers['x-admin-pin'] = currentPin;
    headers['Authorization'] = `Bearer ${currentPin}`;
  }
  return headers;
}

async function optimizeImageFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(mime, 0.82);
          resolve(dataUrl);
          return;
        }
        resolve((e.target?.result as string) || '');
      };
      img.onerror = () => {
        resolve((e.target?.result as string) || '');
      };
      img.src = (e.target?.result as string) || '';
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function readPdfAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve((e.target?.result as string) || '');
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export const attachmentService = {
  getAttachmentViewUrl(attachment: AttachmentItem): string {
    if (attachment.url && (attachment.url.startsWith('/') || attachment.url.startsWith('data:') || attachment.url.startsWith('blob:'))) {
      return attachment.url;
    }
    return `/api/reports/${attachment.reportId}/attachments/${attachment.id}`;
  },

  getAttachmentDownloadUrl(reportId: string, attachmentId: string): string {
    return `/api/reports/${reportId}/attachments/${attachmentId}/download`;
  },

  async uploadAttachments(
    reportId: string,
    files: File[],
    metadata: {
      targetType?: AttachmentItem['targetType'];
      targetItemId?: string;
      targetCategory?: string;
      plant?: 'ialy' | 'ialy_mr';
      locationDescription?: string;
      description?: string;
      uploadedBy?: string;
    } = {}
  ): Promise<{ success: boolean; attachments: AttachmentItem[]; error?: string }> {
    if (!files || files.length === 0) {
      return { success: false, attachments: [], error: 'Không có tệp nào được chọn' };
    }

    // 1. Try uploading to backend API first (for full-stack / Cloud Run deployments)
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      if (metadata.targetType) formData.append('targetType', metadata.targetType);
      if (metadata.targetItemId) formData.append('targetItemId', metadata.targetItemId);
      if (metadata.targetCategory) formData.append('targetCategory', metadata.targetCategory);
      if (metadata.plant) formData.append('plant', metadata.plant);
      if (metadata.locationDescription) formData.append('locationDescription', metadata.locationDescription);
      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.uploadedBy) formData.append('uploadedBy', metadata.uploadedBy);

      const response = await fetch(`/api/reports/${reportId}/attachments`, {
        method: 'POST',
        headers: getHeaders(), // Multi-part form: do NOT set Content-Type header manually
        body: formData,
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success && Array.isArray(data.attachments)) {
          return {
            success: true,
            attachments: data.attachments,
          };
        }
      }
      // If server returned non-JSON (e.g. Vercel static rewrite to index.html) or error status
      console.warn('Server API unavailable or returned non-JSON, using client-side storage fallback.');
    } catch (err: any) {
      console.warn('Server upload request failed, using client-side storage fallback:', err);
    }

    // 2. Client-side Fallback (for Vercel static deployment or offline preview)
    try {
      const clientAttachments: AttachmentItem[] = [];
      for (const file of files) {
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        let dataUrl = '';
        if (isPdf) {
          dataUrl = await readPdfAsDataUrl(file);
        } else {
          dataUrl = await optimizeImageFile(file);
        }

        const cleanName = file.name.replace(/\.[^/.]+$/, '').trim();
        const item: AttachmentItem = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          reportId,
          targetType: metadata.targetType || 'inspection_finding',
          targetCategory: metadata.targetCategory,
          plant: metadata.plant || 'ialy',
          locationDescription: metadata.locationDescription || '',
          fileType: isPdf ? 'pdf' : 'image',
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
          storagePath: `client/${file.name}`,
          url: dataUrl,
          thumbnailUrl: dataUrl,
          description: metadata.description?.trim() || cleanName,
          uploadedBy: metadata.uploadedBy || 'Người kiểm tra',
          createdAt: new Date().toISOString(),
        };
        clientAttachments.push(item);
      }

      return {
        success: true,
        attachments: clientAttachments,
      };
    } catch (fallbackErr: any) {
      console.error('Client-side file conversion failed:', fallbackErr);
      return {
        success: false,
        attachments: [],
        error: fallbackErr?.message || 'Không thể xử lý tệp trên trình duyệt',
      };
    }
  },

  async deleteAttachment(reportId: string, attachmentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/reports/${reportId}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const data = await response.json();
        return { success: data.success !== false };
      }
    } catch (err: any) {
      console.warn('Server delete attachment skipped, deleted locally:', err);
    }
    // Always succeed locally
    return { success: true };
  },

  async updateAttachment(
    reportId: string,
    attachmentId: string,
    updates: Partial<AttachmentItem>
  ): Promise<{ success: boolean; attachment?: AttachmentItem; error?: string }> {
    try {
      const response = await fetch(`/api/reports/${reportId}/attachments/${attachmentId}`, {
        method: 'PUT',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(updates),
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success && data.attachment) {
          return { success: true, attachment: data.attachment };
        }
      }
    } catch (err: any) {
      console.warn('Server update attachment skipped, updated locally:', err);
    }
    return { success: true, attachment: updates as any };
  },

  async analyzeWithAi(params: {
    reportId: string;
    attachmentId?: string;
    imageBase64?: string;
    mimeType?: string;
    targetCategory?: string;
    plant?: 'ialy' | 'ialy_mr';
    locationDescription?: string;
    userDescription?: string;
  }): Promise<{ success: boolean; analysis?: AiInspectionAnalysis; error?: string }> {
    try {
      const response = await fetch('/api/ai/analyze-inspection-image', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(params),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Lỗi phân tích AI' };
      }

      return { success: true, analysis: data.analysis };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Không thể kết nối dịch vụ AI' };
    }
  },

  async fetchFileAsArrayBuffer(fileUrl: string): Promise<ArrayBuffer | null> {
    try {
      const url = fileUrl.startsWith('http') || fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.arrayBuffer();
    } catch (err) {
      console.error(`Failed to fetch file from ${fileUrl}:`, err);
      return null;
    }
  },
};
