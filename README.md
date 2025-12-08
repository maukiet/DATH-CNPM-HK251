# 🚗 BKGENESIS – Website Mua Bán Xe Ô Tô

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-v5.x-000000?logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-v8.x-4479A1?logo=mysql&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-v5.3-7952B3?logo=bootstrap&logoColor=white)

**BKGENESIS** là một sàn giao dịch xe ô tô trực tuyến được phát triển như một đồ án Công nghệ Phần mềm.
Ứng dụng cho phép người dùng đăng ký, đăng nhập (bao gồm OAuth Google/Facebook), đăng tin bán xe, nhắn tin với người bán, quản lý xe yêu thích, và đặt cọc qua PayPal.

---

## 📋 Mục Lục

- [Tính năng chính](#-tính-năng-chính)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Hướng dẫn cài đặt](#-hướng-dẫn-cài-đặt)
- [Cấu hình](#-cấu-hình)
- [Chạy ứng dụng](#-chạy-ứng-dụng)
- [Tài khoản demo](#-tài-khoản-demo)
- [Các trang chính](#-các-trang-chính)
- [Thành viên nhóm](#-thành-viên-nhóm)

---

## ✨ Tính Năng Chính

### 👤 Quản lý người dùng
- Đăng ký / Đăng nhập với email & mật khẩu
- Đăng nhập qua Google / Facebook OAuth
- Quên mật khẩu & reset qua email
- Chỉnh sửa thông tin cá nhân

### 🚘 Quản lý xe
- Xem danh sách xe với phân trang (12 xe/trang)
- Tìm kiếm xe theo tên/hãng
- Lọc theo hãng xe
- Sắp xếp theo năm mới nhất, cũ nhất, giá tăng/giảm
- Xem chi tiết từng xe

### 💼 Dành cho Seller
- Đăng tin bán xe mới (upload ảnh hoặc URL)
- Quản lý danh sách xe đang bán
- Xóa / Gia hạn bài đăng

### ❤️ Yêu thích & Tin nhắn
- Thêm xe vào danh sách yêu thích
- Nhắn tin trực tiếp với người bán
- Giao diện chat theo từng xe

### 💳 Thanh toán
- Đặt cọc qua PayPal Sandbox ($100)

### 🔐 Quản trị (Admin)
- Quản lý danh sách người dùng
- Duyệt / Quản lý bài đăng xe
- Thống kê xe theo hãng (Chart.js)

### 🌓 Giao diện
- Hỗ trợ Dark Mode / Light Mode
- Responsive trên mọi thiết bị
- Thiết kế hiện đại với Bootstrap 5

---

## 🛠 Công Nghệ Sử Dụng

| Thành phần | Công nghệ |
|------------|-----------|
| **Backend** | Node.js, Express.js v5 |
| **Database** | MySQL 8.x |
| **View Engine** | EJS |
| **CSS Framework** | Bootstrap 5.3, Font Awesome 6 |
| **Authentication** | bcryptjs, Passport.js (Google, Facebook OAuth) |
| **Session** | express-session |
| **Payment** | PayPal REST SDK (Sandbox) |
| **Email** | Nodemailer |
| **File Upload** | Multer |

---

## 📁 Cấu Trúc Thư Mục

```
bkgenesis/
├── config/
│   ├── database.js          # Kết nối MySQL
│   ├── passport.js          # Cấu hình OAuth
│   └── paypal.js            # Cấu hình PayPal
├── controllers/
│   ├── adminController.js   # Quản trị user & xe
│   ├── authController.js    # Đăng nhập/đăng ký/OAuth
│   ├── carController.js     # Trang chủ & chi tiết xe
│   ├── infoController.js    # Trang tin tức, about
│   ├── messageController.js # Chat/tin nhắn
│   ├── paymentController.js # Thanh toán PayPal
│   ├── profileController.js # Hồ sơ người dùng
│   ├── sellerController.js  # Quản lý xe của seller
│   └── wishlistController.js# Xe yêu thích
├── public/
│   ├── css/style.css        # CSS tùy chỉnh + dark mode
│   └── images/              # Hình ảnh xe
├── routes/
│   └── index.js             # Định nghĩa tất cả routes
├── views/
│   ├── partials/
│   │   ├── header.ejs       # Header + navbar + theme toggle
│   │   └── footer.ejs       # Footer
│   ├── index.ejs            # Trang chủ
│   ├── car-detail.ejs       # Chi tiết xe
│   ├── login.ejs            # Đăng nhập
│   ├── register.ejs         # Đăng ký
│   ├── profile.ejs          # Hồ sơ cá nhân
│   ├── wishlist.ejs         # Xe yêu thích
│   ├── messages.ejs         # Tin nhắn
│   ├── seller-cars.ejs      # Xe đang bán (seller)
│   ├── seller-car-new.ejs   # Đăng xe mới
│   ├── admin-users.ejs      # Quản lý user (admin)
│   ├── admin-cars.ejs       # Quản lý xe (admin)
│   └── ...
├── .env                     # Biến môi trường (không commit)
├── .env.example             # Mẫu file .env
├── app.js                   # Entry point của ứng dụng
├── database.sql             # Script tạo database & data mẫu
├── package.json             # Dependencies
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt

### Yêu cầu hệ thống
- **Node.js** >= 18.x
- **MySQL** >= 8.x
- **npm** >= 9.x

### Bước 1: Clone dự án
```bash
git clone https://github.com/your-repo/bkgenesis.git
cd bkgenesis
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Tạo database
```bash
# Đăng nhập MySQL
mysql -u root -p

# Chạy script tạo DB
source database.sql
```

### Bước 4: Cấu hình môi trường
```bash
# Copy file mẫu
cp .env.example .env

# Chỉnh sửa .env với thông tin của bạn
```

---

## ⚙ Cấu Hình

Tạo file `.env` với nội dung sau:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bkgenesis_db

# Session
SESSION_SECRET=your_secret_key

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Facebook OAuth (optional)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/facebook/callback

# PayPal Sandbox (optional)
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Email (optional - for password reset)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## ▶ Chạy Ứng Dụng

```bash
# Chạy server
node app.js

# Hoặc với nodemon (auto-reload)
npx nodemon app.js
```

Truy cập: **http://localhost:3000**

---

## 👥 Tài Khoản Demo

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@bk.com | 123456 |
| **Seller 1** | seller@bk.com | 123456 |
| **Seller 2** | seller2@bk.com | 123456 |
| **Customer** | customer@bk.com | 123456 |

---

## 📄 Các Trang Chính

| Đường dẫn | Mô tả |
|-----------|-------|
| `/` | Trang chủ - Danh sách xe |
| `/cars/:id` | Chi tiết xe |
| `/auth/login` | Đăng nhập |
| `/auth/register` | Đăng ký |
| `/profile` | Hồ sơ cá nhân |
| `/wishlist` | Xe yêu thích |
| `/messages` | Tin nhắn |
| `/seller/cars` | Xe đang bán (Seller) |
| `/seller/cars/new` | Đăng xe mới (Seller) |
| `/admin/users` | Quản lý user (Admin) |
| `/admin/cars` | Quản lý xe (Admin) |
| `/news` | Tin tức xe |
| `/about` | Về chúng tôi |

---

## 👨‍💻 Thành Viên Nhóm

| Họ và Tên | MSSV | Vai trò |
|-----------|------|---------|
| Nguyễn Trường Giang | 2310829 | Backend Developer |
| Trần Quốc Hiền | 2310992 | Frontend Developer |
| Mau Gia Kiệt | 2311770 | Database Design |
| Nguyễn Anh Tú | 1915811 | Testing & Documentation |

---

## 📝 License

Dự án này được phát triển phục vụ mục đích học tập tại **Đại học Bách Khoa TP.HCM (HCMUT)**.

---

<p align="center">
  Made with ❤️ by <strong>HCMUT - CSE Team</strong>
</p>