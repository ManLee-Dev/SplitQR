# SplitQR 💸

Web App mobile-first giúp chia tiền nhóm và tạo sẵn mã **VietQR** riêng cho từng thành viên. Người chuyển chỉ cần quét QR bằng app ngân hàng: số tiền, tài khoản người nhận và nội dung chuyển khoản được điền sẵn.

## Tính năng
- Lưu thông tin tài khoản nhận tiền vào LocalStorage
- Chia đều hoặc chia theo món (kèm phí VAT/ship chia đều)
- Mã VietQR động (chuẩn EMVCo/NAPAS) tạo ngay trên trình duyệt, không cần backend
- Sao chép tóm tắt để gửi Zalo/Telegram, tải ảnh summary PNG kèm QR của mọi người
- Đánh dấu ai đã trả tiền
- Hỗ trợ dark mode

## Chạy thử
Mở `index.html` bằng trình duyệt, hoặc chạy server tĩnh:

```bash
python3 -m http.server 8000
```

## Deploy lên GitHub Pages
1. Đẩy repo lên GitHub
2. Vào **Settings → Pages**
3. Chọn **Deploy from a branch**, branch `main`, thư mục `/ (root)`
4. Sau ít phút, app chạy tại `https://<tên-user>.github.io/splitqr/`

## Công nghệ
HTML/CSS/JavaScript thuần, một file duy nhất. Thư viện [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) tải từ cdnjs.

## Hướng phát triển
- Chụp hóa đơn và nhận dạng món (OCR)
- Chia VAT theo tỷ lệ giá trị món
- Lưu lịch sử các lần chia tiền
- Chia sẻ link nhóm (cần backend)

## Giấy phép
MIT
