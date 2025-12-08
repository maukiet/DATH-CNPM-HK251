const db = require('../config/database');

exports.getWishlist = (req, res) => {
    const userId = req.session.user.id;
    // Join bảng favorites với cars để lấy thông tin xe
    const sql = `
        SELECT c.*, f.id as favorite_id 
        FROM favorites f 
        JOIN cars c ON f.car_id = c.id 
        WHERE f.user_id = ?`;
        
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.redirect('/');
        }
        res.render('wishlist', { wishlist: results });
    });
};

exports.addToWishlist = (req, res) => {
    const userId = req.session.user.id;
    const { car_id } = req.body;

    // Kiểm tra xem đã thích chưa
    const checkSql = 'SELECT * FROM favorites WHERE user_id = ? AND car_id = ?';
    db.query(checkSql, [userId, car_id], (err, results) => {
        if (results.length > 0) {
            req.flash('error', 'Xe này đã có trong danh sách yêu thích.');
            return res.redirect(req.get('Referer') || '/');
        }

        const sql = 'INSERT INTO favorites (user_id, car_id) VALUES (?, ?)';
        db.query(sql, [userId, car_id], (err) => {
            if (err) console.error(err);
            req.flash('success', 'Đã thêm vào yêu thích!');
            res.redirect(req.get('Referer') || '/');
        });
    });
};

exports.removeFromWishlist = (req, res) => {
    // Phòng hờ, dù route này đã có middleware isAuthenticated
    if (!req.session.user) {
        req.flash('error', 'Bạn cần đăng nhập để thực hiện thao tác này.');
        return res.redirect('/auth/login');
    }

    const userId = req.session.user.id;       // id user đang login
    const { favorite_id } = req.body;         // id của bản ghi favorites cần xóa

    const sql = 'DELETE FROM favorites WHERE id = ? AND user_id = ?';

    db.query(sql, [favorite_id, userId], (err, result) => {
        if (err) {
            console.error(err);
            req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại sau.');
            return res.redirect('/wishlist');
        }

        // Không xóa được bản ghi nào -> hoặc không tồn tại, hoặc không thuộc user này
        if (result.affectedRows === 0) {
            req.flash('error', 'Không tìm thấy mục yêu thích cần xóa.');
        } else {
            req.flash('success', 'Đã xóa khỏi danh sách yêu thích.');
        }

        res.redirect('/wishlist');
    });
};
