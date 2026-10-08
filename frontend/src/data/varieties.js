export const varietiesData = [
  {
    id: "VAR-001",
    name: "Cà chua bi Cherry Ruby F1",
    cropId: "CRP-02",
    cropName: "Cà chua & Quả mọng",
    growthDuration: 75, // ngày
    bufferTime: 10, // ngày
    expectedYield: "4.5 - 6.0 kg/m²",
    description: "Giống lai F1 kháng bệnh héo xanh vi khuẩn, quả chùm đỏ mọng ngọt đậm đà, độ Brix đạt 9.5. Rất được khách hàng thành phố ưa chuộng.",
    compatiblePlotsCount: 4,
    processTemplateId: "TMPL-001",
    processTemplateName: "Quy trình VietGAP Cà chua bi hữu cơ",
    knowledgeDocsCount: 2,
    status: "ACTIVE",
    imageUrl: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80",
    growingCharacteristics: {
      lightRequirement: "Nắng trực tiếp 6-8 giờ/ngày",
      soilMoistureTarget: "65% - 75%",
      temperatureRange: "20°C - 30°C",
      fertilizerNeeds: "Giàu Kali hữu cơ và Canxi vi lượng lúc tạo quả"
    }
  },
  {
    id: "VAR-002",
    name: "Xà lách Lollo Bionda Ý",
    cropId: "CRP-01",
    cropName: "Rau ăn lá",
    growthDuration: 35,
    bufferTime: 5,
    expectedYield: "2.8 - 3.5 kg/m²",
    description: "Xà lách xoăn xanh mướt nguồn gốc Italia, giòn ngọt thanh mát, không bị đắng dưới nắng nhiệt đới nhờ che chắn lưới vi sinh.",
    compatiblePlotsCount: 6,
    processTemplateId: "TMPL-002",
    processTemplateName: "Quy trình chuẩn Xà lách hữu cơ mùa hè",
    knowledgeDocsCount: 3,
    status: "ACTIVE",
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
    growingCharacteristics: {
      lightRequirement: "Nắng tán xạ 4-6 giờ/ngày",
      soilMoistureTarget: "70% - 80%",
      temperatureRange: "18°C - 28°C",
      fertilizerNeeds: "Đạm sinh học từ phân đậu tương ủ hoai"
    }
  },
  {
    id: "VAR-003",
    name: "Dưa leo Baby Hà Lan F1",
    cropId: "CRP-03",
    cropName: "Dưa leo & Bầu bí",
    growthDuration: 45,
    bufferTime: 7,
    expectedYield: "5.0 - 7.5 kg/m²",
    description: "Quả thẳng, vỏ bóng mỏng không gai, ăn cả vỏ giòn ngọt. Cây sinh trưởng khỏe, đậu quả chùm tự nhiên không cần thụ phấn nhân tạo.",
    compatiblePlotsCount: 4,
    processTemplateId: "TMPL-003",
    processTemplateName: "Quy trình chăm sóc Dưa leo giàn chuẩn VietGAP",
    knowledgeDocsCount: 1,
    status: "ACTIVE",
    imageUrl: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=600&q=80",
    growingCharacteristics: {
      lightRequirement: "Nắng toàn phần",
      soilMoistureTarget: "70% - 80%",
      temperatureRange: "22°C - 32°C",
      fertilizerNeeds: "Phân trùn quế và dịch chuối lên men"
    }
  },
  {
    id: "VAR-004",
    name: "Dâu tây Nhật Hana Chịu Nhiệt",
    cropId: "CRP-02",
    cropName: "Cà chua & Quả mọng",
    growthDuration: 90,
    bufferTime: 12,
    expectedYield: "2.0 - 3.0 kg/m²",
    description: "Giống dâu tây trứ danh hương thơm ngào ngạt, vị ngọt thanh, thích hợp điều kiện khí hậu mát mẻ tại Đơn Dương và nhà màng làm mát.",
    compatiblePlotsCount: 2,
    processTemplateId: "TMPL-004",
    processTemplateName: "Quy trình Dâu tây luống cao công nghệ cao",
    knowledgeDocsCount: 2,
    status: "ACTIVE",
    imageUrl: "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=80",
    growingCharacteristics: {
      lightRequirement: "Nắng sớm dịu nhẹ",
      soilMoistureTarget: "60% - 70%",
      temperatureRange: "15°C - 25°C",
      fertilizerNeeds: "Bổ sung Bo và Magie định kỳ chống rụng hoa"
    }
  },
  {
    id: "VAR-005",
    name: "Cải bó xôi Nhật (Spinach)",
    cropId: "CRP-01",
    cropName: "Rau ăn lá",
    growthDuration: 40,
    bufferTime: 5,
    expectedYield: "3.0 - 4.0 kg/m²",
    description: "Lá xanh đậm, hàm lượng sắt và vitamin nhóm B vượt trội. Sinh trưởng đều trong điều kiện đất xốp giàu hữu cơ.",
    compatiblePlotsCount: 5,
    processTemplateId: null, // intentionally null to show health check alert!
    knowledgeDocsCount: 1,
    status: "ACTIVE",
    imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80",
    growingCharacteristics: {
      lightRequirement: "Nắng 5 giờ/ngày",
      soilMoistureTarget: "70% - 75%",
      temperatureRange: "18°C - 26°C",
      fertilizerNeeds: "Phân chuồng ủ hoai mục kết hợp nấm Trichoderma"
    }
  }
];
