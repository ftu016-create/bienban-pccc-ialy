import { ReportData } from '../types';
import { createNewReport, DEFAULT_STAFF_DIRECTORY } from '../data/defaultData';
import { adminAuthService } from './adminAuth';

const REPORTS_KEY = 'pccc_ialy_reports_v1';
const STAFF_KEY = 'pccc_ialy_staff_directory_v2';

function getAdminHeaders(): Record<string, string> {
  const pin = adminAuthService.getPin();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (adminAuthService.getUserRole() === 'admin') {
    headers['x-admin-pin'] = pin;
    headers['Authorization'] = `Bearer ${pin}`;
  }
  return headers;
}

export const storageService = {
  /**
   * Fetch latest reports from server API so all machines see updated data immediately.
   */
  async fetchFromServer(): Promise<ReportData[]> {
    try {
      const res = await fetch('/api/reports');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && Array.isArray(json.reports) && json.reports.length > 0) {
          const reports = (json.reports as ReportData[]).map((r) => ({
            ...r,
            escape: (r.escape || []).map((esc) =>
              esc.note && esc.note.includes('Hình ảnh minh chứng được lưu tại thư mục dùng chung')
                ? { ...esc, note: '' }
                : esc
            ),
          }));
          localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
          return reports;
        }
      }
    } catch (e) {
      console.warn('Could not reach /api/reports, using local cache:', e);
    }
    return this.getAllReports();
  },

  getAllReports(): ReportData[] {
    try {
      const data = localStorage.getItem(REPORTS_KEY);
      if (!data) {
        // Seed with initial report from PDF
        const initial = createNewReport();
        localStorage.setItem(REPORTS_KEY, JSON.stringify([initial]));
        return [initial];
      }
      const parsed: ReportData[] = JSON.parse(data);
      // Ensure backward compatibility for fields and clean inspection_areas & legacy notes
      return parsed.map((r) => {
        let cleanAreas = r.inspection_areas;
        if (cleanAreas && (cleanAreas.includes('Cửa Nhận Nước') || cleanAreas.includes('Cửa Nhận nước'))) {
          cleanAreas = cleanAreas
            .replace(
              '- NMTĐ Ialy: Gian máy; Gian biến áp; Nhà PK; Trạm 500 kV Ialy; Cửa Nhận Nước.',
              '- NMTĐ Ialy: Gian máy, Gian biến áp, Nhà PK, Trạm 500 kV, Cửa nhận nước.'
            )
            .replace(
              '- NMTĐ Ialy: Gian máy; Gian biến áp; Nhà PK; Trạm 500 kV Ialy; Cửa Nhận nước.',
              '- NMTĐ Ialy: Gian máy, Gian biến áp, Nhà PK, Trạm 500 kV, Cửa nhận nước.'
            );
        }

        const cleanEscape = (r.escape || []).map((esc) => {
          if (esc.note && esc.note.includes('Hình ảnh minh chứng được lưu tại thư mục dùng chung')) {
            return { ...esc, note: '' };
          }
          return esc;
        });

        return {
          ...r,
          inspection_areas: cleanAreas,
          escape: cleanEscape,
          status: r.status || 'draft',
          attachments: r.attachments || [],
        };
      });
    } catch (e) {
      console.error('Failed to load reports from localStorage', e);
      return [createNewReport()];
    }
  },

  getReports(): ReportData[] {
    return this.getAllReports();
  },

  getReportById(id: string): ReportData | null {
    const all = this.getAllReports();
    return all.find((r) => r.id === id) || null;
  },

  async getReportByIdAsync(id: string): Promise<ReportData | null> {
    try {
      const res = await fetch(`/api/reports/${id}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && json.report) {
          return json.report as ReportData;
        }
      }
    } catch (e) {
      // Fallback
    }
    return this.getReportById(id);
  },

  createNewMonthlyReport(override?: Partial<ReportData>): ReportData {
    const newReport = createNewReport(override);
    this.saveReport(newReport);
    return newReport;
  },

  saveReport(report: ReportData): void {
    const all = this.getAllReports();
    const existingIndex = all.findIndex((r) => r.id === report.id);
    const now = new Date().toISOString();
    const updated = {
      ...report,
      status: report.status || 'draft',
      attachments: report.attachments || [],
      updated_at: now,
    };

    if (existingIndex >= 0) {
      all[existingIndex] = updated;
    } else {
      all.unshift(updated);
    }

    try {
      localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('localStorage save warning:', e);
    }

    // Persist to server API in background (if server exists)
    fetch('/api/reports', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ report: updated }),
    }).catch((err) => {
      console.warn('Server save background sync warning:', err);
    });
  },

  async saveReportAsync(report: ReportData): Promise<{ success: boolean; error?: string }> {
    const updated = {
      ...report,
      status: report.status || 'draft',
      attachments: report.attachments || [],
      updated_at: new Date().toISOString(),
    };

    // Update local first
    const all = this.getAllReports();
    const existingIndex = all.findIndex((r) => r.id === report.id);
    if (existingIndex >= 0) {
      all[existingIndex] = updated;
    } else {
      all.unshift(updated);
    }

    try {
      localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('localStorage save warning:', e);
    }

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ report: updated }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok || !data.success) {
          console.warn('Server save returned non-success:', data.error);
        }
      }
      return { success: true };
    } catch (err: any) {
      // Local save already succeeded
      return { success: true };
    }
  },

  deleteReport(id: string): ReportData[] {
    const all = this.getAllReports();
    const filtered = all.filter((r) => r.id !== id);
    try {
      localStorage.setItem(REPORTS_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('localStorage delete error:', e);
    }

    // Call server delete API
    fetch(`/api/reports/${id}`, {
      method: 'DELETE',
      headers: getAdminHeaders(),
    }).catch((e) => {
      console.warn('Failed to delete report on server:', e);
    });

    return filtered;
  },

  async deleteReportAsync(id: string): Promise<{ success: boolean; error?: string }> {
    const all = this.getAllReports();
    const filtered = all.filter((r) => r.id !== id);
    try {
      localStorage.setItem(REPORTS_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('localStorage delete error:', e);
    }

    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok || !data.success) {
          console.warn('Server delete report warning:', data.error);
        }
      }
      return { success: true };
    } catch (e: any) {
      return { success: true };
    }
  },

  duplicateReport(id: string): ReportData | null {
    const target = this.getReportById(id);
    if (!target) return null;

    const copy: ReportData = {
      ...JSON.parse(JSON.stringify(target)),
      id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      report_month: target.report_month + ' (Bản sao)',
      status: 'draft',
      // Reset or copy attachments safely
      attachments: (target.attachments || []).map((a) => ({
        ...a,
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.saveReport(copy);
    return copy;
  },

  getStaffDirectory(): { name: string; role: string }[] {
    const removedNames = ['Lê Văn Đạt', 'Đặng Ngọc Sơn', 'Vũ Mạnh Cường', 'Nguyễn Văn Hiếu'];
    try {
      const data = localStorage.getItem(STAFF_KEY);
      if (!data) {
        localStorage.setItem(STAFF_KEY, JSON.stringify(DEFAULT_STAFF_DIRECTORY));
        return DEFAULT_STAFF_DIRECTORY;
      }
      const parsed: { name: string; role: string }[] = JSON.parse(data);
      const filtered = parsed.filter((p) => !removedNames.includes(p.name));
      if (filtered.length !== parsed.length) {
        localStorage.setItem(STAFF_KEY, JSON.stringify(filtered));
      }
      return filtered;
    } catch (e) {
      return DEFAULT_STAFF_DIRECTORY;
    }
  },

  saveStaffDirectory(staff: { name: string; role: string }[]): void {
    localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
    fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staff }),
    }).catch((e) => {
      // Background sync
    });
  },

  exportBackupJson(): string {
    const reports = this.getAllReports();
    const staff = this.getStaffDirectory();
    return JSON.stringify({ reports, staff, exported_at: new Date().toISOString() }, null, 2);
  },

  importBackupJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.reports)) {
        localStorage.setItem(REPORTS_KEY, JSON.stringify(parsed.reports));
        fetch('/api/reports', {
          method: 'POST',
          headers: getAdminHeaders(),
          body: JSON.stringify({ reports: parsed.reports }),
        }).catch(() => {});
      }
      if (Array.isArray(parsed.staff)) {
        localStorage.setItem(STAFF_KEY, JSON.stringify(parsed.staff));
        fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staff: parsed.staff }),
        }).catch(() => {});
      }
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },
};
