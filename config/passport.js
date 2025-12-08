const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const bcrypt = require('bcryptjs');
const db = require('./database');
require('dotenv').config();

/**
 * Tạo hoặc lấy user từ DB dựa trên email từ tài khoản mạng xã hội
 * - provider: 'google' hoặc 'facebook'
 * - profile: thông tin do provider trả về
 */
function findOrCreateUserFromOAuth(provider, profile, done) {
  try {
    let email =
        (profile.emails && profile.emails[0] && profile.emails[0].value) || null;
    const fullName =
        profile.displayName || (email ? email.split('@')[0] : provider + '_' + profile.id);

// Nếu Facebook không trả email (hoặc mình không xin scope email),
// tự tạo một email "giả nhưng duy nhất" để lưu trong DB
    if (!email) {
        email = `${provider}_${profile.id}@${provider}.local`;
    }

    const selectSql = 'SELECT * FROM users WHERE email = ?';

    db.query(selectSql, [email], async (err, results) => {
      if (err) return done(err);

      if (results && results.length > 0) {
        // Đã có user, dùng luôn
        return done(null, results[0]);
      }

      // Chưa có user -> tạo mới
      const randomPasswordSeed = provider + '_' + profile.id + '_' + Date.now();
      const hashedPassword = await bcrypt.hash(randomPasswordSeed, 10);

      const insertSql =
        'INSERT INTO users (full_name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)';
      const insertValues = [
        fullName,
        email,
        hashedPassword,
        null,
        null,
        'customer' // mặc định user mới là customer, sau này có thể đổi trong trang admin
      ];

      db.query(insertSql, insertValues, (insertErr, insertResult) => {
        if (insertErr) return done(insertErr);

        const newUser = {
          id: insertResult.insertId,
          full_name: fullName,
          email,
          password: hashedPassword,
          phone: null,
          address: null,
          role: 'customer'
        };

        return done(null, newUser);
      });
    });
  } catch (e) {
    return done(e);
  }
}

// Cấu hình Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      findOrCreateUserFromOAuth('google', profile, done);
    }
  )
);

// Cấu hình Facebook OAuth
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'displayName', 'emails']
    },
    async(_accessToken, _refreshToken, profile, done) => {
      findOrCreateUserFromOAuth('facebook', profile, done);
    }
  )
);

// Cấu hình session cho Passport
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const sql =
    'SELECT id, full_name, email, phone, address, role FROM users WHERE id = ?';
  db.query(sql, [id], (err, results) => {
    if (err) return done(err);
    if (!results || results.length === 0) return done(null, false);
    return done(null, results[0]);
  });
});

module.exports = passport;
