# PROJECT MASTER SPEC

# DỰ ÁN BIÊN BẢN TỰ KIỂM TRA PCCC&CNCH – VHIALY

## 1. MỤC ĐÍCH CỦA FILE NÀY

Đây là tài liệu yêu cầu và nguyên tắc gốc của dự án.

Mọi AI hoặc lập trình viên tiếp tục phát triển dự án phải đọc file này trước khi sửa code.

Mục tiêu quan trọng nhất:

> PHÁT TRIỂN TIẾP TRÊN CODE HIỆN CÓ, KHÔNG TỰ Ý VIẾT LẠI DỰ ÁN TỪ ĐẦU.

Không được vì sửa một chức năng mà làm mất các chức năng đang hoạt động.

---

# 2. THÔNG TIN DỰ ÁN

Tên dự án:

**Biên bản tự kiểm tra PCCC&CNCH – VHIALY**

Repository:

`https://github.com/ftu016-create/bienban-pccc-ialy`

Repository owner:

`ftu016-create`

Repository:

`bienban-pccc-ialy`

Nhánh chính:

`main`

Mục tiêu triển khai:

* GitHub làm nơi quản lý source code.
* Vercel dùng để triển khai ứng dụng web.
* Ứng dụng phải sử dụng được trên nhiều máy tính và điện thoại.
* Dữ liệu và file người dùng tải lên phải có khả năng tồn tại lâu dài, không phụ thuộc vào filesystem tạm thời của môi trường server.

---

# 3. NGUYÊN TẮC QUAN TRỌNG NHẤT

## 3.1. Không "làm lại từ đầu"

Khi được yêu cầu sửa một chức năng:

1. Đọc code hiện tại.
2. Xác định chức năng hiện tại đang được thực hiện ở file nào.
3. Xác định dữ liệu liên quan.
4. Sửa tối thiểu phần cần thiết.
5. Không xóa code cũ nếu chưa xác định chắc chắn code đó không còn được sử dụng.
6. Kiểm tra lại các chức năng liên quan sau khi sửa.

Không được dùng cách:

> "Viết lại toàn bộ app cho sạch hơn."

trừ khi người dùng yêu cầu rõ ràng.

---

# 4. KIẾN TRÚC HIỆN TẠI

Dự án hiện tại là ứng dụng:

* React
* TypeScript
* Vite
* Express
* Node.js
* Vercel

Các thư viện hiện đang có trong package.json gồm những thành phần quan trọng:

* `react`
* `react-dom`
* `vite`
* `express`
* `docx`
* `pdf-lib`
* `pdfjs-dist`
* `html2pdf.js`
* `html2canvas`
* `jspdf`
* `multer`
* `xlsx`
* `@google/genai`
* `lucide-react`
* `motion`

Không tự ý thay đổi framework hoặc chuyển sang Flask/Python.

---

# 5. QUY TẮC VỀ SOURCE CODE

Source code hiện tại là cơ sở để xác định chức năng đang tồn tại.

Khi tài liệu và code mâu thuẫn:

* Không tự ý giả định.
* Không âm thầm xóa chức năng.
* Phải xác định sự khác nhau.
* Nếu cần thay đổi kiến trúc, phải thông báo rõ trước khi thực hiện.

Ưu tiên:

1. Code đang chạy thực tế.
2. Dữ liệu thực tế.
3. Yêu cầu trong PROJECT_MASTER_SPEC.md.
4. CURRENT_STATUS.md.
5. CONTINUE_PROMPT.md.

Nếu code hiện tại chưa đáp ứng một yêu cầu của MASTER SPEC thì phải ghi nhận là "chưa hoàn thành", không được ghi thành "đã có".

---

# 6. QUYỀN NGƯỜI DÙNG

Ứng dụng cần có hai mức quyền chính:

## ADMIN

Quản trị viên được phép:

* quản lý biên bản;
* chỉnh sửa dữ liệu;
* xóa biên bản;
* quản lý danh sách cán bộ;
* quản lý mã PIN Admin;
* quản lý file;
* backup;
* restore;
* thực hiện các chức năng quản trị khác.

## USER

Người dùng thông thường có thể:

* xem danh sách biên bản;
* xem nội dung biên bản;
* xem file đính kèm;
* tải file;
* sử dụng các chức năng được phép của ứng dụng.

Không được để USER có thể thực hiện các thao tác quản trị chỉ bằng cách sửa giao diện phía client.

Mọi thao tác quản trị quan trọng phải được kiểm tra ở server.

---

# 7. ADMIN PIN

Dự án hiện sử dụng cơ chế mã PIN Admin.

Các API hiện có gồm:

* `GET /api/admin/pin`
* `POST /api/admin/verify`
* `POST /api/admin/pin`

Mã PIN mới phải có tối thiểu 4 ký tự.

Việc đổi PIN phải yêu cầu PIN cũ.

Không đưa PIN thực tế vào tài liệu này.

Không đưa secret/API key vào GitHub.

---

# 8. QUẢN LÝ BIÊN BẢN

Biên bản phải có khả năng:

* tạo;
* lưu;
* xem;
* chỉnh sửa;
* xóa theo quyền;
* xem lịch sử;
* tải xuống;
* liên kết với hình ảnh;
* liên kết với file PDF/tệp đính kèm.

API hiện tại có:

* `GET /api/reports`
* `GET /api/reports/:id`
* `POST /api/reports`
* các API quản lý file liên quan.

Không được phá API hiện có nếu không cần thiết.

---

# 9. FILE ĐÍNH KÈM

Ứng dụng hiện có cơ chế upload nhiều file thông qua Multer.

File có thể là:

* hình ảnh;
* PDF/tài liệu.

Giới hạn upload hiện tại trong server là:

**100 MB/file**

Mỗi report có thể có nhiều file đính kèm.

File phải được gắn với đúng `reportId`.

Tên file gốc cần được giữ lại trong metadata để người dùng dễ nhận biết.

---

# 10. HÌNH ẢNH

Hình ảnh kiểm tra PCCC&CNCH là một phần quan trọng của biên bản.

Yêu cầu:

* upload được nhiều hình;
* hình thuộc đúng biên bản;
* hình có thể xem lại;
* hình phải truy cập được từ thiết bị khác;
* không được lưu bằng đường dẫn chỉ có trên máy người tạo báo cáo.

Khi xuất phụ lục hình ảnh:

* ưu tiên bố cục 4 hình/trang;
* bố cục 2 cột x 2 hàng;
* hình phải rõ;
* không làm biến dạng hình;
* giữ mô tả hình nếu dữ liệu có mô tả.

---

# 11. FILE PDF ĐÍNH KÈM

Người dùng có thể đính kèm một hoặc nhiều PDF.

Yêu cầu cuối cùng:

Khi xuất PDF hoàn chỉnh của biên bản:

1. PDF biên bản chính phải có đầy đủ nội dung.
2. Các PDF đính kèm phải được ghép vào sau phần biên bản chính.
3. Thứ tự file đính kèm phải được xác định rõ.
4. File gốc đính kèm không được bị thay đổi.
5. PDF kết quả phải có thể mở trên thiết bị khác.

Thư viện `pdf-lib` hiện có trong dự án có thể được sử dụng cho chức năng ghép PDF.

Không được giả định rằng chức năng ghép PDF đã hoàn thành chỉ vì package `pdf-lib` tồn tại.

Phải kiểm tra code thực tế.

---

# 12. WORD

Word là yêu cầu quan trọng của dự án.

Mục tiêu:

* xuất được file `.docx`;
* giữ bố cục giống mẫu gốc;
* nội dung tiếng Việt chính xác;
* không làm hỏng bảng;
* không làm mất hình ảnh;
* không dùng đường dẫn file local của máy người tạo.

Thư viện `docx` hiện có trong package.json.

Không được tự ý thay đổi định dạng Word chỉ để code dễ hơn.

---

# 13. TIÊU CHUẨN ĐỊNH DẠNG VĂN BẢN

Biên bản cần tuân thủ yêu cầu người dùng đã xác định:

* Khổ giấy A4.
* Font Times New Roman.
* Cỡ chữ chủ đạo 13.
* Lề trái: 3 cm.
* Lề trên: 2 cm.
* Lề dưới: 2 cm.
* Lề phải: 2 cm.

Nếu mẫu gốc có bố cục đặc biệt thì phải ưu tiên giữ bố cục của mẫu gốc.

Không được tự ý "làm đẹp" khiến văn bản khác mẫu chính thức.

---

# 14. TÊN FILE

Tên file xuất ra phải dựa trên tiêu đề/tên biên bản.

Không dùng tên tạm kiểu:

* `download.docx`
* `report.docx`
* `file1.pdf`

nếu người dùng đã có tiêu đề cụ thể.

Ví dụ:

`Biên bản tự kiểm tra PCCC&CNCH - Tháng 07-2026.docx`

Tên thực tế có thể được chuẩn hóa để tránh ký tự không hợp lệ trên hệ điều hành.

---

# 15. TRUY CẬP ĐA THIẾT BỊ

Đây là yêu cầu bắt buộc.

Một báo cáo được tạo trên máy A phải có thể:

* mở trên máy B;
* mở trên điện thoại;
* mở trên máy khác;
* xem hình ảnh;
* xem PDF;
* tải Word;
* tải PDF.

Không được phụ thuộc vào:

`C:\...`

`D:\...`

hoặc đường dẫn local của máy tạo báo cáo.

---

# 16. LƯU TRỮ CLOUD / VERCEL

Filesystem của server triển khai trên môi trường serverless không được coi là nơi lưu trữ lâu dài.

Đặc biệt không được thiết kế sản phẩm cuối cùng dựa vào giả định:

> file được ghi vào thư mục local của Vercel thì sẽ tồn tại vĩnh viễn.

Khi hoàn thiện production:

* dữ liệu cần database/cloud database phù hợp;
* hình ảnh cần persistent cloud storage;
* PDF cần persistent cloud storage;
* Word/file xuất cần persistent storage nếu cần lưu lịch sử.

Nếu chưa triển khai cloud storage thì phải ghi rõ:

**CHƯA HOÀN THÀNH PRODUCTION STORAGE**

Không được đánh dấu hoàn thành chỉ vì chạy được ở localhost.

---

# 17. BACKUP / RESTORE

Dự án hiện có:

* `GET /api/backup`
* `POST /api/backup/restore`

Backup phải có khả năng chứa dữ liệu cần thiết để phục hồi.

Restore phải được bảo vệ bởi quyền Admin.

Không được để người dùng thường phục hồi dữ liệu.

Không được coi backup JSON là giải pháp thay thế hoàn toàn cho cloud database/storage trong production.

---

# 18. DANH SÁCH CÁN BỘ

Dự án có API:

* `GET /api/staff`
* `POST /api/staff`

Danh sách cán bộ có các trường cơ bản:

* `name`
* `role`

Chức năng quản lý danh sách cán bộ phải được bảo vệ đúng quyền khi triển khai production.

---

# 19. AI

Dự án hiện có API liên quan đến AI:

`POST /api/ai/analyze-inspection-image`

Có sử dụng `@google/genai`.

AI có thể hỗ trợ phân tích hình ảnh kiểm tra.

Nhưng AI không được tự ý:

* thay đổi dữ liệu người dùng;
* xóa dữ liệu;
* thay đổi quyền;
* thay đổi PIN;
* thay đổi cấu trúc báo cáo

nếu không có yêu cầu rõ ràng.

API key phải được lưu bằng environment variable.

Không commit API key vào GitHub.

---

# 20. QUY TẮC SỬA CODE

Mỗi lần sửa code phải tuân thủ:

### Bước 1

Đọc code liên quan.

### Bước 2

Xác định chức năng hiện tại.

### Bước 3

Xác định chức năng nào có nguy cơ bị ảnh hưởng.

### Bước 4

Sửa tối thiểu.

### Bước 5

Chạy kiểm tra TypeScript/build.

### Bước 6

Kiểm tra chức năng vừa sửa.

### Bước 7

Kiểm tra lại các chức năng cũ liên quan.

### Bước 8

Cập nhật `CURRENT_STATUS.md` nếu trạng thái dự án thay đổi.

---

# 21. QUY TẮC "KHÔNG MẤT ĐẦU KHI SỬA ĐUÔI"

Đây là nguyên tắc bắt buộc.

Ví dụ:

Nếu người dùng yêu cầu:

> "Sửa phần xuất PDF"

thì không được:

* xóa lịch sử;
* xóa chức năng Word;
* xóa upload hình;
* xóa PDF đính kèm;
* thay đổi giao diện không liên quan;
* thay đổi quyền Admin/User;

trừ khi thực sự cần thiết và đã được xác nhận.

Nếu sửa một phần có ảnh hưởng dây chuyền, phải nói rõ.

---

# 22. KIỂM TRA TRƯỚC KHI KẾT THÚC MỘT THAY ĐỔI

Tối thiểu phải kiểm tra:

* app khởi động;
* frontend build;
* TypeScript không có lỗi mới;
* API liên quan hoạt động;
* tạo/xem biên bản;
* file cũ vẫn mở;
* hình cũ vẫn xem được;
* PDF cũ vẫn xem được;
* quyền Admin/User không bị sai;
* chức năng đang sửa hoạt động.

---

# 23. KHÔNG TỰ Ý ĐỔI KIẾN TRÚC

Không tự ý:

* đổi React sang framework khác;
* đổi Express sang framework khác;
* đổi Vite;
* đổi TypeScript sang JavaScript;
* xóa server.ts;
* xóa API cũ;
* thay toàn bộ cơ chế lưu trữ;

chỉ vì có cách khác "đẹp hơn".

Nếu cần thay đổi kiến trúc để đáp ứng Vercel production thì phải:

1. xác định vấn đề;
2. giải thích;
3. đưa phương án;
4. bảo toàn dữ liệu;
5. triển khai từng bước.

---

# 24. MỤC TIÊU CUỐI CÙNG

Ứng dụng hoàn chỉnh phải đáp ứng:

* tạo biên bản PCCC&CNCH;
* quản lý lịch sử;
* Admin quản lý;
* User xem/tải theo quyền;
* upload hình;
* upload nhiều PDF;
* xem file trên thiết bị khác;
* xuất Word;
* xuất PDF;
* ghép PDF đính kèm;
* giữ đúng định dạng văn bản;
* dữ liệu cloud/persistent;
* không mất dữ liệu khi triển khai lại;
* có backup/restore;
* hoạt động ổn định trên Vercel hoặc kiến trúc production phù hợp.

---

# 25. NGUYÊN TẮC CUỐI CÙNG CHO AI

Nếu chưa hiểu code hiện tại:

**KHÔNG ĐƯỢC ĐOÁN.**

Nếu chưa biết một chức năng đã có hay chưa:

**KIỂM TRA SOURCE CODE.**

Nếu yêu cầu mới có thể phá chức năng cũ:

**DỪNG VÀ PHÂN TÍCH ẢNH HƯỞNG TRƯỚC.**

Nếu một chức năng chưa hoàn thành:

**GHI RÕ CHƯA HOÀN THÀNH.**

Không được báo:

> "Đã hoàn thành"

chỉ vì code đã được viết.

Chỉ coi là hoàn thành sau khi có kiểm tra thực tế.

---

# 26. TÀI LIỆU LIÊN QUAN

AI tiếp tục dự án phải đọc:

1. `PROJECT_MASTER_SPEC.md`
2. `CURRENT_STATUS.md`
3. `CONTINUE_PROMPT.md`
4. Source code hiện tại

Sau mỗi thay đổi lớn, cập nhật `CURRENT_STATUS.md`.
