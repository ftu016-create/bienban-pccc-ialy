export type UserRole = 'admin' | 'user' | 'viewer';

export interface Person {
  id: string;
  name: string;
  role: string;
  signatureImage?: string; // base64 or preset
}

export interface EquipItem {
  id: string;
  stt: string;
  name: string;
  qty: string;
  ok: string;
  bad: string;
  note: string;
  isHeader?: boolean;
}

export interface FireSafetyItem {
  id: string;
  stt: string;
  name: string;
  qty: string;
  ok: string;
  bad: string;
  note: string;
}

export interface EscapeItem {
  id: string;
  stt: string;
  name: string;
  status: string;
  note: string;
}

export interface AiInspectionAnalysis {
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  detectedItems: string[];
  findings: string;
  recommendation: string;
  complianceStatus: 'pass' | 'fail' | 'warning';
  observedConditions?: string;
  potentialAnomalies?: string;
  pointsToCheck?: string;
  description?: string;
  confidence?: number;
  analyzedAt?: string;
}

export interface AttachmentItem {
  id: string;
  reportId: string;
  targetType: 'report' | 'equip' | 'fire' | 'escape' | 'general_area' | 'inspection_finding';
  targetItemId?: string;
  targetCategory?: string; // e.g. 'stair', 'exit_door', 'exit_sign', 'emergency_light', 'extinguisher', 'hose_cabinet', 'parking', 'fire_road', 'other'
  plant: 'ialy' | 'ialy_mr';
  locationDescription?: string;
  fileType: 'image' | 'pdf';
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  url?: string;
  thumbnailUrl?: string;
  description?: string;
  uploadedBy: string;
  createdAt: string;
  aiAnalysis?: AiInspectionAnalysis;
}

export interface ReportData {
  id: string;
  // Số hiệu & địa danh
  so: string;
  place: string;
  header_day: string;
  header_month: string;
  header_year: string;
  
  // Tiêu đề & thời gian bắt đầu
  report_month: string;
  start_h: string;
  start_p: string;
  start_day: string;
  start_month: string;
  start_year: string;
  
  // Địa điểm kiểm tra
  inspection_areas: string;
  
  // 1. Thành phần tham gia
  people: Person[];
  
  // 2. Phương tiện, hệ thống PCCC
  equip: EquipItem[];
  equip_note: string;
  
  // 3. Nguồn lửa, nguồn nhiệt
  fire: FireSafetyItem[];
  
  // 4. Thoát nạn, ngăn cháy
  escape: EscapeItem[];
  
  // 5. Chấp hành nội quy
  compliance: string;
  
  // 6. Kiến nghị
  recommendations: string[];
  
  // Kết thúc & người ký
  end_h: string;
  end_p: string;
  signer_title: string;
  signer_role: string;
  manager: string;
  manager_signature?: string;
  
  // Trạng thái hoàn tất & Đính kèm đa phương tiện
  status?: 'draft' | 'completed';
  completed_at?: string;
  completed_by?: string;
  attachments?: AttachmentItem[];

  // Meta
  created_at: string;
  updated_at: string;
}

export interface SavedReportMeta {
  id: string;
  month: string;
  report_date: string;
  title: string;
  created_at: string;
  updated_at: string;
  data: ReportData;
}
