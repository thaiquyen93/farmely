export const varietiesData = [
  {
    id: "VAR-001",
    name: "Rau muống lá tre F1",
    cropId: "CRP-01",
    cropName: "Rau muống cạn",
    growthDuration: 30, // ngày
    bufferTime: 4, // ngày
    expectedYield: "4.5 - 6.0 kg/m²",
    description: "Rau muống lá tre F1 sinh trưởng nhanh, thích hợp trồng luống và thu hoạch non nhiều đợt.",
    compatiblePlotsCount: 4,
    processTemplateId: "TMPL-001",
    processTemplateName: "Quy trình rau muống an toàn",
    knowledgeDocsCount: 2,
    status: "ACTIVE",
    imageUrl: "/images/varieties/rau-muong-la-tre.png",
    growingCharacteristics: {
      lightRequirement: "Nắng trực tiếp 5-7 giờ/ngày",
      soilMoistureTarget: "70% - 80%",
      temperatureRange: "22°C - 32°C",
      fertilizerNeeds: "Bổ sung phân hữu cơ hoai mục theo từng đợt"
    }
  },
  {
    id: "VAR-002",
    name: "Cải ngọt bông F1",
    cropId: "CRP-01",
    cropName: "Cải ngọt / Cải bẹ",
    growthDuration: 35,
    bufferTime: 4,
    expectedYield: "2.8 - 3.5 kg/m²",
    description: "Cải ngọt bông F1 cho lá xanh, thân mềm và thu hoạch nhanh; phù hợp làm rau ăn lá theo vụ ngắn.",
    compatiblePlotsCount: 6,
    processTemplateId: "TMPL-002",
    processTemplateName: "Quy trình cải ngọt an toàn",
    knowledgeDocsCount: 3,
    status: "ACTIVE",
    imageUrl: "/images/varieties/cai-ngot-bong.png",
    growingCharacteristics: {
      lightRequirement: "Nắng trực tiếp hoặc tán xạ 4-6 giờ/ngày",
      soilMoistureTarget: "65% - 75%",
      temperatureRange: "18°C - 30°C",
      fertilizerNeeds: "Phân hữu cơ hoai mục, chia lượng bón theo đợt"
    }
  },
  {
    id: "VAR-003",
    name: "Xà lách Romaine VietGAP",
    cropId: "CRP-01",
    cropName: "Xà lách xoăn",
    growthDuration: 45,
    bufferTime: 4,
    expectedYield: "5.0 - 7.5 kg/m²",
    description: "Xà lách Romaine VietGAP tạo bẹ lá giòn, vị dịu; phù hợp trồng luống hoặc nhà lưới.",
    compatiblePlotsCount: 4,
    processTemplateId: "TMPL-003",
    processTemplateName: "Quy trình xà lách Romaine VietGAP",
    knowledgeDocsCount: 1,
    status: "ACTIVE",
    imageUrl: "/images/varieties/xa-lach-romaine.png",
    growingCharacteristics: {
      lightRequirement: "Nắng nhẹ 4-6 giờ/ngày",
      soilMoistureTarget: "70% - 80%",
      temperatureRange: "18°C - 28°C",
      fertilizerNeeds: "Bổ sung phân hữu cơ cân đối, tránh bón đạm sát ngày thu hoạch"
    }
  },
  {
    id: "VAR-004",
    name: "Cà chua bi đỏ F1",
    cropId: "CRP-02",
    cropName: "Cà chua bi (Cherry)",
    growthDuration: 80,
    bufferTime: 7,
    expectedYield: "2.0 - 3.0 kg/m²",
    description: "Cà chua bi đỏ F1 cho quả nhỏ mọc thành chùm, cần giàn đỡ và chăm sóc đều trong chu kỳ dài.",
    compatiblePlotsCount: 2,
    processTemplateId: "TMPL-004",
    processTemplateName: "Quy trình cà chua bi VietGAP",
    knowledgeDocsCount: 2,
    status: "ACTIVE",
    imageUrl: "/images/varieties/ca-chua-bi-do.png",
    growingCharacteristics: {
      lightRequirement: "Nắng trực tiếp 6-8 giờ/ngày",
      soilMoistureTarget: "65% - 75%",
      temperatureRange: "20°C - 30°C",
      fertilizerNeeds: "Bổ sung kali và canxi khi cây ra hoa, tạo quả"
    }
  },
  {
    id: "VAR-005",
    name: "Dưa leo baby F1",
    cropId: "CRP-03",
    cropName: "Dưa leo baby",
    growthDuration: 55,
    bufferTime: 5,
    expectedYield: "3.0 - 4.0 kg/m²",
    description: "Dưa leo baby F1 cho quả nhỏ, cần giàn chắc và tưới đủ ẩm để cây đậu quả liên tục.",
    compatiblePlotsCount: 5,
    processTemplateId: "TMPL-005",
    knowledgeDocsCount: 1,
    status: "ACTIVE",
    imageUrl: "/images/varieties/dua-leo-baby.png",
    growingCharacteristics: {
      lightRequirement: "Nắng trực tiếp 6-8 giờ/ngày",
      soilMoistureTarget: "70% - 80%",
      temperatureRange: "22°C - 32°C",
      fertilizerNeeds: "Phân hữu cơ hoai mục, bổ sung dinh dưỡng giai đoạn ra hoa"
    }
  }
];
