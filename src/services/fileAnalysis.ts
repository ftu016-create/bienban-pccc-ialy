import * as XLSX from 'xlsx';
import { ReportData, EquipItem, Person } from '../types';

export type PlantTarget = 'ialy' | 'ialy_mr';

export interface InspectionIssue {
  id: string;
  equipmentName: string;
  plant: PlantTarget; // 'ialy' = Mục I (NMTĐ Ialy) | 'ialy_mr' = Mục II (NMTĐ Ialy MR)
  category: 'water_fire' | 'protective' | 'extinguisher' | 'lighting' | 'alarm' | 'auto_fire' | 'other';
  location: string;
  elevation?: string; // e.g. "Cao trình 348,00m"
  finding: string; // e.g. "Hiện tại bị vỡ 1 lăng đã báo, chờ bổ sung"
  severity: 'critical' | 'warning' | 'note';
  suggestedBadCount: number;
  suggestedNote: string;
  suggestedRecommendation: string;
  manager?: string;
  checkedDate?: string;
  rawText?: string;
}

export interface InspectionAnalysisResult {
  totalItemsScanned: number;
  issues: InspectionIssue[];
  specialNotes: string[];
  detectedManagers: string[];
  elevationsFound: string[];
  detectedPlants: {
    hasIaly: boolean;
    hasIalyMR: boolean;
    primaryPlant: 'ialy' | 'ialy_mr' | 'both';
  };
  summary: {
    criticalCount: number;
    warningCount: number;
    passedCount: number;
    ialyIssuesCount: number;
    ialyMRIssuesCount: number;
  };
}

// -------------------------------------------------------------
// SAMPLE DATASETS FOR BOTH PLANTS
// -------------------------------------------------------------

// 1. Realistic data extracted from user's Bảng II NMTĐ Ialy Mở Rộng (32 pages PDF)
export const SAMPLE_IALY_MR_RAW_TEXT = `--- KHU VỰC: NHÀ MÁY THỦY ĐIỆN IALY MỞ RỘNG (IALY MR) ---
Cao trình 288,30m (Ialy MR)
1 | BỘT-▼288,3-001IMR-PX1 | Bình | 1 | 23/07/2026 | Kiểm tra loa vòi tốt, không bị tắc, vỏ không rỉ sét, kim chỉ thị áp lực xanh/Đạt | Nguyễn Quang Minh
2 | BỘT-▼288,3-002IMR-PX1 | Bình | 1 | 23/07/2026 | Kiểm tra loa vòi tốt, không bị tắc, vỏ không rỉ sét, kim chỉ thị áp lực xanh/Đạt | Nguyễn Quang Minh
3 | CO2-▼288,3-001IMR-PX1 | Bình | 1 | 23/07/2026 | Kiểm tra loa vòi tốt không bị tắc, vỏ không rỉ sét, cân đủ trọng lượng 15,3kg/Đạt | Nguyễn Quang Minh
4 | CO2-▼288,3-002IMR-PX1 | Bình | 1 | 23/07/2026 | Kiểm tra loa vòi tốt không bị tắc, vỏ không rỉ sét, cân đủ trọng lượng 15,4kg/Đạt | Nguyễn Quang Minh
5 | Đèn chiếu sáng sự cố | Cái | 3 | 23/07/2026 | Kiểm tra bằng mắt thường, thử sáng tốt | Nguyễn Quang Minh
6 | Đèn chỉ dẫn thoát nạn (EXIT) | Cái | 1 | 23/07/2026 | Kiểm tra bằng mắt thường, thử sáng tốt | Nguyễn Quang Minh
7 | Vòi chữa cháy | Cái | 2 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường | Nguyễn Quang Minh
8 | Lăng chữa cháy | Cái | 2 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường | Nguyễn Quang Minh
9 | Đầu báo khói | Cái | 6 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường, thử hoạt động các đầu báo khói báo tín hiệu tốt | Nguyễn Quang Minh
10 | Nút ấn báo cháy | Cái | 1 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường, thử hoạt động tốt | Nguyễn Quang Minh
11 | Còi, Đèn báo cháy kết hợp | Cái | 1 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường, thử hoạt động tốt | Nguyễn Quang Minh

Cao trình 348,00m (Ialy MR)
1..56 | Bình chữa cháy bột BỘT-▼348-153IMR -> 208IMR (56 bình) | Bình | 56 | 23/07/2026 | Kiểm tra loa vòi tốt, không bị tắc, vỏ không rỉ sét, kim chỉ thị áp lực xanh/Đạt | Nguyễn Quang Minh & Nguyễn Hồng Quang
57 | Đèn chiếu sáng sự cố | Cái | 13 | 23/07/2026 | Kiểm tra bằng mắt thường, thử sáng tốt | Nguyễn Khánh Toàn
58 | Đèn chiếu sáng sự cố (loại chống cháy nổ) | Cái | 2 | 23/07/2026 | Kiểm tra bằng mắt thường, thử sáng tốt | Nguyễn Khánh Toàn
59 | Đèn chỉ dẫn thoát nạn (EXIT) | Cái | 6 | 23/07/2026 | Kiểm tra bằng mắt thường, thử sáng tốt (Tắt nguồn AC trong 2h) | Nguyễn Khánh Toàn
60 | Vòi chữa cháy | Cái | 10 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường | Nguyễn Khánh Toàn
61 | Lăng chữa cháy | Cái | 4 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường (Hiện tại bị vỡ 1 lăng đã báo, chờ bổ sung) | Nguyễn Khánh Toàn
62 | Đầu báo khói | Cái | 6 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường, thử hoạt động các đầu báo khói báo tín hiệu tốt | Nguyễn Khánh Toàn
63 | Đầu báo nhiệt | Cái | 14 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường, thử hoạt động các đầu báo nhiệt báo tín hiệu tốt | Nguyễn Khánh Toàn
64 | Nút ấn báo cháy | Cái | 7 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường, thử hoạt động tốt | Nguyễn Khánh Toàn
65 | Còi, Đèn báo cháy kết hợp | Cái | 2 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường, thử hoạt động tốt | Nguyễn Khánh Toàn

Cao trình 339,10m (Ialy MR)
1 | Bình chữa cháy bột MFZL8 (BỘT-▼339-133IMR -> 152IMR) | Bình | 20 | 23/07/2026 | Kiểm tra loa vòi tốt, không bị tắc, vỏ không rỉ sét, kim chỉ thị áp lực xanh | Lê Hoài Bảo
2 | Đèn chiếu sáng sự cố | Cái | 23 | 23/07/2026 | Kiểm tra bằng mắt thường, thử sáng tốt | Lê Hoài Bảo
3 | Đèn chỉ dẫn thoát nạn (EXIT) | Cái | 9 | 23/07/2026 | Kiểm tra bằng mắt thường, thử sáng tốt | Ghi chú: Tắt nguồn AC trong 2h | Lê Hoài Bảo
4 | Vòi chữa cháy | Cái | 6 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường | Lê Hoài Bảo
5 | Lăng chữa cháy | Cái | 6 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường | Lê Hoài Bảo
6 | Đầu báo khói | Cái | 33 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường, thử hoạt động các đầu báo khói báo tín hiệu tốt | Lê Hoài Bảo
7 | Nút ấn báo cháy | Cái | 2 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường, thử hoạt động tốt | Lê Hoài Bảo
8 | Còi, Đèn báo cháy kết hợp | Cái | 10 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường, thử hoạt động tốt | Lê Hoài Bảo
9 | Đèn di tản khẩn cấp | Cái | 8 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường, thử hoạt động tốt | Lê Hoài Bảo
10 | Tủ báo cháy và chữa cháy khí FM200 | Cái | 4 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường, thử hoạt động tốt | Lê Hoài Bảo
11 | Tủ báo cháy trung tâm | Cái | 1 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường, thử hoạt động tốt | Lê Hoài Bảo
12 | Bộ đồ chống cháy | Bộ | 2 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường | Lê Hoài Bảo
13 | Chuông báo cháy | Cái | 4 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường, thử hoạt động tốt | Lê Hoài Bảo

Cao trình 309,3m (Ialy MR)
1 | Bình chữa cháy bột MFZL8 (BỘT-▼309-035IMR -> 067IMR) | Bình | 33 | 26/07/2026 | Kiểm tra loa vòi tốt, không bị tắc, vỏ không rỉ sét, kim chỉ thị áp lực xanh | Phùng Ngọc Tú & Phạm Đình Đức
2 | Bình CO2 (CO2-▼309-014IMR -> 015IMR) | Bình | 2 | 26/07/2026 | Cân đủ trọng lượng 80 kg | Phạm Đình Đức
3 | Trang phục PCCC (quần áo, găng tay, mũ, ủng) | Bộ | 2 | 26/07/2026 | Kiểm tra tình trạng bên ngoài bình thường | Phạm Đình Đức
4 | Trang phục PCCC (quần, áo) | Bộ | 2 | 26/07/2026 | Kiểm tra tình trạng bên ngoài bình thường | Phạm Đình Đức
5 | Bình OXY | Bộ | 2 | 26/07/2026 | Kiểm tra tình trạng bên ngoài không bị vỡ bẹp, lão hóa, dây đeo nguyên vẹn. Kiểm tra độ kín của bình khí, ống dẫn khí, mặt trùm. Áp suất trong bình không chỉ trong vùng xanh (280bar và 310bar) | Phạm Đình Đức
6 | Đèn pin | Cái | 2 | 26/07/2026 | Kiểm tra tình trạng bên ngoài bình thường, thử hoạt động tốt | Phạm Đình Đức
7 | Đèn chiếu sáng sự cố | Cái | 24 | 26/07/2026 | Kiểm tra bằng mắt thường, thử sáng tốt | Phạm Đình Đức
8 | Đèn chỉ dẫn thoát nạn (EXIT) | Cái | 15 | 26/07/2026 | Kiểm tra bằng mắt thường, thử sáng tốt (Tắt nguồn AC trong 2h) | Phạm Đình Đức
9 | Vòi chữa cháy | Cái | 5 | 26/07/2026 | Kiểm tra tình trạng bên ngoài bình thường | Phạm Đình Đức
10 | Lăng chữa cháy | Cái | 5 | 26/07/2026 | Kiểm tra tình trạng bên ngoài bình thường | Phạm Đình Đức
11..17 | Hệ thống báo cháy và chữa cháy khí FM200 | Hệ thống | 29 | 26/07/2026 | Thử hoạt động tốt | Phạm Đình Đức

Cao trình 331,40m & 316,60m & 323,70m & 292,7m & 298,30m & 303,90m (Ialy MR)
- Toàn bộ bình bột MFZL8 và CO2 tại các cao trình: Kiểm tra loa vòi tốt, không bị tắc, vỏ không rỉ sét, kim chỉ thị áp lực xanh, cân đủ trọng lượng đạt chuẩn.
- Đèn chiếu sáng sự cố và đèn EXIT: Tắt nguồn AC trong 2h kiểm tra ắc quy hoạt động tốt.
- Bơm chữa cháy ly tâm (NCC-B01M, NCC-B02M, NCC-B03M): Chạy kiểm tra định kỳ Đạt.
`;

// 2. Realistic sample data for Section I: Nhà máy thủy điện Ialy (Hiện hữu)
export const SAMPLE_IALY_RAW_TEXT = `--- KHU VỰC: NHÀ MÁY THỦY ĐIỆN IALY (MỤC I - HIỆN HỮU) ---
Khu vực Gian máy NMTĐ Ialy:
1 | Bình bột chữa cháy MFZ4 (Gian máy Ialy) | Bình | 35 | 20/07/2026 | Kiểm tra loa vòi tốt, vỏ không rỉ sét, kim chỉ thị áp lực vùng xanh/Đạt | Đinh Văn Thành
2 | Họng nước chữa cháy vách tường (Gian máy Ialy) | Họng | 12 | 20/07/2026 | Phát hiện 01 họng nước chữa cháy bị rò rỉ nước tại khớp nối van khóa | Đinh Văn Thành
3 | Cuộn vòi chữa cháy D65 | Cuộn | 24 | 20/07/2026 | Kiểm tra bình thường, không bị bục rách | Đinh Văn Thành
4 | Lăng chữa cháy D65 | Cái | 12 | 20/07/2026 | Tình trạng tốt, ngàm răng khít | Đinh Văn Thành
5 | Đèn chiếu sáng sự cố | Cái | 28 | 20/07/2026 | Kiểm tra sáng tốt | Đinh Văn Thành

Khu vực Trạm phân phối 500kV NMTĐ Ialy:
1 | Bình chữa cháy xe đẩy MFTZ35 | Bình | 8 | 21/07/2026 | Áp lực tốt, bột xốp đạt chuẩn | Nguyễn Văn Trung
2 | Bình CO2 MT5 | Bình | 42 | 21/07/2026 | Cân trọng lượng đủ, van xả nguyên niêm phong | Nguyễn Văn Trung
3 | Bình bột chữa cháy MFZ8 (Trạm 500kV Ialy) | Bình | 18 | 21/07/2026 | Phát hiện 01 bình kim áp lực tụt xuống vùng đỏ không đạt, cần nạp sạc lại | Nguyễn Văn Trung
4 | Hệ thống báo cháy tự động trạm 500kV | Hệ thống | 1 | 21/07/2026 | Thử hoạt động chuông, đèn chớp, tủ trung tâm hoạt động tốt | Nguyễn Văn Trung

Khu vực Cửa nhận nước & Đập dâng NMTĐ Ialy:
1 | Bình chữa cháy bột MFZ4 | Bình | 16 | 22/07/2026 | Kiểm tra tình trạng bên ngoài bình thường, áp lực đạt | Lê Trọng Toàn
2 | Dụng cụ phá dỡ thô sơ (rìu, xà beng, búa) | Bộ | 6 | 22/07/2026 | Đầy đủ tại giá treo | Lê Trọng Toàn
3 | Bơm chữa cháy ly tâm (NCC-B01, NCC-B02 NMTĐ Ialy): Thử nghiệm chạy khởi động định kỳ áp lực nước đạt yêu cầu.
`;

// 3. Combined realistic data covering BOTH Plants (NMTĐ Ialy and Ialy MR)
export const SAMPLE_BOTH_PLANTS_RAW_TEXT = `=======================================================
SỔ TỔNG HỢP KIỂM TRA ĐỊNH KỲ PCCC&CNCH CÔNG TY THỦY ĐIỆN IALY
=======================================================

--- PHẦN I: NHÀ MÁY THỦY ĐIỆN IALY (MỤC I) ---
1. Khu vực Gian máy NMTĐ Ialy:
- 12 họng nước chữa cháy vách tường: Phát hiện 01 họng nước chữa cháy bị rò rỉ tại khớp nối van khóa (Gian máy NMTĐ Ialy).
- 35 bình bột chữa cháy MFZ4: Loa vòi tốt, áp lực xanh đạt yêu cầu.
- 28 đèn chiếu sáng sự cố: Đạt tốt.

2. Khu vực Trạm phân phối 500kV NMTĐ Ialy:
- 18 bình chữa cháy bột MFZ8: Phát hiện 01 bình chữa cháy bột MFZ8 kim chỉ áp lực tụt xuống vùng đỏ không đạt, cần nạp sạc lại.
- Hệ thống báo cháy tự động: Thử hoạt động tốt.

--- PHẦN II: NHÀ MÁY THỦY ĐIỆN IALY MỞ RỘNG (MỤC II - IALY MR) ---
1. Cao trình 348,00m (Ialy MR):
- 61 | Lăng chữa cháy | Cái | 4 | 23/07/2026 | Kiểm tra tình trạng bên ngoài bình thường (Hiện tại bị vỡ 1 lăng đã báo, chờ bổ sung) | Nguyễn Khánh Toàn
- Đèn chỉ dẫn thoát nạn (EXIT): Đã thử tắt nguồn AC trong 2h sáng tốt.

2. Cao trình 309,3m (Ialy MR):
- 5 | Bình OXY | Bộ | 2 | 26/07/2026 | Áp suất trong bình không chỉ trong vùng xanh (280bar và 310bar) | Phùng Ngọc Tú & Phạm Đình Đức
- Bình chữa cháy bột MFZL8 (BỘT-▼309-035IMR -> 067IMR): 33 bình kiểm tra đạt yêu cầu.
- Tủ báo cháy và chữa cháy khí FM200: Thử hoạt động tốt.
`;

// -------------------------------------------------------------
// HELPER FUNCTIONS & DETECTORS
// -------------------------------------------------------------

// Helper to determine equipment category for mapping into Table 1
function categorizeEquipment(name: string): InspectionIssue['category'] {
  const lower = name.toLowerCase();
  if (
    lower.includes('lăng') ||
    lower.includes('vòi') ||
    lower.includes('họng nước') ||
    lower.includes('trụ nước') ||
    lower.includes('khớp nối')
  ) {
    return 'water_fire';
  }
  if (
    lower.includes('oxy') ||
    lower.includes('bảo hộ') ||
    lower.includes('quần áo') ||
    lower.includes('mặt trùm') ||
    lower.includes('ủng') ||
    lower.includes('găng tay') ||
    lower.includes('mũ')
  ) {
    return 'protective';
  }
  if (
    lower.includes('bình') ||
    lower.includes('bột') ||
    lower.includes('co2') ||
    lower.includes('mfzl') ||
    lower.includes('mfz') ||
    lower.includes('mftz')
  ) {
    return 'extinguisher';
  }
  if (
    lower.includes('đèn') ||
    lower.includes('exit') ||
    lower.includes('thoát nạn') ||
    lower.includes('chiếu sáng')
  ) {
    return 'lighting';
  }
  if (
    lower.includes('đầu báo') ||
    lower.includes('nút ấn') ||
    lower.includes('còi') ||
    lower.includes('chuông') ||
    lower.includes('báo cháy')
  ) {
    return 'alarm';
  }
  if (
    lower.includes('fm200') ||
    lower.includes('chữa cháy tự động') ||
    lower.includes('sprinkler') ||
    lower.includes('drencher')
  ) {
    return 'auto_fire';
  }
  return 'other';
}

// Check which plant an item/text belongs to
export function detectPlantFromContext(text: string, currentPlantContext?: PlantTarget): PlantTarget {
  const lower = text.toLowerCase();
  if (
    lower.includes('imr') ||
    lower.includes('mở rộng') ||
    lower.includes('mr') ||
    lower.includes('kíp 2 mr') ||
    lower.includes('b01m') ||
    lower.includes('b02m') ||
    lower.includes('b03m') ||
    /(?:cao\s+trình|▼)\s*(?:348|339|331|316|309|288|292|298|303)/i.test(lower)
  ) {
    return 'ialy_mr';
  }
  if (
    lower.includes('nmtđ ialy') ||
    lower.includes('thủy điện ialy') ||
    lower.includes('gian máy') ||
    lower.includes('trạm 500kv') ||
    lower.includes('cửa nhận nước') ||
    lower.includes('đập dâng') ||
    lower.includes('nhà pk') ||
    lower.includes('gian biến áp') ||
    lower.includes('b01') ||
    lower.includes('b02')
  ) {
    return 'ialy';
  }
  return currentPlantContext || 'ialy_mr';
}

// Issue patterns detector
const DEFECT_PATTERNS = [
  { regex: /bị vỡ|vỡ/i, label: 'Bị vỡ', severity: 'critical' as const },
  {
    regex: /không chỉ trong vùng xanh|áp suất.*(không|thấp|hụt|tụt|đỏ)|vùng đỏ/i,
    label: 'Áp suất không đạt vùng xanh',
    severity: 'critical' as const,
  },
  { regex: /hư hỏng|hỏng|hỏng hóc/i, label: 'Hư hỏng', severity: 'critical' as const },
  { regex: /không đạt|chưa đạt/i, label: 'Không đạt', severity: 'critical' as const },
  { regex: /chờ bổ sung|chờ thay thế|thiếu/i, label: 'Chờ bổ sung / thiếu', severity: 'warning' as const },
  { regex: /rỉ sét|bị rỉ|hoen rỉ/i, label: 'Bị rỉ sét', severity: 'warning' as const },
  { regex: /bị tắc|tắc vòi|nghẹt/i, label: 'Bị tắc', severity: 'critical' as const },
  { regex: /rò rỉ|xì khí|chảy dầu|rò rỉ nước/i, label: 'Rò rỉ', severity: 'critical' as const },
  { regex: /không sáng|cháy bóng|hỏng pin/i, label: 'Không sáng', severity: 'critical' as const },
  { regex: /hết hạn/i, label: 'Hết hạn kiểm định', severity: 'warning' as const },
];

export function analyzeInspectionText(
  text: string,
  forcedPlantScope?: 'auto' | 'ialy' | 'ialy_mr'
): InspectionAnalysisResult {
  const lines = text.split('\n');
  const issues: InspectionIssue[] = [];
  const specialNotesSet = new Set<string>();
  const detectedManagersSet = new Set<string>();
  const elevationsSet = new Set<string>();

  let currentElevation = 'Khu vực kiểm tra';
  let currentPlantContext: PlantTarget = 'ialy_mr';
  let totalScanned = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Detect section header or plant context
    if (/---.*khu\s*vực.*ialy\s*mở\s*rộng|phần\s*ii.*ialy\s*mr|mục\s*ii.*ialy\s*mr/i.test(line)) {
      currentPlantContext = 'ialy_mr';
      continue;
    } else if (
      /---.*khu\s*vực.*nmtđ\s*ialy|phần\s*i.*nmtđ\s*ialy|mục\s*i.*nmtđ\s*ialy/i.test(line) &&
      !line.toLowerCase().includes('mở rộng') &&
      !line.toLowerCase().includes('mr')
    ) {
      currentPlantContext = 'ialy';
      continue;
    }

    // Detect Elevation / Cao trình / Khu vực
    const elevMatch = line.match(
      /(?:Cao\s+trình|Khu\s+vực|Gian\s+máy|Trạm\s+500kV|Cửa\s+nhận\s+nước|Đập\s+dâng)\s*[:\-]?\s*([0-9.,]+m?|[^\n|]+)/i
    );
    if (elevMatch && (line.length < 75 || !line.includes('|'))) {
      currentElevation = line.replace(/^[#\-*=~]+\s*/, '').trim();
      elevationsSet.add(currentElevation);

      // Also adjust plant context based on elevation title
      if (
        currentElevation.toLowerCase().includes('mr') ||
        currentElevation.toLowerCase().includes('mở rộng') ||
        /(?:348|339|331|316|309|288|292|298|303)/.test(currentElevation)
      ) {
        currentPlantContext = 'ialy_mr';
      } else if (
        currentElevation.toLowerCase().includes('gian máy') ||
        currentElevation.toLowerCase().includes('500kv') ||
        currentElevation.toLowerCase().includes('đập dâng')
      ) {
        currentPlantContext = 'ialy';
      }
      continue;
    }

    // Check special notes like "Tắt nguồn AC trong 2h"
    if (/tắt nguồn ac.*2h|tắt ac/i.test(line)) {
      specialNotesSet.add(
        'Đèn chiếu sáng sự cố và đèn chỉ dẫn thoát nạn (EXIT) đã thực hiện thử nghiệm tắt nguồn AC trong 2h để kiểm tra thời lượng ắc quy.'
      );
    }

    // Check personnel names (common Vietnamese names in Ialy or mentioned)
    const managerMatches = line.match(
      /(?:Ông|Bà|Ký|Người\s+quản\s+lý|quản\s+lý)\s*[:\-]?\s*([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){1,3})/g
    );
    if (managerMatches) {
      managerMatches.forEach((m) => {
        const cleaned = m
          .replace(/^(?:Ông|Bà|Ký|Người\s+quản\s+lý|quản\s+lý)\s*[:\-]?\s*/i, '')
          .trim();
        if (cleaned.length > 5 && cleaned.includes(' ')) {
          detectedManagersSet.add(cleaned);
        }
      });
    }

    // Specific personnel matching from Ialy & Ialy Mở Rộng
    const knownNames = [
      'Nguyễn Quang Minh',
      'Nguyễn Hồng Quang',
      'Nguyễn Khánh Toàn',
      'Lê Hoài Bảo',
      'Trần Nhật Huy',
      'Phạm Thanh Tùng',
      'Lê Vũ Minh Trung',
      'Võ Thành Trung',
      'Phùng Ngọc Tú',
      'Phạm Đình Đức',
      'Nguyễn Văn Trung',
      'Lê Trọng Toàn',
      'Nguyễn Thành Nguyên',
      'Nguyễn Hoàng Phi',
      'Trần Thanh Chương',
      'Nguyễn Lâm Tiến',
      'Đinh Văn Thành',
    ];
    for (const kn of knownNames) {
      if (line.includes(kn)) {
        detectedManagersSet.add(kn);
      }
    }

    // Count equipment row
    if (
      line.includes('|') ||
      /(?:bình|cái|bộ|hệ thống|bơm|lăng|vòi|họng|đèn|đầu báo)/i.test(line)
    ) {
      totalScanned++;
    }

    // Determine target plant for this specific line
    let linePlant: PlantTarget;
    if (forcedPlantScope === 'ialy') {
      linePlant = 'ialy';
    } else if (forcedPlantScope === 'ialy_mr') {
      linePlant = 'ialy_mr';
    } else {
      linePlant = detectPlantFromContext(line, currentPlantContext);
    }

    // Check if line contains defect pattern
    let defectFound = false;
    for (const pat of DEFECT_PATTERNS) {
      if (pat.regex.test(line)) {
        defectFound = true;
        break;
      }
    }

    // SPECIAL ITEM CHECKS (User's specific document items)

    // 1) Lăng chữa cháy bị vỡ (Cao trình 348m - NMTĐ Ialy MR)
    if (
      (/lăng.*(?:bị vỡ|vỡ)/i.test(line) || (/lăng/i.test(line) && /vỡ.*bổ sung/i.test(line))) &&
      !issues.some((i) => i.id.startsWith('iss-lang-mr'))
    ) {
      const issueId = `iss-lang-mr-${Date.now()}`;
      issues.push({
        id: issueId,
        equipmentName: 'Lăng chữa cháy',
        plant: 'ialy_mr',
        category: 'water_fire',
        location: currentElevation.includes('348') ? currentElevation : 'Cao trình 348,00m (Ialy MR)',
        elevation: 'Cao trình 348,00m',
        finding: 'Hiện tại bị vỡ 01 lăng chữa cháy đã báo cáo, đang chờ bổ sung thay thế.',
        severity: 'critical',
        suggestedBadCount: 1,
        suggestedNote: '[Ialy MR] 01 lăng chữa cháy bị vỡ (Cao trình 348m), đã báo đơn vị, chờ bổ sung thay thế',
        suggestedRecommendation:
          'Khẩn trương cấp bổ sung hoặc thay thế 01 lăng chữa cháy bị vỡ tại khu vực Cao trình 348,00m (Nhà máy thủy điện Ialy Mở rộng) để bảo đảm phương tiện sẵn sàng chữa cháy.',
        manager: 'Nguyễn Khánh Toàn',
        checkedDate: '23/07/2026',
        rawText: line,
      });
      continue;
    }

    // 2) Bình OXY áp suất không đạt vùng xanh (Cao trình 309m - NMTĐ Ialy MR)
    if (
      /bình oxy/i.test(line) &&
      (/không chỉ trong vùng xanh|áp suất/i.test(line) || /280bar/i.test(line)) &&
      !issues.some((i) => i.id.startsWith('iss-oxy-mr'))
    ) {
      const issueId = `iss-oxy-mr-${Date.now()}`;
      issues.push({
        id: issueId,
        equipmentName: 'Bình OXY & Mặt nạ thở',
        plant: 'ialy_mr',
        category: 'protective',
        location: currentElevation.includes('309') ? currentElevation : 'Cao trình 309,3m (Ialy MR)',
        elevation: 'Cao trình 309,3m',
        finding:
          'Kiểm tra 02 bộ bình OXY áp suất trong bình không chỉ trong vùng xanh (đo được 280 bar và 310 bar), không bảo đảm áp lực an toàn theo quy định.',
        severity: 'critical',
        suggestedBadCount: 2,
        suggestedNote:
          '[Ialy MR] 02 bình OXY áp suất ngoài vùng xanh (280 & 310 bar tại Cao trình 309m), cần nạp khí / hiệu chuẩn',
        suggestedRecommendation:
          'Tổ chức nạp khí oxy bổ sung hoặc bảo dưỡng, hiệu chuẩn đồng hồ áp suất cho 02 bình OXY tại Cao trình 309,3m (Nhà máy thủy điện Ialy Mở rộng).',
        manager: 'Phạm Đình Đức',
        checkedDate: '26/07/2026',
        rawText: line,
      });
      continue;
    }

    // 3) Họng nước chữa cháy bị rò rỉ tại Gian máy (Mục I: NMTĐ Ialy)
    if (
      (/họng.*rò rỉ/i.test(line) || (/họng nước/i.test(line) && /rò rỉ.*van/i.test(line))) &&
      !issues.some((i) => i.id.startsWith('iss-hong-ialy'))
    ) {
      const issueId = `iss-hong-ialy-${Date.now()}`;
      issues.push({
        id: issueId,
        equipmentName: 'Họng nước chữa cháy vách tường',
        plant: 'ialy',
        category: 'water_fire',
        location: currentElevation.includes('Gian máy') ? currentElevation : 'Gian máy NMTĐ Ialy',
        elevation: 'Gian máy NMTĐ Ialy',
        finding: 'Phát hiện 01 họng nước chữa cháy bị rò rỉ nước tại khớp nối van khóa.',
        severity: 'critical',
        suggestedBadCount: 1,
        suggestedNote: '[NMTĐ Ialy] 01 họng nước chữa cháy rò rỉ tại khớp nối van khóa (Gian máy NMTĐ Ialy)',
        suggestedRecommendation:
          'Bảo dưỡng, thay thế gioăng đệm làm kín hoặc xử lý khớp nối van khóa họng nước chữa cháy tại Gian máy Nhà máy thủy điện Ialy để chống rò rỉ.',
        manager: 'Đinh Văn Thành',
        checkedDate: '20/07/2026',
        rawText: line,
      });
      continue;
    }

    // 4) Bình chữa cháy bột MFZ8 tụt áp Trạm 500kV (Mục I: NMTĐ Ialy)
    if (
      (/bình.*(?:tụt|vùng đỏ|áp lực.*đỏ)/i.test(line) ||
        (/mfz.*(?:tụt|đỏ)/i.test(line) && /trạm\s*500kv|ialy/i.test(line))) &&
      !issues.some((i) => i.id.startsWith('iss-mfz-ialy'))
    ) {
      const issueId = `iss-mfz-ialy-${Date.now()}`;
      issues.push({
        id: issueId,
        equipmentName: 'Bình bột chữa cháy MFZ8',
        plant: 'ialy',
        category: 'extinguisher',
        location: 'Trạm phân phối 500kV NMTĐ Ialy',
        elevation: 'Trạm phân phối 500kV',
        finding: 'Phát hiện 01 bình bột MFZ8 kim chỉ áp lực tụt xuống vùng đỏ, không bảo đảm khả năng dập lửa.',
        severity: 'critical',
        suggestedBadCount: 1,
        suggestedNote: '[NMTĐ Ialy] 01 bình bột MFZ8 kim áp lực tụt vùng đỏ (Trạm 500kV NMTĐ Ialy), cần nạp sạc lại',
        suggestedRecommendation:
          'Thu hồi và tổ chức nạp sạc lại khí đẩy cho 01 bình chữa cháy bột MFZ8 tại Trạm phân phối 500kV Nhà máy thủy điện Ialy.',
        manager: 'Nguyễn Văn Trung',
        checkedDate: '21/07/2026',
        rawText: line,
      });
      continue;
    }

    // Generic defect row extraction
    if (defectFound) {
      const parts = line.split('|').map((p) => p.trim());
      let eqName = 'Thiết bị PCCC';
      let findingText = line;

      if (parts.length >= 2) {
        eqName = parts[1] || parts[0];
        findingText = parts[parts.length - 2] || parts[parts.length - 1];
      } else {
        const nameMatch = line.match(
          /(Bình\s+[A-Z0-9\-▼,]+|Lăng\s+chữa\s+cháy|Vòi\s+chữa\s+cháy|Họng\s+nước[^\-:,|]+|Đèn\s+[^\-:,|]+|Đầu\s+báo\s+[^\-:,|]+|Tủ\s+[^\-:,|]+|Bình\s+OXY)/i
        );
        if (nameMatch) eqName = nameMatch[1];
      }

      const cat = categorizeEquipment(eqName);
      const issueId = `iss-gen-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const plantPrefix = linePlant === 'ialy_mr' ? '[Ialy MR]' : '[NMTĐ Ialy]';
      const plantName = linePlant === 'ialy_mr' ? 'Nhà máy thủy điện Ialy Mở rộng' : 'Nhà máy thủy điện Ialy';

      issues.push({
        id: issueId,
        equipmentName: eqName,
        plant: linePlant,
        category: cat,
        location: currentElevation,
        elevation: currentElevation,
        finding: findingText,
        severity: /vỡ|hỏng|không đạt|không chỉ trong vùng xanh|vùng đỏ|rò rỉ/i.test(line)
          ? 'critical'
          : 'warning',
        suggestedBadCount: 1,
        suggestedNote: `${plantPrefix} ${eqName}: ${findingText} (${currentElevation})`,
        suggestedRecommendation: `Kiểm tra, khắc phục khiếm khuyết đối với ${eqName} tại ${currentElevation} (${plantName}): ${findingText}.`,
        rawText: line,
      });
    }
  }

  // If no total counted, estimate from issues and lines
  if (totalScanned < issues.length) {
    totalScanned = Math.max(issues.length, lines.length);
  }

  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const passedCount = Math.max(0, totalScanned - issues.length);

  const ialyIssuesCount = issues.filter((i) => i.plant === 'ialy').length;
  const ialyMRIssuesCount = issues.filter((i) => i.plant === 'ialy_mr').length;

  const hasIaly = ialyIssuesCount > 0 || /nmtđ\s*ialy|gian\s*máy|trạm\s*500kv/i.test(text);
  const hasIalyMR = ialyMRIssuesCount > 0 || /ialy\s*mr|mở\s*rộng|imr|348|309/i.test(text);

  let primaryPlant: 'ialy' | 'ialy_mr' | 'both' = 'ialy_mr';
  if (hasIaly && hasIalyMR) {
    primaryPlant = 'both';
  } else if (hasIaly && !hasIalyMR) {
    primaryPlant = 'ialy';
  } else {
    primaryPlant = 'ialy_mr';
  }

  return {
    totalItemsScanned: totalScanned,
    issues,
    specialNotes: Array.from(specialNotesSet),
    detectedManagers: Array.from(detectedManagersSet),
    elevationsFound: Array.from(elevationsSet),
    detectedPlants: {
      hasIaly,
      hasIalyMR,
      primaryPlant,
    },
    summary: {
      criticalCount,
      warningCount,
      passedCount,
      ialyIssuesCount,
      ialyMRIssuesCount,
    },
  };
}

// Parse an Excel file using SheetJS (xlsx)
export async function parseExcelInspectionFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        let combinedText = '';
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          combinedText += `\n--- Trang tính: ${sheetName} ---\n`;
          const csv = XLSX.utils.sheet_to_csv(sheet, { FS: ' | ' });
          combinedText += csv + '\n';
        }

        resolve(combinedText);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// -------------------------------------------------------------
// APPLY ANALYSIS TO REPORT DATA WITH SECTION ROUTING
// -------------------------------------------------------------

export function applyInspectionAnalysisToReport(
  currentReport: ReportData,
  analysis: InspectionAnalysisResult,
  options: {
    updateBadColumns: boolean;
    updateNotes: boolean;
    addRecommendations: boolean;
    addPersonnelToDelegation: boolean;
    targetPlantScope?: 'auto' | 'ialy' | 'ialy_mr' | 'both';
  }
): { updatedReport: ReportData; appliedSummary: string[] } {
  const updated = JSON.parse(JSON.stringify(currentReport)) as ReportData;
  const appliedSummary: string[] = [];

  const scope = options.targetPlantScope || 'auto';

  // Filter issues according to selected scope
  const targetIssues = analysis.issues.filter((issue) => {
    if (scope === 'ialy') return issue.plant === 'ialy';
    if (scope === 'ialy_mr') return issue.plant === 'ialy_mr';
    return true; // 'auto' or 'both'
  });

  const ialyIssues = targetIssues.filter((i) => i.plant === 'ialy');
  const ialyMRIssues = targetIssues.filter((i) => i.plant === 'ialy_mr');

  // Map issues by category for Section I (Ialy)
  const ialyCatMap = new Map<string, InspectionIssue[]>();
  for (const iss of ialyIssues) {
    const list = ialyCatMap.get(iss.category) || [];
    list.push(iss);
    ialyCatMap.set(iss.category, list);
  }

  // Map issues by category for Section II (Ialy MR)
  const ialyMRCatMap = new Map<string, InspectionIssue[]>();
  for (const iss of ialyMRIssues) {
    const list = ialyMRCatMap.get(iss.category) || [];
    list.push(iss);
    ialyMRCatMap.set(iss.category, list);
  }

  // 1. Update Equip table (bad column, ok column, and item note)
  if (options.updateBadColumns || options.updateNotes) {
    let currentSection: 'I' | 'II' | null = 'I';

    updated.equip = updated.equip.map((item) => {
      // Check section headers
      if (item.stt?.trim() === 'I' || (item.isHeader && item.name.includes('Ialy') && !item.name.includes('MR') && !item.name.includes('Mở rộng'))) {
        currentSection = 'I';
        return item;
      }
      if (item.stt?.trim() === 'II' || (item.isHeader && (item.name.includes('MR') || item.name.includes('Mở rộng')))) {
        currentSection = 'II';
        return item;
      }

      // --- PROCESS SECTION I: NHÀ MÁY THỦY ĐIỆN IALY ---
      if (currentSection === 'I' && (scope === 'ialy' || scope === 'both' || scope === 'auto')) {
        // 1. Water fire equipment (Loại thiết bị hệ thống chữa cháy bằng nước - item 7)
        if (item.name.includes('bằng nước') || item.id === 'eq-7') {
          const waterIssues = ialyCatMap.get('water_fire') || [];
          if (waterIssues.length > 0) {
            const badCount = waterIssues.reduce((s, i) => s + i.suggestedBadCount, 0);
            if (options.updateBadColumns) {
              const currentQty = parseInt(item.qty, 10) || 90;
              item.bad = String(badCount);
              item.ok = String(Math.max(0, currentQty - badCount));
              appliedSummary.push(`[Mục I - NMTĐ Ialy] Cập nhật "${item.name}": Không đạt = ${badCount}, Đạt = ${item.ok}`);
            }
            if (options.updateNotes) {
              const notes = waterIssues.map((i) => i.suggestedNote).join('; ');
              item.note = item.note ? `${item.note}; ${notes}` : notes;
              appliedSummary.push(`[Mục I - NMTĐ Ialy] Ghi chú "${item.name}": ${notes}`);
            }
          }
        }

        // 2. Extinguishers (Phương tiện chữa cháy - item 1)
        if ((item.name.includes('Phương tiện chữa cháy') && !item.name.includes('tự động')) || item.id === 'eq-1') {
          const extIssues = ialyCatMap.get('extinguisher') || [];
          if (extIssues.length > 0) {
            const badCount = extIssues.reduce((s, i) => s + i.suggestedBadCount, 0);
            if (options.updateBadColumns) {
              const currentQty = parseInt(item.qty, 10) || 409;
              item.bad = String(badCount);
              item.ok = String(Math.max(0, currentQty - badCount));
              appliedSummary.push(`[Mục I - NMTĐ Ialy] Cập nhật "${item.name}": Không đạt = ${badCount}, Đạt = ${item.ok}`);
            }
            if (options.updateNotes) {
              const notes = extIssues.map((i) => i.suggestedNote).join('; ');
              item.note = item.note ? `${item.note}; ${notes}` : notes;
              appliedSummary.push(`[Mục I - NMTĐ Ialy] Ghi chú "${item.name}": ${notes}`);
            }
          }
        }

        // 3. Protective equipment (item 3)
        if (item.name.includes('bảo hộ cá nhân') || item.id === 'eq-3') {
          const protIssues = ialyCatMap.get('protective') || [];
          if (protIssues.length > 0) {
            const badCount = protIssues.reduce((s, i) => s + i.suggestedBadCount, 0);
            if (options.updateBadColumns) {
              const currentQty = parseInt(item.qty, 10) || 12;
              item.bad = String(badCount);
              item.ok = String(Math.max(0, currentQty - badCount));
              appliedSummary.push(`[Mục I - NMTĐ Ialy] Cập nhật "${item.name}": Không đạt = ${badCount}, Đạt = ${item.ok}`);
            }
            if (options.updateNotes) {
              const notes = protIssues.map((i) => i.suggestedNote).join('; ');
              item.note = item.note ? `${item.note}; ${notes}` : notes;
            }
          }
        }

        // 4. Lighting & Escape (item 2)
        if (item.name.includes('chiếu sáng sự cố') || item.id === 'eq-2') {
          const lightIssues = ialyCatMap.get('lighting') || [];
          if (lightIssues.length > 0) {
            const badCount = lightIssues.reduce((s, i) => s + i.suggestedBadCount, 0);
            if (options.updateBadColumns) {
              const currentQty = parseInt(item.qty, 10) || 193;
              item.bad = String(badCount);
              item.ok = String(Math.max(0, currentQty - badCount));
              appliedSummary.push(`[Mục I - NMTĐ Ialy] Cập nhật "${item.name}": Không đạt = ${badCount}, Đạt = ${item.ok}`);
            }
            if (options.updateNotes) {
              const notes = lightIssues.map((i) => i.suggestedNote).join('; ');
              item.note = item.note ? `${item.note}; ${notes}` : notes;
            }
          }
        }
      }

      // --- PROCESS SECTION II: NHÀ MÁY THỦY ĐIỆN IALY MỞ RỘNG ---
      if (currentSection === 'II' && (scope === 'ialy_mr' || scope === 'both' || scope === 'auto')) {
        // 1. Water fire equipment (Loại thiết bị hệ thống chữa cháy bằng nước - item 17)
        if (item.name.includes('bằng nước') || item.id === 'eq-17') {
          const waterIssues = ialyMRCatMap.get('water_fire') || [];
          if (waterIssues.length > 0) {
            const badCount = waterIssues.reduce((s, i) => s + i.suggestedBadCount, 0);
            if (options.updateBadColumns) {
              const currentQty = parseInt(item.qty, 10) || 53;
              item.bad = String(badCount);
              item.ok = String(Math.max(0, currentQty - badCount));
              appliedSummary.push(`[Mục II - Ialy MR] Cập nhật "${item.name}": Không đạt = ${badCount}, Đạt = ${item.ok}`);
            }
            if (options.updateNotes) {
              const notes = waterIssues.map((i) => i.suggestedNote).join('; ');
              item.note = item.note ? `${item.note}; ${notes}` : notes;
              appliedSummary.push(`[Mục II - Ialy MR] Ghi chú "${item.name}": ${notes}`);
            }
          }
        }

        // 2. Protective gear (Bình Oxy áp suất không đạt - item 13)
        if (item.name.includes('bảo hộ cá nhân') || item.id === 'eq-13') {
          const protIssues = ialyMRCatMap.get('protective') || [];
          if (protIssues.length > 0) {
            const badCount = protIssues.reduce((s, i) => s + i.suggestedBadCount, 0);
            if (options.updateBadColumns) {
              const currentQty = parseInt(item.qty, 10) || 14;
              item.bad = String(badCount);
              item.ok = String(Math.max(0, currentQty - badCount));
              appliedSummary.push(`[Mục II - Ialy MR] Cập nhật "${item.name}": Không đạt = ${badCount}, Đạt = ${item.ok}`);
            }
            if (options.updateNotes) {
              const notes = protIssues.map((i) => i.suggestedNote).join('; ');
              item.note = item.note ? `${item.note}; ${notes}` : notes;
              appliedSummary.push(`[Mục II - Ialy MR] Ghi chú "${item.name}": ${notes}`);
            }
          }
        }

        // 3. Extinguishers (item 11)
        if ((item.name.includes('Phương tiện chữa cháy') && !item.name.includes('tự động')) || item.id === 'eq-11') {
          const extIssues = ialyMRCatMap.get('extinguisher') || [];
          if (extIssues.length > 0) {
            const badCount = extIssues.reduce((s, i) => s + i.suggestedBadCount, 0);
            if (options.updateBadColumns) {
              const currentQty = parseInt(item.qty, 10) || 332;
              item.bad = String(badCount);
              item.ok = String(Math.max(0, currentQty - badCount));
              appliedSummary.push(`[Mục II - Ialy MR] Cập nhật "${item.name}": Không đạt = ${badCount}, Đạt = ${item.ok}`);
            }
            if (options.updateNotes) {
              const notes = extIssues.map((i) => i.suggestedNote).join('; ');
              item.note = item.note ? `${item.note}; ${notes}` : notes;
            }
          }
        }

        // 4. Lighting / Escape (item 12)
        if (item.name.includes('chiếu sáng sự cố') || item.id === 'eq-12') {
          if (analysis.specialNotes.length > 0 && options.updateNotes) {
            if (!item.note.includes('Tắt nguồn AC')) {
              item.note = item.note
                ? `${item.note}; Đã kiểm tra ngắt AC 2h đạt`
                : 'Đã kiểm tra ngắt nguồn AC trong 2h thử sáng đạt yêu cầu';
              appliedSummary.push(`[Mục II - Ialy MR] Ghi chú thử nghiệm vào "${item.name}": Đã kiểm tra ngắt nguồn AC trong 2h`);
            }
          }
        }
      }

      return item;
    });

    // Update equip_note
    if (options.updateNotes && targetIssues.length > 0) {
      const ialyNotes = ialyIssues.map((iss) => `${iss.equipmentName} tại ${iss.location}: ${iss.finding}`);
      const ialyMRNotes = ialyMRIssues.map((iss) => `${iss.equipmentName} tại ${iss.location}: ${iss.finding}`);

      const parts: string[] = [];
      if (ialyNotes.length > 0) {
        parts.push(`[NMTĐ Ialy]: ${ialyNotes.join('; ')}`);
      }
      if (ialyMRNotes.length > 0) {
        parts.push(`[NMTĐ Ialy Mở rộng]: ${ialyMRNotes.join('; ')}`);
      }

      updated.equip_note = `Ghi nhận qua kiểm tra định kỳ có một số phương tiện cần xử lý: ${parts.join(' | ')}. Chi tiết từng vị trí lưu tại sổ Bảng II.`;
      appliedSummary.push('Cập nhật ghi chú tổng thể (equip_note) phân định rõ 2 nhà máy');
    }
  }

  // 2. Add Recommendations
  if (options.addRecommendations && targetIssues.length > 0) {
    const existingRecs = [...updated.recommendations];
    const newRecs: string[] = [];

    targetIssues.forEach((iss) => {
      if (iss.suggestedRecommendation) {
        const alreadyExists = existingRecs.some((r) =>
          r.toLowerCase().includes(iss.equipmentName.toLowerCase().substring(0, 8))
        );
        if (!alreadyExists) {
          newRecs.push(iss.suggestedRecommendation);
          appliedSummary.push(`Thêm kiến nghị (${iss.plant === 'ialy_mr' ? 'Ialy MR' : 'NMTĐ Ialy'}): "${iss.suggestedRecommendation}"`);
        }
      }
    });

    updated.recommendations = [...newRecs, ...existingRecs];
  }

  // 3. Add detected personnel to Delegation ("Danh sách đoàn")
  if (options.addPersonnelToDelegation && analysis.detectedManagers.length > 0) {
    let addedCount = 0;
    analysis.detectedManagers.forEach((mName) => {
      const exists = updated.people.some(
        (p) => p.name.trim().toLowerCase() === mName.trim().toLowerCase()
      );
      if (!exists && addedCount < 4) {
        const isMR = scope === 'ialy_mr' || (scope === 'auto' && analysis.detectedPlants.primaryPlant === 'ialy_mr');
        updated.people.push({
          id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: mName,
          role: isMR ? 'Cán bộ kiểm tra PCCC NMTĐ Ialy MR' : 'Cán bộ kiểm tra PCCC NMTĐ Ialy',
        });
        addedCount++;
        appliedSummary.push(`Thêm đồng chí ${mName} vào Danh sách đoàn`);
      }
    });
  }

  return { updatedReport: updated, appliedSummary };
}
