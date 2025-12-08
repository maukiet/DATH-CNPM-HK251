const db = require('../config/database');

// Trang xem thông tin cá nhân
exports.getProfile = (req, res) => {
    const userId = req.session.user.id;

    const sql = 'SELECT id, full_name, email, phone, address, role, created_at FROM users WHERE id = ?';
    db.query(sql, [userId], (err, results) => {
        if (err || results.length === 0) {
            console.error(err);
            req.flash('error', 'Không tìm thấy thông tin người dùng.');
            return res.redirect('/');
        }

        const profile = results[0];
        res.render('profile', { profile });
    });
};

// Trang form chỉnh sửa thông tin cá nhân
exports.getEditProfile = (req, res) => {
    const userId = req.session.user.id;

    const sql = 'SELECT id, full_name, email, phone, address, role FROM users WHERE id = ?';
    db.query(sql, [userId], (err, results) => {
        if (err || results.length === 0) {
            console.error(err);
            req.flash('error', 'Không tìm thấy thông tin người dùng.');
            return res.redirect('/profile');
        }

        const profile = results[0];
        res.render('profile-edit', { profile });
    });
};

// Xử lý submit form chỉnh sửa
exports.postEditProfile = (req, res) => {
    const userId = req.session.user.id;
    const { full_name, phone, address } = req.body;

    const sql = 'UPDATE users SET full_name = ?, phone = ?, address = ? WHERE id = ?';
    db.query(sql, [full_name, phone, address, userId], (err) => {
        if (err) {
            console.error(err);
            req.flash('error', 'Cập nhật thông tin thất bại. Vui lòng thử lại.');
            return res.redirect('/profile/edit');
        }

        // Cập nhật lại session để header hiển thị tên mới
        req.session.user.full_name = full_name;
        req.session.user.phone = phone;
        req.session.user.address = address;

        req.flash('success', 'Cập nhật thông tin cá nhân thành công.');
        res.redirect('/profile');
    });
};
