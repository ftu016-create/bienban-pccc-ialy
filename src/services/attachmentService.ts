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

export const attachmentService = {
  getAttachmentViewUrl(attachment: AttachmentItem): string {
    if (attachment.url && attachment.url.startsWith('/')) {
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

    try {
      const response = await fetch(`/api/reports/${reportId}/attachments`, {
        method: 'POST',
        headers: getHeaders(), // Multi-part form: do NOT set Content-Type header manually
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return {
          success: false,
          attachments: [],
          error: data.error || `Lỗi tải tệp: HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        attachments: data.attachments || [],
      };
    } catch (err: any) {
      console.error('Upload attachments error:', err);
      return {
        success: false,
        attachments: [],
        error: err?.message || 'Không thể kết nối máy chủ để tải tệp',
      };
    }
  },

  async deleteAttachment(reportId: string, attachmentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/reports/${reportId}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || `Lỗi xóa tệp: HTTP ${response.status}`,
        };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Delete attachment error:', err);
      return { success: false, error: err?.message || 'Không thể kết nối máy chủ' };
    }
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

      const data = await response.json();
      if (!response.ok || !data.success) {
        return { success: false, error: data.error || `Lỗi cập nhật tệp: HTTP ${response.status}` };
      }

      return { success: true, attachment: data.attachment };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Lỗi mạng' };
    }
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
