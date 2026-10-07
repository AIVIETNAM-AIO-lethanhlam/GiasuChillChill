# giasuchillchill

Sổ tay cho gia sư: quản lý học sinh, lịch dạy theo tháng, theo dõi tiến độ học tập, thu nhập dự kiến và thông báo học phí kèm mã QR.

## Tính năng
- Đăng ký / đăng nhập tài khoản gia sư
- Học sinh: tên, lớp, nhiều môn, lịch học hằng tuần, giá riêng cho từng buổi
- Lịch dạy theo tháng: đánh dấu đã dạy / học sinh nghỉ / gia sư nghỉ, thêm buổi dạy bù
- Thu nhập dự kiến theo tháng
- Tiến độ học tập: bảng theo dõi (ngày, môn, % BTVN, nội dung, BTVN, lưu ý)
- Tính học phí theo tháng hoặc khoảng ngày, xuất thông báo kèm mã QR

## Cấu trúc thư mục
Web tĩnh, không cần build: mở `index.html` là chạy.

```
.
├── index.html            # Khung trang, nạp CSS và các file JS theo thứ tự
├── css/
│   └── styles.css        # Toàn bộ giao diện (màu, chữ, bố cục, chế độ tối, mobile)
├── js/
│   ├── config.js         # URL + khóa công khai của Supabase
│   ├── core/
│   │   ├── helpers.js    # Hàm tiện ích: DOM, ngày tháng, tiền tệ, icon, toast
│   │   ├── storage.js    # Đọc/ghi dữ liệu: Supabase, Claude hoặc localStorage
│   │   ├── auth.js       # Khóa dữ liệu, phiên đăng nhập (chế độ local)
│   │   ├── state.js      # Trạng thái ứng dụng, dữ liệu theo tháng
│   │   └── sessions.js   # Sinh buổi học từ lịch tuần, trạng thái, dạy bù
│   ├── ui/
│   │   ├── modal.js      # Hộp thoại
│   │   ├── auth-view.js  # Màn hình đăng nhập / đăng ký / quên mật khẩu
│   │   └── shell.js      # Khung app: menu, điều hướng
│   ├── views/
│   │   ├── home.js       # Tổng quan
│   │   ├── calendar.js   # Lịch dạy
│   │   ├── students.js   # Học sinh
│   │   ├── session.js    # Hộp thoại buổi học, dạy bù
│   │   ├── income.js     # Thu nhập
│   │   ├── progress.js   # Tiến độ học tập (bảng theo dõi)
│   │   ├── fee.js        # Học phí + thông báo kèm QR
│   │   └── settings.js   # Cài đặt, sao lưu
│   └── main.js           # Sự kiện chung + khởi động app (nạp cuối cùng)
├── supabase/
│   └── schema.sql        # Bảng dữ liệu + quy tắc bảo mật trên Supabase
└── render.yaml           # Cấu hình deploy Render (static site)
```

Các file JS là script thường (không dùng bundler), dùng chung phạm vi toàn cục nên **thứ tự `<script>` trong `index.html` phải giữ nguyên**: `config` → `core` → `ui` → `views` → `main`.

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
