// controllers/sellerController.js
const db = require('../config/database');

/**
 * GET /seller/cars
 * Danh sách xe đang bán của seller hiện tại
 */
exports.getSellerCars = (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'Vui lòng đăng nhập.');
    return res.redirect('/auth/login');
  }

  const sellerId = req.session.user.id;

  const sql = `
    SELECT 
      p.id AS post_id,
      p.status AS post_status,
      p.created_at AS post_created_at,
      c.id AS car_id,
      c.brand,
      c.model,
      c.year,
      c.price,
      c.mileage,
      c.status AS car_status,
      c.image_url
    FROM posts p
    JOIN cars c ON p.car_id = c.id
    WHERE p.seller_id = ?
    ORDER BY p.created_at DESC
  `;

  db.query(sql, [sellerId], (err, rows) => {
    if (err) {
      console.error('getSellerCars error:', err);
      req.flash('error', 'Không tải được danh sách xe đang bán.');
      return res.redirect('/');
    }

    res.render('seller-cars', {
      posts: rows,
      active: '' // nếu sau này muốn highlight menu thì dùng
    });
  });
};

/**
 * GET /seller/cars/new
 * Form đăng xe mới
 */
exports.getNewCarForm = (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'Vui lòng đăng nhập.');
    return res.redirect('/auth/login');
  }

  res.render('seller-car-new');
};

/**
 * POST /seller/cars/new
 * Seller thêm xe mới và đăng bán
 * - Hỗ trợ:
 *   + Upload file ảnh (req.file) với path /uploads/cars/...
 *   + Hoặc nhập link ảnh (image_url) nếu không upload
 */
exports.postNewCar = (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'Vui lòng đăng nhập.');
    return res.redirect('/auth/login');
  }

  const sellerId = req.session.user.id;
  const {
    brand,
    model,
    year,
    price,
    mileage,
    description,
    image_url // vẫn cho phép nhập URL nếu không upload file
  } = req.body;

  // Validate cơ bản
  if (!brand || !model || !year || !price) {
    req.flash('error', 'Vui lòng nhập đầy đủ các trường bắt buộc (hãng, mẫu, năm, giá).');
    return res.redirect('/seller/cars/new');
  }

  const yearInt = parseInt(year, 10) || new Date().getFullYear();
  const mileageInt = mileage ? parseInt(mileage, 10) : 0;
  const priceNum = price ? parseFloat(price) : 0;

  // Xác định ảnh cuối cùng dùng: ưu tiên file upload → URL nhập tay → default
  let finalImageUrl = null;

  if (req.file) {
    // Multer đã lưu file vào /public/uploads/cars/...
    finalImageUrl = `/uploads/cars/${req.file.filename}`;
  } else if (image_url && image_url.trim() !== '') {
    finalImageUrl = image_url.trim();
  } else {
    // Ảnh mặc định nếu không có gì
    finalImageUrl = '/images/default-car.jpg';
  }

  const carSql = `
    INSERT INTO cars (
      brand,
      model,
      year,
      price,
      mileage,
      description,
      image_url,
      status,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'available', NOW())
  `;

  db.query(
    carSql,
    [brand, model, yearInt, priceNum, mileageInt, description || null, finalImageUrl],
    (err, result) => {
      if (err) {
        console.error('postNewCar - insert car error:', err);
        req.flash('error', 'Không thể thêm xe. Vui lòng thử lại.');
        return res.redirect('/seller/cars/new');
      }

      const carId = result.insertId;
      const title = `${brand} ${model} ${yearInt}`;

      const postSql = `
        INSERT INTO posts (seller_id, car_id, title, status)
        VALUES (?, ?, ?, 'pending')
      `;

      db.query(postSql, [sellerId, carId, title], (postErr) => {
        if (postErr) {
          console.error('postNewCar - insert post error:', postErr);
          // Dọn car mồ côi (best-effort)
          db.query('DELETE FROM cars WHERE id = ?', [carId], () => { });
          req.flash('error', 'Không thể tạo bài đăng cho xe này.');
          return res.redirect('/seller/cars');
        }

        req.flash('success', 'Đã thêm xe mới và đăng bán thành công.');
        return res.redirect('/seller/cars');
      });
    }
  );
};

/**
 * POST /seller/cars/:postId/delete
 * Ẩn / xóa xe đang bán:
 * - Đặt cars.status = 'hidden' để không hiện trên trang chủ
 * - Đặt posts.status = 'expired'
 */
exports.deletePost = (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'Vui lòng đăng nhập.');
    return res.redirect('/auth/login');
  }

  const sellerId = req.session.user.id;
  const postId = req.params.postId;

  const selectSql = 'SELECT car_id FROM posts WHERE id = ? AND seller_id = ?';

  db.query(selectSql, [postId, sellerId], (err, rows) => {
    if (err) {
      console.error('deletePost - select error:', err);
      req.flash('error', 'Không thể xóa xe.');
      return res.redirect('/seller/cars');
    }

    if (!rows || rows.length === 0) {
      req.flash('error', 'Không tìm thấy bài đăng cần xóa.');
      return res.redirect('/seller/cars');
    }

    const carId = rows[0].car_id;

    const updateCarSql = "UPDATE cars SET status = 'hidden' WHERE id = ?";
    const updatePostSql = "UPDATE posts SET status = 'expired' WHERE id = ?";

    db.query(updateCarSql, [carId], (err2) => {
      if (err2) {
        console.error('deletePost - update car error:', err2);
      }

      db.query(updatePostSql, [postId], (err3) => {
        if (err3) {
          console.error('deletePost - update post error:', err3);
        }

        req.flash('success', 'Đã xóa/ẩn xe khỏi danh sách đang bán.');
        return res.redirect('/seller/cars');
      });
    });
  });
};

/**
 * POST /seller/cars/:postId/renew
 * Gia hạn bài đăng (đặt lại status = 'active' và cập nhật created_at = NOW())
 */
exports.renewPost = (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'Vui lòng đăng nhập.');
    return res.redirect('/auth/login');
  }

  const sellerId = req.session.user.id;
  const postId = req.params.postId;

  const sql = `
    UPDATE posts
    SET status = 'active',
        created_at = NOW()
    WHERE id = ? AND seller_id = ?
  `;

  db.query(sql, [postId, sellerId], (err, result) => {
    if (err) {
      console.error('renewPost error:', err);
      req.flash('error', 'Không thể gia hạn bài đăng.');
      return res.redirect('/seller/cars');
    }

    if (result.affectedRows === 0) {
      req.flash('error', 'Không tìm thấy bài đăng để gia hạn.');
    } else {
      req.flash('success', 'Đã gia hạn bài đăng.');
    }

    return res.redirect('/seller/cars');
  });
};

/**
 * GET /seller/cars/:postId/edit
 * Form sửa xe đang bán
 */
exports.getEditCarForm = (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'Vui lòng đăng nhập.');
    return res.redirect('/auth/login');
  }

  const sellerId = req.session.user.id;
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
    WHERE p.id = ? AND p.seller_id = ?
  `;

  db.query(sql, [postId, sellerId], (err, rows) => {
    if (err) {
      console.error('getEditCarForm error:', err);
      req.flash('error', 'Không tải được thông tin xe.');
      return res.redirect('/seller/cars');
    }

    if (!rows || rows.length === 0) {
      req.flash('error', 'Không tìm thấy bài đăng.');
      return res.redirect('/seller/cars');
    }

    res.render('seller-car-edit', {
      car: rows[0],
      backUrl: '/seller/cars',
      formAction: `/seller/cars/${postId}/edit`
    });
  });
};

/**
 * POST /seller/cars/:postId/edit
 * Seller cập nhật thông tin xe
 */
exports.postEditCar = (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'Vui lòng đăng nhập.');
    return res.redirect('/auth/login');
  }

  const sellerId = req.session.user.id;
  const postId = req.params.postId;
  const { brand, model, year, price, mileage, description, image_url } = req.body;

  // Validate cơ bản
  if (!brand || !model || !year || !price) {
    req.flash('error', 'Vui lòng nhập đầy đủ các trường bắt buộc (hãng, mẫu, năm, giá).');
    return res.redirect(`/seller/cars/${postId}/edit`);
  }

  // Kiểm tra quyền sở hữu
  const checkSql = 'SELECT car_id FROM posts WHERE id = ? AND seller_id = ?';

  db.query(checkSql, [postId, sellerId], (err, rows) => {
    if (err) {
      console.error('postEditCar - check ownership error:', err);
      req.flash('error', 'Lỗi khi kiểm tra quyền sở hữu.');
      return res.redirect('/seller/cars');
    }

    if (!rows || rows.length === 0) {
      req.flash('error', 'Không tìm thấy bài đăng hoặc bạn không có quyền sửa.');
      return res.redirect('/seller/cars');
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
      // Không thay đổi ảnh
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
        console.error('postEditCar - update error:', updateErr);
        req.flash('error', 'Không thể cập nhật xe. Vui lòng thử lại.');
        return res.redirect(`/seller/cars/${postId}/edit`);
      }

      // Cập nhật title trong posts
      const newTitle = `${brand} ${model} ${yearInt}`;
      db.query('UPDATE posts SET title = ? WHERE id = ?', [newTitle, postId], () => {
        req.flash('success', 'Đã cập nhật thông tin xe thành công.');
        return res.redirect('/seller/cars');
      });
    });
  });
};
