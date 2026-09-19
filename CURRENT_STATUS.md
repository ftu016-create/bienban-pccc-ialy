# CURRENT STATUS

# BIÊN BẢN TỰ KIỂM TRA PCCC&CNCH – VHIALY

> File này mô tả trạng thái hiện tại của source code.
>
> Đây không phải danh sách mong muốn.
>
> Khi code thay đổi, phải cập nhật file này.

---

# 1. THÔNG TIN SOURCE

Repository:

`ftu016-create/bienban-pccc-ialy`

Branch:

`main`

Ứng dụng hiện tại:

* React
* TypeScript
* Vite
* Express
* Node.js

Package scripts hiện tại:

* `npm run dev`
* `npm run build`
* `npm run start`
* `npm run preview`
* `npm run clean`
* `npm run lint`

`package.json` hiện có các thư viện phục vụ:

* React/UI
* Express/API
* Word generation
* PDF processing
* PDF rendering
* file upload
* Excel
* Google Gemini AI

---

# 2. SERVER HIỆN TẠI

File server chính:

`server.ts`

Server hiện dùng:

* Express
* Multer
* filesystem (`fs`)
* path
* Vite middleware trong development
* static serving cho uploads

Server hiện có khoảng 664 dòng code thực tế trong repository.

---

# 3. AUTH / ADMIN PIN

## Đã có

API:

`GET /api/admin/pin`

`POST /api/admin/verify`

`POST /api/admin/pin`

Chức năng hiện có:

* lấy PIN hiện tại;
* kiểm tra PIN;
* đổi PIN;
* yêu cầu PIN cũ;
* PIN mới tối thiểu 4 ký tự.

Server có hàm kiểm tra request Admin.

## Cần kiểm tra thêm

* Cơ chế lưu PIN production.
* Bảo mật PIN.
* Không để client tự giả mạo quyền Admin.
* Session/authentication thực sự trong production.
* Có cần thay PIN đơn giản bằng cơ chế authentication mạnh hơn hay không.

Không tự ý thay đổi nếu chưa có yêu cầu.

---

# 4. REPORTS

## Đã có

API:

`GET /api/reports`

`GET /api/reports/:id`

`POST /api/reports`

Có logic:

* lấy danh sách biên bản;
* lấy một biên bản;
* tạo/lưu biên bản;
* xử lý bulk sync;
* phân biệt request Admin trong một số thao tác.

Có logic xóa biên bản trong server.

## Cần tiếp tục kiểm tra

* toàn bộ model dữ liệu của report;
* các trường dữ liệu thực tế;
* chỉnh sửa report;
* trạng thái hoàn thành;
* logic lịch sử;
* khả năng lưu lâu dài trên production;
* đồng bộ database/cloud.

---

# 5. ATTACHMENTS

## Đã có

Có Multer.

Có upload nhiều file:

`POST /api/reports/:id/attachments`

Cho phép tối đa:

**100 file trong một request** theo route hiện tại.

Giới hạn:

**100 MB/file**

Server phân loại:

* PDF;
* image.

Có API tải file:

`GET /api/reports/:id/attachments/:attachmentId/download`

Có API xem/stream trực tiếp:

`GET /api/reports/:id/attachments/:attachmentId`

Metadata file có các thông tin như:

* fileName;
* fileSize;
* mimeType;
* storagePath;
* url;
* thumbnailUrl;
* fileType;
* createdAt;
* uploadedBy.

---

# 6. STORAGE HIỆN TẠI

## Đã có

Server đang lưu upload bằng:

`multer.diskStorage`

File được lưu trên filesystem của server.

Có thư mục riêng cho:

* images;
* documents;
* report.

Có static route:

`/data/uploads`

và

`/uploads`

để phục vụ file.

## CẢNH BÁO QUAN TRỌNG

Đây **chưa được coi là storage production hoàn chỉnh cho Vercel/serverless**.

Lý do:

filesystem của môi trường triển khai không nên được coi là nơi lưu trữ lâu dài.

## Việc cần làm

Chuyển production storage sang dịch vụ persistent/cloud storage phù hợp.

Phải đảm bảo:

* hình ảnh không mất;
* PDF không mất;
* file cũ vẫn truy cập được;
* URL không phụ thuộc máy tạo;
* deploy lại không xóa dữ liệu.

---

# 7. PDF

## Đã có trong project

Có package:

`pdf-lib`

Có:

`pdfjs-dist`

Có:

`jspdf`

Có:

`html2pdf.js`

Có:

`html2canvas`

## Đã xác nhận

Server có xử lý PDF upload.

## Chưa được đánh dấu hoàn thành

Chưa coi các yêu cầu sau là hoàn thành chỉ dựa vào package:

* ghép PDF biên bản + nhiều PDF đính kèm;
* giữ đúng thứ tự;
* tạo một PDF hoàn chỉnh;
* kiểm tra PDF kết quả trên thiết bị khác.

Phải kiểm tra implementation thực tế trước khi đánh dấu DONE.

---

# 8. WORD

## Đã có package

`docx`

## Chưa được đánh dấu hoàn thành

Cần xác nhận implementation thực tế:

* tạo `.docx`;
* bố cục A4;
* Times New Roman 13;
* lề 3/2/2/2 cm;
* bảng;
* hình;
* chữ ký;
* tiêu đề;
* tên file;
* phụ lục;
* PDF đính kèm nếu cần.

Không được coi là hoàn thành chỉ vì package `docx` có trong package.json.

---

# 9. HÌNH ẢNH

## Đã có

Server hỗ trợ upload image.

Image được lưu gắn với `reportId`.

Có URL để truy cập file.

## Mục tiêu cần kiểm tra

* preview;
* mô tả;
* sắp xếp;
* phụ lục;
* 4 ảnh/trang;
* 2 cột x 2 hàng;
* xuất Word;
* xuất PDF.

---

# 10. AI

## Đã có

API:

`POST /api/ai/analyze-inspection-image`

API nhận các thông tin liên quan đến:

* imageBase64;
* mimeType;
* targetCategory;
* plant;
* locationDescription;
* userDescription;
* attachmentId;
* reportId.

Có sử dụng Google GenAI.

## Lưu ý

AI chỉ là chức năng hỗ trợ.

Không để AI tự ý:

* xóa dữ liệu;
* thay đổi quyền;
* thay PIN;
* thay đổi cấu trúc report;
* ghi đè dữ liệu quan trọng;

nếu không có yêu cầu rõ ràng.

---

# 11. STAFF

## Đã có

`GET /api/staff`

`POST /api/staff`

Dữ liệu cán bộ hiện có dạng cơ bản:

* name;
* role.

## Cần kiểm tra

* quyền Admin;
* lưu production;
* đồng bộ giữa các máy.

---

# 12. BACKUP / RESTORE

## Đã có

`GET /api/backup`

`POST /api/backup/restore`

Backup hiện bao gồm:

* reports;
* staff;
* pin;
* exported_at.

Restore có kiểm tra Admin.

## Cần kiểm tra

Backup hiện tại mới là dữ liệu JSON.

Cần đánh giá thêm việc backup:

* hình ảnh;
* PDF;
* file Word;
* storage cloud.

Không được coi backup JSON là bản sao đầy đủ của toàn bộ hệ thống nếu file binary chưa được backup.

---

# 13. VERCEL

Repository có:

`vercel.json`

Build hiện tại trong package.json:

`vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`

Start:

`node dist/server.cjs`

## Cần xác nhận production

* server Express có tương thích hoàn toàn với cách Vercel deploy hiện tại hay không;
* filesystem upload có bị mất sau deployment/runtime hay không;
* API routes;
* static files;
* persistent storage;
* environment variables;
* build/start.

Không đánh dấu production READY chỉ vì build local thành công.

---

# 14. DATABASE

## Hiện trạng

Chưa coi dự án đã có database production đúng nghĩa.

Dữ liệu hiện đang được xử lý bằng filesystem/JSON trong server code.

## Mục tiêu

Chuyển dữ liệu quan trọng sang database persistent.

Dự kiến có thể cần các nhóm dữ liệu:

* users/admin;
* reports;
* report images;
* report attachments;
* staff;
* metadata.

Không tự ý chọn database mới nếu chưa phân tích kiến trúc hiện tại và yêu cầu triển khai.

---

# 15. ĐA THIẾT BỊ

## Yêu cầu

Báo cáo tạo trên máy A phải xem được trên:

* máy B;
* máy C;
* điện thoại.

Bao gồm:

* dữ liệu;
* hình;
* PDF;
* file xuất.

## Hiện trạng

API và URL file đã được thiết kế theo report ID thay vì chỉ lưu đường dẫn hiển thị local.

Tuy nhiên storage hiện vẫn là filesystem server.

Vì vậy:

**ĐA THIẾT BỊ VỀ MẶT URL/API CÓ NỀN TẢNG, NHƯNG PERSISTENT STORAGE PRODUCTION CHƯA HOÀN THÀNH.**

---

# 16. CÁC CHỨC NĂNG ĐÃ XÁC NHẬN CÓ TRONG SERVER

* Admin PIN.
* Verify PIN.
* Đổi PIN.
* Lấy danh sách reports.
* Lấy report theo ID.
* Tạo/lưu reports.
* Upload nhiều attachments.
* Download attachment.
* View/stream attachment.
* Staff API.
* Backup.
* Restore.
* AI image analysis.
* Static upload serving.
* Vite development middleware.
* Production static serving.

---

# 17. CÁC CHỨC NĂNG CHƯA ĐƯỢC COI LÀ HOÀN THÀNH

* Persistent cloud storage production.
* Production database.
* Hoàn chỉnh authentication/session.
* Ghép nhiều PDF vào PDF cuối cùng.
* Kiểm chứng Word giữ đúng mẫu gốc.
* Phụ lục 4 hình/trang.
* Đồng bộ hoàn chỉnh file giữa mọi thiết bị sau deployment.
* Backup binary files.
* Production hardening/security.
* Kiểm thử toàn bộ regression.

---

# 18. VIỆC TUYỆT ĐỐI KHÔNG ĐƯỢC LÀM

Không được:

* xóa `server.ts` chỉ để viết lại;
* xóa API đang hoạt động;
* thay toàn bộ frontend;
* thay framework;
* xóa chức năng backup;
* xóa chức năng attachments;
* xóa AI;
* xóa staff;
* xóa Admin PIN;
* đổi cấu trúc report mà không kiểm tra dữ liệu cũ.

---

# 19. TRẠNG THÁI TỔNG QUÁT

## PHẦN NỀN TẢNG

🟢 Đã có:

* React/Vite/TypeScript.
* Express server.
* API reports.
* Admin PIN.
* File upload.
* Staff.
* Backup/restore.
* AI API.

## PHẦN PRODUCTION

🟡 Cần hoàn thiện:

* database;
* cloud storage;
* authentication;
* persistence;
* Vercel architecture.

## PHẦN DOCUMENT EXPORT

🟡 Cần kiểm chứng/hoàn thiện:

* Word;
* PDF;
* ghép PDF;
* phụ lục hình;
* giữ mẫu gốc.

---

# 20. CÁCH CẬP NHẬT FILE NÀY

Sau mỗi thay đổi quan trọng:

1. Kiểm tra code.
2. Xác định chức năng mới.
3. Đánh dấu DONE chỉ khi đã kiểm tra.
4. Ghi rõ phần còn thiếu.
5. Ghi ngày cập nhật.
6. Không ghi thông tin bí mật.

Ngày cập nhật gần nhất:

`2026-09-19`
