/**
 * ChatStorage - Manages persistence for conversations and messages in browser localStorage
 * Pre-seeded with 4 Customers, 4 Field Workers, and 4 Agricultural Experts.
 * Supports on-the-fly thread creation for new registered users and real-time read receipts.
 */

const STORAGE_KEY = 'farmely_chat_threads_v6';

export const DEMO_CUSTOMERS = [
  {
    id: 'CUST-01',
    threadId: 'CONS-401',
    name: 'Lô Thái Quyền',
    email: 'customer@farmely.vn',
    phone: '0901 234 567',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-01',
    plotName: 'Thửa Sen Vàng A1',
    crop: 'Cà chua bi Cherry F1',
    expertName: 'ThS. Nguyễn Hoàng Nam'
  },
  {
    id: 'CUST-02',
    threadId: 'CONS-402',
    name: 'Nguyễn Văn Hùng',
    email: 'hung.nguyen@farmely.vn',
    phone: '0912 345 678',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-02',
    plotName: 'Thửa Mộc Châu B2',
    crop: 'Xà lách Romaine VietGAP',
    expertName: 'ThS. Trần Phương Thảo'
  },
  {
    id: 'CUST-03',
    threadId: 'CONS-403',
    name: 'Phạm Thu Hương',
    email: 'huong.pham@farmely.vn',
    phone: '0988 776 655',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-03',
    plotName: 'Thửa Rừng Sác C3',
    crop: 'Dưa leo Baby Đà Lạt',
    expertName: 'ThS. Nguyễn Hoàng Nam'
  },
  {
    id: 'CUST-04',
    threadId: 'CONS-404',
    name: 'Trần Minh Quân',
    email: 'quan.tran@farmely.vn',
    phone: '0977 123 456',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-04',
    plotName: 'Thửa Đất Đỏ D4',
    crop: 'Dâu tây Hana chịu nhiệt',
    expertName: 'TS. Lê Hoàng Đức'
  }
];

export const DEMO_WORKERS = [
  {
    id: 'WORK-01',
    threadId: 'WORK-101',
    name: 'Trần Văn Lực (Tổ trưởng CVLĐ)',
    phone: '0933 111 222',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-03',
    plotName: 'Thửa Rừng Sác C3',
    crop: 'Dưa leo Baby Đà Lạt',
    expertName: 'ThS. Nguyễn Hoàng Nam'
  },
  {
    id: 'WORK-02',
    threadId: 'WORK-102',
    name: 'Nguyễn Văn Đạt (Kỹ thuật béc tưới)',
    phone: '0933 222 333',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-01',
    plotName: 'Thửa Sen Vàng A1',
    crop: 'Cà chua bi Cherry F1',
    expertName: 'ThS. Nguyễn Hoàng Nam'
  },
  {
    id: 'WORK-03',
    threadId: 'WORK-103',
    name: 'Lê Thị Hoa (CVLĐ Vườn ươm)',
    phone: '0933 333 444',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-02',
    plotName: 'Thửa Mộc Châu B2',
    crop: 'Xà lách Romaine VietGAP',
    expertName: 'ThS. Trần Phương Thảo'
  },
  {
    id: 'WORK-04',
    threadId: 'WORK-104',
    name: 'Hoàng Văn Nam (Đội trưởng hiện trường)',
    phone: '0933 444 555',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-04',
    plotName: 'Thửa Đất Đỏ D4',
    crop: 'Dâu tây Hana chịu nhiệt',
    expertName: 'TS. Lê Hoàng Đức'
  }
];

export const DEMO_EXPERTS = [
  {
    id: 'EXP-01',
    name: 'ThS. Nguyễn Hoàng Nam',
    title: 'Chuyên gia Cây ăn quả & Dây leo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    agency: 'Viện Khoa học Nông nghiệp Miền Nam'
  },
  {
    id: 'EXP-02',
    name: 'ThS. Trần Phương Thảo',
    title: 'Chuyên gia VietGAP & Rau ăn lá an toàn',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
    agency: 'Trung tâm Khuyến nông TP.HCM'
  },
  {
    id: 'EXP-03',
    name: 'TS. Lê Hoàng Đức',
    title: 'Chuyên gia Thổ nhưỡng & Dinh dưỡng hữu cơ',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
    agency: 'Khoa Nông học - ĐH Nông Lâm'
  },
  {
    id: 'EXP-04',
    name: 'KS. Phạm Quốc Huy',
    title: 'Chuyên gia BVTV Sinh học & Quản lý IPHM',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80',
    agency: 'Chi cục Trồng trọt & BVTV'
  }
];

export const INITIAL_THREADS = [
  // 1. Khách hàng 1: Lô Thái Quyền (Thửa Sen Vàng A1 - P-01)
  {
    id: 'CONS-401',
    role: 'customer',
    roleLabel: 'Khách Thuê Đất',
    customerName: 'Lô Thái Quyền',
    customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-01',
    plotName: 'Thửa Sen Vàng A1',
    crop: 'Cà chua bi Cherry F1',
    stage: 'Ngày 35 • Ra hoa & Đậu quả',
    expertName: 'ThS. Nguyễn Hoàng Nam',
    isOnline: true,
    lastTime: '15 phút trước',
    status: 'PENDING',
    unread: true,
    messages: [
      {
        id: 1,
        sender: 'customer',
        senderName: 'Lô Thái Quyền',
        text: 'Chào chuyên gia Nam! Lá cây cà chua của tôi ở tầng dưới hơi ngả vàng, liệu có phải do thiếu đạm cá hay độ ẩm đất quá cao không?',
        photoUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80',
        photoCaption: 'Ảnh hiện trường: Lá cà chua tầng dưới có dấu hiệu vàng úa mép lá',
        time: '15:10',
        seen: false
      },
      {
        id: 2,
        sender: 'customer',
        senderName: 'Lô Thái Quyền',
        text: 'Tôi xem trên app thấy độ ẩm đất báo 72%, không biết có cần chỉnh béc phun sương giảm lại không chuyên gia?',
        time: '15:12',
        seen: false
      }
    ]
  },
  // 2. Khách hàng 2: Nguyễn Văn Hùng (Thửa Mộc Châu B2 - P-02)
  {
    id: 'CONS-402',
    role: 'customer',
    roleLabel: 'Khách Thuê Đất',
    customerName: 'Nguyễn Văn Hùng',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-02',
    plotName: 'Thửa Mộc Châu B2',
    crop: 'Xà lách Romaine VietGAP',
    stage: 'Ngày 24 • Chuẩn bị thu hoạch',
    expertName: 'ThS. Trần Phương Thảo',
    isOnline: false,
    lastTime: '2 giờ trước',
    status: 'REPLIED',
    unread: false,
    messages: [
      {
        id: 1,
        sender: 'customer',
        senderName: 'Nguyễn Văn Hùng',
        text: 'Xà lách đã đạt ngày 24, tôi muốn thu hoạch vào sáng thứ Bảy này thì từ hôm nay có cần ngưng tưới đạm vi sinh không?',
        photoUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80',
        photoCaption: 'Ảnh hiện trường: Luống Romaine B2 lá nở tròn xòe giòn tươi',
        time: '13:40',
        seen: true,
        seenAt: '13:42'
      },
      {
        id: 2,
        sender: 'expert',
        senderName: 'ThS. Trần Phương Thảo',
        text: 'Chào anh Hùng! Đúng chuẩn VietGAP anh cần cách ly ngưng phân bón 5 ngày trước ngày thu hoạch. Từ hôm nay vườn chỉ duy trì tưới nước sạch mỗi sáng 15 phút là rau sẽ giòn ngọt tự nhiên nhé.',
        prescriptionTag: 'Cách ly VietGAP 5 ngày',
        time: '13:45',
        seen: true,
        seenAt: '13:46'
      }
    ]
  },
  // 3. Khách hàng 3: Phạm Thu Hương (Thửa Rừng Sác C3 - P-03)
  {
    id: 'CONS-403',
    role: 'customer',
    roleLabel: 'Khách Thuê Đất',
    customerName: 'Phạm Thu Hương',
    customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-03',
    plotName: 'Thửa Rừng Sác C3',
    crop: 'Dưa leo Baby Đà Lạt',
    stage: 'Ngày 18 • Bắt đầu leo giàn',
    expertName: 'ThS. Nguyễn Hoàng Nam',
    isOnline: true,
    lastTime: '3 giờ trước',
    status: 'REPLIED',
    unread: false,
    messages: [
      {
        id: 1,
        sender: 'customer',
        senderName: 'Phạm Thu Hương',
        text: 'Dưa leo bắt đầu leo giàn cao 80cm, tôi thấy ngọn vươn rất mạnh. Chuyên gia cho hỏi có cần bấm ngọn phụ để tập trung nhánh chính không?',
        time: '11:20',
        seen: true,
        seenAt: '11:25'
      },
      {
        id: 2,
        sender: 'expert',
        senderName: 'ThS. Nguyễn Hoàng Nam',
        text: 'Chào chị Hương! Giai đoạn này chị giữ thân chính và tỉa sạch nhánh phụ từ đốt thứ 1 đến đốt thứ 5 sát gốc để gốc thông thoáng, ngừa nấm mốc nhé.',
        time: '11:28',
        seen: true,
        seenAt: '11:30'
      }
    ]
  },
  // 4. Khách hàng 4: Trần Minh Quân (Thửa Đất Đỏ D4 - P-04)
  {
    id: 'CONS-404',
    role: 'customer',
    roleLabel: 'Khách Thuê Đất',
    customerName: 'Trần Minh Quân',
    customerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-04',
    plotName: 'Thửa Đất Đỏ D4',
    crop: 'Dâu tây Hana chịu nhiệt',
    stage: 'Ngày 42 • Quả non chuyển hồng',
    expertName: 'TS. Lê Hoàng Đức',
    isOnline: false,
    lastTime: 'Hôm qua',
    status: 'REPLIED',
    unread: false,
    messages: [
      {
        id: 1,
        sender: 'customer',
        senderName: 'Trần Minh Quân',
        text: 'Dâu tây đang đỏ cuống, nắng trưa nay hơi gắt 33 độ C. Nhờ thầy Đức tư vấn giúp có nên kéo lưới đen che bớt nắng không?',
        time: 'Hôm qua • 14:00',
        seen: true,
        seenAt: '14:05'
      },
      {
        id: 'M-404-2',
        sender: 'expert',
        senderName: 'TS. Lê Hoàng Đức',
        text: 'Nên kéo lưới lan 50% che nắng từ 11h đến 15h để tránh quả bị rám nắng và giữ cuống tươi mọng nước anh nhé.',
        time: 'Hôm qua • 14:10',
        seen: true,
        seenAt: '14:12'
      }
    ]
  },
  // 5. Nông Dân 1: Trần Văn Lực (Tổ trưởng CVLĐ Củ Chi - P-03)
  {
    id: 'WORK-101',
    role: 'worker',
    roleLabel: 'CVLĐ Hiện Trường',
    customerName: 'Trần Văn Lực (Tổ trưởng CVLĐ)',
    customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-03',
    plotName: 'Thửa Rừng Sác C3',
    crop: 'Dưa leo Baby Đà Lạt',
    stage: 'Sự cố sâu bệnh: Bọ trĩ mặt lá',
    expertName: 'ThS. Nguyễn Hoàng Nam',
    isOnline: true,
    lastTime: '10 phút trước',
    status: 'PENDING',
    unread: true,
    messages: [
      {
        id: 1,
        sender: 'worker',
        senderName: 'Trần Văn Lực (CVLĐ)',
        text: 'Báo cáo Chuyên gia Nam: Sáng nay đi kiểm tra thửa C3 của chị Hương, phát hiện mặt dưới lá non có dấu hiệu bọ trĩ li ti. Em đã chụp ảnh đính kèm, xin ý kiến chỉ đạo xử lý thuốc sinh học!',
        photoUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80',
        photoCaption: 'Ảnh vi thể: Mặt dưới lá dưa leo baby có bọ trĩ và xoăn mép lá',
        time: '08:45',
        seen: false
      }
    ]
  },
  // 6. Nông Dân 2: Nguyễn Văn Đạt (Kỹ thuật béc tưới - P-01)
  {
    id: 'WORK-102',
    role: 'worker',
    roleLabel: 'CVLĐ Hiện Trường',
    customerName: 'Nguyễn Văn Đạt (Kỹ thuật béc tưới)',
    customerAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-01',
    plotName: 'Thửa Sen Vàng A1',
    crop: 'Cà chua bi Cherry F1',
    stage: 'Bảo trì trạm bơm & béc tưới',
    expertName: 'ThS. Nguyễn Hoàng Nam',
    isOnline: true,
    lastTime: '30 phút trước',
    status: 'REPLIED',
    unread: false,
    messages: [
      {
        id: 1,
        sender: 'worker',
        senderName: 'Nguyễn Văn Đạt (CVLĐ)',
        text: 'Đã hoàn thành kiểm tra áp lực nước béc tưới nhỏ giọt luống cà chua A1. Áp suất đạt chuẩn 1.5 bar, nước tưới đều các gốc.',
        time: '08:15',
        seen: true,
        seenAt: '08:20'
      },
      {
        id: 2,
        sender: 'expert',
        senderName: 'ThS. Nguyễn Hoàng Nam',
        text: 'Cảm ơn Đạt. Tiếp tục theo dõi sensor độ ẩm đất sau 12h trưa xem có bị ứ nước không nhé.',
        time: '08:20',
        seen: true,
        seenAt: '08:22'
      }
    ]
  },
  // 7. Nông Dân 3: Lê Thị Hoa (CVLĐ Vườn ươm - P-02)
  {
    id: 'WORK-103',
    role: 'worker',
    roleLabel: 'CVLĐ Hiện Trường',
    customerName: 'Lê Thị Hoa (CVLĐ Vườn ươm)',
    customerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-02',
    plotName: 'Thửa Mộc Châu B2',
    crop: 'Xà lách Romaine VietGAP',
    stage: 'Chuẩn bị giỏ thu hoạch VietGAP',
    expertName: 'ThS. Trần Phương Thảo',
    isOnline: false,
    lastTime: 'Hôm qua',
    status: 'REPLIED',
    unread: false,
    messages: [
      {
        id: 1,
        sender: 'worker',
        senderName: 'Lê Thị Hoa (CVLĐ)',
        text: 'Thưa cô Thảo, luống Romaine B2 đã chuẩn bị sẵn tem truy xuất nguồn gốc QR và giỏ nan tre. Sáng thứ Bảy em sẽ bắt đầu thu hoạch lúc 06:30 sáng.',
        time: 'Hôm qua • 16:30',
        seen: true,
        seenAt: '16:35'
      },
      {
        id: 2,
        sender: 'expert',
        senderName: 'ThS. Trần Phương Thảo',
        text: 'Rất tốt Hoa nhé! Nhớ cắt tỉa gốc bằng kéo sát trùng và cân đối chứng ngay tại trạm đóng gói.',
        time: 'Hôm qua • 16:40',
        seen: true,
        seenAt: '16:42'
      }
    ]
  },
  // 8. Nông Dân 4: Hoàng Văn Nam (Đội trưởng hiện trường - P-04)
  {
    id: 'WORK-104',
    role: 'worker',
    roleLabel: 'CVLĐ Hiện Trường',
    customerName: 'Hoàng Văn Nam (Đội trưởng hiện trường)',
    customerAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-04',
    plotName: 'Thửa Đất Đỏ D4',
    crop: 'Dâu tây Hana chịu nhiệt',
    stage: 'Kéo lưới che nắng & phủ rơm',
    expertName: 'TS. Lê Hoàng Đức',
    isOnline: true,
    lastTime: 'Vừa xong',
    status: 'PENDING',
    unread: true,
    messages: [
      {
        id: 1,
        sender: 'worker',
        senderName: 'Hoàng Văn Nam (CVLĐ)',
        text: 'Thưa TS. Đức, thửa Dâu tây D4 sáng nay trời có sương mù ẩm 85%. Em có cần kéo bạt che mái vòm để ngừa nấm mốc xám ăn hoa không ạ?',
        time: '08:30',
        seen: false
      }
    ]
  }
];

/**
 * Retrieve all threads from storage, or initialize if empty
 */
export function getStoredThreads() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return INITIAL_THREADS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_THREADS));
      return INITIAL_THREADS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length >= 8 ? parsed : INITIAL_THREADS;
  } catch (err) {
    console.error('[ChatStorage] Error loading threads from localStorage:', err);
    return INITIAL_THREADS;
  }
}

/**
 * Get a specific thread by ID
 */
export function getStoredThreadById(threadId) {
  const threads = getStoredThreads();
  return threads.find((t) => t.id === threadId) || null;
}

/**
 * Save threads to storage
 */
export function saveThreads(threads) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch (err) {
    console.error('[ChatStorage] Error saving threads to localStorage:', err);
  }
}

/**
 * Append a message to a thread and update status.
 * Automatically creates a thread on the fly if it does not exist (e.g. for new registered accounts).
 */
export function appendMessage(threadId, message) {
  const threads = getStoredThreads();
  const threadIndex = threads.findIndex((t) => t.id === threadId);

  // If thread does not exist yet (e.g. newly registered user), create it on the fly!
  if (threadIndex === -1) {
    const newThread = {
      id: threadId,
      role: message.sender === 'worker' ? 'worker' : 'customer',
      roleLabel: message.sender === 'worker' ? 'CVLĐ Hiện Trường' : 'Khách Thuê Đất',
      customerName: message.senderName || 'Khách Hàng Mới',
      customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      plotCode: 'P-01',
      plotName: 'Thửa Canh Tác Mới',
      crop: 'Rau củ VietGAP',
      stage: 'Đang sinh trưởng',
      expertName: 'ThS. Nguyễn Hoàng Nam',
      isOnline: true,
      lastTime: message.time || 'Vừa xong',
      status: 'PENDING',
      unread: true,
      messages: [message]
    };
    const updatedThreads = [newThread, ...threads];
    saveThreads(updatedThreads);
    return { thread: newThread, message, threads: updatedThreads };
  }

  const thread = { ...threads[threadIndex] };
  const newMessages = [...thread.messages, message];

  thread.messages = newMessages;
  thread.lastTime = message.time || 'Vừa xong';

  if (message.sender === 'expert') {
    thread.status = 'REPLIED';
    thread.unread = false;
  } else {
    thread.status = 'PENDING';
    thread.unread = true;
  }

  // Pop up to the top: move thread with new message to index 0
  const remainingThreads = threads.filter((_, idx) => idx !== threadIndex);
  const updatedThreads = [thread, ...remainingThreads];
  saveThreads(updatedThreads);

  return { thread, message, threads: updatedThreads };
}

/**
 * Mark a thread as read (clear unread badge)
 * @param {string} threadId
 */
export function markThreadAsReadInStorage(threadId) {
  const threads = getStoredThreads();
  const threadIndex = threads.findIndex((t) => t.id === threadId);
  if (threadIndex === -1) return null;

  const thread = { ...threads[threadIndex], unread: false };
  const updatedThreads = [...threads];
  updatedThreads[threadIndex] = thread;
  saveThreads(updatedThreads);

  return { thread, threads: updatedThreads };
}
