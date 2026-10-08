export const processTemplatesData = [
  {
    id: "TMPL-001",
    name: "Quy Trình VietGAP Cà Chua Bi Cherry Hữu Cơ Chuẩn Hóa",
    varietyId: "VAR-001",
    varietyName: "Cà chua bi Cherry Ruby F1",
    cropName: "Cà chua & Quả mọng",
    version: "v2.3",
    status: "ACTIVE",
    totalSteps: 7,
    createdDate: "2026-02-15",
    author: "ThS. Nguyễn Hoàng Nam",
    description: "Quy trình chăm sóc khép kín 75 ngày đạt chuẩn VietGAP cho cà chua bi cherry. Tự động sinh Care Task cho Chuyên viên lao động trong gói Assisted-growing.",
    steps: [
      {
        stepNumber: 1,
        dayOffset: 0,
        taskName: "Làm đất & Bón lót vi sinh",
        description: "Xới tơi đất tầng canh tác 25cm, rải phân trùn quế hoai mục (1.5kg/m²) kết hợp nấm đối kháng Trichoderma. Trải màng phủ nông nghiệp và đục lỗ định vị.",
        method: "Thủ công kết hợp máy xới mini",
        durationMinutes: 90,
        status: "COMPLETED",
        materialsRequired: "Phân trùn quế (15kg), Trichoderma (200g), Màng phủ sinh học"
      },
      {
        stepNumber: 2,
        dayOffset: 2,
        taskName: "Xuống giống cây con F1 đã ươm sẵn",
        description: "Cấy cây con 4 lá thật từ bộ Starter Kit F1 vào hố đã chuẩn bị. Tưới đẫm nước gốc bằng dung dịch kích rễ sinh học Humic Acid.",
        method: "Cấy tay nhẹ nhàng tránh vỡ bầu đất",
        durationMinutes: 60,
        status: "COMPLETED",
        materialsRequired: "30 cây giống F1 đạt chuẩn, dung dịch Humic pha loãng 1:500"
      },
      {
        stepNumber: 3,
        dayOffset: 7,
        taskName: "Bón thúc đợt 1 & Kiểm tra bén rễ",
        description: "Kiểm tra tỷ lệ sống (dặm lại nếu có cây chết). Bón thúc nhẹ phân đạm đậu tương lên men vào vùng rìa rễ.",
        method: "Bón rãnh cách gốc 10cm",
        durationMinutes: 45,
        status: "ACTIVE",
        materialsRequired: "Dịch đậu tương vi sinh (2 lít)"
      },
      {
        stepNumber: 4,
        dayOffset: 14,
        taskName: "Dựng giàn chữ A & Cố định thân leo",
        description: "Cắm cọc tre cao 1.8m tạo giàn chữ A kiên cố, luồn dây đay đỡ thân chính chống gãy đổ dưới gió mạnh.",
        method: "Dựng cọc và buộc nút số 8",
        durationMinutes: 75,
        status: "PENDING",
        materialsRequired: "Cọc tre tự nhiên (20 cọc), cuộn dây đay sinh học"
      },
      {
        stepNumber: 5,
        dayOffset: 21,
        taskName: "Tỉa chồi nách & Bấm ngọn cành phụ",
        description: "Vặt bỏ toàn bộ chồi nách dưới chùm hoa đầu tiên, chỉ giữ lại thân chính duy nhất để tập trung dưỡng chất.",
        method: "Dùng kéo chuyên dụng đã khử trùng cồn 70°",
        durationMinutes: 45,
        status: "PENDING",
        materialsRequired: "Kéo tỉa cành, cồn y tế khử trùng"
      },
      {
        stepNumber: 6,
        dayOffset: 35,
        taskName: "Phun phòng sinh học tỏi ớt gừng & Bón đón hoa",
        description: "Phun sương đều 2 mặt lá dung dịch thảo mộc phòng ngừa bọ trĩ và nhện đỏ. Bón bổ sung tro trấu giàu Kali hữu cơ.",
        method: "Bình xịt áp lực mini",
        durationMinutes: 60,
        status: "PENDING",
        materialsRequired: "Dung dịch tỏi ớt lên men (500ml), Tro trấu vi lượng (3kg)"
      },
      {
        stepNumber: 7,
        dayOffset: 70,
        taskName: "Thu hoạch đợt 1 & Cân đo điện tử",
        description: "Thu hoạch các chùm quả chín đỏ đều 90%. Cắt cuống để lại đài xanh, cân khối lượng bằng cân điện tử có ảnh chụp đối chứng.",
        method: "Thu hái thủ công buổi sáng sớm",
        durationMinutes: 90,
        status: "PENDING",
        materialsRequired: "Khay nhựa thoáng khí, cân điện tử kiểm định"
      }
    ]
  },
  {
    id: "TMPL-002",
    name: "Quy Trình Chuẩn Xà Lách Xoăn Lollo Bionda Mùa Hè",
    varietyId: "VAR-002",
    varietyName: "Xà lách Lollo Bionda Ý",
    cropName: "Rau ăn lá",
    version: "v3.0",
    status: "ACTIVE",
    totalSteps: 5,
    createdDate: "2026-03-01",
    author: "ThS. Nguyễn Hoàng Nam",
    description: "Quy trình ngắn ngày 35 ngày tối ưu hóa độ giòn và hạn chế tối đa nguy cơ dập úng khi mưa rào mùa hè.",
    steps: [
      {
        stepNumber: 1,
        dayOffset: 0,
        taskName: "Lên luống cao & Bón lót hữu cơ",
        description: "Tạo luống cao 20cm, rãnh thoát nước rộng 30cm. Bón lót phân trùn quế và vôi bột cân bằng pH.",
        method: "Thủ công",
        durationMinutes: 60,
        status: "COMPLETED",
        materialsRequired: "Phân trùn quế (10kg), vôi bột nông nghiệp (1kg)"
      },
      {
        stepNumber: 2,
        dayOffset: 2,
        taskName: "Cấy cây con xà lách & Phủ rơm giữ ẩm",
        description: "Cấy cây giống cách nhau 20x20cm so le, phủ rơm rạ sạch đã xử lý để tránh bùn bắn lên lá khi tưới.",
        method: "Cấy tay nhẹ nhàng",
        durationMinutes: 45,
        status: "COMPLETED",
        materialsRequired: "Cây con giống (40 cây), rơm sạch khử khuẩn"
      },
      {
        stepNumber: 3,
        dayOffset: 10,
        taskName: "Tưới bổ sung dịch vi sinh EM & Làm cỏ tay",
        description: "Tưới chế phẩm vi sinh phân giải hữu cơ, nhổ sạch cỏ dại cạnh tranh ánh sáng.",
        method: "Tưới thùng búp sen mịn",
        durationMinutes: 30,
        status: "ACTIVE",
        materialsRequired: "Dung dịch EM thứ cấp (1 lít)"
      },
      {
        stepNumber: 4,
        dayOffset: 20,
        taskName: "Kiểm tra sâu khoang & Che lưới giảm nắng",
        description: "Bắt sâu thủ công nếu có, kéo lưới lan màu đen che giảm 40% ánh sáng gắt buổi trưa giữ lá non giòn.",
        method: "Thao tác cơ học",
        durationMinutes: 40,
        status: "PENDING",
        materialsRequired: "Lưới lan cản nhiệt"
      },
      {
        stepNumber: 5,
        dayOffset: 35,
        taskName: "Thu hoạch toàn bộ & Đóng hộp Farmely Eco",
        description: "Cắt sát gốc vào sáng sớm lúc sương đọng, rửa sạch nước tinh khiết và đóng khay giao khách.",
        method: "Kéo tỉa thu hoạch",
        durationMinutes: 60,
        status: "PENDING",
        materialsRequired: "Hộp giấy kraft thực phẩm, nhãn dán QR Farmely"
      }
    ]
  },
  {
    id: "TMPL-003",
    name: "Quy Trình Giàn Leo Dưa Leo Baby Nhà Màng",
    varietyId: "VAR-003",
    varietyName: "Dưa leo Baby Hà Lan F1",
    cropName: "Dưa leo & Bầu bí",
    version: "v1.0",
    status: "DRAFT",
    totalSteps: 6,
    createdDate: "2026-03-25",
    author: "TS. Đặng Thu Thảo",
    description: "Phiên bản dự thảo đang chờ Hội đồng kỹ thuật thẩm định bổ sung bước kích thích hoa lưỡng tính.",
    steps: [
      {
        stepNumber: 1,
        dayOffset: 0,
        taskName: "Khử trùng đất & Bổ sung tro nông nghiệp",
        description: "Tưới đẫm dung dịch nano bạc sát khuẩn đất và phơi đất 2 ngày.",
        method: "Phun áp lực",
        durationMinutes: 60,
        status: "PENDING",
        materialsRequired: "Dung dịch nano bạc sinh học"
      }
    ]
  }
];
