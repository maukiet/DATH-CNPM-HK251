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

/**
 * GET /admin/cars/:postId/edit
 * Admin xem form sửa xe
 */
exports.getEditCarForm = (req, res) => {
    const postId = req.params.postId;

    const sql = `
        SELECT 
            p.id AS post_id,
            p.status AS post_status,
            c.id AS car_id,
            c.brand,
            c.model,
            c.year,
            c.price,
            c.mileage,
            c.description,
            c.image_url
        FROM posts p
        JOIN cars c ON p.car_id = c.id
        WHERE p.id = ?
    `;

    db.query(sql, [postId], (err, rows) => {
        if (err) {
            console.error('admin getEditCarForm error:', err);
            req.flash('error', 'Không tải được thông tin xe.');
            return res.redirect('/admin/cars');
        }

        if (!rows || rows.length === 0) {
            req.flash('error', 'Không tìm thấy bài đăng.');
            return res.redirect('/admin/cars');
        }

        res.render('seller-car-edit', {
            car: rows[0],
            backUrl: '/admin/cars',
            formAction: `/admin/cars/${postId}/edit`
        });
    });
};

/**
 * POST /admin/cars/:postId/edit
 * Admin cập nhật thông tin xe
 */
exports.postEditCar = (req, res) => {
    const postId = req.params.postId;
    const { brand, model, year, price, mileage, description, image_url } = req.body;

    // Validate cơ bản
    if (!brand || !model || !year || !price) {
        req.flash('error', 'Vui lòng nhập đầy đủ các trường bắt buộc.');
        return res.redirect(`/admin/cars/${postId}/edit`);
    }

    // Lấy car_id từ post
    const checkSql = 'SELECT car_id FROM posts WHERE id = ?';

    db.query(checkSql, [postId], (err, rows) => {
        if (err) {
            console.error('admin postEditCar - check error:', err);
            req.flash('error', 'Lỗi khi kiểm tra bài đăng.');
            return res.redirect('/admin/cars');
        }

        if (!rows || rows.length === 0) {
            req.flash('error', 'Không tìm thấy bài đăng.');
            return res.redirect('/admin/cars');
        }

        const carId = rows[0].car_id;
        const yearInt = parseInt(year, 10) || new Date().getFullYear();
        const mileageInt = mileage ? parseInt(mileage, 10) : 0;
        const priceNum = price ? parseFloat(price) : 0;

        // Xác định ảnh cuối cùng
        let finalImageUrl = null;
        if (req.file) {
            finalImageUrl = `/uploads/cars/${req.file.filename}`;
        } else if (image_url && image_url.trim() !== '') {
            finalImageUrl = image_url.trim();
        }

        // Build update query
        let updateSql, params;
        if (finalImageUrl) {
            updateSql = `
                UPDATE cars SET
                    brand = ?,
                    model = ?,
                    year = ?,
                    price = ?,
                    mileage = ?,
                    description = ?,
                    image_url = ?
                WHERE id = ?
            `;
            params = [brand, model, yearInt, priceNum, mileageInt, description || null, finalImageUrl, carId];
        } else {
            updateSql = `
                UPDATE cars SET
                    brand = ?,
                    model = ?,
                    year = ?,
                    price = ?,
                    mileage = ?,
                    description = ?
                WHERE id = ?
            `;
            params = [brand, model, yearInt, priceNum, mileageInt, description || null, carId];
        }

        db.query(updateSql, params, (updateErr) => {
            if (updateErr) {
                console.error('admin postEditCar - update error:', updateErr);
                req.flash('error', 'Không thể cập nhật xe.');
                return res.redirect(`/admin/cars/${postId}/edit`);
            }

            // Cập nhật title trong posts
            const newTitle = `${brand} ${model} ${yearInt}`;
            db.query('UPDATE posts SET title = ? WHERE id = ?', [newTitle, postId], () => {
                req.flash('success', 'Đã cập nhật thông tin xe thành công.');
                return res.redirect('/admin/cars');
            });
        });
    });
};

/**
 * POST /admin/users/:userId/delete
 * Admin xóa tài khoản người dùng (không xóa được admin)
 */
exports.deleteUser = (req, res) => {
    const userId = req.params.userId;

    if (!userId) {
        req.flash('error', 'Thiếu ID tài khoản.');
        return res.redirect('/admin/users');
    }

    // Kiểm tra không cho xóa admin
    const checkSql = 'SELECT role FROM users WHERE id = ?';
    db.query(checkSql, [userId], (err, rows) => {
        if (err) {
            console.error('deleteUser - check error:', err);
            req.flash('error', 'Lỗi khi kiểm tra tài khoản.');
            return res.redirect('/admin/users');
        }

        if (!rows || rows.length === 0) {
            req.flash('error', 'Không tìm thấy tài khoản.');
            return res.redirect('/admin/users');
        }

        if (rows[0].role === 'admin') {
            req.flash('error', 'Không thể xóa tài khoản admin.');
            return res.redirect('/admin/users');
        }

        // Xóa tài khoản
        const deleteSql = 'DELETE FROM users WHERE id = ?';
        db.query(deleteSql, [userId], (deleteErr, result) => {
            if (deleteErr) {
                console.error('deleteUser error:', deleteErr);
                req.flash('error', 'Không thể xóa tài khoản.');
                return res.redirect('/admin/users');
            }

            if (result.affectedRows === 0) {
                req.flash('error', 'Không tìm thấy tài khoản cần xóa.');
            } else {
                req.flash('success', 'Đã xóa tài khoản thành công.');
            }

            return res.redirect('/admin/users');
        });
    });
};
