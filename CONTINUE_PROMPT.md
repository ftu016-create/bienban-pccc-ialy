# CONTINUE PROMPT

# TIẾP TỤC DỰ ÁN BIÊN BẢN PCCC&CNCH – VHIALY

Bạn đang tiếp tục một dự án ĐÃ CÓ SOURCE CODE.

KHÔNG coi đây là dự án mới.

Repository:

`https://github.com/ftu016-create/bienban-pccc-ialy`

Branch:

`main`

---

# 1. VIỆC ĐẦU TIÊN BẮT BUỘC

Trước khi sửa bất kỳ code nào, hãy đọc:

1. `PROJECT_MASTER_SPEC.md`
2. `CURRENT_STATUS.md`
3. `CONTINUE_PROMPT.md`

Sau đó đọc source code thực tế trong repository.

Không được chỉ đọc CONTINUE_PROMPT rồi đoán code.

---

# 2. NGUYÊN TẮC QUAN TRỌNG NHẤT

Dự án đã được phát triển trước đó.

KHÔNG được xây dựng lại từ đầu.

KHÔNG được tự ý thay framework.

KHÔNG được tự ý xóa chức năng cũ.

KHÔNG được viết lại toàn bộ ứng dụng chỉ để sửa một lỗi.

Nguyên tắc:

> SỬA ĐÚNG CHỖ – GIỮ NGUYÊN PHẦN ĐANG CHẠY – KIỂM TRA LẠI SAU KHI SỬA.

---

# 3. CÂU "KHÔNG LÀM MẤT ĐẦU KHI SỬA ĐUÔI"

Nếu tôi yêu cầu sửa một chức năng cụ thể, hãy:

1. Xác định file liên quan.
2. Đọc code hiện tại.
3. Xác định chức năng phụ thuộc.
4. Sửa tối thiểu.
5. Không xóa code không liên quan.
6. Kiểm tra build.
7. Kiểm tra chức năng mới.
8. Kiểm tra các chức năng cũ có liên quan.

Ví dụ:

Nếu tôi yêu cầu sửa PDF:

KHÔNG được làm mất:

* Word;
* report history;
* image upload;
* PDF attachments;
* Admin;
* Staff;
* Backup;
* AI.

---

# 4. TRƯỚC KHI CODE

Trước tiên hãy trả lời tôi bằng 4 phần:

## A. Hiện trạng

Bạn đã đọc:

* PROJECT_MASTER_SPEC.md chưa?
* CURRENT_STATUS.md chưa?
* Source code liên quan chưa?

## B. Chức năng liên quan

Nêu chính xác:

* file nào;
* component nào;
* API nào;
* dữ liệu nào.

## C. Ảnh hưởng

Nêu những chức năng có thể bị ảnh hưởng.

## D. Kế hoạch sửa

Đưa ra kế hoạch ngắn gọn.

CHƯA sửa code ngay nếu yêu cầu chưa rõ.

---

# 5. SOURCE CODE HIỆN TẠI

Ứng dụng hiện dùng:

* React
* TypeScript
* Vite
* Express
* Node.js

Server chính:

`server.ts`

Không được chuyển sang Flask/Python.

---

# 6. CÁC CHỨC NĂNG HIỆN CÓ CẦN BẢO VỆ

Server hiện đã có các nhóm chức năng:

## Admin

* `/api/admin/pin`
* `/api/admin/verify`
* `/api/admin/pin`

## Reports

* `/api/reports`
* `/api/reports/:id`
* `/api/reports`

## Attachments

* upload nhiều file;
* download;
* view/stream.

## Staff

* `/api/staff`

## Backup

* `/api/backup`
* `/api/backup/restore`

## AI

* `/api/ai/analyze-inspection-image`

Khi sửa code phải kiểm tra các API liên quan.

---

# 7. STORAGE – ĐIỂM CẦN ĐẶC BIỆT LƯU Ý

Source hiện tại đang sử dụng filesystem server để lưu file upload.

Điều này có thể chạy trong môi trường development/local.

Nhưng không được mặc định coi filesystem của Vercel là storage lâu dài.

Mục tiêu production là:

* database persistent;
* cloud file storage;
* file truy cập được trên nhiều thiết bị;
* deployment không làm mất file cũ.

Nếu được yêu cầu làm phần storage:

KHÔNG xóa dữ liệu cũ.

Phải có kế hoạch migration.

---

# 8. WORD / PDF

Khi sửa phần xuất Word/PDF:

Phải bảo vệ:

* bố cục mẫu;
* A4;
* Times New Roman;
* cỡ chữ;
* lề;
* bảng;
* hình;
* chữ ký;
* tên file.

Không được chỉ tập trung vào "xuất được file" mà làm sai mẫu văn bản.

Nếu yêu cầu ghép PDF:

* PDF biên bản là phần chính;
* PDF đính kèm nối phía sau;
* giữ nguyên file gốc;
* thứ tự phải rõ;
* PDF cuối cùng phải mở được trên thiết bị khác.

---

# 9. HÌNH ẢNH

Hình ảnh là dữ liệu của biên bản.

Không được:

* lưu đường dẫn local của máy người dùng;
* tạo URL chỉ dùng được trên máy tạo;
* làm mất hình cũ khi cập nhật report.

Mục tiêu phụ lục:

* 4 hình/trang;
* 2 cột;
* 2 hàng;
* rõ ràng;
* không méo hình.

---

# 10. DỮ LIỆU CŨ

Nếu thay đổi model dữ liệu:

* phải tương thích dữ liệu cũ;
* hoặc viết migration;
* hoặc có phương án chuyển đổi;
* không được âm thầm xóa dữ liệu.

Không được test bằng cách xóa toàn bộ dữ liệu thật.

---

# 11. ADMIN / USER

Không chỉ bảo vệ bằng giao diện.

Nếu API là chức năng Admin:

server phải kiểm tra quyền.

Không được làm kiểu:

```text
Ẩn nút Admin
=
Đã bảo mật
```

---

# 12. API KEY / SECRET

Không đưa:

* GEMINI_API_KEY;
* PIN thật;
* token;
* password;
* secret;

vào source code hoặc tài liệu.

Sử dụng environment variables.

Không commit `.env` chứa secret.

---

# 13. KHI GẶP LỖI

Không sửa ngẫu nhiên.

Thực hiện:

1. đọc error;
2. xác định file;
3. xác định dòng;
4. xác định nguyên nhân;
5. sửa nguyên nhân;
6. build lại;
7. test lại.

Không chữa lỗi bằng cách xóa chức năng.

---

# 14. KHI MUỐN THAY ĐỔI KIẾN TRÚC

Nếu thấy kiến trúc hiện tại không phù hợp production:

Không tự ý rewrite.

Hãy báo:

### Vấn đề hiện tại

...

### Ảnh hưởng

...

### Phương án đề xuất

...

### Dữ liệu cần bảo vệ

...

### Cách migration

...

Sau khi có sự đồng ý mới triển khai thay đổi lớn.

---

# 15. SAU MỖI LẦN SỬA

Bắt buộc:

* kiểm tra TypeScript;
* kiểm tra build;
* kiểm tra API liên quan;
* kiểm tra chức năng mới;
* kiểm tra chức năng cũ liên quan.

Nếu không thể chạy một kiểm tra nào đó:

Nói rõ:

`CHƯA KIỂM TRA ĐƯỢC`

Không được nói:

`ĐÃ HOÀN THÀNH`

nếu chưa xác minh.

---

# 16. CẬP NHẬT CURRENT_STATUS

Sau khi hoàn thành thay đổi đáng kể:

Cập nhật:

`CURRENT_STATUS.md`

Ghi:

* đã làm gì;
* file nào thay đổi;
* API nào thay đổi;
* chức năng nào đã hoàn thành;
* chức năng nào còn thiếu;
* vấn đề còn tồn tại.

---

# 17. QUY TẮC KHI TIẾP TỤC SAU KHI CHAT CŨ HẾT

Nếu đây là một chat mới sau khi chat trước đã hết giới hạn:

KHÔNG hỏi tôi xây lại dự án từ đầu.

Hãy:

1. Đọc GitHub repository.
2. Đọc `PROJECT_MASTER_SPEC.md`.
3. Đọc `CURRENT_STATUS.md`.
4. Đọc source code.
5. Xác định trạng thái hiện tại.
6. Tiếp tục từ trạng thái đó.

---

# 18. NẾU CÓ MÂU THUẪN

Nếu:

`CURRENT_STATUS.md`

nói một chức năng đã có nhưng source code không có:

=> kiểm tra source code và báo mâu thuẫn.

Nếu:

`PROJECT_MASTER_SPEC.md`

yêu cầu một chức năng nhưng source code chưa có:

=> ghi:

`YÊU CẦU CÓ – CHƯA IMPLEMENT`

Không được giả vờ rằng chức năng đã hoàn thành.

---

# 19. CÁCH TRẢ LỜI KHI TÔI YÊU CẦU SỬA

Ưu tiên trả lời ngắn gọn:

### Đã xác định

...

### Sẽ sửa

...

### Không ảnh hưởng

...

### Cần kiểm tra

...

Sau đó mới thực hiện thay đổi.

---

# 20. MỤC TIÊU CUỐI CÙNG

Đưa dự án từ source hiện tại đến một ứng dụng PCCC&CNCH production ổn định:

* tạo biên bản;
* quản lý lịch sử;
* Admin;
* User;
* hình ảnh;
* PDF;
* Word;
* PDF đính kèm;
* phụ lục hình;
* database;
* cloud storage;
* backup;
* restore;
* đa thiết bị;
* Vercel production.

Nhưng:

> KHÔNG được đạt mục tiêu mới bằng cách phá chức năng cũ.

---

# 21. CÂU LỆNH KHỞI ĐỘNG CHO CHAT MỚI

Sau khi đọc toàn bộ tài liệu, hãy trả lời:

> "Tôi đã đọc PROJECT_MASTER_SPEC.md, CURRENT_STATUS.md và source code hiện tại. Tôi sẽ tiếp tục trên code hiện có, không xây dựng lại từ đầu và sẽ bảo vệ các chức năng đang hoạt động."

Sau đó chờ yêu cầu công việc tiếp theo.
