const paypal = require('../config/paypal');
const db = require('../config/database');

/**
 * POST /pay
 * Tạo payment request gửi sang PayPal (Sandbox)
 * type: deposit ($100) hoặc purchase (mua xe - demo $500)
 */
exports.createPayment = (req, res) => {
    if (!req.session.user) {
        req.flash('error', 'Vui lòng đăng nhập để thanh toán.');
        return res.redirect('/auth/login');
    }

    const carId = req.body.carId;
    const userId = req.session.user.id;
    const paymentType = req.body.type || 'deposit'; // deposit or purchase

    // Xác định số tiền và mô tả
    let amount, itemName, description;
    if (paymentType === 'purchase') {
        amount = '500.00'; // Demo: $500 cho mua xe
        itemName = 'Car Purchase';
        description = 'Full payment for purchasing car on BKGENESIS';
    } else {
        amount = '100.00'; // Đặt cọc $100
        itemName = 'Car Deposit';
        description = 'Deposit for purchasing car on BKGENESIS';
    }

    // Lưu thông tin vào session để xử lý sau khi success
    req.session.paymentInfo = { carId, userId, paymentType, amount };

    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": `${process.env.BASE_URL || 'http://localhost:3000'}/pay/success`,
            "cancel_url": `${process.env.BASE_URL || 'http://localhost:3000'}/pay/cancel`
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": itemName,
                    "sku": paymentType === 'purchase' ? '002' : '001',
                    "price": amount,
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": amount
            },
            "description": description
        }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            console.error('PayPal Create Error:', error);
            req.flash('error', 'Lỗi khởi tạo thanh toán PayPal.');
            res.redirect('/');
        } else {
            // Tìm link approval_url để redirect user
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    res.redirect(payment.links[i].href);
                    return;
                }
            }
        }
    });
};

/**
 * GET /pay/success
 * Xử lý khi user thanh toán thành công và được redirect về
 */
exports.executePayment = (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    // Lấy thông tin từ session
    const paymentInfo = req.session.paymentInfo;
    if (!paymentInfo) {
        req.flash('error', 'Không tìm thấy thông tin thanh toán.');
        return res.redirect('/');
    }

    const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": paymentInfo.amount || "100.00"
            }
        }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.error('PayPal Execute Error:', error.response);
            req.flash('error', 'Lỗi xử lý thanh toán.');
            res.redirect('/');
        } else {
            // Xác định mô tả dựa trên loại thanh toán
            const desc = paymentInfo.paymentType === 'purchase'
                ? 'Thanh toán mua xe qua PayPal'
                : 'Đặt cọc xe qua PayPal';
            const amountNum = parseFloat(paymentInfo.amount) || 100.00;

            // Lưu giao dịch vào database
            const sql = `
                INSERT INTO transactions (user_id, car_id, amount, currency, paypal_payment_id, paypal_payer_id, status, description)
                VALUES (?, ?, ?, 'USD', ?, ?, 'completed', ?)
            `;
            db.query(sql, [paymentInfo.userId, paymentInfo.carId, amountNum, paymentId, payerId, desc], (err) => {
                if (err) {
                    console.error('Save transaction error:', err);
                }
                // Xóa paymentInfo khỏi session
                delete req.session.paymentInfo;

                req.flash('success', 'Thanh toán đặt cọc thành công! (PayPal Sandbox)');
                res.redirect('/invoices');
            });
        }
    });
};

/**
 * GET /pay/cancel
 * Xử lý khi user hủy thanh toán
 */
exports.cancelPayment = (req, res) => {
    // Xóa paymentInfo khỏi session
    delete req.session.paymentInfo;
    req.flash('info', 'Bạn đã hủy thanh toán.');
    res.redirect('/');
};

/**
 * GET /invoices
 * Xem lịch sử hóa đơn/giao dịch của user
 */
exports.getInvoices = (req, res) => {
    if (!req.session.user) {
        req.flash('error', 'Vui lòng đăng nhập.');
        return res.redirect('/auth/login');
    }

    const userId = req.session.user.id;

    const sql = `
        SELECT 
            t.id,
            t.amount,
            t.currency,
            t.paypal_payment_id,
            t.status,
            t.description,
            t.created_at,
            c.brand,
            c.model,
            c.year,
            c.image_url
        FROM transactions t
        JOIN cars c ON t.car_id = c.id
        WHERE t.user_id = ?
        ORDER BY t.created_at DESC
    `;

    db.query(sql, [userId], (err, transactions) => {
        if (err) {
            console.error('getInvoices error:', err);
            req.flash('error', 'Không tải được lịch sử giao dịch.');
            return res.redirect('/');
        }

        res.render('invoices', { transactions });
    });
};
