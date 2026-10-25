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
    totalDays: 40,
    expectedYield: '20 - 25 kg/thửa',
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
        dayEnd: 6,
        label: 'Ngày 1 - 6',
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
        dayStart: 7,
        dayEnd: 20,
        label: 'Ngày 7 - 20',
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
        dayStart: 21,
        dayEnd: 32,
        label: 'Ngày 21 - 32',
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
        name: 'Thu hái rộ đợt 1 & Đóng gói',
        dayStart: 33,
        dayEnd: 40,
        label: 'Ngày 33 - 40',
        statusDesc: 'Thu hái hàng ngày quả baby dài 10-12cm giòn ngọt',
        waterRegime: 'Tưới bù ẩm sau mỗi lượt hái',
        nutrition: 'Duy trì nước tưới vi sinh sạch',
        guide: 'Cắt quả bằng kéo lúc sáng sớm, quả dài 10-12cm là đạt tiêu chuẩn cao cấp.',
        pestAlert: 'Kiểm soát tốt không để nấm cuống quả.',
        inspectionCriteria: 'Dưa baby thon đều, ruột đặc ít hạt, giòn tan.'
      }
    ]
  }
};

// Helper bóc tách và định dạng ngày an toàn
function parseDateRobust(dVal) {
  if (!dVal) return null;
  if (dVal instanceof Date) return isNaN(dVal.getTime()) ? null : dVal;
  const s = String(dVal).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const parts = s.split('T')[0].split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(s)) {
    const parts = s.split('/').map(Number);
    return new Date(parts[2], parts[1] - 1, parts[0], 12, 0, 0);
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function formatViDate(d) {
  if (!d || isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Phân tích và sinh quy trình chuẩn theo ngày dựa trên thông tin thửa đất
 * ĐỒNG BỘ CHÍNH XÁC: Ngày bắt đầu (Bước 1) = startDate và Ngày kết thúc (Bước cuối) = endDate khi thuê đất
 */
export function resolveStandardCropProcess(plot, dbStages = []) {
  if (!plot) return { cropName: 'Cây trồng', totalDays: 45, currentDay: 1, stages: [] };

  const cropKey = detectCropKey(plot.crop || plot.name || '');
  const standardTemplate = CROP_STANDARDS[cropKey] || CROP_STANDARDS.tomato;

  // 1. Phân tích ngày bắt đầu & kết thúc từ thông tin hợp đồng / thuê đất
  const rawStart = plot.startDate || plot.start_date || (dbStages[0]?.date ? dbStages[0].date : null);
  const rawEnd = plot.endDate || plot.end_date || plot.expectedHarvestDate;

  const parsedStart = parseDateRobust(rawStart);
  const parsedEnd = parseDateRobust(rawEnd);

  // Tính tổng số ngày chu kỳ (totalDays) theo thời hạn thuê thực tế
  let totalDays = Number(plot.totalDays);
  if (parsedStart && parsedEnd) {
    const diffDays = Math.max(1, Math.round((parsedEnd.getTime() - parsedStart.getTime()) / 86400000));
    totalDays = diffDays;
  }
  if (!totalDays || isNaN(totalDays) || totalDays <= 0) {
    const maxOffset = dbStages && dbStages.length > 0
      ? Math.max(...dbStages.map((s) => Number(s.dayOffset || 0) + Number(s.durationDays || 1)))
      : standardTemplate.totalDays;
    totalDays = Math.max(maxOffset, standardTemplate.totalDays || 45);
  }

  // Ngày hiện tại ở mốc 12:00 trưa để so sánh ngày chính xác
  const now = new Date();
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);

  // Tính toán currentDay theo tiến độ thực tế
  let currentDay = Number(plot.currentDay);
  if (parsedStart) {
    if (todayMid.getTime() < parsedStart.getTime()) {
      currentDay = 0; // Chưa đến ngày bắt đầu canh tác
    } else {
      const elapsed = Math.floor((todayMid.getTime() - parsedStart.getTime()) / 86400000) + 1;
      currentDay = Math.min(totalDays, Math.max(1, elapsed));
    }
  } else if (!currentDay || isNaN(currentDay)) {
    currentDay = Math.min(totalDays, Math.max(1, Math.round(totalDays * 0.58)));
  }

  const progressPercent = Math.min(100, Math.max(0, Math.round((currentDay / totalDays) * 100)));
  const daysLeft = parsedEnd
    ? Math.max(0, Math.ceil((parsedEnd.getTime() - todayMid.getTime()) / 86400000))
    : Math.max(0, totalDays - currentDay);

  // NẾU CÓ DỮ LIỆU TỪ POSTGRESQL (process_templates & template_steps)
  if (dbStages && dbStages.length > 0) {
    const cropName = dbStages[0]?.varietyName || plot.crop || standardTemplate.cropName;
    const stagesCount = dbStages.length;

    const computedStages = dbStages.map((st, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === stagesCount - 1;

      let dayStart = Number(st.dayOffset || 0);
      let dayEnd = dayStart + Number(st.durationDays || 1);
      let stageDateObj = null;

      if (parsedStart) {
        if (isFirst) {
          dayStart = 0;
          stageDateObj = parsedStart;
        } else if (isLast && parsedEnd) {
          dayStart = totalDays;
          dayEnd = totalDays;
          stageDateObj = parsedEnd;
        } else {
          stageDateObj = new Date(parsedStart.getTime() + dayStart * 86400000);
          if (parsedEnd && stageDateObj.getTime() > parsedEnd.getTime()) {
            stageDateObj = parsedEnd;
          }
        }
      }

      const formattedDate = stageDateObj ? formatViDate(stageDateObj) : (st.date || '');
      let label = '';
      if (formattedDate) {
        label = `${formattedDate} (Ngày ${dayStart})`;
      } else {
        label = `Ngày ${dayStart}`;
      }

      // Trạng thái bước canh tác
      const isCurrent = st.status === 'IN_PROGRESS' || (currentDay >= dayStart && currentDay <= dayEnd);
      const isDone = st.status === 'COMPLETED' || currentDay > dayEnd;

      return {
        id: st.stepId || st.stepOrder || idx + 1,
        stepOrder: st.stepOrder || idx + 1,
        name: st.stage || st.stepName || `Bước ${idx + 1}`,
        label,
        date: formattedDate,
        dayStart,
        dayEnd,
        status: st.status || (isDone ? 'COMPLETED' : isCurrent ? 'IN_PROGRESS' : 'PENDING'),
        desc: st.guide || st.description || '',
        guide: st.guide || st.description || '',
        materials: st.materialsNeeded || st.materials || 'Dinh dưỡng hữu cơ chuẩn VietGAP',
        isCurrent,
        isDone,
        minTemp: st.minTemp,
        maxTemp: st.maxTemp,
        minHumidity: st.minHumidity,
        maxHumidity: st.maxHumidity,
        specs: [
          { label: 'Nhiệt độ tối ưu:', value: `${st.minTemp || 20} – ${st.maxTemp || 32} °C` },
          { label: 'Độ ẩm khuyến nghị:', value: `${st.minHumidity || 60} – ${st.maxHumidity || 80} %` },
          { label: 'Thời lượng:', value: `${st.durationDays || 1} ngày` },
          { label: 'Yêu cầu minh chứng:', value: 'Ghi nhật ký số & đối chứng hình ảnh thực địa' }
        ]
      };
    });

    const currentStageObj = computedStages.find((s) => s.isCurrent) || computedStages.find((s) => !s.isDone) || computedStages[computedStages.length - 1];

    return {
      cropKey,
      cropName,
      plotName: plot.name,
      plotCode: plot.plotCode || plot.id,
      totalDays,
      currentDay,
      daysLeft,
      progressPercent,
      startDateFormatted: parsedStart ? formatViDate(parsedStart) : null,
      endDateFormatted: parsedEnd ? formatViDate(parsedEnd) : null,
      currentStage: currentStageObj,
      stages: computedStages,
      optimalConditions: {
        tempRange: `${dbStages[0]?.minTemp || 20} - ${dbStages[0]?.maxTemp || 35}°C`,
        soilMoistureRange: `${dbStages[0]?.minHumidity || 60} - ${dbStages[0]?.maxHumidity || 85}%`,
        airHumidityRange: '60 - 80%',
        lightRequirement: 'Ưa sáng tự nhiên nhà màng'
      },
      expectedYield: plot.expectedYield || standardTemplate.expectedYield
    };
  }

  // 2. Fallback sang mẫu template tĩnh nếu chưa tải được Database
  const templateStages = standardTemplate.stages || [];
  const stagesCount = templateStages.length;

  const computedStages = templateStages.map((st, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === stagesCount - 1;

    let dayStart = Number(st.dayStart || 0);
    let dayEnd = Number(st.dayEnd || dayStart + 1);
    let stageDateObj = null;

    if (parsedStart) {
      if (isFirst) {
        dayStart = 0;
        stageDateObj = parsedStart;
      } else if (isLast && parsedEnd) {
        dayStart = totalDays;
        dayEnd = totalDays;
        stageDateObj = parsedEnd;
      } else {
        const offset = Math.round((idx / (stagesCount - 1)) * totalDays);
        dayStart = offset;
        dayEnd = offset + 2;
        stageDateObj = new Date(parsedStart.getTime() + offset * 86400000);
        if (parsedEnd && stageDateObj.getTime() > parsedEnd.getTime()) {
          stageDateObj = parsedEnd;
        }
      }
    }

    const formattedDate = stageDateObj ? formatViDate(stageDateObj) : '';
    const label = formattedDate ? `${formattedDate} (Ngày ${dayStart})` : (st.label || `Ngày ${dayStart}`);

    let status = 'PENDING';
    if (currentDay > dayEnd) {
      status = 'COMPLETED';
    } else if (currentDay >= dayStart && currentDay <= dayEnd) {
      status = 'IN_PROGRESS';
    }

    return {
      ...st,
      label,
      date: formattedDate,
      dayStart,
      dayEnd,
      status,
      desc: st.guide,
      specs: [
        { label: 'Nhiệt độ tối ưu:', value: standardTemplate.optimalConditions.tempRange },
        { label: 'Độ ẩm đất khuyến nghị:', value: standardTemplate.optimalConditions.soilMoistureRange },
        { label: 'Chế độ dinh dưỡng:', value: st.nutrition || 'Hữu cơ VietGAP' },
        { label: 'Tiêu chí nghiệm thu:', value: st.inspectionCriteria || 'Đạt tiêu chuẩn sinh trưởng' }
      ],
      isCurrent: status === 'IN_PROGRESS',
      isDone: status === 'COMPLETED',
      daysUntil: currentDay < dayStart ? dayStart - currentDay : 0,
      daysElapsed: currentDay > dayEnd ? (dayEnd - dayStart + 1) : Math.max(0, currentDay - dayStart + 1)
    };
  });

  const currentStageObj = computedStages.find((s) => s.isCurrent) || computedStages[computedStages.length - 1];

  return {
    cropKey,
    cropName: standardTemplate.cropName,
    plotName: plot.name,
    plotCode: plot.plotCode || plot.id,
    totalDays,
    currentDay,
    daysLeft,
    progressPercent,
    startDateFormatted: parsedStart ? formatViDate(parsedStart) : null,
    endDateFormatted: parsedEnd ? formatViDate(parsedEnd) : null,
    currentStage: currentStageObj,
    stages: computedStages,
    optimalConditions: standardTemplate.optimalConditions,
    expectedYield: plot.expectedYield || standardTemplate.expectedYield
  };
}

function detectCropKey(cropText) {
  const t = String(cropText).toLowerCase();
  if (t.includes('xà lách') || t.includes('lettuce') || t.includes('lô lô') || t.includes('romaine')) return 'lettuce';
  if (t.includes('dưa') || t.includes('cucumber') || t.includes('baby')) return 'cucumber';
  if (t.includes('muống') || t.includes('spinach')) return 'water_spinach';
  if (t.includes('cải') || t.includes('choy') || t.includes('mustard')) return 'mustard';
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
    let list = raw ? JSON.parse(raw) : DEFAULT_STAFF_ACTIVITIES;

    if (!Array.isArray(list) || list.length === 0) {
      list = DEFAULT_STAFF_ACTIVITIES;
      saveStaffActivities(list);
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
    return DEFAULT_STAFF_ACTIVITIES;
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
