const paypal = require('../config/paypal');

/**
 * POST /pay
 * Tạo payment request gửi sang PayPal (Sandbox)
 * Body nhận: car_name, price (hoặc fix amount deposit)
 */
exports.createPayment = (req, res) => {
    // Giá trị cọc ví dụ: $100 USD (hoặc quy đổi VND -> USD)
    // Sandbox PayPal thường dùng USD. Nếu dùng VND cần convert hoặc check support.
    // Ở đây ta fix cứng fee cọc là 10.00 USD cho demo.

    // Lưu thông tin xe/user vào session để xử lý sau khi success
    // req.session.paymentInfo = { carId: req.body.carId, userId: req.session.user.id };

    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/pay/success",
            "cancel_url": "http://localhost:3000/pay/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "Deposit for Car",
                    "sku": "001",
                    "price": "100.00",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": "100.00"
            },
            "description": "Deposit for purchasing car on BKGENESIS"
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

    const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "100.00"
            }
        }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.error('PayPal Execute Error:', error.response);
            req.flash('error', 'Lỗi xử lý thanh toán.');
            res.redirect('/');
        } else {
            console.log(JSON.stringify(payment));
            req.flash('success', 'Thanh toán đặt cọc thành công! (PayPal Sandbox)');
            res.redirect('/');
        }
    });
};

/**
 * GET /pay/cancel
 * Xử lý khi user hủy thanh toán
 */
exports.cancelPayment = (req, res) => {
    req.flash('info', 'Bạn đã hủy thanh toán.');
    res.redirect('/');
};
