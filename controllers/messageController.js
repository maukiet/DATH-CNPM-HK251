const db = require('../config/database');

/**
 * Gửi tin nhắn (từ trang chi tiết xe hoặc từ khung chat)
 */
exports.sendMessage = (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'Vui lòng đăng nhập để gửi tin nhắn.');
    return res.redirect('/auth/login');
  }

  const senderId = req.session.user.id;
  const { receiver_id, car_id, content } = req.body;

  if (!receiver_id || !car_id || !content || !content.trim()) {
    req.flash('error', 'Thiếu thông tin để gửi tin nhắn.');
    return res.redirect('/messages');
  }

  const sql = `
    INSERT INTO messages (sender_id, receiver_id, car_id, content, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;

  db.query(sql, [senderId, receiver_id, car_id, content.trim()], (err) => {
    if (err) {
      console.error('sendMessage error:', err);
      req.flash('error', 'Gửi tin nhắn thất bại.');
      return res.redirect('/messages');
    }

    req.flash('success', 'Đã gửi tin nhắn.');
    // Sau khi gửi thành công -> quay lại đúng cuộc trò chuyện
    return res.redirect(`/messages?otherId=${receiver_id}&carId=${car_id}`);
  });
};

/**
 * Trang /messages
 * - Cột trái: danh sách cuộc trò chuyện (theo từng người + từng xe)
 * - Cột phải: nội dung chat của cuộc trò chuyện đang chọn
 */
exports.getMessagesPage = (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'Vui lòng đăng nhập để xem tin nhắn.');
    return res.redirect('/auth/login');
  }

  const userId = req.session.user.id;
  const { otherId, carId } = req.query;

  const convSql = `
    SELECT
      CASE 
        WHEN m.sender_id = ? THEN m.receiver_id
        ELSE m.sender_id
      END AS other_id,
      u.full_name AS other_name,
      c.id AS car_id,
      c.brand,
      c.model,
      c.year,
      MAX(m.created_at) AS last_time
    FROM messages m
    JOIN users u ON u.id = CASE 
                             WHEN m.sender_id = ? THEN m.receiver_id
                             ELSE m.sender_id
                           END
    LEFT JOIN cars c ON c.id = m.car_id
    WHERE m.sender_id = ? OR m.receiver_id = ?
    GROUP BY other_id, other_name, car_id, c.brand, c.model, c.year
    ORDER BY last_time DESC
  `;

  db.query(convSql, [userId, userId, userId, userId], (err, conversations) => {
    if (err) {
      console.error('getMessagesPage - convSql error:', err);
      req.flash('error', 'Không tải được danh sách cuộc trò chuyện.');
      return res.redirect('/');
    }

    if (!conversations || conversations.length === 0) {
      return res.render('messages', {
        active: 'messages',
        conversations: [],
        activeMessages: [],
        activeOther: null,
        activeCar: null
      });
    }

    let activeOtherId = otherId ? parseInt(otherId, 10) : null;
    let activeCarId = carId ? parseInt(carId, 10) : null;

    // Nếu chưa truyền otherId / carId -> mặc định chọn cuộc trò chuyện mới nhất
    if (!activeOtherId || !activeCarId) {
      activeOtherId = conversations[0].other_id;
      activeCarId = conversations[0].car_id;
    }

    const activeConv =
      conversations.find(
        (c) => c.other_id === activeOtherId && c.car_id === activeCarId
      ) || null;

    if (!activeConv) {
      return res.render('messages', {
        active: 'messages',
        conversations,
        activeMessages: [],
        activeOther: null,
        activeCar: null
      });
    }

    const msgSql = `
      SELECT
        m.*,
        s.full_name AS sender_name,
        r.full_name AS receiver_name
      FROM messages m
      JOIN users s ON s.id = m.sender_id
      JOIN users r ON r.id = m.receiver_id
      WHERE (
              (m.sender_id = ? AND m.receiver_id = ?)
              OR
              (m.sender_id = ? AND m.receiver_id = ?)
            )
        AND m.car_id = ?
      ORDER BY m.created_at ASC, m.id ASC
    `;

    db.query(
      msgSql,
      [userId, activeOtherId, activeOtherId, userId, activeCarId],
      (msgErr, msgs) => {
        if (msgErr) {
          console.error('getMessagesPage - msgSql error:', msgErr);
          req.flash('error', 'Không tải được nội dung cuộc trò chuyện.');
          return res.redirect('/');
        }

        return res.render('messages', {
          active: 'messages',
          conversations,
          activeMessages: msgs || [],
          activeOther: activeConv,
          activeCar: activeConv
        });
      }
    );
  });
};
