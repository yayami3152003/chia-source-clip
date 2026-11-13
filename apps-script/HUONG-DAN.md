# Cài "Chia Source Clip" bằng Google Apps Script (làm 1 lần, ~3 phút)

Miễn phí. Không cần Google Cloud, không cần Client ID, không cần thẻ.
Cài xong bạn có **một đường link**. Mỗi lần dùng: mở link → dán link thư mục Drive → bấm **Chia**.

## Bước 1: Tạo project

1. Mở **https://script.google.com** (đăng nhập đúng tài khoản Google có quyền Sửa các thư mục source).
2. Bấm **Dự án mới** (New project).
3. Bấm chữ **Dự án không có tiêu đề** ở góc trên trái → đổi tên thành `Chia Source Clip`.

## Bước 2: Dán code

1. Ở khung bên trái đang có file **Code.gs**. Xoá hết chữ trong đó, rồi dán toàn bộ nội dung file `Code.gs`.
2. Bấm dấu **+** cạnh chữ "Tệp" (Files) → chọn **HTML** → đặt tên đúng là `Index` (không gõ `.html`).
3. Xoá hết chữ trong file Index vừa tạo, dán toàn bộ nội dung file `Index.html`.
4. Bấm biểu tượng **Lưu** (hình đĩa) hoặc Ctrl+S.

## Bước 3: Deploy thành web app

1. Bấm nút xanh **Triển khai** (Deploy) góc trên phải → **Tùy chọn triển khai mới** (New deployment).
2. Bấm bánh răng cạnh "Chọn loại" → chọn **Ứng dụng web** (Web app).
3. Điền:
   - **Mô tả:** `Chia source`
   - **Thực thi với tư cách** (Execute as): **Người dùng truy cập ứng dụng web** (User accessing the web app)
   - **Ai có quyền truy cập** (Who has access): **Bất kỳ ai có Tài khoản Google** (Anyone with Google account)
4. Bấm **Triển khai** (Deploy).
5. Google hỏi cấp quyền → **Cho phép quyền truy cập** → chọn tài khoản →
   nếu hiện "Google chưa xác minh ứng dụng này": bấm **Nâng cao** (Advanced) → **Đi tới Chia Source Clip (không an toàn)** → **Cho phép**.
   (Đây là script của chính bạn nên Google cảnh báo vậy, không sao.)
6. Copy **URL ứng dụng web** (dạng `https://script.google.com/macros/s/…/exec`). **Đây là link của bạn**, lưu lại / ghim lên trình duyệt.

## Dùng hằng ngày

1. Mở link web app.
2. Dán link thư mục Drive chứa clip, ví dụ `https://drive.google.com/drive/folders/1qCK6PBV…`
3. Bấm **Chia**. Trang tự:
   - đọc giờ quay trong từng clip (chỉ đọc vài KB, không tải cả video),
   - xem hình từng clip bằng AI chạy trên máy bạn (lần đầu tải ~90 MB, các lần sau dùng lại),
   - chia theo **Ngày › Cảnh**, tạo thư mục `Ngày 1/01 Ăn uống`, `Ngày 1/02 Quán cà phê`… ngay trong thư mục đó,
   - chuyển clip vào, thêm file `_DANH-SACH-SOURCE.txt` cho editor.
4. Đổi tên cảnh ngay trên trang → thư mục trên Drive đổi theo.
5. Chia sai? Bấm **Hoàn tác**: clip về chỗ cũ, thư mục con vào Thùng rác.

## Chia sẻ cho người khác

Gửi họ link web app. Mỗi người dùng tài khoản Google của chính mình (cần quyền Sửa thư mục), lần đầu bấm Cho phép giống bước 3.5.

## Sửa code sau này

Dán code mới vào → Lưu → **Triển khai** → **Quản lý các tùy chọn triển khai** → bút chì → Phiên bản: **Phiên bản mới** → Triển khai. Link giữ nguyên.
