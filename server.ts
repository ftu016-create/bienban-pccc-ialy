import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { analyzeInspectionImageWithGemini } from './src/server/geminiVision';
import { ReportData, AttachmentItem } from './src/types';
import { createNewReport, DEFAULT_STAFF_DIRECTORY } from './src/data/defaultData';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');
const DOCS_DIR = path.join(UPLOADS_DIR, 'documents');
const PIN_FILE = path.join(DATA_DIR, 'pin.json');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');
const STAFF_FILE = path.join(DATA_DIR, 'staff.json');
const DEFAULT_PIN = 'ialy2026';

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
  if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
}

ensureDirectories();

// PIN helpers
function getCurrentPin(): { pin: string; updated_at: string } {
  try {
    if (fs.existsSync(PIN_FILE)) {
      const data = JSON.parse(fs.readFileSync(PIN_FILE, 'utf-8'));
      if (data && data.pin && typeof data.pin === 'string' && data.pin.trim().length >= 4) {
        return { pin: data.pin.trim(), updated_at: data.updated_at || new Date().toISOString() };
      }
    }
  } catch (err) {
    console.error('Error reading PIN file:', err);
  }
  return { pin: DEFAULT_PIN, updated_at: new Date().toISOString() };
}

function savePin(newPin: string): { pin: string; updated_at: string } {
  ensureDirectories();
  const payload = {
    pin: newPin.trim(),
    updated_at: new Date().toISOString(),
  };
  fs.writeFileSync(PIN_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  return payload;
}

function isRequestAdmin(req: express.Request): boolean {
  const headerPin = req.headers['x-admin-pin'] as string;
  const authHeader = req.headers['authorization'] as string;
  const currentPin = getCurrentPin().pin;

  if (headerPin && headerPin.trim() === currentPin) {
    return true;
  }
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token === currentPin) return true;
  }
  return false;
}

// Reports helpers
function getAllReports(): ReportData[] {
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      const content = fs.readFileSync(REPORTS_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data.reports)) {
        return data.reports;
      }
    }
  } catch (err) {
    console.error('Error reading reports file:', err);
  }

  // Seed default report if none exists
  const initial = createNewReport();
  const payload = { reports: [initial], updated_at: new Date().toISOString() };
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  return [initial];
}

function saveAllReports(reports: ReportData[]): void {
  ensureDirectories();
  const payload = {
    reports,
    updated_at: new Date().toISOString(),
  };
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(payload, null, 2), 'utf-8');
}

// Staff helpers
function getStaffList(): { name: string; role: string }[] {
  try {
    if (fs.existsSync(STAFF_FILE)) {
      const data = JSON.parse(fs.readFileSync(STAFF_FILE, 'utf-8'));
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_STAFF_DIRECTORY;
}

function saveStaffList(staff: { name: string; role: string }[]): void {
  ensureDirectories();
  fs.writeFileSync(STAFF_FILE, JSON.stringify(staff, null, 2), 'utf-8');
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const reportId = req.params.id || 'general';
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    const targetDir = isPdf ? path.join(DOCS_DIR, reportId) : path.join(IMAGES_DIR, reportId);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    // Sanitize filename
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniquePrefix}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB per file
  },
});

async function startServer() {
  const app = express();

  // Basic middlewares
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Static uploads serving for images & PDFs (Accessible across all machines)
  app.use('/data/uploads', express.static(UPLOADS_DIR));
  app.use('/uploads', express.static(UPLOADS_DIR));

  // CORS headers for all /api endpoints
  app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-pin');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // --- API ROUTES ---

  // 1. PIN & AUTH
  app.get('/api/admin/pin', (req, res) => {
    const current = getCurrentPin();
    res.json({ success: true, ...current });
  });

  app.post('/api/admin/verify', (req, res) => {
    const inputPin = typeof req.body.pin === 'string' ? req.body.pin.trim() : '';
    const current = getCurrentPin();
    res.json({ success: true, valid: inputPin === current.pin });
  });

  app.post('/api/admin/pin', (req, res) => {
    const oldPin = typeof req.body.oldPin === 'string' ? req.body.oldPin.trim() : '';
    const newPin = typeof req.body.newPin === 'string' ? req.body.newPin.trim() : '';
    const current = getCurrentPin();

    if (oldPin !== current.pin) {
      return res.status(400).json({ success: false, message: 'Mã PIN cũ không chính xác. Bạn không có quyền đổi mã PIN.' });
    }
    if (newPin.length < 4) {
      return res.status(400).json({ success: false, message: 'Mã PIN mới phải từ 4 ký tự trở lên.' });
    }
    if (newPin === current.pin) {
      return res.status(400).json({ success: false, message: 'Mã PIN mới không được trùng với mã PIN hiện tại.' });
    }

    const saved = savePin(newPin);
    res.json({
      success: true,
      message: 'Đã đổi mã PIN Admin thành công và đồng bộ tới tất cả máy tính!',
      ...saved,
    });
  });

  // 2. REPORTS
  // GET all reports (USER + ADMIN can read)
  app.get('/api/reports', (req, res) => {
    const reports = getAllReports();
    res.json({ success: true, reports });
  });

  // GET single report with attachments (USER + ADMIN can read)
  app.get('/api/reports/:id', (req, res) => {
    const reports = getAllReports();
    const found = reports.find((r) => r.id === req.params.id);
    if (!found) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy biên bản' });
    }
    res.json({ success: true, report: found });
  });

  // POST save / create report
  app.post('/api/reports', (req, res) => {
    const isAdmin = isRequestAdmin(req);
    const body = req.body;

    if (Array.isArray(body.reports)) {
      // Bulk sync: requires admin if overwriting completed reports
      if (!isAdmin) {
        // Allow creating/saving non-completed reports
        const existing = getAllReports();
        const hasCompletedOverwrite = existing.some((r) => {
          if (r.status === 'completed') {
            const incoming = body.reports.find((b: ReportData) => b.id === r.id);
            return incoming && incoming.updated_at !== r.updated_at;
          }
          return false;
        });
        if (hasCompletedOverwrite) {
          return res.status(403).json({
            success: false,
            error: 'Biên bản đã hoàn tất và được khóa. Chỉ Quản trị viên (ADMIN) mới có quyền sửa hoặc ghi đè.',
          });
        }
      }
      saveAllReports(body.reports);
      return res.json({ success: true, updated_at: new Date().toISOString() });
    }

    // Single report save
    const reportToSave: ReportData = body.report || body;
    if (!reportToSave.id) {
      return res.status(400).json({ success: false, error: 'Dữ liệu biên bản thiếu ID' });
    }

    const reports = getAllReports();
    const existingIndex = reports.findIndex((r) => r.id === reportToSave.id);

    if (existingIndex >= 0) {
      const existing = reports[existingIndex];
      // If completed and not admin, reject!
      if (existing.status === 'completed' && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Biên bản này đã hoàn tất và được khóa an toàn. Quyền USER không được phép sửa đổi.',
        });
      }
      // Preserve attachments if client didn't supply them
      const updatedAttachments = reportToSave.attachments || existing.attachments || [];
      reports[existingIndex] = {
        ...reportToSave,
        attachments: updatedAttachments,
        updated_at: new Date().toISOString(),
      };
    } else {
      // New report creation (USER or ADMIN can create)
      reports.unshift({
        ...reportToSave,
        status: reportToSave.status || 'draft',
        attachments: reportToSave.attachments || [],
        created_at: reportToSave.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    saveAllReports(reports);
    res.json({ success: true, report: reports[existingIndex >= 0 ? existingIndex : 0] });
  });

  // PUT update single report
  app.put('/api/reports/:id', (req, res) => {
    const isAdmin = isRequestAdmin(req);
    const reportId = req.params.id;
    const incoming: Partial<ReportData> = req.body;

    const reports = getAllReports();
    const idx = reports.findIndex((r) => r.id === reportId);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy biên bản' });
    }

    const existing = reports[idx];
    if (existing.status === 'completed' && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Biên bản đã hoàn tất và được khóa an toàn. Chỉ Quản trị viên (ADMIN) mới có quyền chỉnh sửa.',
      });
    }

    // If changing status to completed, or opening, check permissions
    if (incoming.status && incoming.status !== existing.status && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Chỉ Quản trị viên (ADMIN) mới có quyền thay đổi trạng thái hoàn tất của biên bản.',
      });
    }

    reports[idx] = {
      ...existing,
      ...incoming,
      id: reportId, // enforce id
      attachments: incoming.attachments !== undefined ? incoming.attachments : existing.attachments,
      updated_at: new Date().toISOString(),
    };

    saveAllReports(reports);
    res.json({ success: true, report: reports[idx] });
  });

  // DELETE report (ADMIN ONLY)
  app.delete('/api/reports/:id', (req, res) => {
    if (!isRequestAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'Từ chối truy cập (403 Forbidden): Chỉ Quản trị viên (ADMIN) mới có quyền xóa biên bản.',
      });
    }

    const reportId = req.params.id;
    const reports = getAllReports();
    const filtered = reports.filter((r) => r.id !== reportId);
    saveAllReports(filtered);

    // Clean up upload folders
    try {
      const imgPath = path.join(IMAGES_DIR, reportId);
      const docPath = path.join(DOCS_DIR, reportId);
      if (fs.existsSync(imgPath)) fs.rmSync(imgPath, { recursive: true, force: true });
      if (fs.existsSync(docPath)) fs.rmSync(docPath, { recursive: true, force: true });
    } catch (e) {
      console.error('Error cleaning report upload folders:', e);
    }

    res.json({ success: true, message: 'Đã xóa biên bản thành công' });
  });

  // 3. ATTACHMENTS MANAGEMENT (Multi-file upload)
  app.post('/api/reports/:id/attachments', upload.array('files', 100), (req, res) => {
    const reportId = req.params.id;
    const reports = getAllReports();
    const reportIndex = reports.findIndex((r) => r.id === reportId);

    if (reportIndex === -1) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy biên bản để đính kèm tệp' });
    }

    const existingReport = reports[reportIndex];
    const isAdmin = isRequestAdmin(req);

    if (existingReport.status === 'completed' && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Biên bản đã hoàn tất. Chỉ Quản trị viên (ADMIN) mới có quyền tải thêm ảnh hoặc tài liệu.',
      });
    }

    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) {
      return res.status(400).json({ success: false, error: 'Không có tệp nào được tải lên' });
    }

    const targetType = (req.body.targetType || 'general_area') as AttachmentItem['targetType'];
    const targetItemId = req.body.targetItemId || '';
    const targetCategory = req.body.targetCategory || '';
    const plant = (req.body.plant || 'ialy') as 'ialy' | 'ialy_mr';
    const locationDescription = req.body.locationDescription || '';
    const manualDescription = req.body.description || '';
    const uploadedBy = req.body.uploadedBy || (isAdmin ? 'Quản trị viên (Admin)' : 'Cán bộ kiểm tra');

    const newAttachments: AttachmentItem[] = files.map((file) => {
      const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
      const subFolder = isPdf ? 'documents' : 'images';
      const storageRelPath = `uploads/${subFolder}/${reportId}/${file.filename}`;
      const fileUrl = `/data/${storageRelPath}`;

      // Auto-suggest description from filename if user didn't specify manual description
      let suggestedDesc = manualDescription;
      if (!suggestedDesc) {
        const nameWithoutExt = file.originalname.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        suggestedDesc = nameWithoutExt;
      }

      return {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        reportId,
        targetType,
        targetItemId: targetItemId || undefined,
        targetCategory: targetCategory || undefined,
        plant,
        locationDescription: locationDescription || undefined,
        fileType: isPdf ? 'pdf' : 'image',
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        storagePath: storageRelPath,
        url: fileUrl,
        thumbnailUrl: fileUrl,
        description: suggestedDesc,
        uploadedBy,
        createdAt: new Date().toISOString(),
      };
    });

    const currentAttachments = existingReport.attachments || [];
    existingReport.attachments = [...currentAttachments, ...newAttachments];
    existingReport.updated_at = new Date().toISOString();

    reports[reportIndex] = existingReport;
    saveAllReports(reports);

    res.json({
      success: true,
      message: `Đã tải lên thành công ${files.length} tệp đính kèm`,
      attachments: newAttachments,
      report: existingReport,
    });
  });

  // GET attachment file download
  app.get('/api/reports/:id/attachments/:attachmentId/download', (req, res) => {
    const { id, attachmentId } = req.params;
    const reports = getAllReports();
    const report = reports.find((r) => r.id === id);
    if (!report) return res.status(404).send('Không tìm thấy biên bản');

    const attachment = (report.attachments || []).find((a) => a.id === attachmentId);
    if (!attachment) return res.status(404).send('Không tìm thấy tệp đính kèm');

    const absPath = path.resolve(DATA_DIR, attachment.storagePath);
    if (!fs.existsSync(absPath)) {
      return res.status(404).send('Tệp không tồn tại trên máy chủ');
    }

    res.download(absPath, attachment.fileName);
  });

  // GET attachment direct stream/view
  app.get('/api/reports/:id/attachments/:attachmentId', (req, res) => {
    const { id, attachmentId } = req.params;
    const reports = getAllReports();
    const report = reports.find((r) => r.id === id);
    if (!report) return res.status(404).send('Không tìm thấy biên bản');

    const attachment = (report.attachments || []).find((a) => a.id === attachmentId);
    if (!attachment) return res.status(404).send('Không tìm thấy tệp đính kèm');

    const absPath = path.resolve(DATA_DIR, attachment.storagePath);
    if (!fs.existsSync(absPath)) {
      return res.status(404).send('Tệp không tồn tại trên máy chủ');
    }

    res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(absPath).pipe(res);
  });

  // PUT update attachment description or metadata
  app.put('/api/reports/:id/attachments/:attachmentId', (req, res) => {
    const { id, attachmentId } = req.params;
    const reports = getAllReports();
    const reportIndex = reports.findIndex((r) => r.id === id);
    if (reportIndex === -1) return res.status(404).json({ success: false, error: 'Không tìm thấy biên bản' });

    const report = reports[reportIndex];
    const isAdmin = isRequestAdmin(req);
    if (report.status === 'completed' && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Biên bản đã hoàn tất, không được phép chỉnh sửa' });
    }

    const attIndex = (report.attachments || []).findIndex((a) => a.id === attachmentId);
    if (attIndex === -1) return res.status(404).json({ success: false, error: 'Không tìm thấy tệp đính kèm' });

    const currentAtt = report.attachments![attIndex];
    const updatedAtt: AttachmentItem = {
      ...currentAtt,
      description: req.body.description !== undefined ? req.body.description : currentAtt.description,
      locationDescription: req.body.locationDescription !== undefined ? req.body.locationDescription : currentAtt.locationDescription,
      targetCategory: req.body.targetCategory !== undefined ? req.body.targetCategory : currentAtt.targetCategory,
      plant: req.body.plant !== undefined ? req.body.plant : currentAtt.plant,
      aiAnalysis: req.body.aiAnalysis !== undefined ? req.body.aiAnalysis : currentAtt.aiAnalysis,
    };

    report.attachments![attIndex] = updatedAtt;
    report.updated_at = new Date().toISOString();
    saveAllReports(reports);

    res.json({ success: true, attachment: updatedAtt, report });
  });

  // DELETE single attachment
  app.delete('/api/reports/:id/attachments/:attachmentId', (req, res) => {
    const { id, attachmentId } = req.params;
    const reports = getAllReports();
    const reportIndex = reports.findIndex((r) => r.id === id);
    if (reportIndex === -1) return res.status(404).json({ success: false, error: 'Không tìm thấy biên bản' });

    const report = reports[reportIndex];
    const isAdmin = isRequestAdmin(req);

    if (report.status === 'completed' && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Biên bản đã hoàn tất. Chỉ Quản trị viên (ADMIN) mới có quyền xóa tệp đính kèm.',
      });
    }

    const currentAttachments = report.attachments || [];
    const target = currentAttachments.find((a) => a.id === attachmentId);
    if (!target) return res.status(404).json({ success: false, error: 'Không tìm thấy tệp đính kèm cần xóa' });

    // Delete file from disk
    try {
      const absPath = path.resolve(DATA_DIR, target.storagePath);
      if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
    } catch (e) {
      console.error('Error unlinking file:', e);
    }

    report.attachments = currentAttachments.filter((a) => a.id !== attachmentId);
    report.updated_at = new Date().toISOString();
    saveAllReports(reports);

    res.json({ success: true, message: 'Đã xóa tệp đính kèm thành công', attachments: report.attachments });
  });

  // 4. AI VISION ANALYSIS
  app.post('/api/ai/analyze-inspection-image', async (req, res) => {
    try {
      const { imageBase64, mimeType, targetCategory, plant, locationDescription, userDescription, attachmentId, reportId } = req.body;

      let base64Data = imageBase64;
      let fileMime = mimeType || 'image/jpeg';

      // If attachmentId and reportId provided, read file directly from server disk!
      if (!base64Data && reportId && attachmentId) {
        const reports = getAllReports();
        const report = reports.find((r) => r.id === reportId);
        const att = (report?.attachments || []).find((a) => a.id === attachmentId);
        if (att) {
          const absPath = path.resolve(DATA_DIR, att.storagePath);
          if (fs.existsSync(absPath)) {
            const buffer = fs.readFileSync(absPath);
            base64Data = buffer.toString('base64');
            fileMime = att.mimeType || 'image/jpeg';
          }
        }
      }

      if (!base64Data) {
        return res.status(400).json({ success: false, error: 'Thiếu dữ liệu hình ảnh để phân tích' });
      }

      const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      const analysis = await analyzeInspectionImageWithGemini({
        imageBase64: cleanBase64,
        mimeType: fileMime,
        targetCategory,
        plant,
        locationDescription,
        userDescription,
      });

      // If attachmentId was provided, auto-save analysis to the attachment record!
      if (reportId && attachmentId && analysis.status === 'completed') {
        const reports = getAllReports();
        const repIdx = reports.findIndex((r) => r.id === reportId);
        if (repIdx !== -1) {
          const attIdx = (reports[repIdx].attachments || []).findIndex((a) => a.id === attachmentId);
          if (attIdx !== -1) {
            reports[repIdx].attachments![attIdx].aiAnalysis = analysis;
            reports[repIdx].updated_at = new Date().toISOString();
            saveAllReports(reports);
          }
        }
      }

      res.json({ success: true, analysis });
    } catch (err: any) {
      console.error('AI Analysis error:', err);
      res.status(500).json({ success: false, error: err.message || 'Lỗi phân tích AI' });
    }
  });

  // 5. STAFF DIRECTORY
  app.get('/api/staff', (req, res) => {
    const staff = getStaffList();
    res.json({ success: true, staff });
  });

  app.post('/api/staff', (req, res) => {
    if (Array.isArray(req.body.staff)) {
      saveStaffList(req.body.staff);
      return res.json({ success: true, staff: req.body.staff });
    }
    res.status(400).json({ success: false, error: 'Dữ liệu danh mục cán bộ không hợp lệ' });
  });

  // 6. BACKUP & RESTORE
  app.get('/api/backup', (req, res) => {
    const reports = getAllReports();
    const staff = getStaffList();
    const pin = getCurrentPin();
    res.json({
      success: true,
      exported_at: new Date().toISOString(),
      pin,
      staff,
      reports,
    });
  });

  app.post('/api/backup/restore', (req, res) => {
    if (!isRequestAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Chỉ Quản trị viên (ADMIN) mới có quyền phục hồi dữ liệu sao lưu.' });
    }

    const { reports, staff, pin } = req.body;
    if (Array.isArray(reports)) saveAllReports(reports);
    if (Array.isArray(staff)) saveStaffList(staff);
    if (pin && typeof pin.pin === 'string') savePin(pin.pin);

    res.json({ success: true, message: 'Phục hồi dữ liệu thành công' });
  });

  // --- VITE MIDDLEWARE / STATIC ASSETS ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PCCC Ialy Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
