-- === (TÙY CHỌN) RESET HOÀN TOÀN DATABASE KHI DEV ===
-- CHỈ DÙNG KHI BẠN MUỐN XÓA SẠCH DATA CŨ
-- DROP DATABASE IF EXISTS bkgenesis_db;

CREATE DATABASE IF NOT EXISTS bkgenesis_db;
USE bkgenesis_db;

-- ===========================
-- 1. BẢNG USER
-- ===========================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    role ENUM('admin', 'seller', 'customer') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- 2. BẢNG CARS
-- ===========================
CREATE TABLE IF NOT EXISTS cars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    mileage INT DEFAULT 0,
    description TEXT,
    image_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_car_code UNIQUE (brand, model, year) -- tránh trùng “mã xe”
);

-- ===========================
-- 3. BẢNG POSTS
-- ===========================
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    car_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    status ENUM('pending', 'active', 'sold', 'expired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Mỗi seller chỉ có tối đa 1 bài đăng cho một xe (tránh trùng bài)
    UNIQUE KEY uniq_seller_car (seller_id, car_id),
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);

-- ===========================
-- 4. BẢNG FAVORITES (WISHLIST)
-- ===========================
CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    car_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);

-- ===========================
-- 5. BẢNG MESSAGES (CHAT)
-- ===========================
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    car_id INT,             
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===========================
-- 6. BẢNG TRANSACTIONS (GIAO DỊCH/HÓA ĐƠN)
-- ===========================
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    car_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    paypal_payment_id VARCHAR(100),
    paypal_payer_id VARCHAR(100),
    status ENUM('pending', 'completed', 'cancelled', 'refunded') DEFAULT 'pending',
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);

-- ===========================
-- 7. DỮ LIỆU XE MẪU
-- ===========================
-- ===========================
-- Dùng INSERT IGNORE để nếu (brand, model, year) đã tồn tại thì KHÔNG insert lại
UPDATE cars 
SET image_url = '/images/cars/volvo-xc-90.jpg' 
WHERE brand = 'Volvo' AND model = 'XC90';
INSERT IGNORE INTO cars (brand, model, year, price, mileage, description, image_url) VALUES 
-- Audi
('Audi', 'A4', 2023, 1950000000, 10000, 'Sedan hạng D, Quattro AWD, nội thất virtual cockpit.', '/images/cars/audi-a4.jpg'),
('Audi', 'Q5 Sportback', 2024, 2700000000, 0, 'SUV coupe, thiết kế thể thao, công nghệ tiên tiến.', '/images/cars/audi-q5-sportback.jpg'),
('Audi', 'Q7', 2023, 4100000000, 12000, 'SUV 7 chỗ hạng sang, full option, nhập khẩu Đức.', '/images/cars/audi-q7.jpg'),
('Audi', 'e-tron GT', 2024, 5900000000, 0, 'Sedan điện thể thao, tăng tốc 0-100km/h trong 3.3s.', '/images/cars/audi-e-tron-gt.jpg'),
('Audi', 'A5 Sportback', 2023, 2400000000, 3000, 'Thiết kế Coupe 4 cửa thời thượng, nhập khẩu Đức.', '/images/cars/audi-a5.jpg'),

-- BMW
('BMW', 'X3 xDrive', 2024, 2400000000, 0, 'SUV thể thao, cảm giác lái BMW đặc trưng.', '/images/cars/bmw-x3-xdrive.jpg'),
('BMW', 'X5 M Sport', 2023, 4200000000, 8000, 'SUV hạng sang cỡ lớn, động cơ mạnh mẽ.', '/images/cars/bmw-x5-m-sport.jpg'),
('BMW', '530i M Sport', 2022, 3100000000, 20000, 'Sedan hạng E, cảm giác lái thể thao, nội thất cao cấp.', 'images/cars/bmw-530i-m-sport.jpg'),
('BMW', 'iX3', 2024, 3300000000, 0, 'SUV điện, công nghệ tiên tiến, sạc nhanh.', '/images/cars/bmw-ix3.jpg'),
('BMW', '320i Sport', 2022, 1800000000, 12000, 'Cảm giác lái thể thao, xe chính chủ giữ gìn kỹ.', '/images/cars/bmw-320i-sport.jpg'),

-- Bugatti
('Bugatti', 'W16 Mistral', 2024, 3600000000, 5000,'Siêu xe mang phong cách thể thao và đẳng cấp của nhà vua', '/images/cars/bugatti-w16-mistral.jpg'),

-- Chevrolet
('Chevrolet', 'Colorado', 2023, 810000000, 15000, 'Bán tải Mỹ, máy dầu mạnh mẽ, bền bỉ.', '/images/cars/chevrolet-colorado.jpg'),
('Chevrolet', 'Trailblazer', 2024, 950000000, 0, 'SUV 7 chỗ, giá hợp lý, máy dầu tiết kiệm.', '/images/cars/chevrolet-trailblazer.jpg'),

-- Ford
('Ford', 'Everest Titanium', 2024, 1450000000, 0, 'SUV 7 chỗ, máy dầu Bi-Turbo, full công nghệ.', '/images/cars/ford-everest-titanium.jpg'),
('Ford', 'Territory', 2023, 830000000, 10000, 'SUV cỡ trung, thiết kế hiện đại, giá hợp lý.', '/images/cars/ford-territory.jpg'),
('Ford', 'Mustang', 2021, 3200000000, 12000, 'Muscle car huyền thoại, động cơ V8 5.0L.', '/images/cars/ford-mustang.jpg'),
('Ford', 'Ranger Wildtrak', 2022, 950000000, 15000, 'Vua bán tải, đi địa hình cực tốt, màu cam.', '/images/cars/ford-ranger-wildtrak.jpg'),

-- Honda
('Honda', 'City RS', 2023, 599000000, 8000, 'Sedan hạng B, động cơ Turbo, nhiều tính năng an toàn.', '/images/cars/honda-city-rs.jpg'),
('Honda', 'Civic RS', 2024, 870000000, 0, 'Sedan thể thao, thế hệ mới nhất, Honda Sensing full option.', '/images/cars/honda-civic-rs.jpg'),
('Honda', 'Accord', 2023, 1320000000, 15000, 'Sedan hạng D cao cấp, nội thất sang trọng, động cơ Turbo 1.5L.', '/images/cars/honda-accord.jpg'),
('Honda', 'HR-V L', 2024, 826000000, 0, 'SUV cỡ nhỏ, thiết kế hiện đại, Honda Sensing đầy đủ.', 'images/cars/honda-hr-v-l.jpg'),
('Honda', 'BR-V', 2023, 661000000, 10000, 'SUV 7 chỗ cỡ nhỏ, tiết kiệm nhiên liệu, thích hợp gia đình.', '/images/cars/honda-br-v.jpg'),
('Honda', 'CR-V L', 2024, 1100000000, 0, 'Xe gầm cao gia đình, công nghệ an toàn Honda Sensing.', '/images/cars/honda-cr-v-l.jpg'),

-- Hyundai
('Hyundai', 'Accent', 2024, 520000000, 0, 'Sedan bán chạy, thiết kế mới, tiết kiệm xăng.', '/images/cars/hyundai-accent.jpg'),
('Hyundai', 'Tucson', 2023, 920000000, 8000, 'SUV cỡ trung, thiết kế tương lai, full option.', '/images/cars/hyundai-tucson.jpg'),
('Hyundai', 'Santa Fe', 2024, 1340000000, 0, 'SUV 7 chỗ cao cấp, thế hệ mới nhất, full công nghệ.', '/images/cars/hyundai-santa-fe.jpg'),
('Hyundai', 'Creta', 2023, 660000000, 12000, 'SUV cỡ nhỏ, giá hợp lý, nhiều tính năng an toàn.', '/images/cars/hyundai-creta.jpg'),
('Hyundai', 'Stargazer', 2024, 599000000, 5000, 'MPV 7 chỗ, thiết kế độc đáo, nội thất rộng rãi.', '/images/cars/hyundai_stargazer.jpg'),

-- Kia
('Kia', 'Morning', 2023, 380000000, 15000, 'Xe cỡ nhỏ, tiết kiệm nhiên liệu, phù hợp đi phố.', '/images/cars/kia-morning.jpg'),
('Kia', 'K3', 2024, 659000000, 0, 'Sedan hạng C, thiết kế thể thao, nhiều công nghệ.', '/images/cars/kia-k3.jpg'),
('Kia', 'Seltos', 2023, 710000000, 8000, 'SUV cỡ nhỏ, thiết kế trẻ trung, full option.', '/images/cars/kia-seltos.jpg'),
('Kia', 'Sportage', 2024, 999000000, 0, 'SUV cỡ trung, thế hệ mới, thiết kế tương lai.', '/images/cars/kia-sportage.jpg'),
('Kia', 'Sorento', 2023, 1200000000, 10000, 'SUV 7 chỗ cao cấp, động cơ Turbo, nhiều công nghệ.', '/images/cars/kia-sorento.jpg'),
('Kia', 'Carnival', 2024, 1650000000, 0, 'MPV hạng sang, 7 chỗ VIP, full công nghệ.', '/images/cars/kia-carnival.jpg'),

-- Koenigsegg
('Koenigsegg', 'Agera One', 2014, 8500000000, 10000, 'Nữ hoàng tốc độ cùng với những đường nét mạnh mẽ', '/images/cars/koenigsegg-agera-one.jpg'),

-- Land Rover
('Land Rover', 'Defender', 2023, 5100000000, 10000, 'SUV địa hình huyền thoại, thiết kế mới, full option.', '/images/cars/land-rover-defender.jpg'),
('Land Rover', 'Range Rover Sport', 2024, 7500000000, 0, 'SUV hạng sang thể thao, nội thất siêu sang.', '/images/cars/land-rover-sport.jpg'),

-- Lexus
('Lexus', 'ES 250', 2023, 2500000000, 5000, 'Sedan hạng sang Nhật Bản, êm ái, đẳng cấp.', '/images/cars/lexus-es-250.jpg'),
('Lexus', 'RX 350', 2024, 4200000000, 0, 'SUV hạng sang, thế hệ mới, công nghệ hybrid.', '/images/cars/lexus-rx-350.jpg'),
('Lexus', 'NX 350h', 2023, 3100000000, 8000, 'SUV cỡ trung, động cơ Hybrid, tiết kiệm nhiên liệu.', '/images/cars/lexus-nx-350h.jpg'),
('Lexus', 'LX 600', 2024, 8200000000, 0, 'SUV full-size hạng sang, vua địa hình, nội thất siêu sang.', '/images/cars/lexus-lx-600.jpg'),

-- Mazda
('Mazda', 'Mazda3 Sport', 2024, 750000000, 0, 'Hatchback thể thao, thiết kế Kodo, công nghệ SkyActiv.', '/images/cars/mazda-mazda-3-sport.jpg'),
('Mazda', 'Mazda6 Luxury', 2023, 920000000, 12000, 'Sedan hạng D, thiết kế sang trọng, nội thất cao cấp.', '/images/cars/mazda-mazda-6-luxury.jpg'),
('Mazda', 'CX-8 Premium', 2023, 1150000000, 8000, 'SUV 7 chỗ, bản Premium AWD, đầy đủ tiện nghi.', '/images/cars/mazda-cx-8-premium.jpg'),
('Mazda', 'CX-30', 2024, 720000000, 0, 'SUV cỡ nhỏ, thiết kế trẻ trung, nhiều công nghệ.', '/images/cars/mazda-cx-30.jpg'),
('Mazda', 'CX-5 Signature', 2022, 950000000, 8000, 'SUV 5 chỗ, bản Signature full option, thích hợp cho gia đình, nội thất hai tông màu sang trọng.', '/images/cars/mazda-cx-5-signature.jpg'),

-- Mercedes-Benz
('Mercedes-Benz', 'E300 AMG', 2023, 3200000000, 8000, 'Sedan hạng sang, full option, màu đen lịch lãm.', '/images/cars/mercedes-benz-e-300-amg.jpg'),
('Mercedes-Benz', 'GLC 300', 2024, 2500000000, 0, 'SUV hạng sang, thế hệ mới, công nghệ MBUX.', '/images/cars/mercedes-benz-glc-300.jpg'),
('Mercedes-Benz', 'S450 Luxury', 2022, 5800000000, 15000, 'Sedan đẳng cấp, nội thất siêu sang, xe chủ tịch.', '/images/cars/mercedes-benz-s-450.jpg'),
('Mercedes-Benz', 'A200', 2023, 1450000000, 10000, 'Hatchback thể thao, nhỏ gọn, phù hợp giới trẻ.', '/images/cars/mercedes-benz-a-200.jpg'),
('Mercedes-Benz', 'C300 AMG', 2023, 2100000000, 5000, 'Xe lướt, màu trắng sang trọng, nội thất đỏ thể thao.', '/images/cars/mercedes-benz-c-300-amg.jpg'),

-- Mitsubishi
('Mitsubishi', 'Xpander', 2024, 630000000, 0, 'MPV 7 chỗ bán chạy, thực dụng, tiết kiệm xăng.', '/images/cars/mitsubishi-xpander.jpg'),
('Mitsubishi', 'Pajero Sport', 2023, 1110000000, 15000, 'SUV 7 chỗ, máy dầu, đi địa hình tốt.', '/images/cars/mitsubishi-pajero-sport.jpg'),
('Mitsubishi', 'Outlander', 2024, 1060000000, 0, 'SUV 7 chỗ, thiết kế mới, nhiều công nghệ an toàn.', '/images/cars/mitsubishi-outlander.jpg'),

-- Nissan
('Nissan', 'Navara', 2023, 750000000, 12000, 'Bán tải mạnh mẽ, máy dầu, thùng sau rộng.', '/images/cars/nissan-navara.jpg'),
('Nissan', 'X-Trail', 2024, 1100000000, 0, 'SUV 7 chỗ, động cơ e-Power, tiết kiệm nhiên liệu.', '/images/cars/nissan-x-trail.jpg'),
('Nissan', 'Almera', 2023, 530000000, 8000, 'Sedan hạng B, tiết kiệm xăng, phù hợp chạy dịch vụ.', '/images/cars/nissan-almera.jpg'),

-- Peugeot
('Peugeot', '3008', 2024, 1100000000, 0, 'SUV Pháp, nội thất i-Cockpit độc đáo.', '/images/cars/peugeot-3008.jpg'),
('Peugeot', '5008', 2023, 1250000000, 8000, 'SUV 7 chỗ, thiết kế châu Âu, full option.', '/images/cars/peugeot-5008.jpg'),

-- Porsche
('Porsche', 'Cayenne', 2023, 5200000000, 10000, 'SUV thể thao hạng sang, động cơ V6 Turbo.', '/images/cars/porsche-cayenne.jpg'),
('Porsche', 'Macan', 2024, 3800000000, 0, 'SUV cỡ trung thể thao, cảm giác lái Porsche.', '/images/cars/porsche-macan.jpg'),
('Porsche', 'Taycan', 2024, 6500000000, 0, 'Sedan điện thể thao, công suất 761 mã lực.', '/images/cars/porsche-taycan.jpg'),
('Porsche', '911 Carrera', 2021, 6500000000, 8000, 'Siêu phẩm tốc độ, màu tím nổi bật.', '/images/cars/porsche-911.jpg'),

-- Subaru
('Subaru', 'Forester', 2024, 1100000000, 0, 'SUV Nhật Bản, AWD đối xứng, an toàn hàng đầu.', '/images/cars/subaru-forester.jpg'),
('Subaru', 'Outback', 2023, 1750000000, 8000, 'SUV/Wagon lai, AWD, thích hợp đi phượt.', '/images/cars/subaru-outback.jpg'),

-- Toyota
('Toyota', 'Vios G', 2023, 580000000, 5000, 'Sedan phổ thông bán chạy nhất Việt Nam, tiết kiệm nhiên liệu.', '/images/cars/toyota-vios-g.jpg'),
('Toyota', 'Corolla Cross', 2024, 920000000, 0, 'SUV cỡ nhỏ, động cơ Hybrid tiết kiệm xăng, full option.', '/images/cars/toyota-corolla-cross.jpg'),
('Toyota', 'Fortuner Legender', 2023, 1350000000, 12000, 'SUV 7 chỗ, máy dầu mạnh mẽ, thiết kế thể thao.', '/images/cars/toyota-fortuner-legender.jpg'),
('Toyota', 'Land Cruiser', 2022, 4200000000, 18000, 'Vua địa hình, máy V6 Twin Turbo, nhập khẩu chính hãng.', '/images/cars/toyota-land-cruiser.jpg'),
('Toyota', 'Veloz Cross', 2024, 680000000, 2000, 'MPV 7 chỗ, nội thất rộng rãi, phù hợp gia đình.', '/images/cars/toyota-veloz-cross.jpg'),
('Toyota', 'Camry 2.5Q', 2021, 1150000000, 20000, 'Sedan hạng D, nội thất rộng rãi, nhiều công nghệ an toàn, xe chạy gia đình không kinh doanh.', '/images/cars/toyota-camry-2.5q.jpg'),

-- VinFast
('VinFast', 'VF e34', 2023, 690000000, 5000, 'SUV điện cỡ nhỏ, thân thiện môi trường, bảo hành pin 10 năm.', '/images/cars/vinfast-vf-e34.jpg'),
('VinFast', 'VF 8', 2024, 1100000000, 0, 'SUV điện cỡ trung, công nghệ cao, nội thất cao cấp.', '/images/cars/vinfast-vf-8.jpg'),
('VinFast', 'VF 9', 2024, 1500000000, 0, 'SUV điện 7 chỗ, kích thước lớn, full option.', '/images/cars/vinfast-vf-9.jpg'),
('VinFast', 'LUX A2.0', 2022, 950000000, 25000, 'Sedan hạng D, thiết kế Pininfarina, xe đẹp như mới.', '/images/cars/vinfast-lux-a2.0.jpg'),
('VinFast', 'LUX SA2', 2023, 1300000000, 10000, 'SUV 7 chỗ, trang bị nhiều công nghệ hỗ trợ lái, bảo dưỡng chính hãng đầy đủ.', '/images/cars/vinfast-lux-sa2.jpg'),

-- Volkswagen
('Volkswagen', 'Tiguan', 2023, 1700000000, 10000, 'SUV Đức, chất lượng cao, lái êm ái.', '/images/cars/volkswagen-tiguan.jpg'),
('Volkswagen', 'Teramont', 2024, 2350000000, 0, 'SUV 7 chỗ cỡ lớn, nội thất rộng rãi, nhập Mỹ.', '/images/cars/volkswagen-teramont.jpg'),

-- Volvo
('Volvo', 'XC60', 2024, 2600000000, 0, 'SUV Thụy Điển, an toàn hàng đầu, nội thất Scandinavian.', '/images/cars/volvo-xc-60.jpg'),
('Volvo', 'XC90', 2023, 4200000000, 12000, 'SUV 7 chỗ hạng sang, an toàn 5 sao, nội thất cao cấp.', '/images/cars/volvo-xc-90.jpg');


-- ===========================
-- 7. USER MẪU
-- ===========================
INSERT IGNORE INTO users (full_name, email, password, role) VALUES 
('Admin', 'admin@bk.com', '$2a$10$At7ok0mivnjZfeFR.Hl8..dkaP2pRP07MKE6piUww4EoCQOEG6Kly', 'admin'),
('Khoa LC Car', 'seller@bk.com', '$2a$10$At7ok0mivnjZfeFR.Hl8..dkaP2pRP07MKE6piUww4EoCQOEG6Kly', 'seller'),
('Sơn Tùng Auto', 'seller2@bk.com', '$2a$10$At7ok0mivnjZfeFR.Hl8..dkaP2pRP07MKE6piUww4EoCQOEG6Kly', 'seller'),
('Mau Kit', 'customer@bk.com', '$2a$10$At7ok0mivnjZfeFR.Hl8..dkaP2pRP07MKE6piUww4EoCQOEG6Kly', 'customer');

-- UPDATE users
-- SET password = '$2a$10$At7ok0mivnjZfeFR.Hl8..dkaP2pRP07MKE6piUww4EoCQOEG6Kly'
-- WHERE email IN ('seller@bk.com', 'seller2@bk.com', 'customer@bk.com','admin@bk.com');

-- ===========================
-- 8. BÀI ĐĂNG DEMO CHO SELLER THỨ NHẤT (Khoa LC Car)
-- ===========================
INSERT IGNORE INTO posts (seller_id, car_id, title, status)
SELECT 
    u.id AS seller_id,
    c.id AS car_id,
    CONCAT(c.brand, ' ', c.model, ' - Tin đăng demo từ Khoa LC Car') AS title,
    'active' AS status
FROM users u
JOIN cars c ON
    (
        -- Xe gốc
        (c.brand = 'Mercedes-Benz' AND c.model = 'C300 AMG'           AND c.year = 2023) OR
        (c.brand = 'BMW'          AND c.model = '320i Sport'          AND c.year = 2022) OR
        (c.brand = 'Porsche'      AND c.model = '911 Carrera'         AND c.year = 2021) OR
        (c.brand = 'Honda'        AND c.model = 'CR-V L'              AND c.year = 2024) OR
        (c.brand = 'Ford'         AND c.model = 'Ranger Wildtrak'     AND c.year = 2022) OR
        (c.brand = 'Audi'         AND c.model = 'A5 Sportback'        AND c.year = 2023) OR
        (c.brand = 'Bugatti'      AND c.model = 'W16 Mistral'         AND c.year = 2024) OR
        (c.brand = 'Koenigsegg'   AND c.model = 'Agera One'           AND c.year = 2014) OR
        (c.brand = 'Toyota'       AND c.model = 'Vios G'              AND c.year = 2023) OR
        (c.brand = 'Toyota'       AND c.model = 'Corolla Cross'       AND c.year = 2024) OR
        (c.brand = 'Toyota'       AND c.model = 'Land Cruiser'        AND c.year = 2022) OR
        (c.brand = 'Honda'        AND c.model = 'City RS'             AND c.year = 2023) OR
        (c.brand = 'Honda'        AND c.model = 'Civic RS'            AND c.year = 2024) OR
        (c.brand = 'Honda'        AND c.model = 'HR-V L'              AND c.year = 2024) OR
        (c.brand = 'Hyundai'      AND c.model = 'Accent'              AND c.year = 2024) OR
        (c.brand = 'Hyundai'      AND c.model = 'Tucson'              AND c.year = 2023) OR
        (c.brand = 'Hyundai'      AND c.model = 'Santa Fe'            AND c.year = 2024) OR
        (c.brand = 'Kia'          AND c.model = 'K3'                  AND c.year = 2024) OR
        (c.brand = 'Kia'          AND c.model = 'Sportage'            AND c.year = 2024) OR
        (c.brand = 'Kia'          AND c.model = 'Carnival'            AND c.year = 2024) OR
        (c.brand = 'VinFast'      AND c.model = 'VF 8'                AND c.year = 2024) OR
        (c.brand = 'VinFast'      AND c.model = 'VF 9'                AND c.year = 2024) OR
        (c.brand = 'Mercedes-Benz' AND c.model = 'E300 AMG'           AND c.year = 2023) OR
        (c.brand = 'Mercedes-Benz' AND c.model = 'GLC 300'            AND c.year = 2024) OR
        (c.brand = 'BMW'          AND c.model = 'X3 xDrive'           AND c.year = 2024) OR
        (c.brand = 'BMW'          AND c.model = 'iX3'                 AND c.year = 2024) OR
        (c.brand = 'Mazda'        AND c.model = 'Mazda3 Sport'        AND c.year = 2024) OR
        (c.brand = 'Mazda'        AND c.model = 'CX-30'               AND c.year = 2024) OR
        (c.brand = 'Ford'         AND c.model = 'Everest Titanium'    AND c.year = 2024) OR
        (c.brand = 'Ford'         AND c.model = 'Mustang'             AND c.year = 2021) OR
        (c.brand = 'Lexus'        AND c.model = 'RX 350'              AND c.year = 2024) OR
        (c.brand = 'Lexus'        AND c.model = 'LX 600'              AND c.year = 2024) OR
        (c.brand = 'Audi'         AND c.model = 'Q5 Sportback'        AND c.year = 2024) OR
        (c.brand = 'Audi'         AND c.model = 'e-tron GT'           AND c.year = 2024) OR
        (c.brand = 'Porsche'      AND c.model = 'Macan'               AND c.year = 2024) OR
        (c.brand = 'Porsche'      AND c.model = 'Taycan'              AND c.year = 2024) OR
        (c.brand = 'Mitsubishi'   AND c.model = 'Xpander'             AND c.year = 2024) OR
        (c.brand = 'Mitsubishi'   AND c.model = 'Outlander'           AND c.year = 2024) OR
        (c.brand = 'Nissan'       AND c.model = 'X-Trail'             AND c.year = 2024) OR
        (c.brand = 'Volkswagen'   AND c.model = 'Teramont'            AND c.year = 2024) OR
        (c.brand = 'Peugeot'      AND c.model = '3008'                AND c.year = 2024) OR
        (c.brand = 'Land Rover'   AND c.model = 'Range Rover Sport'   AND c.year = 2024) OR
        (c.brand = 'Volvo'        AND c.model = 'XC60'                AND c.year = 2024) OR
        (c.brand = 'Chevrolet'    AND c.model = 'Trailblazer'         AND c.year = 2024) OR
        (c.brand = 'Subaru'       AND c.model = 'Forester'            AND c.year = 2024)
    )
WHERE u.email = 'seller@bk.com';

-- ===========================
-- 9. BÀI ĐĂNG DEMO CHO SELLER THỨ HAI (Sơn Tùng Auto)
-- ===========================
INSERT IGNORE INTO posts (seller_id, car_id, title, status)
SELECT 
    u.id AS seller_id,
    c.id AS car_id,
    CONCAT(c.brand, ' ', c.model, ' - Xe đã qua kiểm định tại Sơn Tùng Auto') AS title,
    'active' AS status
FROM users u
JOIN cars c ON
    (
        -- Xe gốc
        (c.brand = 'Mazda'        AND c.model = 'CX-5 Signature'      AND c.year = 2022) OR
        (c.brand = 'Toyota'       AND c.model = 'Camry 2.5Q'          AND c.year = 2021) OR
        (c.brand = 'VinFast'      AND c.model = 'LUX SA2'             AND c.year = 2023) OR
        (c.brand = 'Toyota'       AND c.model = 'Fortuner Legender'   AND c.year = 2023) OR
        (c.brand = 'Toyota'       AND c.model = 'Veloz Cross'         AND c.year = 2024) OR
        (c.brand = 'Honda'        AND c.model = 'Accord'              AND c.year = 2023) OR
        (c.brand = 'Honda'        AND c.model = 'BR-V'                AND c.year = 2023) OR
        (c.brand = 'Hyundai'      AND c.model = 'Creta'               AND c.year = 2023) OR
        (c.brand = 'Hyundai'      AND c.model = 'Stargazer'           AND c.year = 2024) OR
        (c.brand = 'Kia'          AND c.model = 'Morning'             AND c.year = 2023) OR
        (c.brand = 'Kia'          AND c.model = 'Seltos'              AND c.year = 2023) OR
        (c.brand = 'Kia'          AND c.model = 'Sorento'             AND c.year = 2023) OR
        (c.brand = 'VinFast'      AND c.model = 'VF e34'              AND c.year = 2023) OR
        (c.brand = 'VinFast'      AND c.model = 'LUX A2.0'            AND c.year = 2022) OR
        (c.brand = 'Mercedes-Benz' AND c.model = 'S450 Luxury'        AND c.year = 2022) OR
        (c.brand = 'Mercedes-Benz' AND c.model = 'A200'               AND c.year = 2023) OR
        (c.brand = 'BMW'          AND c.model = 'X5 M Sport'          AND c.year = 2023) OR
        (c.brand = 'BMW'          AND c.model = '530i M Sport'        AND c.year = 2022) OR
        (c.brand = 'Mazda'        AND c.model = 'Mazda6 Luxury'       AND c.year = 2023) OR
        (c.brand = 'Mazda'        AND c.model = 'CX-8 Premium'        AND c.year = 2023) OR
        (c.brand = 'Ford'         AND c.model = 'Territory'           AND c.year = 2023) OR
        (c.brand = 'Lexus'        AND c.model = 'ES 250'              AND c.year = 2023) OR
        (c.brand = 'Lexus'        AND c.model = 'NX 350h'             AND c.year = 2023) OR
        (c.brand = 'Audi'         AND c.model = 'A4'                  AND c.year = 2023) OR
        (c.brand = 'Audi'         AND c.model = 'Q7'                  AND c.year = 2023) OR
        (c.brand = 'Porsche'      AND c.model = 'Cayenne'             AND c.year = 2023) OR
        (c.brand = 'Mitsubishi'   AND c.model = 'Pajero Sport'        AND c.year = 2023) OR
        (c.brand = 'Nissan'       AND c.model = 'Navara'              AND c.year = 2023) OR
        (c.brand = 'Nissan'       AND c.model = 'Almera'              AND c.year = 2023) OR
        (c.brand = 'Volkswagen'   AND c.model = 'Tiguan'              AND c.year = 2023) OR
        (c.brand = 'Peugeot'      AND c.model = '5008'                AND c.year = 2023) OR
        (c.brand = 'Land Rover'   AND c.model = 'Defender'            AND c.year = 2023) OR
        (c.brand = 'Volvo'        AND c.model = 'XC90'                AND c.year = 2023) OR
        (c.brand = 'Chevrolet'    AND c.model = 'Colorado'            AND c.year = 2023) OR
        (c.brand = 'Subaru'       AND c.model = 'Outback'             AND c.year = 2023)
    )
WHERE u.email = 'seller2@bk.com';

-- =====================================================
-- 10. CÁC VIEWS
-- =====================================================

-- Xóa trước nếu đã tồn tại
DROP VIEW IF EXISTS v_active_posts;
DROP VIEW IF EXISTS v_user_favorites;
DROP VIEW IF EXISTS v_messages_detail;

-- View: bài đăng đang active kèm thông tin xe + seller
CREATE VIEW v_active_posts AS
SELECT 
    p.id          AS post_id,
    p.title       AS post_title,
    p.status      AS post_status,
    p.created_at  AS post_created_at,
    c.id          AS car_id,
    c.brand,
    c.model,
    c.year,
    c.price,
    c.mileage,
    c.image_url,
    u.id          AS seller_id,
    u.full_name   AS seller_name,
    u.phone       AS seller_phone,
    u.address     AS seller_address
FROM posts p
JOIN cars  c ON p.car_id   = c.id
JOIN users u ON p.seller_id = u.id
WHERE p.status = 'active';

-- View: danh sách xe yêu thích kèm thông tin người dùng + xe
CREATE VIEW v_user_favorites AS
SELECT
    f.id          AS favorite_id,
    f.created_at  AS favorited_at,
    u.id          AS user_id,
    u.full_name   AS user_name,
    c.id          AS car_id,
    c.brand,
    c.model,
    c.year,
    c.price,
    c.image_url
FROM favorites f
JOIN users    u ON f.user_id = u.id
JOIN cars     c ON f.car_id  = c.id;

-- View: chi tiết tin nhắn (sender/receiver name + thông tin xe)
CREATE VIEW v_messages_detail AS
SELECT
    m.id,
    m.sender_id,
    su.full_name AS sender_name,
    m.receiver_id,
    ru.full_name AS receiver_name,
    m.car_id,
    c.brand      AS car_brand,
    c.model      AS car_model,
    m.content,
    m.created_at
FROM messages m
JOIN users su ON m.sender_id  = su.id
JOIN users ru ON m.receiver_id = ru.id
LEFT JOIN cars c ON m.car_id  = c.id;

-- =====================================================
-- 11. FUNCTION: TÍNH TUỔI XE
-- =====================================================
DELIMITER $$

DROP FUNCTION IF EXISTS fn_car_age $$
CREATE FUNCTION fn_car_age(p_year INT)
RETURNS INT
DETERMINISTIC
BEGIN
    RETURN YEAR(CURDATE()) - p_year;
END $$

-- =====================================================
-- 12. PROCEDURE + CURSOR:
--     TỰ ĐỘNG CHUYỂN STATUS POST => 'expired'
--     CHO NHỮNG TIN QUÁ p_days NGÀY
-- =====================================================

DROP PROCEDURE IF EXISTS sp_expire_old_posts $$
CREATE PROCEDURE sp_expire_old_posts(IN p_days INT)
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_id INT;
    DECLARE v_created_at DATETIME;

    DECLARE cur_posts CURSOR FOR
        SELECT id, created_at
        FROM posts
        WHERE status = 'active';

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur_posts;

    read_loop: LOOP
        FETCH cur_posts INTO v_id, v_created_at;
        IF done = 1 THEN
            LEAVE read_loop;
        END IF;

        IF v_created_at < (NOW() - INTERVAL p_days DAY) THEN
            UPDATE posts
            SET status = 'expired'
            WHERE id = v_id;
        END IF;
    END LOOP;

    CLOSE cur_posts;
END $$

-- =====================================================
-- 13. TRIGGER: ĐỒNG BỘ STATUS POST <-> STATUS CAR
-- =====================================================

DROP TRIGGER IF EXISTS trg_posts_update_status $$
CREATE TRIGGER trg_posts_update_status
AFTER UPDATE ON posts
FOR EACH ROW
BEGIN
    -- Nếu post mới được đánh dấu 'sold' => set car.status = 'sold'
    IF NEW.status = 'sold' AND OLD.status <> 'sold' THEN
        UPDATE cars
        SET status = 'sold'
        WHERE id = NEW.car_id;
    -- Nếu post chuyển lại trạng thái 'active' hoặc 'pending'
    -- mà trước đó là 'sold' => set lại car.status = 'available'
    ELSEIF NEW.status IN ('active','pending') AND OLD.status = 'sold' THEN
        UPDATE cars
        SET status = 'available'
        WHERE id = NEW.car_id;
    END IF;
END $$

DELIMITER ;
