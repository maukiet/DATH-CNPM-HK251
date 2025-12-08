const db = require('../config/database');

/**
 * GET /admin/users
 * Admin xem danh sách toàn bộ tài khoản
 */
exports.getUsersList = (req, res) => {
    const sql = `
        SELECT 
            id,
            full_name,
            email,
            phone,
            address,
            role,
            created_at
        FROM users
        ORDER BY created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('getUsersList error:', err);
            req.flash('error', 'Không tải được danh sách tài khoản.');
            return res.redirect('/');
        }

        return res.render('admin-users', {
            users: results
        });
    });
};

/**
 * GET /admin/cars
 * Admin xem danh sách toàn bộ xe trong hệ thống
 */
// File: controllers/adminController.js

exports.getCarsList = (req, res) => {
    // 1. Query lấy danh sách xe (giữ nguyên logic cũ)
    const sqlCars = `
        SELECT 
            c.id AS car_id,
            c.brand, c.model, c.year, c.price, c.mileage,
            c.status AS car_status, c.created_at AS car_created_at, c.image_url,
            u.id AS seller_id, u.full_name AS seller_name,
            p.id AS post_id, p.status AS post_status
        FROM cars c
        LEFT JOIN posts p ON p.car_id = c.id
        LEFT JOIN users u ON u.id = p.seller_id
        ORDER BY c.created_at DESC
    `;

    // 2. Query lấy thống kê cho biểu đồ (MỚI)
    const sqlStats = `
        SELECT brand, COUNT(*) as count 
        FROM cars 
        GROUP BY brand 
    `;

    db.query(sqlCars, (err, carResults) => {
        if (err) {
            console.error('getCarsList error:', err);
            req.flash('error', 'Không tải được danh sách xe.');
            return res.redirect('/');
        }

        // Gọi tiếp query thống kê
        db.query(sqlStats, (err2, statResults) => {
            if (err2) {
                console.error('Stats error:', err2);
                // Nếu lỗi thống kê thì vẫn hiện danh sách xe, nhưng stats rỗng
                return res.render('admin-cars', {
                    cars: carResults,
                    stats: [] 
                });
            }

            // --- QUAN TRỌNG: Truyền cả 'cars' và 'stats' xuống view ---
            return res.render('admin-cars', {
                cars: carResults,
                stats: statResults || [] 
            });
        });
    });
};

/**
 * POST /admin/cars/:carId/delete
 * Admin xóa 1 xe (cùng các posts/favorites liên quan nhờ FK ON DELETE CASCADE)
 */
exports.deleteCar = (req, res) => {
    const carId = req.params.carId;

    if (!carId) {
        req.flash('error', 'Thiếu ID xe cần xóa.');
        return res.redirect('/admin/cars');
    }

    const sql = 'DELETE FROM cars WHERE id = ?';

    db.query(sql, [carId], (err, result) => {
        if (err) {
            console.error('deleteCar error:', err);
            req.flash('error', 'Không thể xóa xe. Vui lòng thử lại.');
            return res.redirect('/admin/cars');
        }

        if (result.affectedRows === 0) {
            req.flash('error', 'Không tìm thấy xe cần xóa.');
        } else {
            req.flash('success', 'Đã xóa xe thành công.');
        }

        return res.redirect('/admin/cars');
    });
};

/**
 * POST /admin/cars/:postId/approve
 * Admin duyệt bài đăng (status: pending -> active)
 */
exports.approvePost = (req, res) => {
    const postId = req.params.postId;

    if (!postId) {
        req.flash('error', 'Thiếu ID bài đăng.');
        return res.redirect('/admin/cars');
    }

    const sql = "UPDATE posts SET status = 'active' WHERE id = ?";

    db.query(sql, [postId], (err, result) => {
        if (err) {
            console.error('approvePost error:', err);
            req.flash('error', 'Lỗi khi duyệt bài.');
            return res.redirect('/admin/cars');
        }

        if (result.affectedRows === 0) {
            req.flash('error', 'Không tìm thấy bài đăng.');
        } else {
            req.flash('success', 'Đã duyệt bài đăng thành công.');
        }

        return res.redirect('/admin/cars');
    });
};
