# giasuchillchill

Sổ tay cho gia sư: quản lý học sinh, lịch dạy theo tháng, theo dõi tiến độ học tập, thu nhập dự kiến và thông báo học phí kèm mã QR.

## Tính năng
- Đăng ký / đăng nhập tài khoản gia sư
- Học sinh: tên, lớp, nhiều môn, lịch học hằng tuần, giá riêng cho từng buổi
- Lịch dạy theo tháng: đánh dấu đã dạy / học sinh nghỉ / gia sư nghỉ, thêm buổi dạy bù
- Thu nhập dự kiến theo tháng
- Tiến độ học tập: bảng theo dõi (ngày, môn, % BTVN, nội dung, BTVN, lưu ý)
- Tính học phí theo tháng hoặc khoảng ngày, xuất thông báo kèm mã QR

## Cấu trúc
Toàn bộ web nằm trong một file `index.html` (HTML + CSS + JavaScript), không cần build.

## Backend: Supabase
- **Đăng nhập:** Supabase Auth (email + mật khẩu, xác nhận email, quên mật khẩu).
- **Database:** bảng `public.kv` trên Postgres (xem `supabase/schema.sql`). Mỗi dòng là một tài liệu JSON của một gia sư: hồ sơ, danh sách học sinh, dữ liệu từng tháng (buổi học, tiến độ).
- **Bảo mật:** bật Row Level Security, mỗi gia sư chỉ đọc/ghi được dữ liệu của chính mình.
- Khóa `anon` trong `index.html` là khóa công khai (được phép để ở frontend).

### Cấu hình bắt buộc sau khi deploy
Supabase Dashboard → **Authentication → URL Configuration**:
- **Site URL**: địa chỉ web trên Render, ví dụ `https://giasuchillchill.onrender.com`
- **Redirect URLs**: thêm `https://giasuchillchill.onrender.com/**`

Nếu không muốn bắt xác nhận email: **Authentication → Sign In / Providers → Email → tắt "Confirm email"**.

## Deploy lên Render (miễn phí)
1. Vào https://dashboard.render.com → **New** → **Static Site**
2. Chọn repository này
3. Build Command: để trống · Publish Directory: `.`
4. Bấm **Create Static Site**

Hoặc dùng **New → Blueprint** để Render đọc file `render.yaml` có sẵn.
