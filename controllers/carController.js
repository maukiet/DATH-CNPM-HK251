const db = require('../config/database');

const CARS_PER_PAGE = 12;

/**
 * Trang chủ / danh sách xe:
 * - Hỗ trợ tìm kiếm (q)
 * - Lọc theo hãng (brand)
 * - Sắp xếp (sort)
 * - Phân trang (page)
 */
exports.getHomePage = (req, res) => {
    const { q, sort, brand, page } = req.query;

    const keyword = q ? q.trim() : '';
    const selectedBrand = brand && brand.trim() !== '' ? brand : 'all';
    const sortOption = sort || 'latest';
    const currentPage = parseInt(page) || 1;
    const offset = (currentPage - 1) * CARS_PER_PAGE;

    let baseWhere = 'WHERE status = "available"';
    const params = [];

    if (keyword) {
        baseWhere += ' AND (model LIKE ? OR brand LIKE ?)';
        const s = `%${keyword}%`;
        params.push(s, s);
    }

    if (selectedBrand !== 'all') {
        baseWhere += ' AND brand = ?';
        params.push(selectedBrand);
    }

    // Sort
    let orderBy = '`year` DESC';
    switch (sortOption) {
        case 'oldest':
            orderBy = '`year` ASC';
            break;
        case 'price_asc':
            orderBy = 'price ASC';
            break;
        case 'price_desc':
            orderBy = 'price DESC';
            break;
        case 'latest':
        default:
            orderBy = '`year` DESC';
            break;
    }

    const countSql = `SELECT COUNT(*) as total FROM cars ${baseWhere}`;
    const dataSql = `SELECT * FROM cars ${baseWhere} ORDER BY ${orderBy} LIMIT ${CARS_PER_PAGE} OFFSET ${offset}`;
    const brandSql = 'SELECT DISTINCT brand FROM cars ORDER BY brand ASC';

    db.query(brandSql, (brandErr, brandRows) => {
        if (brandErr) {
            console.error('getHomePage brand error:', brandErr);
        }

        const brands = brandRows || [];

        // Đếm tổng số xe
        db.query(countSql, params, (countErr, countResult) => {
            if (countErr) {
                console.error('getHomePage count error:', countErr);
                return res.render('index', {
                    cars: [],
                    sliderCars: [],
                    active: 'home',
                    brands,
                    query: keyword,
                    selectedBrand,
                    sort: sortOption,
                    currentPage: 1,
                    totalPages: 1,
                    totalCars: 0
                });
            }

            const totalCars = countResult[0].total;
            const totalPages = Math.ceil(totalCars / CARS_PER_PAGE);

            // Lấy danh sách xe cho trang hiện tại
            db.query(dataSql, params, (err, carResults) => {
                if (err) {
                    console.error('getHomePage cars error:', err);
                    return res.render('index', {
                        cars: [],
                        sliderCars: [],
                        active: 'home',
                        brands,
                        query: keyword,
                        selectedBrand,
                        sort: sortOption,
                        currentPage,
                        totalPages: 1,
                        totalCars: 0
                    });
                }

                // Lấy 5 xe random cho slider
                const sliderSql = 'SELECT * FROM cars WHERE status = "available" ORDER BY RAND() LIMIT 5';
                db.query(sliderSql, (sliderErr, sliderResults) => {
                    if (sliderErr) {
                        console.error('getHomePage slider error:', sliderErr);
                    }

                    return res.render('index', {
                        cars: carResults,
                        sliderCars: sliderResults || [],
                        active: 'home',
                        brands,
                        query: keyword,
                        selectedBrand,
                        sort: sortOption,
                        currentPage,
                        totalPages,
                        totalCars
                    });
                });
            });
        });
    });
};

/**
 * Chi tiết xe:
 * - Lấy thêm thông tin người bán (seller) từ bảng posts + users
 * - Kiểm tra xem user hiện tại đã thêm xe này vào favorites chưa
 */
exports.getCarDetail = (req, res) => {
    const carId = req.params.id;
    const currentUser = req.session.user || null;

    const sql = `
        SELECT 
            c.*,
            u.id AS seller_id,
            u.full_name AS seller_name,
            u.phone AS seller_phone,
            u.email AS seller_email
        FROM cars c
        LEFT JOIN posts p 
            ON p.car_id = c.id AND p.status = 'active'
        LEFT JOIN users u 
            ON u.id = p.seller_id
        WHERE c.id = ?
        LIMIT 1
    `;

    db.query(sql, [carId], (err, results) => {
        if (err) {
            console.error('getCarDetail error:', err);
            req.flash('error', 'Không lấy được thông tin xe.');
            return res.redirect('/');
        }

        if (!results || results.length === 0) {
            req.flash('error', 'Không tìm thấy xe.');
            return res.redirect('/');
        }

        const car = results[0];

        // Nếu chưa đăng nhập thì không cần check favorites
        if (!currentUser) {
            return res.render('car-detail', {
                car,
                isFavorite: false
            });
        }

        // Kiểm tra xem user hiện tại đã thêm xe này vào favorites chưa
        const favSql = 'SELECT id FROM favorites WHERE user_id = ? AND car_id = ? LIMIT 1';

        db.query(favSql, [currentUser.id, carId], (favErr, favRows) => {
            if (favErr) {
                console.error('check favorite error:', favErr);
                return res.render('car-detail', {
                    car,
                    isFavorite: false
                });
            }

            const isFavorite = favRows && favRows.length > 0;

            return res.render('car-detail', {
                car,
                isFavorite
            });
        });
    });
};

/**
 * /search: tái sử dụng logic getHomePage
 */
exports.searchCars = (req, res) => {
    return exports.getHomePage(req, res);
};
