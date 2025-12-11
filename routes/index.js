// routes/index.js
const express = require('express');
const path = require('path');
const multer = require('multer');

const router = express.Router();

// Controllers
const authController = require('../controllers/authController');
const carController = require('../controllers/carController');
const wishlistController = require('../controllers/wishlistController');
const messageController = require('../controllers/messageController');
const profileController = require('../controllers/profileController');
const sellerController = require('../controllers/sellerController');
const adminController = require('../controllers/adminController');
const infoController = require('../controllers/infoController');
const passport = require('../config/passport');

/* ==========================================================
   MIDDLEWARE CHECK LOGIN / ROLE
   ========================================================== */
function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  req.flash('error', 'Vui lòng đăng nhập trước.');
  return res.redirect('/auth/login');
}

function isSeller(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Vui lòng đăng nhập với tài khoản seller.');
    return res.redirect('/auth/login');
  }
  if (req.session.user.role !== 'seller') {
    req.flash('error', 'Chức năng này chỉ dành cho tài khoản người bán (seller).');
    return res.redirect('/');
  }
  return next();
}

function isAdmin(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Vui lòng đăng nhập.');
    return res.redirect('/auth/login');
  }
  if (req.session.user.role !== 'admin') {
    req.flash('error', 'Bạn không có quyền truy cập trang quản trị.');
    return res.redirect('/');
  }
  return next();
}

/* ==========================================================
   CẤU HÌNH MULTER UPLOAD ẢNH XE
   - Lưu vào /public/uploads/cars
   ========================================================== */

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'cars');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const base = path.basename(file.originalname || 'car', ext);
    const safeBase = base.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '');
    const filename = `${safeBase}-${Date.now()}${ext || '.jpg'}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/* ==========================================================
   ROUTES TRANG CHỦ / XE
   ========================================================== */

// Trang chủ + tìm kiếm + filter
router.get('/', carController.getHomePage);

// /search tái sử dụng logic trang chủ
router.get('/search', carController.searchCars);

// Chi tiết xe
router.get('/cars/:id', carController.getCarDetail);

/* ==========================================================
   AUTH: LOGIN / REGISTER / LOGOUT
   ========================================================== */

// Form login / register
router.get('/auth/login', authController.getLoginPage);
router.get('/auth/register', authController.getRegisterPage);

// Xử lý login / register
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);

// Logout
router.get('/auth/logout', authController.logout);

/* ------------------ Quên mật khẩu ------------------ */

router.get('/auth/forgot-password', authController.getForgotPasswordPage);
router.post('/auth/forgot-password', authController.postForgotPassword);

router.get('/auth/reset-password/:token', authController.getResetPasswordPage);
router.post('/auth/reset-password', authController.postResetPassword);

/* ------------------ Đăng nhập Google ------------------ */

router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login', failureFlash: true }),
  authController.handleOAuthCallback
);

/* ------------------ Đăng nhập Facebook ------------------ */

router.get(
  '/auth/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get(
  '/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/auth/login', failureFlash: true }),
  authController.handleOAuthCallback
);

/* ==========================================================
   PROFILE CÁ NHÂN
   ========================================================== */

router.get('/profile', isAuthenticated, profileController.getProfile);
router.get('/profile/edit', isAuthenticated, profileController.getEditProfile);
router.post('/profile/edit', isAuthenticated, profileController.postEditProfile);

/* ==========================================================
   SELLER: ĐĂNG XE / QUẢN LÝ XE
   ========================================================== */

// Danh sách xe đang bán
router.get('/seller/cars', isSeller, sellerController.getSellerCars);

// Form đăng xe mới
router.get('/seller/cars/new', isSeller, sellerController.getNewCarForm);

// Xử lý đăng xe mới (có upload ảnh)
router.post(
  '/seller/cars/new',
  isSeller,
  upload.single('image'),
  (req, res, next) => {
    // Nếu có file, set image_url = đường dẫn public
    if (req.file) {
      req.body.image_url = `/uploads/cars/${req.file.filename}`;
    }
    next();
  },
  sellerController.postNewCar
);

// Xóa / ẩn xe (post)
router.post('/seller/cars/:postId/delete', isSeller, sellerController.deletePost);

// Gia hạn bài đăng
router.post('/seller/cars/:postId/renew', isSeller, sellerController.renewPost);

// Form sửa xe
router.get('/seller/cars/:postId/edit', isSeller, sellerController.getEditCarForm);

// Xử lý sửa xe (có upload ảnh)
router.post(
  '/seller/cars/:postId/edit',
  isSeller,
  upload.single('image_file'),
  sellerController.postEditCar
);

/* ==========================================================
   WISHLIST (YÊU THÍCH)
   ========================================================== */

router.get('/wishlist', isAuthenticated, wishlistController.getWishlist);
router.post('/wishlist/add', isAuthenticated, wishlistController.addToWishlist);
router.post('/wishlist/remove', isAuthenticated, wishlistController.removeFromWishlist);

/* ==========================================================
   MESSAGES / CHAT
   ========================================================== */

// Trang tin nhắn (2 cột: inbox + chat)
router.get('/messages', isAuthenticated, messageController.getMessagesPage);

// Gửi tin nhắn
router.post('/messages/send', isAuthenticated, messageController.sendMessage);

/* ==========================================================
   PAYPAL PAYMENT
   ========================================================== */
const paymentController = require('../controllers/paymentController');

router.post('/pay', isAuthenticated, paymentController.createPayment);
router.get('/pay/success', paymentController.executePayment);
router.get('/pay/cancel', paymentController.cancelPayment);

// Lịch sử hóa đơn/giao dịch
router.get('/invoices', isAuthenticated, paymentController.getInvoices);

/* ==========================================================
   ADMIN
   ========================================================== */

// Danh sách user
router.get('/admin/users', isAuthenticated, isAdmin, adminController.getUsersList);

// Xóa tài khoản người dùng
router.post('/admin/users/:userId/delete', isAuthenticated, isAdmin, adminController.deleteUser);

// Danh sách xe
router.get('/admin/cars', isAuthenticated, isAdmin, adminController.getCarsList);

router.post('/admin/cars/:postId/approve', isAuthenticated, isAdmin, adminController.approvePost);

router.post('/admin/cars/:carId/delete', isAuthenticated, isAdmin, adminController.deleteCar);

// Xóa xe
router.post('/admin/cars/:carId/delete', isAuthenticated, isAdmin, adminController.deleteCar);

// Duyệt bài đăng
router.post('/admin/cars/:postId/approve', isAuthenticated, isAdmin, adminController.approvePost);

// Form sửa xe (Admin)
router.get('/admin/cars/:postId/edit', isAuthenticated, isAdmin, adminController.getEditCarForm);

// Xử lý sửa xe (Admin)
router.post(
  '/admin/cars/:postId/edit',
  isAuthenticated,
  isAdmin,
  upload.single('image_file'),
  adminController.postEditCar
);

/* ==========================================================
   TRANG TĨNH: TIN TỨC / VỀ CHÚNG TÔI
   ========================================================== */

router.get('/news', infoController.getNewsPage);
router.get('/about', infoController.getAboutPage);

/* ==========================================================
   EXPORT
   ========================================================== */

module.exports = router;
