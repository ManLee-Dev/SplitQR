# SplitQR 💸

SplitQR là web app mobile-first giúp chia tiền nhóm và tạo sẵn mã VietQR cho từng thành viên. Mỗi người chỉ cần quét mã bằng app ngân hàng, hệ thống sẽ tự điền số tiền, tài khoản nhận và nội dung chuyển khoản.

## Tính năng
- Lưu thông tin tài khoản nhận tiền trên trình duyệt bằng LocalStorage
- Chia đều hoặc chia theo món, hỗ trợ phí VAT / ship chia đều
- Tạo mã VietQR động theo chuẩn EMVCo/NAPAS ngay trên frontend
- Sao chép tóm tắt để gửi qua Zalo / Telegram
- Tải ảnh summary PNG kèm QR của từng người
- Đánh dấu ai đã trả tiền
- Giao diện thân thiện trên mobile, dễ sử dụng

## Cài đặt và chạy local
```bash
npm install
npm run dev
```

Mở địa chỉ hiển thị trong terminal, ví dụ: http://localhost:4173/

## Build production
```bash
npm run build
```

## Preview production build
```bash
npm run preview
```

## Công nghệ sử dụng
- Vite
- Vanilla JavaScript modules
- CSS module-based styling
- qrcode-generator

## Cấu trúc dự án
```text
.
├── index.html
├── src/
│   ├── main.js
│   ├── styles.css
│   ├── lib/
│   │   ├── banks.js
│   │   ├── calculator.js
│   │   ├── format.js
│   │   └── qr.js
├── package.json
├── vite.config.js
├── .gitignore
└── README.md
```

## Hướng phát triển
- OCR hóa đơn để tạo món tự động
- Chia tiền theo tỷ lệ % thay vì chia đều
- Lưu lịch sử các lần chia tiền
- Tạo link nhóm cho nhiều người cùng theo dõi

## Giấy phép
MIT
