// controllers/authController.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

/**
 * Helper: build object lưu trong session từ bản ghi users trong DB
 */
function buildSessionUser(userRow) {
  if (!userRow) return null;
  return {
    id: userRow.id,
    full_name: userRow.full_name,
    email: userRow.email,
    role: userRow.role,
    phone: userRow.phone,
    address: userRow.address
  };
}

/**
 * Tạo transporter gửi email nếu có cấu hình SMTP.
 * Nếu không có, mình fallback sang log ra console để tiện demo.
 */
function createMailTransporter() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.warn(
      '[Auth] SMTP env not set - password reset link will be logged to console instead of sending email.'
    );
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Gửi email reset mật khẩu (hoặc log ra console nếu chưa cấu hình SMTP)
 */
async function sendResetEmail(toEmail, resetLink) {
  const transporter = createMailTransporter();

  const subject = 'BKGenesis - Đặt lại mật khẩu tài khoản của bạn';
  const textContent = `
Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu tài khoản trên BKGenesis.

Nếu đó là bạn, hãy truy cập vào link dưới đây để đặt lại mật khẩu (link có hiệu lực 1 giờ):

${resetLink}

Nếu bạn không yêu cầu, hãy bỏ qua email này.

Trân trọng,
BKGenesis
  `.trim();

  if (!transporter) {
    console.log('====================');
    console.log('[BKGenesis] Password reset link (demo):');
    console.log(`To: ${toEmail}`);
    console.log(resetLink);
    console.log('====================');
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"BKGenesis" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject,
    text: textContent
  });
}

/**
 * Đăng nhập bằng email / mật khẩu
 */
exports.getLoginPage = (req, res) => {
  res.render('login');
};

exports.getRegisterPage = (req, res) => {
  res.render('register');
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';

  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0) {
      console.error('Login error:', err);
      req.flash('error', 'Email hoặc mật khẩu không đúng.');
      return res.redirect('/auth/login');
    }

    const user = results[0];
    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        req.flash('error', 'Email hoặc mật khẩu không đúng.');
        return res.redirect('/auth/login');
      }
    } catch (hashErr) {
      console.error('bcrypt compare error:', hashErr);
      req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại.');
      return res.redirect('/auth/login');
    }

    // Lưu thông tin user vào session
    req.session.user = buildSessionUser(user);
    req.flash('success', 'Đăng nhập thành công.');
    return res.redirect('/');
  });
};

/**
 * Đăng ký tài khoản thường
 * - Cho phép chọn role: customer / seller
 * - Không cho tự đăng ký admin
 */
exports.register = async (req, res) => {
  try {
    const { full_name, email, password, phone, address, role } = req.body;

    if (!full_name || !email || !password) {
      req.flash('error', 'Vui lòng điền đầy đủ họ tên, email và mật khẩu.');
      return res.redirect('/auth/register');
    }

    // Chỉ cho phép 2 role: customer hoặc seller
    let userRole = 'customer';
    if (role === 'seller') {
      userRole = 'seller';
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql =
      'INSERT INTO users (full_name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)';

    db.query(
      sql,
      [full_name, email, hashedPassword, phone || null, address || null, userRole],
      (err, result) => {
        if (err) {
          console.error('Register error:', err);
          if (err.code === 'ER_DUP_ENTRY') {
            req.flash('error', 'Email đã tồn tại. Vui lòng sử dụng email khác.');
          } else {
            req.flash('error', 'Email đã tồn tại hoặc lỗi hệ thống.');
          }
          return res.redirect('/auth/register');
        }

        req.flash('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
        return res.redirect('/auth/login');
      }
    );
  } catch (err) {
    console.error('Register exception:', err);
    req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại.');
    return res.redirect('/auth/register');
  }
};

/**
 * Callback chung cho đăng nhập bằng Google / Facebook
 * - Passport sẽ gắn req.user
 * - Ta map sang req.session.user để các phần còn lại của site sử dụng
 */
exports.handleOAuthCallback = (req, res) => {
  if (!req.user) {
    req.flash('error', 'Đăng nhập bằng mạng xã hội thất bại.');
    return res.redirect('/auth/login');
  }

  req.session.user = buildSessionUser(req.user);
  req.flash('success', 'Đăng nhập thành công.');
  return res.redirect('/');
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    if (req.logout) {
      req.logout(() => {
        return res.redirect('/');
      });
    } else {
      return res.redirect('/');
    }
  });
};

/* ==========================================================
   QUÊN MẬT KHẨU
   ========================================================== */

/**
 * GET /auth/forgot-password
 * Hiển thị form nhập email
 */
exports.getForgotPasswordPage = (req, res) => {
  res.render('forgot-password');
};

/**
 * POST /auth/forgot-password
 * - Nhận email
 * - Nếu tồn tại user: tạo token + thời hạn, lưu DB, gửi email (hoặc log ra console)
 * - Nếu không tồn tại: báo rõ cho user là email không tồn tại
 */
exports.postForgotPassword = (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    req.flash('error', 'Vui lòng nhập email.');
    return res.redirect('/auth/forgot-password');
  }

  const cleanEmail = email.trim();

  const findSql = 'SELECT id, email FROM users WHERE email = ?';
  db.query(findSql, [cleanEmail], (err, results) => {
    if (err) {
      console.error('Forgot password - query error:', err);
      req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại.');
      return res.redirect('/auth/forgot-password');
    }

    // Không tìm thấy user -> báo rõ ràng cho người dùng
    if (!results || results.length === 0) {
      req.flash(
        'error',
        'Email này không tồn tại trong hệ thống. Vui lòng kiểm tra lại hoặc đăng ký tài khoản mới.'
      );
      return res.redirect('/auth/forgot-password');
    }

    const user = results[0];

    // Tạo token ngẫu nhiên
    const token = crypto.randomBytes(32).toString('hex');
    // Hết hạn sau 1 giờ
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h

    const updateSql =
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?';

    db.query(updateSql, [token, expires, user.id], async (updateErr) => {
      if (updateErr) {
        console.error('Forgot password - update token error:', updateErr);
        req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại.');
        return res.redirect('/auth/forgot-password');
      }

      // Tạo link reset: dùng domain hiện tại (localhost / ngrok / render)
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const resetLink = `${baseUrl}/auth/reset-password/${token}`;

      try {
        await sendResetEmail(user.email, resetLink);
      } catch (mailErr) {
        console.error('Forgot password - send mail error:', mailErr);
        // Vẫn cho user biết là đã xử lý xong, nhưng log lỗi để debug
      }

      req.flash(
        'success',
        `Đã gửi email đặt lại mật khẩu tới ${cleanEmail}. ` +
          'Vui lòng kiểm tra hộp thư (kể cả Spam / Quảng cáo).'
      );
      return res.redirect('/auth/forgot-password');
    });
  });
};

/**
 * GET /auth/reset-password/:token
 * - Kiểm tra token có tồn tại và còn hạn không
 * - Nếu hợp lệ, render form nhập mật khẩu mới
 */
exports.getResetPasswordPage = (req, res) => {
  const { token } = req.params;

  const sql =
    'SELECT id, email FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()';

  db.query(sql, [token], (err, results) => {
    if (err) {
      console.error('Reset password - query error:', err);
      req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại.');
      return res.redirect('/auth/forgot-password');
    }

    if (!results || results.length === 0) {
      req.flash(
        'error',
        'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng thực hiện lại bước quên mật khẩu.'
      );
      return res.redirect('/auth/forgot-password');
    }

    // Token ok -> hiển thị form
    return res.render('reset-password', {
      token
    });
  });
};

/**
 * POST /auth/reset-password
 * - Nhận token + password mới
 * - Kiểm tra token hợp lệ
 * - Hash mật khẩu mới, cập nhật DB, xoá token & expires
 */
exports.postResetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    req.flash('error', 'Vui lòng nhập đầy đủ mật khẩu mới.');
    return res.redirect('back');
  }

  if (password !== confirmPassword) {
    req.flash('error', 'Mật khẩu xác nhận không khớp.');
    return res.redirect('back');
  }

  const sql =
    'SELECT id FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()';

  db.query(sql, [token], async (err, results) => {
    if (err) {
      console.error('Reset password - query error:', err);
      req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại.');
      return res.redirect('/auth/forgot-password');
    }

    if (!results || results.length === 0) {
      req.flash(
        'error',
        'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng thực hiện lại bước quên mật khẩu.'
      );
      return res.redirect('/auth/forgot-password');
    }

    const user = results[0];

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const updateSql = `
        UPDATE users
        SET password = ?, reset_password_token = NULL, reset_password_expires = NULL
        WHERE id = ?
      `;

      db.query(updateSql, [hashedPassword, user.id], (updateErr) => {
        if (updateErr) {
          console.error('Reset password - update error:', updateErr);
          req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại.');
          return res.redirect('/auth/forgot-password');
        }

        req.flash('success', 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
        return res.redirect('/auth/login');
      });
    } catch (hashErr) {
      console.error('Reset password - hash error:', hashErr);
      req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại.');
      return res.redirect('/auth/forgot-password');
    }
  });
};
