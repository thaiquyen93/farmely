export const plotsData = [
  {
    id: "PLT-101",
    code: "P-101",
    name: "Thửa Đất Sen Vàng A1",
    landId: "LND-001",
    landName: "Nông Trại Củ Chi Eco Farm",
    area: "50 m²",
    soilType: "Đất phù sa bồi lắng giàu mùn (pH 6.2 - 6.8)",
    status: "AVAILABLE",
    rentalPrice: 1200000, // VND / tháng
    formattedPrice: "1.200.000 đ/tháng",
    careServicePrice: 600000, // Phí Assisted-growing / tháng
    iotStationId: "IOT-CC-01",
    iotStationName: "Trạm Cảm Biến Alpha 01",
    compatibleCrops: ["Cà chua bi Cherry", "Xà lách Lollo Bionda", "Dưa leo Baby"],
    description: "Thửa đất vị trí đắc địa tiếp giáp kênh tưới tự nhiên, đón nắng sớm 6-8 tiếng mỗi ngày. Đã hoàn thiện rãnh thoát nước chống ngập và trạm đo IoT vi khí hậu.",
    imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80"
    ],
    boundaryCoordinates: "Khu A - Lô 01, Hàng rào tre tự nhiên hướng Đông",
    currentCrop: null,
    tenantName: null,
    recentSensorReadings: {
      temperature: "28.5 °C",
      humidity: "74 %",
      soilMoisture: "68 %",
      lastUpdated: "10 phút trước"
    }
  },
  {
    id: "PLT-102",
    code: "P-102",
    name: "Thửa Đất Xanh Ngọc A2",
    landId: "LND-001",
    landName: "Nông Trại Củ Chi Eco Farm",
    area: "65 m²",
    soilType: "Đất thịt nhẹ pha phân trùn quế hữu cơ",
    status: "RENTED",
    rentalPrice: 1500000,
    formattedPrice: "1.500.000 đ/tháng",
    careServicePrice: 750000,
    iotStationId: "IOT-CC-02",
    iotStationName: "Trạm Cảm Biến Alpha 02",
    compatibleCrops: ["Cà chua bi Cherry", "Cải bó xôi Nhật", "Rau muống tiến vua"],
    description: "Khu đất đã phủ bạt giữ ẩm sinh học, đang canh tác Cà chua bi Cherry được 22 ngày tuổi theo hình thức Chăm sóc trọn gói (Assisted-growing).",
    imageUrl: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=80"
    ],
    boundaryCoordinates: "Khu A - Lô 02, Tiếp giáp luống A1",
    currentCrop: "Cà chua bi Cherry",
    tenantName: "Nguyễn Văn Hùng (KH-8821)",
    recentSensorReadings: {
      temperature: "29.1 °C",
      humidity: "71 %",
      soilMoisture: "65 %",
      lastUpdated: "5 phút trước"
    }
  },
  {
    id: "PLT-103",
    code: "P-103",
    name: "Thửa Đất Mặt Trời B1",
    landId: "LND-002",
    landName: "Khu Nông Nghiệp Đô Thị Long Phước",
    area: "80 m²",
    soilType: "Đất đỏ bazan pha cát thoáng khí (pH 6.5)",
    status: "AVAILABLE",
    rentalPrice: 1800000,
    formattedPrice: "1.800.000 đ/tháng",
    careServicePrice: 850000,
    iotStationId: "IOT-LP-01",
    iotStationName: "Trạm Cảm Biến Beta 01",
    compatibleCrops: ["Dưa leo Baby", "Ớt chuông ngọt", "Xà lách Romaine"],
    description: "Thửa đất nằm trong khuôn viên nhà màng bán mở, hệ thống phun sương làm mát tự động khi nhiệt độ vượt 33°C. Rất thích hợp trồng rau ăn quả.",
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80"
    ],
    boundaryCoordinates: "Khu B - Lô 01, Cổng vòm hướng Nam",
    currentCrop: null,
    tenantName: null,
    recentSensorReadings: {
      temperature: "27.8 °C",
      humidity: "78 %",
      soilMoisture: "72 %",
      lastUpdated: "12 phút trước"
    }
  },
  {
    id: "PLT-104",
    code: "P-104",
    name: "Thửa Đất Cao Nguyên D1",
    landId: "LND-003",
    landName: "Thung Lũng Xanh Đơn Dương Farm",
    area: "100 m²",
    soilType: "Đất mùn núi cao giàu khoáng vi lượng",
    status: "AVAILABLE",
    rentalPrice: 2200000,
    formattedPrice: "2.200.000 đ/tháng",
    careServicePrice: 950000,
    iotStationId: "IOT-DD-01",
    iotStationName: "Trạm Cảm Biến Gamma 01",
    compatibleCrops: ["Dâu tây Nhật Hana", "Cà chua bi Cherry", "Xà lách Lollo Bionda"],
    description: "Thửa đất tại vùng ôn đới cao nguyên, khí hậu se lạnh tuyệt vời. Thích hợp cho trải nghiệm gia đình lên thăm vườn vào cuối tuần kết hợp du lịch.",
    imageUrl: "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1000&q=80"
    ],
    boundaryCoordinates: "Khu D - Lô 01, Đồi thông sườn Đông",
    currentCrop: null,
    tenantName: null,
    recentSensorReadings: {
      temperature: "21.4 °C",
      humidity: "82 %",
      soilMoisture: "70 %",
      lastUpdated: "2 phút trước"
    }
  },
  {
    id: "PLT-105",
    code: "P-105",
    name: "Thửa Đất Cánh Đồng Xanh A3",
    landId: "LND-001",
    landName: "Nông Trại Củ Chi Eco Farm",
    area: "50 m²",
    soilType: "Đất phù sa bồi lắng",
    status: "RESERVED",
    rentalPrice: 1200000,
    formattedPrice: "1.200.000 đ/tháng",
    careServicePrice: 600000,
    iotStationId: "IOT-CC-03",
    iotStationName: "Trạm Cảm Biến Alpha 03",
    compatibleCrops: ["Xà lách Romaine", "Cải ngọt hữu cơ"],
    description: "Đang có khách hàng đặt giữ chỗ trong 15 phút và hoàn tất thủ tục thanh toán trọn gói.",
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80"
    ],
    boundaryCoordinates: "Khu A - Lô 03",
    currentCrop: null,
    tenantName: "Trần Mai Anh (Đang thanh toán)",
    recentSensorReadings: {
      temperature: "28.9 °C",
      humidity: "75 %",
      soilMoisture: "67 %",
      lastUpdated: "15 phút trước"
    }
  },
  {
    id: "PLT-106",
    code: "P-106",
    name: "Thửa Đất Tái Sinh B2",
    landId: "LND-002",
    landName: "Khu Nông Nghiệp Đô Thị Long Phước",
    area: "60 m²",
    soilType: "Đất đỏ bazan đang phơi ải",
    status: "MAINTENANCE",
    rentalPrice: 1400000,
    formattedPrice: "1.400.000 đ/tháng",
    careServicePrice: 700000,
    iotStationId: "IOT-LP-02",
    iotStationName: "Trạm Cảm Biến Beta 02",
    compatibleCrops: ["Dưa leo Baby", "Cà chua bi Cherry"],
    description: "Vừa kết thúc hợp đồng thuê vụ trước. Đang trong chu kỳ 4 ngày xới đất, phơi ải và bổ sung nấm đối kháng Trichoderma theo quy chuẩn BR23.",
    imageUrl: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=1000&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=1000&q=80"
    ],
    boundaryCoordinates: "Khu B - Lô 02",
    currentCrop: null,
    tenantName: null,
    recentSensorReadings: {
      temperature: "31.0 °C",
      humidity: "60 %",
      soilMoisture: "45 %",
      lastUpdated: "30 phút trước"
    }
  }
];
