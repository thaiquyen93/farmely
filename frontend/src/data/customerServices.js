import { Bug, Droplets, Leaf, ShieldPlus } from 'lucide-react';

export const customerServices = [
  {
    id: 'watering-check',
    name: 'Tưới và kiểm tra độ ẩm',
    description: 'Kiểm tra đất, tưới theo tình trạng thực tế và gửi ảnh sau khi hoàn tất.',
    price: 120000,
    duration: '30–45 phút',
    icon: Droplets,
  },
  {
    id: 'weed-care',
    name: 'Dọn cỏ và vệ sinh luống',
    description: 'Nhổ cỏ quanh gốc, dọn luống và kiểm tra nhanh tình trạng cây.',
    price: 150000,
    duration: '45–60 phút',
    icon: Leaf,
  },
  {
    id: 'pest-check',
    name: 'Kiểm tra sâu bệnh',
    description: 'CVLĐ ghi nhận hiện trường, chụp ảnh và chuyển CGNN hướng dẫn khi cần.',
    price: 180000,
    duration: '45 phút',
    icon: Bug,
  },
  {
    id: 'temporary-care',
    name: 'Chăm vườn tạm thời',
    description: 'Farmely hỗ trợ các việc chăm sóc cơ bản trong 3 ngày khi bạn bận.',
    price: 320000,
    duration: 'Gói 3 ngày',
    icon: ShieldPlus,
  },
];

export const formatServicePrice = price => `${price.toLocaleString('vi-VN')} đ`;
