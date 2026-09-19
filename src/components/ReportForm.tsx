import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Download,
  Printer,
  PenTool,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  UserPlus,
  Eye,
  UploadCloud,
  Sparkles,
} from 'lucide-react';
import { ReportData, Person, EquipItem, FireSafetyItem, EscapeItem, UserRole } from '../types';
import { DEFAULT_STAFF_DIRECTORY } from '../data/defaultData';
import { getSignatureForPerson } from '../data/sampleSignatures';
import { SignatureModal } from './SignatureModal';
import { InspectionMediaUploader } from './InspectionMediaUploader';
import { Lock, Unlock, CheckCircle2 } from 'lucide-react';

interface ReportFormProps {
  data: ReportData;
  onChange: (updated: ReportData) => void;
  onSave: () => void;
  onViewDetail?: () => void;
  onExportWord: () => void;
  onPreviewPrint: () => void;
  onOpenScanner?: () => void;
  staffDirectory: { name: string; role: string }[];
  userRole?: UserRole;
  onOpenAdminLogin?: () => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({
  data,
  onChange,
  onSave,
  onViewDetail,
  onExportWord,
  onPreviewPrint,
  onOpenScanner,
  staffDirectory,
  userRole = 'viewer',
  onOpenAdminLogin,
}) => {
  const [signingPerson, setSigningPerson] = useState<{ name: string; isManager?: boolean } | null>(null);

  const updateField = <K extends keyof ReportData>(field: K, value: ReportData[K]) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  // --- 1. PEOPLE (CHÚNG TÔI GỒM) ---
  const addPerson = () => {
    const newPerson: Person = {
      id: `p-${Date.now()}`,
      name: '',
      role: 'Thành viên',
    };
    updateField('people', [...data.people, newPerson]);
  };

  const updatePerson = (id: string, field: 'name' | 'role', val: string) => {
    const updated = data.people.map((p) => {
      if (p.id === id) {
        return { ...p, [field]: val };
      }
      return p;
    });
    updateField('people', updated);
  };

  const removePerson = (id: string) => {
    updateField(
      'people',
      data.people.filter((p) => p.id !== id)
    );
  };

  const handleSelectStaffForPerson = (id: string, staffName: string) => {
    const found = staffDirectory.find((s) => s.name === staffName);
    if (!found) return;
    const updated = data.people.map((p) => {
      if (p.id === id) {
        return { ...p, name: found.name, role: found.role };
      }
      return p;
    });
    updateField('people', updated);
  };

  // --- 2. EQUIP (PHƯƠNG TIỆN, HỆ THỐNG PCCC) ---
  const renumberEquipSTT = (items: EquipItem[]) => {
    let currentNumber = 1;
    return items.map((item) => {
      if (item.isHeader || ['I', 'II', 'III', 'IV'].includes(item.stt.trim())) {
        currentNumber = 1;
        return item;
      }
      const newItem = { ...item, stt: String(currentNumber) };
      currentNumber++;
      return newItem;
    });
  };

  const addEquipRowUnderSection = (sectionStt: string) => {
    const items = [...data.equip];
    let insertIndex = -1;

    // Find the last item of this section before the next section
    let inSection = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].stt.trim() === sectionStt) {
        inSection = true;
        insertIndex = i;
        continue;
      }
      if (inSection) {
        if (items[i].isHeader || ['I', 'II', 'III', 'IV'].includes(items[i].stt.trim())) {
          break;
        }
        insertIndex = i;
      }
    }

    const newItem: EquipItem = {
      id: `eq-${Date.now()}`,
      stt: '',
      name: '',
      qty: '0',
      ok: '0',
      bad: '0',
      note: '',
    };

    if (insertIndex >= 0) {
      items.splice(insertIndex + 1, 0, newItem);
    } else {
      items.push(newItem);
    }

    updateField('equip', renumberEquipSTT(items));
  };

  const updateEquipRow = (id: string, field: keyof EquipItem, val: string) => {
    const updated = data.equip.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: val };
      }
      return item;
    });
    updateField('equip', updated);
  };

  const removeEquipRow = (id: string) => {
    const remaining = data.equip.filter((item) => item.id !== id);
    updateField('equip', renumberEquipSTT(remaining));
  };

  // --- 3. FIRE SAFETY (NGUỒN LỬA, NGUỒN NHIỆT) ---
  const addFireRow = () => {
    const nextStt = String(data.fire.length + 1);
    const newRow: FireSafetyItem = {
      id: `f-${Date.now()}`,
      stt: nextStt,
      name: '',
      qty: '',
      ok: 'Đảm bảo',
      bad: '/',
      note: '',
    };
    updateField('fire', [...data.fire, newRow]);
  };

  const updateFireRow = (id: string, field: keyof FireSafetyItem, val: string) => {
    const updated = data.fire.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: val };
      }
      return item;
    });
    updateField('fire', updated);
  };

  const removeFireRow = (id: string) => {
    updateField(
      'fire',
      data.fire.filter((item) => item.id !== id)
    );
  };

  // --- 4. ESCAPE (THOÁT NẠN) ---
  const addEscapeRow = () => {
    const newRow: EscapeItem = {
      id: `esc-${Date.now()}`,
      stt: '',
      name: '',
      status: 'Đảm bảo',
      note: '',
    };
    updateField('escape', [...data.escape, newRow]);
  };

  const updateEscapeRow = (id: string, field: keyof EscapeItem, val: string) => {
    const updated = data.escape.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: val };
      }
      return item;
    });
    updateField('escape', updated);
  };

  const removeEscapeRow = (id: string) => {
    updateField(
      'escape',
      data.escape.filter((item) => item.id !== id)
    );
  };

  // --- 6. RECOMMENDATIONS ---
  const addRecommendation = () => {
    updateField('recommendations', [...data.recommendations, '']);
  };

  const updateRecommendation = (index: number, val: string) => {
    const updated = [...data.recommendations];
    updated[index] = val;
    updateField('recommendations', updated);
  };

  const removeRecommendation = (index: number) => {
    updateField(
      'recommendations',
      data.recommendations.filter((_, i) => i !== index)
    );
  };

  const isCompleted = data.status === 'completed';
  const isAdmin = userRole === 'admin';

  const toggleReportStatus = () => {
    if (!isAdmin) {
      if (onOpenAdminLogin) onOpenAdminLogin();
      return;
    }
    const newStatus = isCompleted ? 'draft' : 'completed';
    updateField('status', newStatus);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Quick Scanner Shortcut Banner (Admin Only) */}
      {onOpenScanner && userRole === 'admin' && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <span>Quét file kiểm tra Bảng II (Excel, Word, OCR)</span>
                <span className="text-[10px] bg-amber-400 text-slate-900 font-extrabold px-2 py-0.5 rounded-full">
                  Mới
                </span>
              </h4>
              <p className="text-xs text-slate-200 mt-0.5">
                Tự động nhận diện thiết bị vỡ, tụt áp, rò rỉ van để điền cột Không đạt, trừ cột Đạt, điền Ghi chú và sinh Kiến nghị theo từng nhà máy.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenScanner}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-900 hover:bg-blue-50 active:bg-blue-100 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-blue-600" />
            <span>Mở công cụ quét file</span>
          </button>
        </div>
      )}

      {/* ---------------- CARD 1: THÔNG TIN CHUNG & TIÊU ĐỀ ---------------- */}
      <div className="bg-white rounded-xl shadow-xs p-5 sm:p-6 transition-all border border-slate-200">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <h3 className="font-bold text-base text-[#17365d] flex items-center gap-2">
            <span>🏛️</span>
            <span>Thông tin văn bản & Thời gian kiểm tra</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Số biên bản
            </label>
            <input
              type="text"
              value={data.so}
              onChange={(e) => updateField('so', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="VD: 1209/VHIALY"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Địa danh văn bản
            </label>
            <input
              type="text"
              value={data.place}
              onChange={(e) => updateField('place', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="VD: Gia Lai"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ngày / Tháng / Năm trên văn bản
            </label>
            <div className="grid grid-cols-3 gap-1">
              <input
                type="text"
                value={data.header_day}
                onChange={(e) => updateField('header_day', e.target.value)}
                className="w-full px-2 py-2 text-sm text-center border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Ngày"
              />
              <input
                type="text"
                value={data.header_month}
                onChange={(e) => updateField('header_month', e.target.value)}
                className="w-full px-2 py-2 text-sm text-center border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Tháng"
              />
              <input
                type="text"
                value={data.header_year}
                onChange={(e) => updateField('header_year', e.target.value)}
                className="w-full px-2 py-2 text-sm text-center border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Năm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tháng báo cáo (Tiêu đề chính)
            </label>
            <input
              type="text"
              value={data.report_month}
              onChange={(e) => updateField('report_month', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-blue-400 bg-blue-50/50 rounded-md focus:ring-2 focus:ring-blue-500 font-bold text-blue-900"
              placeholder="VD: 07/2026"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Giờ & Phút bắt đầu
            </label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={data.start_h}
                onChange={(e) => updateField('start_h', e.target.value)}
                className="w-1/2 px-2 py-2 text-sm text-center border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Giờ (08)"
              />
              <span className="font-bold">:</span>
              <input
                type="text"
                value={data.start_p}
                onChange={(e) => updateField('start_p', e.target.value)}
                className="w-1/2 px-2 py-2 text-sm text-center border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Phút (30)"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ngày kiểm tra thực tế
            </label>
            <input
              type="text"
              value={data.start_day}
              onChange={(e) => updateField('start_day', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Ngày (VD: 31)"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tháng & Năm kiểm tra
            </label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={data.start_month}
                onChange={(e) => updateField('start_month', e.target.value)}
                className="w-1/2 px-2 py-2 text-sm text-center border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Tháng (07)"
              />
              <span className="text-slate-400">/</span>
              <input
                type="text"
                value={data.start_year}
                onChange={(e) => updateField('start_year', e.target.value)}
                className="w-1/2 px-2 py-2 text-sm text-center border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Năm (2026)"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Thời gian kết thúc biên bản
            </label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={data.end_h}
                onChange={(e) => updateField('end_h', e.target.value)}
                className="w-1/2 px-2 py-2 text-sm text-center border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Giờ (15)"
              />
              <span className="font-bold">:</span>
              <input
                type="text"
                value={data.end_p}
                onChange={(e) => updateField('end_p', e.target.value)}
                className="w-1/2 px-2 py-2 text-sm text-center border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Phút (30)"
              />
            </div>
          </div>
        </div>

        {/* Inspection Areas */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Khu vực tiến hành kiểm tra công tác PCCC&CNCH:
          </label>
          <textarea
            value={data.inspection_areas}
            onChange={(e) => updateField('inspection_areas', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Khu vực kiểm tra..."
          />
        </div>
      </div>

      {/* ---------------- CARD 2: THÀNH PHẦN THAM GIA (CHÚNG TÔI GỒM) ---------------- */}
      <div className="bg-white rounded-xl shadow-xs p-5 sm:p-6 transition-all border border-slate-200">
        <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-bold text-base text-[#17365d] flex items-center gap-2">
              <span>👥</span>
              <span>1. Danh sách đoàn kiểm tra</span>
            </h3>
          </div>

          <button
            type="button"
            onClick={addPerson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-md text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Thêm thành viên đoàn</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {data.people.map((p, idx) => (
            <div
              key={p.id}
              className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 bg-slate-50/80 hover:bg-slate-100/60 p-2.5 rounded-xl border border-slate-200/90 transition"
            >
              {/* STT badge & Name */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                  #{idx + 1}
                </span>
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => updatePerson(p.id, 'name', e.target.value)}
                  placeholder="Họ và tên..."
                  className="w-44 sm:w-56 px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Role column: wide enough to fit long titles on 1 line! */}
              <div className="flex-1 min-w-[280px]">
                <input
                  type="text"
                  value={p.role}
                  list={`roles-list-${p.id}`}
                  onChange={(e) => updatePerson(p.id, 'role', e.target.value)}
                  placeholder="Chức vụ / Vị trí đảm nhiệm (rộng rãi đủ 1 dòng)..."
                  className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                />
                <datalist id={`roles-list-${p.id}`}>
                  <option value="Kỹ sư vận hành PX Vận hành Ialy" />
                  <option value="Kỹ sư vận hành NMTĐ Ialy" />
                  <option value="Trưởng ca vận hành PX Vận hành Ialy" />
                  <option value="Trưởng ca vận hành NMTĐ Ialy" />
                  <option value="Phó Quản đốc Phân xưởng VHIALY" />
                  <option value="Quản đốc Phân xưởng VHIALY" />
                  <option value="An toàn vệ sinh viên Phân xưởng" />
                  <option value="Cán bộ chuyên trách an toàn" />
                  <option value="Nhân viên vận hành" />
                </datalist>
              </div>

              {/* Dropdown select to pick fast from directory */}
              <div className="w-full md:w-44 shrink-0">
                <select
                  value=""
                  onChange={(e) => handleSelectStaffForPerson(p.id, e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 text-slate-600 rounded-lg cursor-pointer hover:border-slate-400"
                >
                  <option value="">▼ Danh sách đoàn</option>
                  {staffDirectory.map((st, i) => (
                    <option key={i} value={st.name}>
                      {st.name} ({st.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => removePerson(p.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 self-end md:self-center cursor-pointer"
                title="Xóa thành viên này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-start">
          <button
            type="button"
            onClick={addPerson}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-300 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm dòng thành viên</span>
          </button>
        </div>
      </div>

      {/* ---------------- CARD 3: PHƯƠNG TIỆN, HỆ THỐNG PCCC (TABLE 1) ---------------- */}
      <div className="bg-white rounded-xl shadow-xs p-5 sm:p-6 transition-all border border-slate-200">
        <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-bold text-base text-[#17365d] flex items-center gap-2">
              <span>🚒</span>
              <span>2. Phương tiện, hệ thống PCCC, cứu nạn cứu hộ & nguồn nước</span>
            </h3>
          </div>
        </div>

        {/* Table header */}
        <div className="hidden md:grid md:grid-cols-12 gap-1.5 bg-[#eef2f5] p-2.5 rounded-t-lg font-bold text-xs text-slate-700 border border-slate-300">
          <div className="col-span-1 text-center">STT</div>
          <div className="col-span-4">Tên trang bị phương tiện, hệ thống</div>
          <div className="col-span-2 text-center">Số lượng</div>
          <div className="col-span-1 text-center">Đạt</div>
          <div className="col-span-1 text-center">Không đạt</div>
          <div className="col-span-2">Ghi chú</div>
          <div className="col-span-1 text-center">Thao tác</div>
        </div>

        {/* Rows */}
        <div className="space-y-1 md:space-y-0 md:divide-y md:divide-slate-200 border-x border-b border-slate-200 rounded-b-lg overflow-hidden">
          {data.equip.map((eq) => {
            const isHeader = eq.isHeader || ['I', 'II', 'III', 'IV'].includes(eq.stt.trim());

            if (isHeader) {
              return (
                <div
                  key={eq.id}
                  className="bg-blue-50/70 p-2.5 flex flex-wrap items-center justify-between border-t-2 border-blue-400"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-bold text-blue-900 w-8 text-center text-sm">{eq.stt}</span>
                    <input
                      type="text"
                      value={eq.name}
                      onChange={(e) => updateEquipRow(eq.id, 'name', e.target.value)}
                      className="font-bold text-sm text-blue-900 bg-transparent border-b border-dashed border-blue-300 focus:outline-none focus:border-blue-600 px-1 py-0.5 w-full max-w-lg"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => addEquipRowUnderSection(eq.stt.trim())}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Thêm dòng mục {eq.stt}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeEquipRow(eq.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Xóa mục này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={eq.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-1.5 p-2 items-center bg-white hover:bg-slate-50/80 text-xs"
              >
                <div className="md:col-span-1 text-center font-mono font-medium text-slate-500">
                  <input
                    type="text"
                    value={eq.stt}
                    onChange={(e) => updateEquipRow(eq.id, 'stt', e.target.value)}
                    className="w-10 text-center py-1 border border-slate-200 rounded font-bold"
                  />
                </div>
                <div className="md:col-span-4">
                  <input
                    type="text"
                    value={eq.name}
                    onChange={(e) => updateEquipRow(eq.id, 'name', e.target.value)}
                    placeholder="Tên trang bị..."
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-slate-800"
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={eq.qty}
                    onChange={(e) => updateEquipRow(eq.id, 'qty', e.target.value)}
                    placeholder="Số lượng"
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-center font-mono"
                  />
                </div>
                <div className="md:col-span-1">
                  <input
                    type="text"
                    value={eq.ok}
                    onChange={(e) => updateEquipRow(eq.id, 'ok', e.target.value)}
                    placeholder="Đạt"
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-center font-mono text-emerald-700 font-bold"
                  />
                </div>
                <div className="md:col-span-1">
                  <input
                    type="text"
                    value={eq.bad}
                    onChange={(e) => updateEquipRow(eq.id, 'bad', e.target.value)}
                    placeholder="Không đạt"
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-center font-mono text-rose-600"
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={eq.note}
                    onChange={(e) => updateEquipRow(eq.id, 'note', e.target.value)}
                    placeholder="Ghi chú..."
                    className="w-full px-2 py-1.5 border border-slate-300 rounded"
                  />
                </div>
                <div className="md:col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeEquipRow(eq.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                    title="Xóa dòng này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footnote note */}
        <div className="mt-3">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Ghi chú dưới bảng phương tiện:
          </label>
          <input
            type="text"
            value={data.equip_note}
            onChange={(e) => updateField('equip_note', e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded italic text-slate-700"
          />
        </div>
      </div>

      {/* ---------------- CARD 4: NGUỒN LỬA, NGUỒN NHIỆT (TABLE 2) ---------------- */}
      <div className="bg-white rounded-xl shadow-xs p-5 sm:p-6 transition-all border border-slate-200">
        <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-bold text-base text-[#17365d] flex items-center gap-2">
              <span>🔥</span>
              <span>3. Nguồn lửa, nguồn nhiệt, thiết bị sinh nhiệt & chất dễ cháy nổ</span>
            </h3>
            <span className="text-xs text-slate-500">
              Kiểm tra việc sử dụng lửa/hàn mài xâm thực BXCT các tổ máy và chất dễ cháy nổ.
            </span>
          </div>

          <button
            type="button"
            onClick={addFireRow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-md text-xs font-bold shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Thêm dòng nguồn nhiệt</span>
          </button>
        </div>

        <div className="space-y-3">
          {data.fire.map((f) => (
            <div
              key={f.id}
              className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-2 items-start"
            >
              <div className="md:col-span-1">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">STT</label>
                <input
                  type="text"
                  value={f.stt}
                  onChange={(e) => updateFireRow(f.id, 'stt', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs text-center border border-slate-300 rounded font-bold"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Nội dung duy trì</label>
                <textarea
                  value={f.name}
                  onChange={(e) => updateFireRow(f.id, 'name', e.target.value)}
                  rows={3}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Số lượng / Số phiếu công tác hàn mài
                </label>
                <textarea
                  value={f.qty}
                  onChange={(e) => updateFireRow(f.id, 'qty', e.target.value)}
                  rows={3}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded font-mono"
                  placeholder="VD: 99/2026/VHIALY-TĐIAL Mài hàn..."
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-[11px] font-bold text-slate-500 mb-1 text-center">Đảm bảo</label>
                <input
                  type="text"
                  value={f.ok}
                  onChange={(e) => updateFireRow(f.id, 'ok', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs text-center border border-slate-300 rounded text-emerald-700 font-bold"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-[11px] font-bold text-slate-500 mb-1 text-center">Không ĐB</label>
                <input
                  type="text"
                  value={f.bad}
                  onChange={(e) => updateFireRow(f.id, 'bad', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs text-center border border-slate-300 rounded"
                />
              </div>

              <div className="md:col-span-1 flex flex-col items-center justify-between h-full pt-6">
                <button
                  type="button"
                  onClick={() => removeFireRow(f.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                  title="Xóa dòng này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- CARD 5: THOÁT NẠN, NGĂN CHÁY (TABLE 3) ---------------- */}
      <div className="bg-white rounded-xl shadow-xs p-5 sm:p-6 transition-all border border-slate-200">
        <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-bold text-base text-[#17365d] flex items-center gap-2">
              <span>🚪</span>
              <span>4. Thoát nạn, ngăn cháy, chống cháy lan, chống khói</span>
            </h3>
            <span className="text-xs text-slate-500">
              Kiểm tra hành lang, cửa thoát nạn, cầu thang thoát nạn và các giải pháp ngăn cháy lan.
            </span>
          </div>

          <button
            type="button"
            onClick={addEscapeRow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-md text-xs font-bold shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Thêm dòng thoát nạn</span>
          </button>
        </div>

        <div className="space-y-2">
          {data.escape.map((esc) => (
            <div
              key={esc.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs"
            >
              <div className="md:col-span-1">
                <input
                  type="text"
                  value={esc.stt}
                  onChange={(e) => updateEscapeRow(esc.id, 'stt', e.target.value)}
                  className="w-full px-2 py-1.5 text-center border border-slate-300 rounded font-bold"
                  placeholder="STT"
                />
              </div>

              <div className="md:col-span-5">
                <input
                  type="text"
                  value={esc.name}
                  onChange={(e) => updateEscapeRow(esc.id, 'name', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded font-medium"
                  placeholder="Nội dung duy trì..."
                />
              </div>

              <div className="md:col-span-2">
                <input
                  type="text"
                  value={esc.status}
                  onChange={(e) => updateEscapeRow(esc.id, 'status', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-center text-emerald-700 font-bold"
                  placeholder="Tình trạng"
                />
              </div>

              <div className="md:col-span-3">
                <input
                  type="text"
                  value={esc.note}
                  onChange={(e) => updateEscapeRow(esc.id, 'note', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded"
                  placeholder="Ghi chú minh chứng..."
                />
              </div>

              <div className="md:col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => removeEscapeRow(esc.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                  title="Xóa dòng này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- CARD 6: CHẤP HÀNH NỘI QUY & KIẾN NGHỊ ---------------- */}
      <div className="bg-white rounded-xl shadow-xs p-5 sm:p-6 transition-all border border-slate-200">
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-sm text-[#17365d] mb-1.5">
              5. Chấp hành nội quy phòng cháy, chữa cháy, cứu hộ, cứu nạn:
            </h3>
            <textarea
              value={data.compliance}
              onChange={(e) => updateField('compliance', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-[#17365d]">
                II. Kiến nghị:
              </h3>
              <button
                type="button"
                onClick={addRecommendation}
                className="flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium border border-slate-300 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm kiến nghị</span>
              </button>
            </div>

            <div className="space-y-2">
              {data.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2">
                  <textarea
                    value={rec}
                    onChange={(e) => updateRecommendation(i, e.target.value)}
                    rows={2}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeRecommendation(i)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    title="Xóa kiến nghị"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- CARD 6.5: TÀI LIỆU & HÌNH ẢNH HIỆN TRƯỜNG (MULTI-MACHINE & AI VISION) ---------------- */}
      <InspectionMediaUploader
        report={data}
        userRole={userRole}
        onUpdateReport={onChange}
        onAddRecommendation={addRecommendation}
      />

      {/* ---------------- CARD 7: CHỮ KÝ & NGƯỜI KÝ (CHIA 2 CỘT NHƯ TÀI LIỆU GỐC) ---------------- */}
      <div className="bg-white rounded-xl shadow-xs p-5 sm:p-6 transition-all border border-slate-200">
        <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-bold text-base text-[#17365d] flex items-center gap-2">
              <span>✍️</span>
              <span>Chữ ký các thành viên & Lãnh đạo ký duyệt (Định dạng 2 cột chuẩn Mẫu PC02)</span>
            </h3>
          </div>
        </div>

        {/* 2-Column Signatures Preview/Editor */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 mb-6">
          <div className="text-center font-bold text-sm text-slate-800 uppercase tracking-wide mb-3">
            Các thành viên kiểm tra:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.people
              .filter((p) => p.name.trim() && p.name.trim() !== data.manager.trim())
              .map((p) => {
                const sig = getSignatureForPerson(p.name, p.signatureImage);
                return (
                  <div
                    key={p.id}
                    className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-col items-center justify-between"
                  >
                    <div className="text-sm font-semibold text-slate-800">
                      - Ông: {p.name}
                    </div>
                    <div className="text-xs text-slate-500">{p.role}</div>

                    <div
                      onClick={() => setSigningPerson({ name: p.name })}
                      className="w-full h-16 my-2 bg-blue-50/30 border border-dashed border-blue-200 rounded flex items-center justify-center cursor-pointer hover:bg-blue-50/70 transition-colors group relative"
                      title="Bấm để ký lại hoặc chọn chữ ký"
                    >
                      {sig ? (
                        <img
                          src={sig}
                          alt={`Chữ ký ${p.name}`}
                          className="max-h-12 object-contain"
                        />
                      ) : (
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <PenTool className="w-3.5 h-3.5 text-blue-500" />
                          <span>Bấm để chèn chữ ký</span>
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1.5 opacity-0 group-hover:opacity-100 text-[10px] text-blue-600 bg-white/90 px-1 rounded shadow-2xs">
                        Đổi chữ ký
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Manager Signature & Signer Title */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <div className="text-xs font-bold uppercase text-slate-500 mb-1">
                Nơi nhận văn bản
              </div>
              <div className="text-xs text-slate-600 font-serif space-y-0.5 bg-white p-2.5 rounded border border-slate-200">
                <div className="font-bold italic">Nơi nhận:</div>
                <div>- HCLĐ (để phối hợp);</div>
                <div>- Lưu: VHIALY.</div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  value={data.signer_title}
                  onChange={(e) => updateField('signer_title', e.target.value)}
                  className="px-2 py-1 text-xs text-center font-bold uppercase border border-slate-300 rounded"
                  placeholder="KT. QUẢN ĐỐC"
                />
                <input
                  type="text"
                  value={data.signer_role}
                  onChange={(e) => updateField('signer_role', e.target.value)}
                  className="px-2 py-1 text-xs text-center font-bold uppercase border border-slate-300 rounded"
                  placeholder="PHÓ QUẢN ĐỐC"
                />
              </div>

              {/* Manager signature box */}
              <div
                onClick={() => setSigningPerson({ name: data.manager, isManager: true })}
                className="h-20 bg-blue-50/30 border border-dashed border-blue-200 rounded flex items-center justify-center cursor-pointer hover:bg-blue-50/70 transition-colors relative group my-1"
                title="Bấm để ký lại lãnh đạo"
              >
                {getSignatureForPerson(data.manager, data.manager_signature) ? (
                  <img
                    src={getSignatureForPerson(data.manager, data.manager_signature)!}
                    alt={`Chữ ký ${data.manager}`}
                    className="max-h-16 object-contain"
                  />
                ) : (
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <PenTool className="w-4 h-4 text-blue-500" />
                    <span>Bấm để chèn chữ ký lãnh đạo</span>
                  </div>
                )}
                <span className="absolute bottom-1 right-1.5 opacity-0 group-hover:opacity-100 text-[10px] text-blue-600 bg-white/90 px-1 rounded shadow-2xs">
                  Đổi chữ ký
                </span>
              </div>

              <input
                type="text"
                value={data.manager}
                onChange={(e) => updateField('manager', e.target.value)}
                className="w-full px-2 py-1 text-sm text-center font-bold border border-slate-300 rounded"
                placeholder="Họ và tên người ký (VD: Nguyễn Hoàng Phi)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {signingPerson && (
        <SignatureModal
          personName={signingPerson.name}
          currentSignature={
            signingPerson.isManager
              ? data.manager_signature
              : data.people.find((p) => p.name === signingPerson.name)?.signatureImage
          }
          onSave={(sig) => {
            if (signingPerson.isManager) {
              updateField('manager_signature', sig);
            } else {
              const updated = data.people.map((p) => {
                if (p.name === signingPerson.name) {
                  return { ...p, signatureImage: sig };
                }
                return p;
              });
              updateField('people', updated);
            }
          }}
          onClose={() => setSigningPerson(null)}
        />
      )}
    </div>
  );
};
