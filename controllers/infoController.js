// controllers/infoController.js

exports.getNewsPage = (req, res) => {
    // Sau này nếu có DB tin tức thì lấy ở đây
    const sampleNews = [
        {
            id: 1,
            title: 'Toyota ra mắt mẫu Camry 2026 với động cơ hybrid mới',
            tag: 'Mẫu xe mới',
            date: '2025-11-20',
            summary: 'Camry 2026 sử dụng nền tảng hybrid thế hệ mới, tiết kiệm nhiên liệu hơn 15% so với đời trước, kèm theo gói an toàn Toyota Safety Sense 4.0.',
            image: 'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&cs=tinysrgb&w=800'
        },
        {
            id: 2,
            title: 'Công nghệ tự lái cấp độ 3 dần phổ biến tại thị trường châu Á',
            tag: 'Công nghệ',
            date: '2025-10-05',
            summary: 'Nhiều hãng xe bắt đầu thử nghiệm và triển khai công nghệ tự lái Level 3, cho phép xe tự vận hành trong một số điều kiện nhất định.',
            image: 'https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg?auto=compress&cs=tinysrgb&w=800'
        },
        {
            id: 3,
            title: 'Xu hướng xe điện tại Việt Nam: Hạ tầng sạc và ưu đãi thuế',
            tag: 'Xu hướng thị trường',
            date: '2025-09-12',
            summary: 'Thị trường xe điện tại Việt Nam tăng trưởng mạnh, kéo theo nhu cầu hạ tầng trạm sạc và các chính sách ưu đãi từ Nhà nước.',
            image: 'https://images.pexels.com/photos/799443/pexels-photo-799443.jpeg?auto=compress&cs=tinysrgb&w=800'
        }
    ];

    res.render('news', {
        active: 'news',
        newsList: sampleNews
    });
};

exports.getAboutPage = (req, res) => {
    res.render('about', {
        active: 'about'
    });
};
