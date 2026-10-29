/**
 * CROP STANDARD CULTIVATION PROCESS & STAFF ACTIVITY MANAGEMENT SERVICE
 * 
 * Quản lý Quy trình canh tác chuẩn VietGAP tính theo ngày tuổi cho từng loại cây trồng
 * và Lưu trữ / Truy xuất lịch sử hoạt động của nhân viên chăm sóc (Staff/Field Worker).
 */

// Bộ dữ liệu quy trình canh tác chuẩn VietGAP chi tiết theo từng ngày tuổi
export const CROP_STANDARDS = {
  'tomato': {
    cropName: 'Cà chua bi Cherry F1',
    totalDays: 45,
    expectedYield: '14 - 18 kg/thửa',
    optimalConditions: {
      tempRange: '20 - 30°C',
      soilMoistureRange: '60 - 75%',
      airHumidityRange: '60 - 80%',
      lightRequirement: '40.000 - 65.000 Lux (ưa nắng)'
    },
    stages: [
      {
        id: 'STAGE-1',
        stepOrder: 1,
        name: 'Gieo ươm & Hồi xanh rễ non',
        dayStart: 1,
        dayEnd: 7,
        label: 'Ngày 1 - 7',
        statusDesc: 'Giai đoạn thiết lập bộ rễ và thích nghi giá thể',
        waterRegime: '1.2 - 1.5 L/m²/ngày (tưới phun sương nhẹ 2 lần/ngày: 07:00 và 16:30)',
        nutrition: 'Tưới kích rễ bằng dịch chiết Humic & Acid Amin hữu cơ loãng (tỷ lệ 1:800)',
        guide: 'Che lưới đen 50% nắng trong 3 ngày đầu. Giữ ẩm giá thể liên tục ở mức 70-75%, tuyệt đối không để mặt đất đóng váng.',
        pestAlert: 'Đề phòng nấm lở cổ rễ (Rhizoctonia solani) và ốc sên cắn cây non ban đêm.',
        inspectionCriteria: 'Cây con thẳng đứng, có 3-4 lá thật màu xanh đậm, rễ trắng ăn sâu vào luống.'
      },
      {
        id: 'STAGE-2',
        stepOrder: 2,
        name: 'Phát triển thân lá & Định hình khung tán',
        dayStart: 8,
        dayEnd: 22,
        label: 'Ngày 8 - 22',
        statusDesc: 'Tăng trưởng sinh dưỡng nhanh, hình thành cành nhánh chính',
        waterRegime: '2.0 - 2.5 L/m²/ngày (tưới nhỏ giọt bổ sung độ ẩm tầng rễ)',
        nutrition: 'Bón thúc lần 1: Phân trùn quế ép viên (1.5 kg/gốc) kết hợp tưới đạm cá lên men vi sinh EM',
        guide: 'Tiến hành cắm cọc tre/buộc dây treo ngọn lên giàn thẳng đứng. Vặt bỏ các chồi nách phụ dưới nách lá số 5 để tập trung dinh dưỡng nuôi thân chính.',
        pestAlert: 'Bọ trĩ, rầy phấn trắng chích hút đọt non. Treo bẫy dính màu vàng cách mặt luống 30cm.',
        inspectionCriteria: 'Thân cây mập, đường kính gốc đạt 0.8 - 1.2 cm, lá xòe đều, không có dấu hiệu cong queo.'
      },
      {
        id: 'STAGE-3',
        stepOrder: 3,
        name: 'Phân hóa mầm hoa & Thụ phấn đậu quả',
        dayStart: 23,
        dayEnd: 35,
        label: 'Ngày 23 - 35',
        statusDesc: 'Cây ra chùm hoa thứ 1 đến thứ 4, thụ phấn tạo quả non',
        waterRegime: '1.8 - 2.2 L/m²/ngày (duy trì độ ẩm ổn định, tránh tưới đẫm làm rụng hoa)',
        nutrition: 'Bổ sung Kali hữu cơ (dịch chuối ủ vi sinh) và Canxi-Bo sinh học chống rụng hoa, nứt quả non',
        guide: 'Rung nhẹ thân cây hoặc dùng quạt nhẹ lúc 08:30 - 09:30 sáng khi phấn hoa chín để tăng tỷ lệ đậu trái. Tỉa bớt hoa dị hình, giữ lại 8-10 quả/chùm.',
        pestAlert: 'Sâu đục quả non và bệnh phấn trắng. Phun phòng chế phẩm gừng tỏi ớt lên men hoặc dầu Neem hữu cơ.',
        inspectionCriteria: 'Tỷ lệ đậu trái đạt > 85%, quả non bóng láng, cuống quả xanh tươi vững chắc.'
      },
      {
        id: 'STAGE-4',
        stepOrder: 4,
        name: 'Nuôi quả lớn & Chuyển màu chín',
        dayStart: 36,
        dayEnd: 42,
        label: 'Ngày 36 - 42',
        statusDesc: 'Quả tích lũy đường, chuyển từ xanh sang vàng cam và đỏ mọng',
        waterRegime: '1.2 - 1.5 L/m²/ngày (giảm 30% nước tưới để quả ngọt đậm và không bị nứt vỏ)',
        nutrition: 'Ngưng bón phân hóa học/hữu cơ đậm đặc, chỉ tưới nước sạch vi sinh đã khử clo',
        guide: 'Cắt tỉa toàn bộ lá già, lá vàng úa ở tầng đáy để tạo độ thông thoáng và đón ánh nắng mặt trời giúp quả chín đều màu.',
        pestAlert: 'Ruồi đục quả chín. Tăng cường bẫy pheromone sinh học quanh khu đất.',
        inspectionCriteria: 'Quả tròn căng, vỏ bóng láng, đạt độ chín đỏ từ 80% trở lên trên từng chùm.'
      },
      {
        id: 'STAGE-5',
        stepOrder: 5,
        name: 'Thu hoạch đạt chuẩn VietGAP & Đóng gói',
        dayStart: 43,
        dayEnd: 45,
        label: 'Ngày 43 - 45',
        statusDesc: 'Kiểm nghiệm dư lượng an toàn và tiến hành thu hái giao cho khách',
        waterRegime: 'Ngừng tưới 24h trước khi thu hái để bảo quản được lâu hơn',
        nutrition: 'Thời gian cách ly dinh dưỡng đạt 100% tiêu chuẩn VietGAP',
        guide: 'Thu hái bằng kéo chuyên dụng giữ nguyên cuống quả xanh tươi lúc 06:30 - 08:30 sáng. Xếp vào khay thoáng khí, cân mẫu và đóng gói gửi tới nhà khách.',
        pestAlert: 'Không ghi nhận sâu bệnh. Khâu vệ sinh dụng cụ hái đảm bảo vô trùng.',
        inspectionCriteria: 'Độ ngọt (Brix) đạt ≥ 9.5%, màu đỏ tươi đồng đều, quả chắc thịt, cuống xanh tươi.'
      }
    ]
  },

  'lettuce': {
    cropName: 'Xà lách Lô Lô Xanh Thủy Canh',
    totalDays: 32,
    expectedYield: '10 - 12 kg/thửa',
    optimalConditions: {
      tempRange: '18 - 26°C',
      soilMoistureRange: '65 - 80%',
      airHumidityRange: '65 - 85%',
      lightRequirement: '25.000 - 45.000 Lux (ưa râm mát)'
    },
    stages: [
      {
        id: 'STAGE-1',
        stepOrder: 1,
        name: 'Gieo ươm cây mầm & Ra rễ',
        dayStart: 1,
        dayEnd: 6,
        label: 'Ngày 1 - 6',
        statusDesc: 'Cây con nhú mầm và hình thành 2 lá mầm đầu tiên',
        waterRegime: 'Phun sương giữ ẩm 3 lần/ngày',
        nutrition: 'Nước lọc khoáng tự nhiên, chưa bổ sung dinh dưỡng đậm đặc',
        guide: 'Để khay ươm nơi thoáng mát, tránh ánh nắng trực tiếp.',
        pestAlert: 'Ốc sên và kiến tha hạt giống.',
        inspectionCriteria: 'Tỷ lệ nảy mầm > 92%, cây mầm mập mạp.'
      },
      {
        id: 'STAGE-2',
        stepOrder: 2,
        name: 'Cấy luống & Sinh trưởng sinh dưỡng',
        dayStart: 7,
        dayEnd: 18,
        label: 'Ngày 7 - 18',
        statusDesc: 'Bung lá xòe tán, phát triển bộ rễ xum xuê',
        waterRegime: 'Tưới ẩm luống 2 lần/ngày sáng và chiều',
        nutrition: 'Bón thúc đạm hữu cơ trùn quế & dịch đạm cá loãng',
        guide: 'Khoảng cách giữa các cây 18-20cm để tán lá có không gian xòe rộng.',
        pestAlert: 'Sâu tơ, sâu xanh ăn lá.',
        inspectionCriteria: 'Lá quăn xoăn tự nhiên, màu xanh nõn chuối mướt mắt.'
      },
      {
        id: 'STAGE-3',
        stepOrder: 3,
        name: 'Cuộn bắp & Tích tụ dưỡng chất',
        dayStart: 19,
        dayEnd: 28,
        label: 'Ngày 19 - 28',
        statusDesc: 'Tán lá xếp lớp tầng tầng, bẹ lá dày giòn',
        waterRegime: 'Tưới rãnh ngấm đáy, không phun trực tiếp vào ngọn bắp tránh đọng nước',
        nutrition: 'Bổ sung Canxi sinh học chống cháy mép lá (Tip-burn)',
        guide: 'Giữ ẩm tầng đất ổn định ở mức 70%, che nắng nhẹ lúc giữa trưa.',
        pestAlert: 'Nấm hạch và thối nhũn do đọng nước.',
        inspectionCriteria: 'Búp bắp chắc tay, lá giòn ngọt.'
      },
      {
        id: 'STAGE-4',
        stepOrder: 4,
        name: 'Thu hoạch tiêu chuẩn VietGAP',
        dayStart: 29,
        dayEnd: 32,
        label: 'Ngày 29 - 32',
        statusDesc: 'Cây đạt trọng lượng chuẩn 300 - 450g/cây, vị giòn ngọt thanh',
        waterRegime: 'Ngừng tưới 12h trước khi thu hái',
        nutrition: 'Đảm bảo 0% dư lượng nitrate',
        guide: 'Hái sớm lúc sương sớm còn đọng, rửa sạch gốc bằng nước RO và bọc màng thở chuyên dụng.',
        pestAlert: 'Không có sâu bệnh.',
        inspectionCriteria: 'Búp xà lách sạch sẽ, nặng tay, không dập nát.'
      }
    ]
  },

  'cucumber': {
    cropName: 'Dưa leo Baby F1 Giòn Ngọt',
    totalDays: 55,
    expectedYield: '35 - 45 kg/thửa',
    optimalConditions: {
      tempRange: '22 - 32°C',
      soilMoistureRange: '65 - 75%',
      airHumidityRange: '60 - 80%',
      lightRequirement: '35.000 - 60.000 Lux'
    },
    stages: [
      {
        id: 'STAGE-1',
        stepOrder: 1,
        name: 'Gieo hạt & Bén rễ hồi xanh',
        dayStart: 1,
        dayEnd: 7,
        label: 'Ngày 1 - 7',
        statusDesc: 'Cây con mọc 2 lá mầm và nhú lá thật thứ nhất',
        waterRegime: 'Tưới ẩm gốc nhẹ nhàng vào sáng sớm',
        nutrition: 'Phân hữu cơ vi sinh ủ hoai mục lót đáy luống',
        guide: 'Xới nhẹ mặt luống cho tơi xốp, giữ ẩm 70%.',
        pestAlert: 'Bọ nhảy cắn thủng lá mầm.',
        inspectionCriteria: 'Cây con cứng cáp, không bị gục thân.'
      },
      {
        id: 'STAGE-2',
        stepOrder: 2,
        name: 'Leo giàn & Phân cành nhánh',
        dayStart: 8,
        dayEnd: 25,
        label: 'Ngày 8 - 25',
        statusDesc: 'Thân leo phát triển nhanh 10-15cm mỗi ngày',
        waterRegime: 'Tưới nhỏ giọt duy trì ẩm 70%',
        nutrition: 'Bón thúc NPK hữu cơ nguồn gốc tảo biển',
        guide: 'Cột dây dẫn ngọn chữ A, bấm ngọn nhánh bên từ nách thứ 5 trở xuống.',
        pestAlert: 'Bọ trĩ mặt dưới lá và bệnh đốm phấn.',
        inspectionCriteria: 'Ngọn vươn cao, tua cuốn bám chắc vào lưới giàn.'
      },
      {
        id: 'STAGE-3',
        stepOrder: 3,
        name: 'Ra hoa rộ & Đậu quả liên tục',
        dayStart: 26,
        dayEnd: 42,
        label: 'Ngày 26 - 42',
        statusDesc: 'Hoa cái nở rộ ở mỗi nách lá, quả lớn nhanh',
        waterRegime: 'Tưới nước đều đặn mỗi ngày, dưa leo rất háo nước',
        nutrition: 'Bổ sung dịch trùn quế và Kali hữu cơ tăng độ giòn ngọt',
        guide: 'Tỉa bỏ hoa đực dị hình, giữ lại quả thẳng đẹp.',
        pestAlert: 'Sâu vẽ bùa và ruồi vàng chích quả non.',
        inspectionCriteria: 'Quả non mọc dày, da xanh bóng, có gai mịn.'
      },
      {
        id: 'STAGE-4',
        stepOrder: 4,
        name: 'Thu hái rộ & Đóng gói',
        dayStart: 43,
        dayEnd: 55,
        label: 'Ngày 43 - 55',
        statusDesc: 'Thu hái hàng ngày quả baby dài 10-12cm giòn ngọt',
        waterRegime: 'Tưới bù ẩm sau mỗi lượt hái',
        nutrition: 'Duy trì nước tưới vi sinh sạch',
        guide: 'Cắt quả bằng kéo lúc sáng sớm, quả dài 10-12cm là đạt tiêu chuẩn cao cấp.',
        pestAlert: 'Kiểm soát tốt không để nấm cuống quả.',
        inspectionCriteria: 'Dưa baby thon đều, ruột đặc ít hạt, giòn tan.'
      }
    ]
  },

  'water_spinach': {
    cropName: 'Rau muống cạn lá tre F1',
    totalDays: 30,
    expectedYield: '15 - 20 kg/thửa',
    optimalConditions: {
      tempRange: '25 - 32°C',
      soilMoistureRange: '75 - 85%',
      airHumidityRange: '70 - 90%',
      lightRequirement: '40.000 - 60.000 Lux (ưa nắng nhiệt đới)'
    },
    stages: [
      {
        id: 'STAGE-1',
        stepOrder: 1,
        name: 'Gieo hạt & Hồi xanh rễ',
        dayStart: 1,
        dayEnd: 6,
        label: 'Ngày 1 - 6',
        statusDesc: 'Hạt nảy mầm đều, rễ bám sâu giá thể',
        waterRegime: 'Tưới phun sương 2 lần/ngày (07:00 và 16:30), độ ẩm 75-85%',
        nutrition: 'Bón lót trùn quế vi sinh ủ hoai mục',
        guide: 'Giữ ẩm mặt luống liên tục, phủ rơm rạ hoặc lưới lan che nắng 2 ngày đầu.',
        pestAlert: 'Bọ nhảy cắn thủng mầm, ốc bươu vàng cắn gốc con ban đêm.',
        inspectionCriteria: 'Tỷ lệ nảy mầm > 95%, mầm cây đồng đều, thân thẳng mập.'
      },
      {
        id: 'STAGE-2',
        stepOrder: 2,
        name: 'Phát triển thân cành & Đẻ nhánh',
        dayStart: 7,
        dayEnd: 18,
        label: 'Ngày 7 - 18',
        statusDesc: 'Sinh trưởng sinh dưỡng mạnh, bung nhánh non',
        waterRegime: 'Tưới rãnh ngập 1/3 luống hoặc tưới đẫm 2.5 - 3.0 L/m²/ngày',
        nutrition: 'Bón thúc đạm cá hữu cơ lên men vi sinh pha loãng 1:500',
        guide: 'Xới nhẹ phá váng mặt luống, làm sạch cỏ dại cạnh tranh dinh dưỡng.',
        pestAlert: 'Sâu khoang ăn lá, bệnh rỉ trắng mặt dưới lá non.',
        inspectionCriteria: 'Thân vươn cao 15-20cm, lóng dài vừa phải, màu xanh bóng.'
      },
      {
        id: 'STAGE-3',
        stepOrder: 3,
        name: 'Chăm sóc sinh khối & Cách ly an toàn',
        dayStart: 19,
        dayEnd: 27,
        label: 'Ngày 19 - 27',
        statusDesc: 'Đọt non phát triển rộ, lá vươn đều, tích lũy khoáng',
        waterRegime: 'Duy trì độ ẩm 75-80%, ngừng tưới phân bón',
        nutrition: 'Thời gian cách ly dinh dưỡng theo tiêu chuẩn VietGAP',
        guide: 'Ngừng bón tất cả các loại phân bón và thuốc BVTV sinh học.',
        pestAlert: 'Bệnh đốm mắt cua do đọng sương, tưới rửa sương sớm nếu trời mù.',
        inspectionCriteria: 'Rau đồng đều, ngọn mập non, bẹ lá xanh non giòn ngọt.'
      },
      {
        id: 'STAGE-4',
        stepOrder: 4,
        name: 'Thu hoạch lứa 1 đạt chuẩn VietGAP',
        dayStart: 28,
        dayEnd: 30,
        label: 'Ngày 28 - 30',
        statusDesc: 'Thu hoạch cắt cách gốc 3-5cm để tái sinh lứa 2',
        waterRegime: 'Ngừng tưới 24h trước khi cắt thu hoạch',
        nutrition: 'Thời gian cách ly an toàn 100%',
        guide: 'Cắt rau bằng liềm/kéo sắc bén vào sáng sớm khi sương vừa tan. Xếp ráo nước, phân loại và đóng gói túi thông khí.',
        pestAlert: 'Không có sâu bệnh.',
        inspectionCriteria: 'Chiều dài ngọn 25-30cm, lá bóng mướt, không dập gãy.'
      }
    ]
  },

  'mustard_greens': {
    cropName: 'Cải ngọt & Cải ăn lá cao sản F1',
    totalDays: 35,
    expectedYield: '12 - 15 kg/thửa',
    optimalConditions: {
      tempRange: '18 - 28°C',
      soilMoistureRange: '65 - 75%',
      airHumidityRange: '65 - 80%',
      lightRequirement: '30.000 - 50.000 Lux'
    },
    stages: [
      {
        id: 'STAGE-1',
        stepOrder: 1,
        name: 'Gieo hạt & Hồi xanh cây non',
        dayStart: 1,
        dayEnd: 7,
        label: 'Ngày 1 - 7',
        statusDesc: 'Cây mọc 2 lá mầm đến 2 lá thật đầu tiên',
        waterRegime: 'Tưới phun sương nhẹ 2 lần/ngày, giữ ẩm đất 70-75%',
        nutrition: 'Bón lót phân trùn quế + Nấm đối kháng Trichoderma',
        guide: 'Tỉa định cây giữ khoảng cách 10-12cm giữa các cây.',
        pestAlert: 'Bọ nhảy họ bọ cánh cứng cắn lủng lỗ lá non.',
        inspectionCriteria: 'Cây con đứng vững, lá xanh bóng, rễ trắng khỏe.'
      },
      {
        id: 'STAGE-2',
        stepOrder: 2,
        name: 'Phát triển bẹ lá & Tán cây',
        dayStart: 8,
        dayEnd: 22,
        label: 'Ngày 8 - 22',
        statusDesc: 'Bẹ cuống dày lên, lá xòe rộng màu xanh mỡ',
        waterRegime: 'Tưới nhỏ giọt hoặc phun sương 2.0 L/m²/ngày',
        nutrition: 'Bón thúc đạm hữu cơ vi sinh và dịch rong biển kích rễ',
        guide: 'Vun gốc nhẹ giữ thân đứng thẳng, nhổ sạch cỏ dại quanh gốc.',
        pestAlert: 'Sâu tơ, sâu xanh da láng hại rau chữ thập.',
        inspectionCriteria: 'Lá dày bóng, cuống bẹ trắng nõn hoặc xanh non, tán rộng.'
      },
      {
        id: 'STAGE-3',
        stepOrder: 3,
        name: 'Tích lũy sinh khối & Cách ly PHI',
        dayStart: 23,
        dayEnd: 31,
        label: 'Ngày 23 - 31',
        statusDesc: 'Bẹ lá đầy đặn, cây đạt độ giòn và trọng lượng chuẩn',
        waterRegime: 'Tưới nước sạch khử clo, giữ ẩm đất 65-70%',
        nutrition: 'Tuyệt đối ngưng bón phân hóa học và đạm, thực hiện cách ly',
        guide: 'Kiểm tra dư lượng nitrate và kiểm dịch an toàn thực phẩm.',
        pestAlert: 'Thối nhũn vi khuẩn nếu mưa nhiều hoặc úng trũng.',
        inspectionCriteria: 'Cây cải cứng cáp, bẹ giòn ngọt, không vết châm chích.'
      },
      {
        id: 'STAGE-4',
        stepOrder: 4,
        name: 'Thu hoạch nhổ nguyên cây VietGAP',
        dayStart: 32,
        dayEnd: 35,
        label: 'Ngày 32 - 35',
        statusDesc: 'Thu hoạch đóng thùng chuyển khách hàng',
        waterRegime: 'Ngừng tưới 12-24h trước khi thu hái',
        nutrition: 'Thời gian cách ly hoàn tất 100%',
        guide: 'Thu hoạch lúc sáng sớm, nhổ hoặc cắt sát gốc, tỉa lá già chân gốc, rửa sạch bằng nước RO và làm mát sơ bộ.',
        pestAlert: 'Không sâu bệnh.',
        inspectionCriteria: 'Trọng lượng 150-250g/cây, bẹ giòn ngọt, lá nguyên vẹn.'
      }
    ]
  },

  'french_bean': {
    cropName: 'Đậu cô ve leo xanh giòn F1',
    totalDays: 55,
    expectedYield: '18 - 22 kg/thửa',
    optimalConditions: {
      tempRange: '20 - 28°C',
      soilMoistureRange: '65 - 75%',
      airHumidityRange: '60 - 80%',
      lightRequirement: '35.000 - 55.000 Lux'
    },
    stages: [
      {
        id: 'STAGE-1',
        stepOrder: 1,
        name: 'Gieo hạt & Cây con bén rễ',
        dayStart: 1,
        dayEnd: 10,
        label: 'Ngày 1 - 10',
        statusDesc: 'Hạt nảy mầm khỏe, xuất hiện lá thật kép đầu tiên',
        waterRegime: 'Tưới ẩm nhẹ, tránh tưới úng làm thối hạt đậu giống',
        nutrition: 'Bón lót phân hữu cơ vi sinh ủ hoai',
        guide: 'Cắm chà giàn sớm khi cây nhú tua cuốn đầu tiên ở ngày thứ 8-10.',
        pestAlert: 'Ruồi đục lá và bọ trĩ phá mầm.',
        inspectionCriteria: 'Cây con mập khỏe, tua cuốn vươn cao bám cọc.'
      },
      {
        id: 'STAGE-2',
        stepOrder: 2,
        name: 'Leo giàn & Phân cành hoa',
        dayStart: 11,
        dayEnd: 30,
        label: 'Ngày 11 - 30',
        statusDesc: 'Thân leo phủ kín giàn chữ A, ra nụ hoa nách',
        waterRegime: 'Tưới nhỏ giọt duy trì 2.0 L/m²/ngày',
        nutrition: 'Bón thúc lân và kali hữu cơ kích thích bật mầm hoa',
        guide: 'Cố định thân dây đều trên lưới giàn, vặt bỏ lá già chân gốc.',
        pestAlert: 'Rệp muội đen bu bám chùm hoa, nhện đỏ mặt dưới lá.',
        inspectionCriteria: 'Dây leo xanh tốt, đốt mắt đều, chùm hoa phân bổ dày.'
      },
      {
        id: 'STAGE-3',
        stepOrder: 3,
        name: 'Nở hoa rộ & Đậu quả non',
        dayStart: 31,
        dayEnd: 45,
        label: 'Ngày 31 - 45',
        statusDesc: 'Hoa trắng tím nở rộ, quả non hình thành dày đặc',
        waterRegime: 'Tưới đủ ẩm đều đặn, không để khô hạn làm rụng quả non',
        nutrition: 'Bổ sung Canxi-Bo sinh học chống rụng hoa và lép quả',
        guide: 'Rung nhẹ giàn buổi sáng hỗ trợ thụ phấn, giữ đất ẩm 70%.',
        pestAlert: 'Sâu đục quả non bám cuống đậu.',
        inspectionCriteria: 'Tỷ lệ đậu quả cao, quả non suôn thẳng, không sần sùi.'
      },
      {
        id: 'STAGE-4',
        stepOrder: 4,
        name: 'Nuôi quả thẳng & Thu hái từng đợt',
        dayStart: 46,
        dayEnd: 55,
        label: 'Ngày 46 - 55',
        statusDesc: 'Quả tròn hạt chưa nổi gồ, độ giòn ngọt tối đa',
        waterRegime: 'Tưới nhẹ sau mỗi đợt hái',
        nutrition: 'Ngừng bón phân, cách ly an toàn',
        guide: 'Thu hái liên tục cách ngày 1 lần vào buổi sáng sớm, quả dài 15-18cm cuống xanh.',
        pestAlert: 'Không có sâu bệnh.',
        inspectionCriteria: 'Quả xanh bóng, bẻ đôi nghe tiếng giòn rụm, hạt nhỏ.'
      }
    ]
  },

  'luffa': {
    cropName: 'Mướp hương cao sản F1',
    totalDays: 65,
    expectedYield: '25 - 35 kg/thửa',
    optimalConditions: {
      tempRange: '24 - 32°C',
      soilMoistureRange: '70 - 80%',
      airHumidityRange: '65 - 85%',
      lightRequirement: '40.000 - 60.000 Lux (ưa nắng mạnh)'
    },
    stages: [
      {
        id: 'STAGE-1',
        stepOrder: 1,
        name: 'Ươm mầm & Cây con hồi xanh',
        dayStart: 1,
        dayEnd: 10,
        label: 'Ngày 1 - 10',
        statusDesc: 'Nảy mầm và phát triển rễ non khỏe mạnh',
        waterRegime: 'Tưới giữ ẩm 1.5 L/m²/ngày',
        nutrition: 'Bón lót phân trùn quế đáy hố',
        guide: 'Làm giàn lưới cao 2m hình mái bằng hoặc chữ U thoáng đãng.',
        pestAlert: 'Dế cắn đứt thân con, bọ cánh cứng ăn lá mầm.',
        inspectionCriteria: 'Cây con xanh mướt, thân mập, 3 lá thật.'
      },
      {
        id: 'STAGE-2',
        stepOrder: 2,
        name: 'Leo giàn giăng tán & Phân cành',
        dayStart: 11,
        dayEnd: 32,
        label: 'Ngày 11 - 32',
        statusDesc: 'Ngọn vươn lên giàn cao, phát triển nhiều nhánh cấp 1',
        waterRegime: 'Tưới ẩm 2.5 L/m²/ngày',
        nutrition: 'Bón thúc NPK hữu cơ nguồn cá biển',
        guide: 'Dẫn dây leo lên giàn, bấm ngọn chính ở độ cao 1.8m để kích nhánh ngang.',
        pestAlert: 'Bọ trĩ, rầy phấn trắng, sương mai lá già.',
        inspectionCriteria: 'Giàn phủ kín lá xanh thẫm, tua cuốn bám chặt.'
      },
      {
        id: 'STAGE-3',
        stepOrder: 3,
        name: 'Ra hoa rộ & Thụ phấn nuôi quả',
        dayStart: 33,
        dayEnd: 52,
        label: 'Ngày 33 - 52',
        statusDesc: 'Hoa vàng nở rộ khắp giàn, quả lớn nhanh',
        waterRegime: 'Tưới đủ nước đều đặn, cây cần nước nuôi quả',
        nutrition: 'Bổ sung dịch chuối ủ Kali hữu cơ giúp quả thơm ngọt',
        guide: 'Bọc túi bao trái sinh học chống ruồi vàng chích quả non.',
        pestAlert: 'Ruồi vàng đục quả (Bactrocera cucurbitae).',
        inspectionCriteria: 'Quả suôn thẳng thon dài, mùi thơm ngát đặc trưng.'
      },
      {
        id: 'STAGE-4',
        stepOrder: 4,
        name: 'Thu hái quả non rộ đợt 1',
        dayStart: 53,
        dayEnd: 65,
        label: 'Ngày 53 - 65',
        statusDesc: 'Thu hái quả non dài 25-30cm vỏ mềm thơm',
        waterRegime: 'Duy trì tưới sau mỗi đợt hái để nuôi lứa tiếp',
        nutrition: 'Cách ly an toàn VietGAP',
        guide: 'Cắt cuống quả bằng kéo chuyên dụng, bọc xốp lưới bảo vệ vỏ mướp.',
        pestAlert: 'Không có sâu bệnh.',
        inspectionCriteria: 'Quả suôn dài, vỏ xanh non, ấn tay nhẹ còn độ đàn hồi.'
      }
    ]
  },

  'malabar_spinach': {
    cropName: 'Rau mồng tơi lá to F1',
    totalDays: 35,
    expectedYield: '14 - 18 kg/thửa',
    optimalConditions: {
      tempRange: '25 - 33°C',
      soilMoistureRange: '70 - 80%',
      airHumidityRange: '70 - 85%',
      lightRequirement: '35.000 - 50.000 Lux'
    },
    stages: [
      {
        id: 'STAGE-1',
        stepOrder: 1,
        name: 'Gieo hạt & Bén rễ cây con',
        dayStart: 1,
        dayEnd: 8,
        label: 'Ngày 1 - 8',
        statusDesc: 'Cây mọc lá mầm dày mọng nước',
        waterRegime: 'Tưới phun sương nhẹ 2 lần/ngày',
        nutrition: 'Bón lót vi sinh hữu cơ hoai mục',
        guide: 'Giữ ẩm mặt luống liên tục ở mức 75%.',
        pestAlert: 'Ốc sên cắn lá mầm non.',
        inspectionCriteria: 'Cây con cứng cáp, lá mầm dày xanh đậm.'
      },
      {
        id: 'STAGE-2',
        stepOrder: 2,
        name: 'Phát triển thân lá sinh dưỡng',
        dayStart: 9,
        dayEnd: 24,
        label: 'Ngày 9 - 24',
        statusDesc: 'Thân mập tím hoặc xanh bóng, lá to dày mọng',
        waterRegime: 'Tưới đẫm 2.0 L/m²/ngày',
        nutrition: 'Bón thúc đạm cá vi sinh hòa loãng',
        guide: 'Bấm ngọn khi thân cao 25cm để kích thích đẻ nhiều nhánh nách.',
        pestAlert: 'Đốm mắt cua và rầy mềm hại lá non.',
        inspectionCriteria: 'Lá phiến to tròn, xanh bóng mỡ màng, thân mập.'
      },
      {
        id: 'STAGE-3',
        stepOrder: 3,
        name: 'Tích lũy chất nhầy & Cách ly PHI',
        dayStart: 25,
        dayEnd: 31,
        label: 'Ngày 25 - 31',
        statusDesc: 'Đọt non vươn đều, búp lá dày giòn mọng nước',
        waterRegime: 'Tưới nước sạch khử clo',
        nutrition: 'Cách ly dinh dưỡng VietGAP',
        guide: 'Không bón phân trong 7 ngày trước thu hoạch.',
        pestAlert: 'Thối gốc do mưa nhiều.',
        inspectionCriteria: 'Đọt non mập, lá bóng khỏe, không dư lượng nitrat.'
      },
      {
        id: 'STAGE-4',
        stepOrder: 4,
        name: 'Thu hái ngọn non đợt 1',
        dayStart: 32,
        dayEnd: 35,
        label: 'Ngày 32 - 35',
        statusDesc: 'Thu hoạch cắt ngọn dài 20cm',
        waterRegime: 'Ngừng tưới 12h trước hái',
        nutrition: 'Thời gian cách ly hoàn tất',
        guide: 'Hái ngọn non bằng kéo bấm, bó thành từng bó 500g ráo nước.',
        pestAlert: 'Không có sâu bệnh.',
        inspectionCriteria: 'Đọt non búp to tròn, mọng nước, không xước lá.'
      }
    ]
  },

  'chili': {
    cropName: 'Ớt cay / Ớt chỉ thiên F1',
    totalDays: 85,
    expectedYield: '10 - 15 kg/thửa',
    optimalConditions: {
      tempRange: '22 - 30°C',
      soilMoistureRange: '60 - 70%',
      airHumidityRange: '60 - 75%',
      lightRequirement: '40.000 - 65.000 Lux (ưa nắng ráo)'
    },
    stages: [
      {
        id: 'STAGE-1',
        stepOrder: 1,
        name: 'Ươm cây con & Hồi xanh rễ',
        dayStart: 1,
        dayEnd: 15,
        label: 'Ngày 1 - 15',
        statusDesc: 'Cây con bén rễ thích nghi luống trồng',
        waterRegime: 'Tưới ẩm vừa phải 1.2 L/m²/ngày',
        nutrition: 'Bón lót trùn quế + Lân vi sinh',
        guide: 'Tránh tưới đọng gốc gây thối rễ non, cắm que đỡ thân con.',
        pestAlert: 'Lở cổ rễ cây con, bọ trĩ xoăn ngọn.',
        inspectionCriteria: 'Cây con có 5-6 lá thật xanh đậm, rễ đâm khỏe.'
      },
      {
        id: 'STAGE-2',
        stepOrder: 2,
        name: 'Phát triển tán cây & Phân nhánh chữ Y',
        dayStart: 16,
        dayEnd: 42,
        label: 'Ngày 16 - 42',
        statusDesc: 'Hình thành chạc ba chữ Y đầu tiên, tán xòe tròn',
        waterRegime: 'Tưới nhỏ giọt ẩm 65%',
        nutrition: 'Bón thúc NPK hữu cơ cân đối',
        guide: 'Tỉa bỏ chồi nách dưới điểm phân cành đầu tiên để thông thoáng gốc.',
        pestAlert: 'Rầy mềm, nhện trắng cắn phá mặt dưới lá.',
        inspectionCriteria: 'Thân gốc hóa gỗ cứng cáp, tán tròn đều, lá xanh bóng.'
      },
      {
        id: 'STAGE-3',
        stepOrder: 3,
        name: 'Ra hoa rộ & Đậu quả chỉ thiên',
        dayStart: 43,
        dayEnd: 68,
        label: 'Ngày 43 - 68',
        statusDesc: 'Hoa trắng nở rộ ở các nách lá, quả non chĩa thẳng lên trời',
        waterRegime: 'Duy trì ẩm ổn định, không tưới đẫm vào hoa',
        nutrition: 'Bổ sung Canxi-Bo sinh học chống rụng hoa và nứt đuôi quả',
        guide: 'Chống đổ ngã bằng dây căng dọc luống hai bên tán cây.',
        pestAlert: 'Bệnh thán thư (Colletotrichum) đốm mắt cua trên quả non.',
        inspectionCriteria: 'Quả chỉ thiên mọc đều hướng lên trên, da bóng láng.'
      },
      {
        id: 'STAGE-4',
        stepOrder: 4,
        name: 'Quả chín đỏ rộ & Thu hoạch đợt 1',
        dayStart: 69,
        dayEnd: 85,
        label: 'Ngày 69 - 85',
        statusDesc: 'Quả chuyển màu đỏ tươi đồng đều, độ cay thơm tối đa',
        waterRegime: 'Giảm tưới 30% để quả cay đậm và giữ được lâu',
        nutrition: 'Cách ly dinh dưỡng 100%',
        guide: 'Hái quả chín đỏ nguyên cuống vào buổi sáng ráo sương, phân loại đóng hộp.',
        pestAlert: 'Không có sâu bệnh.',
        inspectionCriteria: 'Màu đỏ tươi bóng, cuống quả xanh tươi dính chặt.'
      }
    ]
  },

  'amaranth': {
    cropName: 'Rau dền đỏ / dền cơm VietGAP',
    totalDays: 30,
    expectedYield: '12 - 16 kg/thửa',
    optimalConditions: {
      tempRange: '23 - 32°C',
      soilMoistureRange: '70 - 80%',
      airHumidityRange: '65 - 80%',
      lightRequirement: '35.000 - 50.000 Lux'
    },
    stages: [
      {
        id: 'STAGE-1',
        stepOrder: 1,
        name: 'Gieo hạt & Cây con bén rễ',
        dayStart: 1,
        dayEnd: 6,
        label: 'Ngày 1 - 6',
        statusDesc: 'Cây con mọc lá mầm đỏ tía hoặc xanh non',
        waterRegime: 'Tưới phun sương nhẹ 2 lần/ngày sáng sớm và chiều mát',
        nutrition: 'Bón lót phân trùn quế hoai mục',
        guide: 'Gieo vãi đều hạt trộn tro trấu để tránh cây mọc quá dày.',
        pestAlert: 'Sâu khoang ăn lá con, bọ nhảy cắn mầm.',
        inspectionCriteria: 'Cây mầm mọc đều khắp luống, màu sắc tươi tắn.'
      },
      {
        id: 'STAGE-2',
        stepOrder: 2,
        name: 'Tỉa định khoảng cách & Bón thúc',
        dayStart: 7,
        dayEnd: 18,
        label: 'Ngày 7 - 18',
        statusDesc: 'Cây con lớn nhanh, phiến lá to rộng',
        waterRegime: 'Tưới đều 2.0 L/m²/ngày',
        nutrition: 'Bón thúc đạm cá vi sinh pha loãng 1:600',
        guide: 'Tỉa bớt cây con ăn sớm (tỉa dặm), giữ khoảng cách 10x10cm.',
        pestAlert: 'Sâu cuốn lá, sâu xanh ăn đọt.',
        inspectionCriteria: 'Thân mập giòn, màu sắc lá rực rỡ, phiến lá dày.'
      },
      {
        id: 'STAGE-3',
        stepOrder: 3,
        name: 'Phát triển sinh khối & Cách ly PHI',
        dayStart: 19,
        dayEnd: 26,
        label: 'Ngày 19 - 26',
        statusDesc: 'Cây đạt chiều cao 25-30cm, lá mướt giòn ngọt',
        waterRegime: 'Tưới nước sạch đã khử clo',
        nutrition: 'Thời gian cách ly an toàn VietGAP',
        guide: 'Ngừng bón phân, giữ ẩm đất ổn định.',
        pestAlert: 'Đốm lá do sương đọng.',
        inspectionCriteria: 'Lá nguyên vẹn không thủng lỗ, thân non mềm giòn.'
      },
      {
        id: 'STAGE-4',
        stepOrder: 4,
        name: 'Thu hoạch nhổ tỉa hoặc cắt ngọn',
        dayStart: 27,
        dayEnd: 30,
        label: 'Ngày 27 - 30',
        statusDesc: 'Nhổ cả cây hoặc cắt ngọn cách gốc 5cm',
        waterRegime: 'Ngừng tưới 12h trước khi thu hái',
        nutrition: 'Hoàn tất cách ly 100%',
        guide: 'Thu hoạch sáng sớm, rửa sạch đất rễ bằng nước RO, bó thành từng bó 300-500g.',
        pestAlert: 'Không có sâu bệnh.',
        inspectionCriteria: 'Rau dền tươi rói, không dập nát, thân mềm giòn ngọt.'
      }
    ]
  }
};

/**
 * Phân tích và sinh quy trình chuẩn theo ngày dựa trên thông tin thửa đất
 */
export function resolveStandardCropProcess(plot, dbStages = []) {
  if (!plot) return { cropName: 'Cây trồng', totalDays: 45, currentDay: 0, stages: [], isNotStarted: true };

  const cropKey = detectCropKey(plot.crop || plot.name || '');
  const standardTemplate = CROP_STANDARDS[cropKey] || CROP_STANDARDS.tomato;

  const totalDays = Number(plot.totalDays) || standardTemplate.totalDays || 45;

  // Kiểm tra vụ mùa đã bắt đầu hay chưa (currentDay = 0 hoặc status = 'SCHEDULED' hoặc isScheduled hoặc startDate trong tương lai)
  const isFutureStartDate = Boolean(
    plot.startDate && new Date(plot.startDate).setHours(0, 0, 0, 0) > new Date().setHours(0, 0, 0, 0)
  );
  const isNotStarted = plot.seasonStatus === 'SCHEDULED' || Number(plot.currentDay) === 0 || Boolean(plot.isScheduled) || isFutureStartDate;

  let currentDay = 0;
  let progressPercent = 0;

  if (isNotStarted) {
    currentDay = 0;
    progressPercent = 0;
  } else {
    // Nếu có giá trị currentDay hợp lệ (> 0): dùng giá trị đó, ngược lại mới fallback
    const rawDay = plot.currentDay !== undefined && plot.currentDay !== null && !isNaN(Number(plot.currentDay))
      ? Number(plot.currentDay)
      : Math.round(totalDays * 0.58);
    currentDay = Math.min(totalDays, Math.max(1, rawDay));
    progressPercent = Math.min(100, Math.round((currentDay / totalDays) * 100));
  }

  const baseTotal = standardTemplate.totalDays || 45;
  const scale = totalDays > 0 ? totalDays / baseTotal : 1;
  const shouldScale = Math.abs(scale - 1) > 0.05 && (!dbStages || dbStages.length === 0);

  let currentCursor = 1;
  // Tính toán trạng thái các giai đoạn (tự động co giãn theo tổng ngày chu kỳ)
  const computedStages = standardTemplate.stages.map((st, sIdx) => {
    let dayStart = st.dayStart;
    let dayEnd = st.dayEnd;

    if (shouldScale) {
      dayStart = currentCursor;
      if (sIdx === standardTemplate.stages.length - 1) {
        dayEnd = totalDays;
      } else {
        const rawDur = Math.max(1, st.dayEnd - st.dayStart + 1);
        const scaledDur = Math.max(2, Math.round(rawDur * scale));
        dayEnd = Math.min(totalDays - (standardTemplate.stages.length - 1 - sIdx), currentCursor + scaledDur - 1);
      }
      currentCursor = dayEnd + 1;
    }

    let status = 'PENDING';
    if (!isNotStarted) {
      if (currentDay > dayEnd) {
        status = 'COMPLETED';
      } else if (currentDay >= dayStart && currentDay <= dayEnd) {
        status = 'IN_PROGRESS';
      }
    }

    // Nếu có dữ liệu từ DB (template_steps), merge thông tin
    const matchingDb = dbStages.find((d) => 
      d.stepOrder === st.stepOrder || 
      (d.stage && d.stage.toLowerCase().includes(st.name.slice(0, 10).toLowerCase()))
    );

    return {
      ...st,
      dayStart,
      dayEnd,
      label: `Ngày ${dayStart} - ${dayEnd}`,
      status: matchingDb?.status || status,
      guide: matchingDb?.guide || st.guide,
      materials: matchingDb?.materials || st.nutrition,
      isCurrent: !isNotStarted && status === 'IN_PROGRESS',
      daysUntil: currentDay < dayStart ? dayStart - currentDay : 0,
      daysElapsed: currentDay > dayEnd ? (dayEnd - dayStart + 1) : Math.max(0, currentDay - dayStart + 1)
    };
  });

  const currentStageObj = isNotStarted
    ? {
        ...computedStages[0],
        name: `Sắp tới: ${computedStages[0].name}`,
        statusDesc: `Vụ mùa sắp tới (Khởi động ngày ${plot.startDate ? new Date(plot.startDate).toLocaleDateString('vi-VN') : 'Kỳ tới'}). Đất đang trong giai đoạn nghỉ hoặc hoàn thiện chuẩn bị xuống giống theo lịch canh tác.`,
        isCurrent: false
      }
    : (computedStages.find((s) => s.isCurrent) || computedStages[computedStages.length - 1]);

  return {
    cropKey,
    cropName: standardTemplate.cropName,
    plotName: plot.name,
    plotCode: plot.plotCode || plot.id,
    totalDays,
    currentDay,
    daysLeft: isNotStarted ? totalDays : Math.max(0, totalDays - currentDay),
    progressPercent,
    currentStage: currentStageObj,
    stages: computedStages,
    optimalConditions: standardTemplate.optimalConditions,
    expectedYield: plot.expectedYield || standardTemplate.expectedYield,
    isNotStarted
  };
}

export function detectCropKey(cropText) {
  const t = String(cropText).toLowerCase();
  if (t.includes('xà lách') || t.includes('lettuce') || t.includes('lô lô') || t.includes('romaine')) return 'lettuce';
  if (t.includes('dưa') || t.includes('cucumber') || t.includes('baby')) return 'cucumber';
  if (t.includes('muống') || t.includes('water spinach')) return 'water_spinach';
  if (t.includes('cải') || t.includes('mustard') || t.includes('ngọt') || t.includes('thìa') || t.includes('chíp')) return 'mustard_greens';
  if (t.includes('đậu') || t.includes('cô ve') || t.includes('french bean')) return 'french_bean';
  if (t.includes('mướp') || t.includes('luffa')) return 'luffa';
  if (t.includes('mồng tơi') || t.includes('malabar')) return 'malabar_spinach';
  if (t.includes('ớt') || t.includes('chili') || t.includes('cay')) return 'chili';
  if (t.includes('dền') || t.includes('amaranth')) return 'amaranth';
  if (t.includes('cà chua') || t.includes('cherry') || t.includes('tomato')) return 'tomato';
  return 'tomato';
}

/* ──────────────────────────────────────────────────────────────────────────
   LƯU TRỮ & TRUY XUẤT HOẠT ĐỘNG CỦA NHÂN VIÊN CHĂM SÓC (STAFF ACTIVITIES)
   ────────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'farmely_persisted_staff_activities_v2';

/**
 * Danh mục các hoạt động mẫu chuẩn chỉnh chu của kỹ thuật viên Farmely
 */
export const DEFAULT_STAFF_ACTIVITIES = [
  {
    activityId: 'ACT-001',
    plotId: 'P-01',
    plotCode: 'P-01',
    rentalId: 1,
    workerId: 8,
    workerName: 'Trần Văn Lực',
    workerRole: 'Kỹ thuật viên hiện trường chuyên trách',
    workerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    actionType: 'WATERING',
    actionTypeName: 'Tưới vi sinh & Cân bằng ẩm',
    title: 'Tưới ẩm vi sinh EM1 và kiểm tra tầng đất mặt',
    timestamp: '07:30 • Sáng nay',
    date: new Date().toISOString().split('T')[0],
    status: 'COMPLETED',
    notes: 'Đã tưới 15L nước vi sinh khử clo pha chế phẩm EM1 (tỷ lệ 1:500). Độ ẩm đất sau tưới đạt 68.5%, đất tơi xốp, giá thể ráo nước tốt.',
    proofPhoto: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80',
    sensorSnapshot: { temp: '26.8°C', soilMoisture: '68%', light: '42.000 Lux' }
  },
  {
    activityId: 'ACT-002',
    plotId: 'P-01',
    plotCode: 'P-01',
    rentalId: 1,
    workerId: 8,
    workerName: 'Trần Văn Lực',
    workerRole: 'Kỹ thuật viên hiện trường chuyên trách',
    workerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    actionType: 'NUTRITION',
    actionTypeName: 'Bổ sung dinh dưỡng & Bón thúc',
    title: 'Bón phân trùn quế hữu cơ quanh gốc và bổ sung dịch chuối ủ Kali',
    timestamp: '15:45 • Hôm qua',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    status: 'COMPLETED',
    notes: 'Bón 2.0kg phân trùn quế hữu cơ quanh vùng rễ tán lá, bổ sung dịch chuối ủ Kali nhằm kích thích phân hóa mầm hoa và chống rụng hoa chùm 2.',
    proofPhoto: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
    sensorSnapshot: { temp: '28.1°C', soilMoisture: '65%', light: '48.000 Lux' }
  },
  {
    activityId: 'ACT-003',
    plotId: 'P-01',
    plotCode: 'P-01',
    rentalId: 1,
    workerId: 8,
    workerName: 'Trần Văn Lực',
    workerRole: 'Kỹ thuật viên hiện trường chuyên trách',
    workerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    actionType: 'PRUNING',
    actionTypeName: 'Tỉa cành & Cố định ngọn leo',
    title: 'Cắt tỉa chồi nách phụ tầng thấp và buộc dây nâng ngọn',
    timestamp: '09:10 • 2 ngày trước',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    status: 'COMPLETED',
    notes: 'Vặt sạch các chồi nách dưới nách lá thứ 4 để tập trung dinh dưỡng nuôi thân chính. Buộc cố định ngọn dây leo chữ A đảm bảo thông thoáng.',
    proofPhoto: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=800&q=80',
    sensorSnapshot: { temp: '27.4°C', soilMoisture: '64%', light: '45.000 Lux' }
  },
  {
    activityId: 'ACT-004',
    plotId: 'P-02',
    plotCode: 'P-02',
    rentalId: 2,
    workerId: 9,
    workerName: 'Nguyễn Văn Đạt',
    workerRole: 'Kỹ thuật viên Bảo vệ thực vật sinh học',
    workerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    actionType: 'PEST_CONTROL',
    actionTypeName: 'Phòng trừ sâu bệnh sinh học',
    title: 'Treo bổ sung bẫy dính vàng và phun vi sinh Neem phòng bọ trĩ',
    timestamp: '14:00 • Hôm nay',
    date: new Date().toISOString().split('T')[0],
    status: 'IN_PROGRESS',
    notes: 'Đang triển khai treo bẫy dính vàng cách ngọn 30cm để giám sát rầy phấn trắng, chuẩn bị phun sương nhẹ tinh dầu Neem sinh học vào lúc 16:30.',
    proofPhoto: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=800&q=80',
    sensorSnapshot: { temp: '28.5°C', soilMoisture: '67%', light: '52.000 Lux' }
  },
  {
    activityId: 'ACT-005',
    plotId: 'PLOT-CC-01',
    plotCode: 'CC-01',
    rentalId: 1,
    workerId: 101,
    workerName: 'Trần Văn Lực',
    workerRole: 'Kỹ thuật viên hiện trường chuyên trách',
    workerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    actionType: 'INSPECTION',
    actionTypeName: 'Nghiệm thu & Đo đạc định kỳ',
    title: 'Đo lường độ tăng trưởng chiều cao thân và chỉ số Brix quả non',
    timestamp: '08:00 • Ngày mai',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    status: 'PENDING',
    notes: 'Kế hoạch kiểm tra tốc độ phát triển lóng cành, đo đếm số chùm hoa nở rộ và ghi chép nhật ký nông vụ định kỳ.',
    proofPhoto: null,
    sensorSnapshot: null
  }
];

/**
 * Lấy danh sách hoạt động của nhân viên được lưu trữ (kết hợp DB + LocalStorage)
 */
export function getPersistedStaffActivities(plotId = null) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(list)) {
      list = [];
    }

    if (!plotId) return list;

    const cleanId = String(plotId).replace(/^PLOT-|^PLT-/i, '').trim().toUpperCase();
    return list.filter((item) => {
      const itemCode = String(item.plotCode || item.plotId || '').replace(/^PLOT-|^PLT-/i, '').trim().toUpperCase();
      const numMatch = cleanId.replace(/\D/g, '') !== '' && cleanId.replace(/\D/g, '') === itemCode.replace(/\D/g, '');
      return itemCode === cleanId || item.plotId === plotId || numMatch || !plotId;
    });
  } catch (e) {
    console.warn('[StaffActivities] Không thể đọc từ localStorage:', e);
    return [];
  }
}

/**
 * Lưu danh sách hoạt động của nhân viên vào LocalStorage và phát tin hiệu BroadcastChannel
 */
export function saveStaffActivities(activities) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      const bc = new BroadcastChannel('farmely_staff_activity_channel');
      bc.postMessage({ type: 'STAFF_ACTIVITIES_UPDATED', timestamp: Date.now() });
      bc.close();
    }
  } catch (e) {
    console.warn('[StaffActivities] Không thể ghi vào localStorage:', e);
  }
}

/**
 * Thêm hoặc cập nhật một hoạt động của nhân viên
 */
export function recordStaffActivity(activity) {
  const current = getPersistedStaffActivities();
  const index = current.findIndex((a) => a.activityId === activity.activityId);

  const updatedItem = {
    ...activity,
    activityId: activity.activityId || `ACT-${Date.now()}`,
    timestamp: activity.timestamp || 'Vừa xong',
    status: activity.status || 'COMPLETED'
  };

  let next;
  if (index >= 0) {
    next = [...current];
    next[index] = { ...next[index], ...updatedItem };
  } else {
    next = [updatedItem, ...current];
  }

  saveStaffActivities(next);
  return next;
}

/* ──────────────────────────────────────────────────────────────────────────
   QUY TRÌNH NGHỈ ĐẤT & CẢI TẠO ĐẤT VIETGAP (FALLOW & SOIL REMEDIATION PROTOCOL)
   ────────────────────────────────────────────────────────────────────────── */

export const FALLOW_PROTOCOL_STEPS = [
  {
    step: 1,
    title: 'Thu dọn tàn dư vụ cũ & Vệ sinh mặt luống',
    desc: 'Nhổ bỏ gốc rễ cũ, thu gom toàn bộ thân lá tàn dư để ngăn ngừa mầm bệnh ủ trong lòng đất.',
    duration: 'Ngày 1',
    status: 'COMPLETED',
    worker: 'Trần Văn Lực (CVLĐ)',
    image: '/images/Mucangchai3.jpg'
  },
  {
    step: 2,
    title: 'Rải vôi nông nghiệp khử trùng & Cân bằng pH',
    desc: 'Rải vôi bột nông nghiệp (15 - 20 kg/100m²) để diệt khuẩn, hạ phèn và nâng pH đất lên mức tối ưu 6.0 - 6.5.',
    duration: 'Ngày 2',
    status: 'COMPLETED',
    worker: 'Trần Văn Lực (CVLĐ)',
    image: '/images/Mucangchai1.jpg'
  },
  {
    step: 3,
    title: 'Cày xới sâu & Phơi ải diệt nấm bệnh tự nhiên',
    desc: 'Xới sâu 20 - 25cm, phơi ải dưới ánh nắng mặt trời giúp diệt nấm hại, tuyến trùng và ấu trùng sâu bọ.',
    duration: 'Ngày 3 - 4',
    status: 'IN_PROGRESS',
    worker: 'Nguyễn Văn Hùng (KTV)',
    image: '/images/Mucangchai2.jpg'
  },
  {
    step: 4,
    title: 'Bón lót phân trùn quế & Bổ sung vi sinh Trichoderma',
    desc: 'Bổ sung nguồn hữu cơ hoai mục và hệ vi sinh đối kháng để tái tạo độ phì nhiêu màu mỡ cho vụ mùa mới.',
    duration: 'Ngày 5 (Sáng)',
    status: 'PENDING',
    worker: 'Đội ngũ Kỹ thuật Farmely'
  },
  {
    step: 5,
    title: 'Lên luống mới & Cân chỉnh hệ thống tưới nhỏ giọt',
    desc: 'Tạo luống cao ráo thoát nước, phủ màng giữ ẩm và chạy thử hệ thống tưới tự động sẵn sàng đón cây giống.',
    duration: 'Ngày 5 (Chiều)',
    status: 'PENDING',
    worker: 'Đội ngũ Kỹ thuật Farmely'
  }
];

/**
 * Chuẩn hóa danh sách các Vụ mùa theo đúng thứ tự tuần tự (Sequential):
 * - Vụ sau chỉ bắt đầu sau khi Vụ trước kết thúc + thời gian nghỉ đất (fallowDays).
 * - Không bao giờ có 2 vụ cùng ở trạng thái ACTIVE (Đang trồng) tại cùng một thời điểm.
 * - Nếu Vụ trước chưa COMPLETED (đang trồng, đang nghỉ đất, hoặc chưa bắt đầu),
 *   thì tất cả các vụ kế tiếp bắt buộc ở trạng thái SCHEDULED (currentDay = 0).
 */
function enforceSequentialSeasons(rawSeasons = [], plot = {}) {
  if (!Array.isArray(rawSeasons) || rawSeasons.length === 0) return [];

  const primaryCropKey = detectCropKey(plot.crop || 'lettuce');
  const primaryStandard = CROP_STANDARDS[primaryCropKey] || CROP_STANDARDS['lettuce'];
  const defaultDuration = Number(plot.cycleDays) || Number(plot.totalDays) || primaryStandard.totalDays || 55;
  const rawCurrentDay = Number(plot.currentDay !== undefined && plot.currentDay !== null ? plot.currentDay : 1);

  const normalized = [];
  let currentStart = plot.startDate ? new Date(plot.startDate) : new Date();
  if (Number.isNaN(currentStart.getTime())) currentStart = new Date();
  let accumulatedDays = 0;
  let earlierSeasonIncomplete = false;

  rawSeasons.forEach((s, idx) => {
    const seasonNumber = idx + 1;
    const cropKey = s.cropKey || detectCropKey(s.cropName || plot.crop || 'lettuce');
    const standard = CROP_STANDARDS[cropKey] || primaryStandard;
    const cropName = s.cropName || plot.crop || standard.cropName;
    const seasonDuration = Number(s.totalDays) || standard.totalDays || defaultDuration;
    const fallowDays = Number(s.fallowDays) || 5;

    const seasonStart = new Date(currentStart);
    const seasonEnd = new Date(seasonStart);
    seasonEnd.setDate(seasonEnd.getDate() + seasonDuration);

    const seasonDayStart = accumulatedDays + 1;
    const seasonDayEnd = accumulatedDays + seasonDuration;
    const fallowEnd = seasonDayEnd + fallowDays;

    let status = 'SCHEDULED';
    let currentDayInSeason = 0;
    let isCurrent = false;
    let inFallow = false;

    if (earlierSeasonIncomplete) {
      status = 'SCHEDULED';
      currentDayInSeason = 0;
      isCurrent = false;
      inFallow = false;
    } else if (rawCurrentDay <= 0) {
      status = 'SCHEDULED';
      currentDayInSeason = 0;
      isCurrent = idx === 0;
      earlierSeasonIncomplete = true;
    } else if (rawCurrentDay > fallowEnd) {
      status = 'COMPLETED';
      currentDayInSeason = seasonDuration;
      isCurrent = false;
    } else if (rawCurrentDay > seasonDayEnd) {
      status = 'SOIL_PREP';
      currentDayInSeason = seasonDuration;
      isCurrent = true;
      inFallow = true;
      earlierSeasonIncomplete = true;
    } else if (rawCurrentDay >= seasonDayStart) {
      status = 'ACTIVE';
      currentDayInSeason = rawCurrentDay - seasonDayStart + 1;
      isCurrent = true;
      earlierSeasonIncomplete = true;
    } else {
      status = 'SCHEDULED';
      currentDayInSeason = 0;
      isCurrent = false;
      earlierSeasonIncomplete = true;
    }

    normalized.push({
      ...s,
      seasonNumber,
      id: `SEASON-${seasonNumber}`,
      seasonName: `Vụ ${seasonNumber}: ${cropName}`,
      cropKey,
      cropName,
      status,
      totalDays: seasonDuration,
      currentDay: currentDayInSeason,
      startDate: seasonStart.toISOString().slice(0, 10),
      endDate: seasonEnd.toISOString().slice(0, 10),
      fallowDays,
      isCurrent,
      inFallow,
      yieldKgActual: status === 'COMPLETED' ? (s.yieldKgActual || 12.5) : null
    });

    const nextStart = new Date(seasonEnd);
    nextStart.setDate(nextStart.getDate() + fallowDays);
    currentStart = nextStart;
    accumulatedDays = fallowEnd;
  });

  if (!normalized.some((s) => s.isCurrent) && normalized.length > 0) {
    const active = normalized.find((s) => s.status === 'ACTIVE' || s.status === 'SOIL_PREP') || normalized[0];
    if (active) active.isCurrent = true;
  }

  return normalized;
}

/**
 * Phân tích và sinh danh sách các Vụ mùa (Seasons) cho một thửa đất
 * Tuân thủ chính xác theo hợp đồng: số vụ thuê, thời hạn thuê termMonths,
 * hỗ trợ chuyển đổi giữa các vụ và hiển thị giai đoạn nghỉ đất 5 ngày.
 */
export function resolvePlotSeasons(plot, allRentals = []) {
  if (!plot) return [];

  const plotKey = String(plot.plotCode || plot.mapPlotId || plot.id || '').replace(/^PLOT-/i, '').trim().toUpperCase();
  const rentalIdSuffix = plot.rentalId ? `_${plot.rentalId}` : '';
  const storageKey = `farmely_plot_seasons_${plotKey}${rentalIdSuffix}`;

  // 1. Kiểm tra nếu có dữ liệu gia hạn hợp đồng thực tế đã lưu từ PlotRenewalModal
  try {
    const saved = localStorage.getItem(storageKey) || localStorage.getItem(`farmely_plot_seasons_${plotKey}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const firstSeason = parsed[0];
        const isMatchingRental = !plot.rentalId || !firstSeason.rentalId || String(firstSeason.rentalId) === String(plot.rentalId);
        const isMatchingCrop = !plot.crop || !firstSeason.cropName || firstSeason.cropName.toLowerCase().includes(plot.crop.toLowerCase()) || plot.crop.toLowerCase().includes(firstSeason.cropName.toLowerCase());
        // Bỏ qua nếu là dữ liệu giả 2 vụ cũ bị sinh tự động (chưa từng qua gia hạn thật)
        const isStaleMockSplit = parsed.length === 2 && parsed[1]?.id === 'SEASON-2' && (parsed[1]?.rentalId === (plot.rentalId || 1) + 1 || parsed[1]?.rentalId === 2) && !parsed[1]?.varietyId;
        if (isMatchingRental && isMatchingCrop && !isStaleMockSplit) {
          return enforceSequentialSeasons(parsed, plot);
        }
      }
    }
  } catch {}

  // 2. Tính số vụ mùa (targetSeasons) chuẩn xác theo hợp đồng hiện tại của thửa đất:
  const primaryCropKey = detectCropKey(plot.crop || 'lettuce');
  const primaryStandard = CROP_STANDARDS[primaryCropKey] || CROP_STANDARDS['lettuce'];
  const cropDisplayName = plot.crop || primaryStandard.cropName;
  const cycleDays = Number(plot.cycleDays || (plot.termDays ? plot.totalDays : null)) || Number(plot.totalDays) || primaryStandard.totalDays || 55;
  const termDays = Number(plot.termDays) || 0;
  const termMonths = Number(plot.termMonths) || 0;

  let targetSeasons = 1;
  if (plot.seasonsCount && Number(plot.seasonsCount) > 0) {
    targetSeasons = Number(plot.seasonsCount);
  } else if (plot.seasonCount && Number(plot.seasonCount) > 0) {
    targetSeasons = Number(plot.seasonCount);
  } else if (termMonths > 0) {
    // Theo quy chuẩn gói thuê Farmely (LEASE_TERM_OPTIONS):
    // 1 tháng = 1 vụ (thử nghiệm ngắn ngày), 3 tháng = 1 vụ mùa tiêu chuẩn
    // 6 tháng = 2 vụ mùa luân canh, 9 tháng = 3 vụ, 12 tháng = 4 vụ trọn năm
    if (termMonths <= 3) targetSeasons = 1;
    else if (termMonths <= 6) targetSeasons = 2;
    else if (termMonths <= 9) targetSeasons = 3;
    else targetSeasons = Math.min(4, Math.floor(termMonths / 3));
  } else if (termDays > 0) {
    const seasonDuration = cycleDays + 5;
    targetSeasons = Math.max(1, Math.round(termDays / seasonDuration));
  }

  const rawSeasons = Array.from({ length: targetSeasons }, (_, i) => ({
    seasonNumber: i + 1,
    id: `SEASON-${i + 1}`,
    seasonName: `Vụ ${i + 1}: ${cropDisplayName}`,
    cropKey: primaryCropKey,
    cropName: cropDisplayName,
    totalDays: cycleDays,
    fallowDays: 5,
    rentalId: i === 0 ? (plot.rentalId || 1) : (plot.rentalId ? plot.rentalId * 100 + (i + 1) : i + 1),
    cultivationMode: plot.mode || 'ASSISTED'
  }));

  return enforceSequentialSeasons(rawSeasons, plot);
}
