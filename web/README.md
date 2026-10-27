# Jay Mataji Creation — web

Next.js 15 (App Router) + MySQL 8 + Prisma + Auth.js. Giao diện port từ `../templates/`
(CSS giữ nguyên trong `app/styles/`).

## Chạy lần đầu

```bash
# 1. Tạo database + user (mật khẩu đã sinh sẵn khớp với .env)
sudo mysql < setup-db.sql

# 2. Cài và tạo bảng + dữ liệu mẫu (16 sản phẩm, nội dung trang chủ, tài khoản admin)
npm install
npm run db:migrate
npm run db:seed

# 3. Chạy
npm run dev            # http://localhost:3000
```

Tài khoản admin lấy từ `ADMIN_EMAIL` / `ADMIN_PASSWORD` trong `.env`. Seed chạy lại nhiều lần không sao:
không ghi đè sản phẩm hay nội dung đã sửa.

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run db:migrate` | Tạo migration mới sau khi sửa `prisma/schema.prisma` |
| `npm run db:seed` | Nạp dữ liệu mẫu |
| `npm run db:studio` | Xem / sửa DB trên trình duyệt |
| `npm test` | Test nhỏ (`lib/*.test.ts`) |
| `npm run build && npm start` | Chạy production |

## Cấu trúc

```
app/(shop)/      trang có header + footer: home, shop, product, cart, wishlist, profile, orders, gallery, about, contact
app/(auth)/      login, signup + server actions
app/admin/       dashboard (mọi page/action phải gọi requireAdmin())
components/      Header, Footer, HeroCarousel, Rail, ProductCard, Intro, FX, Toaster
lib/             db, bag (giỏ + wishlist: cookie cho khách, DB khi đăng nhập), orders, pricing, content, format
prisma/          schema, migrations, seed
public/img/      ảnh, mỗi ảnh 3 cỡ: -960 / -1920 / -4k
```

## Production

- Đặt `AUTH_SECRET` mới (`openssl rand -base64 32`), mật khẩu DB và admin mới.
- Deploy: `npm ci && npx prisma migrate deploy && npm run build && npm start` sau Nginx.
- `AUTH_TRUST_HOST=true` khi chạy sau proxy của mình; hoặc đặt `AUTH_URL=https://domain`.

## CSS

`app/styles/style.css` + `luxe.css` là CSS chung của template. CSS riêng từng trang (`shop.css`, `cart.css`…)
được scope bằng class bọc ngoài (`.pg-shop .panel`) vì Next giữ CSS của trang cũ khi chuyển trang,
và nhiều template dùng trùng tên class (`.panel`, `.tabs`, `.two`) với định nghĩa khác nhau.
Trang mới: bọc nội dung trong `<div className="pg-ten-trang">` và prefix selector tương ứng.

## Thanh toán

| Cách | Cần gì | Trạng thái đơn |
|---|---|---|
| Cash on delivery | Không cần gì. Phí ₹40 dưới ₹2,999, tối đa ₹20,000 | `PENDING` → admin đánh dấu khi thu tiền |
| UPI (QR thật tới VPA của shop) | Điền UPI ID vào `SiteContent.payment` (giai đoạn 4 có màn hình admin) | khách nhập UTR → `AWAITING_CHECK` → admin đối chiếu sao kê |
| Thẻ / netbanking / ví | `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` | `PAID` sau khi server kiểm chữ ký |

- **Không bao giờ** nhận số thẻ trên trang của shop: thẻ/netbanking/ví nhập trong cửa sổ Razorpay.
- Razorpay dashboard: bật **auto-capture**; thêm webhook `https://<domain>/api/webhooks/razorpay`,
  sự kiện `payment.captured` + `order.paid`, secret = `RAZORPAY_WEBHOOK_SECRET`
  (để đơn vẫn được ghi nhận khi khách đóng tab ngay sau khi trả tiền).
- Đơn online chưa trả sau 24 giờ tự huỷ và trả hàng về kho.
- Tạm cấu hình UPI trước khi có màn hình admin: `npm run db:studio` → bảng `SiteContent` → thêm key `payment`,
  value `{"upiId":"tenban@okaxis","payee":"Jay Mataji Creation","codFee":40,"codMax":20000}`.

## Admin (`/admin`)

| Trang | Làm gì |
|---|---|
| Overview | Doanh thu, đơn đang mở, khách, sắp hết hàng, biểu đồ 7 ngày (giờ IST) |
| Orders | Lọc/tìm đơn, đổi trạng thái (huỷ → trả kho; khôi phục → trừ kho; COD giao xong → đã thu tiền), sửa địa chỉ, lịch sử |
| Payments | Cài UPI ID + phí/giới hạn COD, đối chiếu UTR, danh sách cần hoàn tiền, hoàn tiền Razorpay |
| Products | Thêm/sửa, upload ảnh (tự tạo 3 cỡ), sửa tồn kho tại bảng, ẩn/hiện, xoá |
| Customers | CRM: LTV, ghi chú + tag nội bộ, xuất CSV, sửa giỏ hàng giúp khách, cấp/thu quyền admin |
| Open bags | Giỏ đang mở / bỏ dở > 24h, nút email nhắc khách |
| Inbox / Reviews | Tin nhắn liên hệ; duyệt review trước khi hiện trên trang sản phẩm |
| Site content | Slide trang chủ, dòng chữ chạy, thông tin liên hệ ở footer |

- Quyền admin được kiểm lại trong DB mỗi request: thu quyền là có hiệu lực ngay.
- Ảnh upload nằm trong `uploads/` (đổi bằng `UPLOAD_DIR`): **sao lưu thư mục này cùng với database**.
- Dashboard tự refresh mỗi 20 giây.
