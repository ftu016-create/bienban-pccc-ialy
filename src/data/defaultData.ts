import { Person, EquipItem, FireSafetyItem, EscapeItem, ReportData } from '../types';

export const DEFAULT_STAFF_DIRECTORY: { name: string; role: string }[] = [
  { name: 'Nguyễn Hoàng Phi', role: 'Phó Quản đốc' },
  { name: 'Trần Thanh Chương', role: 'QLKT - Thư ký' },
  { name: 'Nguyễn Văn Toàn', role: 'TĐKTT - Thành viên' },
  { name: 'Võ Quang Minh', role: 'TBA - Thành viên' },
  { name: 'Thái Trần Hoàng Vũ', role: 'TPM - Thành viên' },
  { name: 'A Ran', role: 'T.Trạm 500kV Ialy - Thành viên' },
  { name: 'Phùng Ngọc Tú', role: 'Trực chính Gian máy Ialy MR - Thành viên' },
  { name: 'Nguyễn Hồng Quang', role: 'Trực chính Gian máy Ialy MR - Thành viên' },
];

export const DEFAULT_PEOPLE: Person[] = [
  { id: 'p-1', name: 'Nguyễn Hoàng Phi', role: 'Phó Quản đốc' },
  { id: 'p-2', name: 'Trần Thanh Chương', role: 'QLKT - Thư ký' },
  { id: 'p-3', name: 'Nguyễn Văn Toàn', role: 'TĐKTT - Thành viên' },
  { id: 'p-4', name: 'Võ Quang Minh', role: 'TBA - Thành viên' },
  { id: 'p-5', name: 'Thái Trần Hoàng Vũ', role: 'TPM - Thành viên' },
  { id: 'p-6', name: 'A Ran', role: 'T.Trạm 500kV Ialy - Thành viên' },
  { id: 'p-7', name: 'Phùng Ngọc Tú', role: 'Trực chính Gian máy Ialy MR - Thành viên' },
  { id: 'p-8', name: 'Nguyễn Hồng Quang', role: 'Trực chính Gian máy Ialy MR - Thành viên' },
];

export const DEFAULT_EQUIP: EquipItem[] = [
  // SECTION I: Nhà máy thủy điện Ialy
  { id: 'eq-s1', stt: 'I', name: 'Nhà máy thủy điện Ialy', qty: '', ok: '', bad: '', note: '', isHeader: true },
  { id: 'eq-1', stt: '1', name: 'Phương tiện chữa cháy', qty: '409', ok: '409', bad: '0', note: '' },
  { id: 'eq-2', stt: '2', name: 'Phương tiện chiếu sáng sự cố; chiếu sáng thoát nạn và bộ đàm', qty: '193', ok: '193', bad: '0', note: '' },
  { id: 'eq-3', stt: '3', name: 'Phương tiện trang phục và thiết bị bảo hộ cá nhân', qty: '12', ok: '12', bad: '0', note: '' },
  { id: 'eq-4', stt: '4', name: 'Dụng cụ phá dỡ thô sơ', qty: '22', ok: '22', bad: '0', note: '' },
  { id: 'eq-5', stt: '5', name: 'Hệ thống chữa cháy tự động', qty: '26', ok: '26', bad: '0', note: '' },
  { id: 'eq-6', stt: '6', name: 'Hệ thống báo cháy tự động', qty: '354', ok: '354', bad: '0', note: '' },
  { id: 'eq-7', stt: '7', name: 'Loại thiết bị của hệ thống chữa cháy bằng nước', qty: '90', ok: '90', bad: '0', note: '' },
  { id: 'eq-8', stt: '8', name: 'Hệ thống điện phục vụ phòng cháy và chữa cháy', qty: '20', ok: '20', bad: '0', note: '' },
  { id: 'eq-9', stt: '9', name: 'Nguồn nước chữa cháy', qty: '04', ok: '04', bad: '0', note: '' },
  { id: 'eq-10', stt: '10', name: 'Bộ truyền tin báo cháy', qty: '01', ok: '01', bad: '0', note: '' },

  // SECTION II: Nhà máy thủy điện Ialy MR
  { id: 'eq-s2', stt: 'II', name: 'Nhà máy thủy điện Ialy MR', qty: '', ok: '', bad: '', note: '', isHeader: true },
  { id: 'eq-11', stt: '1', name: 'Phương tiện chữa cháy', qty: '332', ok: '332', bad: '0', note: '' },
  { id: 'eq-12', stt: '2', name: 'Phương tiện chiếu sáng sự cố; chiếu sáng thoát nạn', qty: '192', ok: '192', bad: '0', note: '' },
  { id: 'eq-13', stt: '3', name: 'Phương tiện trang phục và thiết bị bảo hộ cá nhân', qty: '14', ok: '14', bad: '0', note: '' },
  { id: 'eq-14', stt: '4', name: 'Dụng cụ phá dỡ thô sơ', qty: '17', ok: '17', bad: '0', note: '' },
  { id: 'eq-15', stt: '5', name: 'Hệ thống báo cháy tự động', qty: '379', ok: '379', bad: '0', note: '' },
  { id: 'eq-16', stt: '6', name: 'Hệ thống chữa cháy tự động', qty: '8', ok: '8', bad: '0', note: '' },
  { id: 'eq-17', stt: '7', name: 'Loại thiết bị của hệ thống chữa cháy bằng nước', qty: '53', ok: '53', bad: '0', note: '' },
  { id: 'eq-18', stt: '8', name: 'Hệ thống điện phục vụ phòng cháy và chữa cháy', qty: '11', ok: '11', bad: '0', note: '' },
  { id: 'eq-19', stt: '9', name: 'Nguồn nước chữa cháy', qty: '04', ok: '04', bad: '0', note: '' },
  { id: 'eq-20', stt: '10', name: 'Bộ truyền tin báo cháy', qty: '01', ok: '01', bad: '0', note: '' },
];

export const DEFAULT_FIRE: FireSafetyItem[] = [
  {
    id: 'f-1',
    stt: '1',
    name: 'Việc duy trì điều kiện an toàn phòng cháy trong sử dụng nguồn lửa, nguồn nhiệt, thiết bị, dụng cụ sinh lửa, sinh nhiệt',
    qty: '99/2026/VHIALY-TĐIAL Mài hàn xâm thực BXCT của tổ máy H4 NMTĐ Ialy\n103/2026/VHIALY-TĐIAL Mài hàn xâm thực BXCT của tổ máy H4 NMTĐ Ialy\n115/2026/VHIALY-TĐIAL Mài hàn xâm thực BXCT của tổ máy H3 NMTĐ Ialy',
    ok: 'Đảm bảo',
    bad: '/',
    note: '',
  },
  {
    id: 'f-2',
    stt: '2',
    name: 'Việc duy trì điều kiện an toàn phòng cháy trong sử dụng chất dễ cháy, nổ',
    qty: 'Không phát sinh',
    ok: '/',
    bad: '/',
    note: '',
  },
];

export const DEFAULT_ESCAPE: EscapeItem[] = [
  { id: 'esc-1', stt: '1', name: 'Việc duy trì giải pháp thoát nạn', status: 'Đảm bảo', note: '' },
  { id: 'esc-2', stt: '1.1', name: 'Các hành lang, lối thoát nạn', status: 'Đảm bảo', note: '' },
  { id: 'esc-3', stt: '1.2', name: 'Cửa thoát nạn', status: 'Đảm bảo', note: '' },
  { id: 'esc-4', stt: '1.3', name: 'Cầu thang thoát nạn', status: 'Đảm bảo', note: '' },
  { id: 'esc-5', stt: '2', name: 'Việc duy trì giải pháp ngăn cháy, chống cháy lan, chống khói', status: 'Đảm bảo', note: '' },
];

export function createNewReport(override?: Partial<ReportData>): ReportData {
  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentDay = String(now.getDate()).padStart(2, '0');
  const reportMonthStr = `${currentMonth}/${currentYear}`;

  return {
    id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    so: '1209/VHIALY',
    place: 'Gia Lai',
    header_day: '02',
    header_month: '8',
    header_year: '2026',

    report_month: '07/2026',
    start_h: '08',
    start_p: '30',
    start_day: '31',
    start_month: '07',
    start_year: '2026',

    inspection_areas: '- NMTĐ Ialy: Gian máy, Gian biến áp, Nhà PK, Trạm 500 kV, Cửa nhận nước.\n- NMTĐ Ialy mở rộng.',

    people: JSON.parse(JSON.stringify(DEFAULT_PEOPLE)),
    equip: JSON.parse(JSON.stringify(DEFAULT_EQUIP)),
    equip_note: 'Thống kê chi tiết trang bị và duy trì các phương tiện, dụng cụ, hệ thống nêu trên như Phụ lục kèm theo biên bản này.',

    fire: JSON.parse(JSON.stringify(DEFAULT_FIRE)),
    escape: JSON.parse(JSON.stringify(DEFAULT_ESCAPE)),

    compliance: 'Cán bộ, công nhân viên đơn vị nghiêm túc chấp hành đầy đủ các quy định, nội quy về phòng cháy, chữa cháy và cứu nạn, cứu hộ.',

    recommendations: [
      'Tiếp tục duy trì chế độ tự kiểm tra định kỳ; tăng cường kiểm tra trong các đợt sửa chữa, các công việc có sử dụng nguồn lửa, nguồn nhiệt; bảo đảm các phương tiện, hệ thống PCCC luôn ở trạng thái sẵn sàng hoạt động; thường xuyên tuyên truyền, huấn luyện và diễn tập PCCC&CNCH theo kế hoạch.'
    ],

    end_h: '15',
    end_p: '30',
    signer_title: 'KT. QUẢN ĐỐC',
    signer_role: 'PHÓ QUẢN ĐỐC',
    manager: 'Nguyễn Hoàng Phi',

    status: 'draft',
    attachments: [],

    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...override,
  };
}
