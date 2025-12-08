const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const flash = require('connect-flash');
const mainRoutes = require('./routes/index');
require('dotenv').config();
const passport = require('./config/passport');

const app = express();

/**
 * Khi chạy sau proxy (ngrok, render, nginx, ...),
 * nên bật trust proxy để Express hiểu đúng scheme (http/https).
 */
app.set('trust proxy', 1);

// --- 1. Cấu hình Middleware ---
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- 2. Cấu hình Session ---
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'bkgenesis_secret_key_12345',
    resave: false,
    saveUninitialized: false,
    cookie: {
      // Chỉ cho JS phía client đọc cookie → tăng bảo mật
      httpOnly: true,
      /**
       * ĐỂ FALSE khi đang test trên localhost + ngrok
       * Sau này deploy HTTPS thật có thể chuyển thành true.
       */
      secure: false,
      /**
       * Lax: cho phép gửi cookie trong các request điều hướng top-level
       * (như sau khi Google/Facebook redirect về) → cần cho OAuth.
       */
      sameSite: 'lax',
      // Thời gian sống của session: 15 phút
      maxAge: 1000 * 60 * 15
    }
  })
);

// Passport (OAuth)
app.use(passport.initialize());
app.use(passport.session());

// --- 3. Cấu hình Flash Messages ---
app.use(flash());

// --- 4. Middleware Toàn Cục (Giúp biến user, error, success luôn tồn tại) ---
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');

  // user dùng cho header.ejs: ưu tiên session.user, fallback sang req.user (passport)
  res.locals.user = req.session.user || req.user || null;

  next();
});

// --- 5. Routes ---
app.use('/', mainRoutes);

// --- 6. Khởi động Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
