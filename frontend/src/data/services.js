export const defaultServices = [
  {
    id: 'SVC-001',
    name: 'Chăm sóc rau theo tuần',
    category: 'Chăm sóc định kỳ',
    customerCategory: 'CYCLE',
    price: 420000,
    duration: 7,
    unit: '/ tuần (7 ngày)',
    tag: 'Chăm sóc định kỳ',
    iconKey: 'calendar',
    active: true,
    description: 'Kỹ thuật viên kiểm tra luống, tưới ẩm, nhổ cỏ và cập nhật minh chứng trong suốt tuần.',
    tasks: [
      { offset: 0, title: 'Kiểm tra độ ẩm & tưới', assignee: 'STAFF', evidence: true },
      { offset: 3, title: 'Nhổ cỏ, xới bề mặt đất', assignee: 'STAFF', evidence: true },
      { offset: 6, title: 'Đánh giá sinh trưởng cuối tuần', assignee: 'EXPERT', evidence: false }
    ]
  },
  {
    id: 'SVC-002',
    name: 'Bón phân hữu cơ VietGAP',
    category: 'Dịch vụ một lần',
    customerCategory: 'SINGLE',
    price: 80000,
    duration: 1,
    unit: '/ lần thực hiện',
    tag: 'Dịch vụ lẻ',
    iconKey: 'layers',
    active: true,
    description: 'Bón phân hữu cơ đúng định mức, đối chiếu hướng dẫn và chụp ảnh hiện trường sau thực hiện.',
    tasks: [
      { offset: 0, title: 'Đối chiếu hướng dẫn bón', assignee: 'EXPERT', evidence: false },
      { offset: 0, title: 'Bón phân & chụp ảnh hiện trường', assignee: 'STAFF', evidence: true }
    ]
  },
  {
    id: 'SVC-003',
    name: 'Ủy thác chăm sóc trọn vụ',
    category: 'Trọn vụ',
    customerCategory: 'FULL',
    price: 1500000,
    duration: 30,
    unit: '/ chu kỳ 30 ngày',
    tag: 'Trọn vụ',
    iconKey: 'sprout',
    active: false,
    description: 'Farmely tiếp nhận chăm sóc thửa đất theo lịch vận hành và phác đồ của chuyên gia.',
    tasks: [
      { offset: 0, title: 'Khảo sát hiện trạng thửa', assignee: 'EXPERT', evidence: true },
      { offset: 1, title: 'Khởi tạo lịch chăm sóc', assignee: 'STAFF', evidence: false },
      { offset: 7, title: 'Báo cáo tiến độ tuần', assignee: 'STAFF', evidence: true }
    ]
  }
];
