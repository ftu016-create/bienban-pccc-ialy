import React, { useState } from 'react';
import { X, Plus, Trash2, Users, Save, Check } from 'lucide-react';
import { storageService } from '../services/storage';

interface StaffManagerModalProps {
  onClose: () => void;
  onUpdate: () => void;
}

export const StaffManagerModal: React.FC<StaffManagerModalProps> = ({ onClose, onUpdate }) => {
  const [staffList, setStaffList] = useState<{ name: string; role: string }[]>(() =>
    storageService.getStaffDirectory()
  );
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddStaff = () => {
    if (!newName.trim()) return;
    const updated = [...staffList, { name: newName.trim(), role: newRole.trim() || 'Thành viên' }];
    setStaffList(updated);
    setNewName('');
    setNewRole('');
  };

  const handleRemove = (index: number) => {
    const updated = staffList.filter((_, i) => i !== index);
    setStaffList(updated);
  };

  const handleSave = () => {
    storageService.saveStaffDirectory(staffList);
    setSavedSuccess(true);
    onUpdate();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        <div className="bg-[#17365d] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-300" />
            <h3 className="font-bold text-base">Danh sách đoàn kiểm tra (PCCC&CNCH)</h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-4">
          <p className="text-xs text-slate-500">
            Danh sách đoàn kiểm tra thường trực dùng để điền nhanh thành phần tham gia và người ký biên bản.
          </p>

          {/* Add new */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Thêm thành viên đoàn mới
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input
                type="text"
                placeholder="Họ và tên..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="sm:col-span-3 px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Chức danh/vị trí..."
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="sm:col-span-2 px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAddStaff}
              disabled={!newName.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm vào danh sách</span>
            </button>
          </div>

          {/* List */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {staffList.map((st, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 hover:bg-slate-50 text-sm">
                <div>
                  <span className="font-semibold text-slate-900">{st.name}</span>
                  <span className="text-xs text-slate-500 ml-2 font-mono bg-slate-100 px-2 py-0.5 rounded">
                    {st.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">Tổng cộng {staffList.length} nhân sự</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-sm text-slate-600 hover:bg-slate-200/60 rounded"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-sm font-semibold shadow-sm"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Đã lưu!' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
