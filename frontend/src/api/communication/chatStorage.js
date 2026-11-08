/**
 * ChatStorage - Manages persistence for conversations and messages in browser localStorage
 * Cleaned to SSoT: 1 Demo Customer (Lô Thái Quyền), 1 Field Worker (Trần Văn Lực), 1 Admin (Ban Quản Trị).
 * No dummy mock clutter. Real-time cross-tab synchronization.
 */

const STORAGE_KEY = 'farmely_chat_threads_v9';

export const DEMO_CUSTOMERS = [
  {
    id: 'CUST-01',
    threadId: 'CONS-401',
    name: 'Lô Thái Quyền',
    email: 'customer@farmely.vn',
    phone: '0901 234 567',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-01, P-14',
    plotName: 'Thửa P-01 & Thửa P-14',
    crop: 'Cà chua bi & Dưa leo baby',
    expertName: 'ThS. Nguyễn Hoàng Nam',
    plots: [
      { plotCode: 'P-01', plotName: 'Thửa P-01 (Sen Vàng A1)', crop: 'Cà chua bi Cherry F1' },
      { plotCode: 'P-14', plotName: 'Thửa P-14 (Rừng Sác C3)', crop: 'Dưa leo baby F1' }
    ]
  }
];

export const DEMO_WORKERS = [
  {
    id: 'WORK-01',
    threadId: 'WORK-101',
    name: 'Trần Văn Lực (Tổ trưởng CVLĐ)',
    phone: '0933 111 222',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-03, P-12',
    plotName: 'Thửa P-03 & Thửa P-12',
    crop: 'Dưa leo Baby & Cà chua bi',
    expertName: 'ThS. Nguyễn Hoàng Nam',
    plots: [
      { plotCode: 'P-03', plotName: 'Thửa P-03 (Rừng Sác C3)', crop: 'Dưa leo Baby Đà Lạt' },
      { plotCode: 'P-12', plotName: 'Thửa P-12 (Vườn Ươm B2)', crop: 'Cà chua bi F1' }
    ]
  }
];

export const DEMO_EXPERTS = [
  {
    id: 'EXP-01',
    name: 'ThS. Nguyễn Hoàng Nam',
    title: 'Chuyên gia Cây ăn quả & Dây leo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    agency: 'Viện Khoa học Nông nghiệp Miền Nam'
  }
];

export const INITIAL_THREADS = [
  // 1. Khách hàng SSoT: Lô Thái Quyền (Quản lý 2 Thửa: P-01 và P-14)
  {
    id: 'CONS-401',
    conversationId: 1,
    role: 'customer',
    roleLabel: 'Khách Thuê Đất',
    rentalStatus: 'RENTED',
    customerName: 'Lô Thái Quyền',
    customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-01, P-14',
    plotName: 'Thửa P-01 & Thửa P-14',
    crop: 'Cà chua bi & Dưa leo baby',
    stage: 'Đang theo dõi 2 thửa đất canh tác',
    expertName: 'ThS. Nguyễn Hoàng Nam',
    isOnline: true,
    lastTime: '15 phút trước',
    status: 'REPLIED',
    unread: false,
    plots: [
      { plotCode: 'P-01', plotName: 'Thửa P-01 (Sen Vàng A1)', crop: 'Cà chua bi Cherry F1' },
      { plotCode: 'P-14', plotName: 'Thửa P-14 (Rừng Sác C3)', crop: 'Dưa leo baby F1' }
    ],
    messages: [
      {
        id: 1,
        sender: 'customer',
        senderName: 'Lô Thái Quyền',
        text: 'Chào chuyên gia Nam, cà chua bi của tôi ở thửa P-01 độ ẩm 68% đã đạt chuẩn chưa ạ?',
        time: '15:10',
        seen: true,
        plotCode: 'P-01',
        crop: 'Cà chua bi Cherry F1'
      },
      {
        id: 2,
        sender: 'expert',
        senderName: 'ThS. Nguyễn Hoàng Nam',
        text: 'Chào anh Quyền! Độ ẩm 68% ở Thửa P-01 là hoàn hảo cho giai đoạn cây chuẩn bị bung hoa nhé.',
        time: '15:15',
        seen: true,
        plotCode: 'P-01',
        crop: 'Cà chua bi Cherry F1'
      },
      {
        id: 3,
        sender: 'customer',
        senderName: 'Lô Thái Quyền',
        text: 'Cảm ơn Thạc sĩ rất nhiều!',
        time: '15:19',
        seen: true,
        plotCode: 'P-01',
        crop: 'Cà chua bi Cherry F1'
      },
      {
        id: 4,
        sender: 'customer',
        senderName: 'Lô Thái Quyền',
        text: 'Còn luống dưa leo baby ở thửa P-14 sáng nay em thấy lá hơi xoăn nhẹ, chuyên gia xem giúp em với ạ.',
        time: '15:30',
        seen: true,
        plotCode: 'P-14',
        crop: 'Dưa leo baby F1'
      },
      {
        id: 5,
        sender: 'expert',
        senderName: 'ThS. Nguyễn Hoàng Nam',
        text: 'Thửa P-14 do độ ẩm không khí hôm nay cao, em tưới sương nhẹ buổi sáng thôi và kiểm tra béc tưới nhỏ giọt lúc 16h nhé.',
        time: '15:35',
        seen: true,
        plotCode: 'P-14',
        crop: 'Dưa leo baby F1',
        prescriptionTag: 'CHỈ ĐẠO THỬA P-14'
      }
    ]
  },
  // 2. Nhân viên hiện trường SSoT: Trần Văn Lực (Phụ trách Thửa P-03 và Thửa P-12)
  {
    id: 'WORK-101',
    conversationId: 3,
    role: 'worker',
    roleLabel: 'CVLĐ Hiện Trường',
    category: 'worker',
    customerName: 'Trần Văn Lực (Tổ trưởng CVLĐ)',
    customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    plotCode: 'P-03, P-12',
    plotName: 'Thửa P-03 & Thửa P-12',
    crop: 'Dưa leo Baby & Cà chua bi',
    stage: 'Giám sát kỹ thuật & Điều phối hiện trường',
    expertName: 'ThS. Nguyễn Hoàng Nam',
    isOnline: true,
    lastTime: '10 phút trước',
    status: 'PENDING',
    unread: true,
    plots: [
      { plotCode: 'P-03', plotName: 'Thửa P-03 (Rừng Sác C3)', crop: 'Dưa leo Baby Đà Lạt' },
      { plotCode: 'P-12', plotName: 'Thửa P-12 (Vườn Ươm B2)', crop: 'Cà chua bi F1' }
    ],
    messages: [
      {
        id: 101,
        sender: 'worker',
        senderName: 'Trần Văn Lực (CVLĐ)',
        text: 'Báo cáo Chuyên gia: Đã hoàn tất kiểm tra béc tưới và độ ẩm các luống dưa leo P-03.',
        time: '15:20',
        seen: true,
        plotCode: 'P-03',
        crop: 'Dưa leo Baby Đà Lạt'
      },
      {
        id: 102,
        sender: 'expert',
        senderName: 'ThS. Nguyễn Hoàng Nam',
        text: 'Tốt lắm Lực. Chiều nay qua tiếp thửa P-12 kiểm tra độ ẩm cà chua bi và bón lót vi sinh Trichoderma nhé.',
        time: '15:25',
        seen: true,
        plotCode: 'P-12',
        crop: 'Cà chua bi F1',
        prescriptionTag: 'CHỈ ĐẠO THỬA P-12'
      },
      {
        id: 103,
        sender: 'worker',
        senderName: 'Trần Văn Lực (CVLĐ)',
        text: 'Dạ rõ thưa Thầy Nam, em đang chuẩn bị chế phẩm vi sinh để qua P-12 ngay.',
        time: '15:28',
        seen: false,
        plotCode: 'P-12',
        crop: 'Cà chua bi F1'
      }
    ]
  },
  // 3. Quản Trị Viên: Ban Quản Trị Farmely
  {
    id: 'ADMIN-01',
    role: 'admin',
    roleLabel: 'Ban Quản Trị',
    category: 'admin',
    customerName: 'Ban Quản Trị Farmely',
    customerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    plotCode: '',
    plotName: 'Hội đồng Quản trị Farmely',
    crop: '',
    stage: 'Điều phối & Giám sát vận hành toàn trang trại',
    expertName: 'ThS. Nguyễn Hoàng Nam',
    isOnline: true,
    lastTime: 'Hôm nay',
    status: 'REPLIED',
    unread: false,
    messages: [
      {
        id: 201,
        sender: 'admin',
        senderName: 'Ban Quản Trị Farmely',
        text: 'Ban Quản Trị lưu ý: Đã kích hoạt lịch kiểm tra định kỳ tiêu chuẩn VietGAP cho các thửa canh tác.',
        time: '08:00',
        seen: true
      }
    ]
  }
];

export const DEFAULT_AVATARS = {
  customer: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  worker: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  expert: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  admin: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
};

export const getSafeAvatar = (url, role = 'customer') => {
  if (url && typeof url === 'string' && url.trim().length > 5 && !url.includes('placeholder')) {
    return url;
  }
  return DEFAULT_AVATARS[role] || DEFAULT_AVATARS.customer;
};

/**
 * Retrieve all threads from storage, or initialize if empty
 */
export function getStoredThreads() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    // Dọn dẹp cache mock cũ
    try {
      window.localStorage.removeItem('farmely_chat_threads_v6');
      window.localStorage.removeItem('farmely_chat_threads_v5');
    } catch (_) {}

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Lọc bỏ triệt để các mock user rác cũ (Mai Anh Thư, Hùng, Hương, Quân, Đạt, Hoa, Nam, qw, duplicate Ban Quản Trị)
    const validSeedIds = new Set(INITIAL_THREADS.map((t) => t.id));
    const cleaned = parsed.filter((t) => {
      if (validSeedIds.has(t.id)) return true;
      if (/Mai Anh Thư|Nguyễn Văn Hùng|Phạm Thu Hương|Trần Minh Quân|Nguyễn Văn Đạt|Lê Thị Hoa|Hoàng Văn Nam|^qw$/i.test(t.customerName || '')) {
        return false;
      }
      if (/Ban Quản Trị|Admin/i.test(t.customerName || '') && t.id !== 'ADMIN-01') {
        return false;
      }
      return true;
    });

    if (cleaned.length !== parsed.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      return cleaned;
    }

    return parsed;
  } catch (err) {
    console.error('[ChatStorage] Error loading threads from localStorage:', err);
    return [];
  }
}

/**
 * Get a specific thread by ID
 */
export function getStoredThreadById(threadId) {
  const threads = getStoredThreads();
  return threads.find((t) => t.id === threadId) || null;
}

export function getPlotChatThreadId({ userId, email, plotCode, role = 'customer' }) {
  const identity = email || userId || role.toUpperCase();
  const safeUser = String(identity).replace(/[^a-zA-Z0-9]/g, '_');
  const safePlot = String(plotCode || 'UNKNOWN').replace(/[^a-zA-Z0-9]/g, '_');
  return `${role === 'worker' ? 'WORK' : 'CONS'}-${safeUser}-PLOT-${safePlot}`;
}

export function upsertPlotChatThread({ threadId, rentalId, customerName, customerEmail, customerAvatar, plotCode, plotName, crop, rentalStatus = 'NOT_RENTED' }) {
  if (!threadId) return null;
  const threads = getStoredThreads();
  const existingIndex = threads.findIndex((thread) => thread.id === threadId);
  const existing = existingIndex >= 0 ? threads[existingIndex] : null;
  const thread = {
    ...(existing || {}),
    id: threadId,
    role: 'customer',
    roleLabel: rentalStatus === 'RENTED' ? 'Khách thuê đất' : 'Khách tư vấn trước thuê',
    category: 'expert',
    plotChat: true,
    rentalStatus,
    rentalId: rentalId || existing?.rentalId || null,
    customerName: customerName || existing?.customerName || 'Khách hàng Farmely',
    customerEmail: customerEmail || existing?.customerEmail || '',
    customerAvatar: customerAvatar || existing?.customerAvatar || getSafeAvatar(null, 'customer'),
    plotCode: plotCode || existing?.plotCode || '',
    plotName: plotName || existing?.plotName || '',
    crop: crop || existing?.crop || '',
    stage: rentalStatus === 'RENTED' ? 'Đang thuê thửa đất' : 'Đang tìm hiểu thửa đất',
    expertName: existing?.expertName || 'ThS. Nguyễn Hoàng Nam',
    isOnline: true,
    lastTime: existing?.lastTime || 'Chưa có tin nhắn',
    status: existing?.status || 'PENDING',
    unread: existing?.unread || false,
    messages: existing?.messages || []
  };
  const updatedThreads = existingIndex >= 0
    ? threads.map((item, index) => index === existingIndex ? thread : item)
    : [thread, ...threads];
  saveThreads(updatedThreads);
  return { thread, threads: updatedThreads };
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
      customerAvatar: getSafeAvatar(null, message.sender === 'worker' ? 'worker' : 'customer'),
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

export function updateThreadRentalInStorage({ threadId, rentalId, customerName, customerAvatar, plotCode, plotName, crop }) {
  const threads = getStoredThreads();

  // Không bao giờ gán đè Ban Quản Trị hoặc tạo thêm Admin thành Khách Thuê Đất
  if (/Ban Quản Trị|Admin/i.test(customerName || '') || String(threadId || '').toLowerCase().includes('admin')) {
    return { thread: null, threads };
  }

  // Tìm thread hiện có theo threadId hoặc theo tên
  const requestedThreadIndex = threads.findIndex((thread) => thread.id === threadId);
  const normalizedPlotCode = String(plotCode || '').trim().toUpperCase().replace(/^PLOT-/, '');
  const existingIndex = requestedThreadIndex >= 0 ? requestedThreadIndex : threads.findIndex((thread) => {
    const existingPlotCode = String(thread.plotCode || '').trim().toUpperCase().replace(/^PLOT-/, '');
    return customerName && thread.customerName
      && thread.customerName.toLowerCase() === customerName.toLowerCase()
      && existingPlotCode === normalizedPlotCode;
  });
  const existing = existingIndex >= 0 ? threads[existingIndex] : null;

  const cleanPlotCode = (plotCode || '')
    .replace(/\bPlot\s+Plot\b/gi, 'Plot')
    .replace(/\bThửa\s+Thửa\b/gi, 'Thửa')
    .trim();

  // Duy trì và hợp nhất danh sách các thửa đất mà khách hàng/nhân viên này phụ trách
  const existingPlots = Array.isArray(existing?.plots) ? [...existing.plots] : [];
  if (cleanPlotCode) {
    const foundIdx = existingPlots.findIndex(p => p.plotCode === cleanPlotCode);
    const newPlotEntry = { 
      plotCode: cleanPlotCode, 
      plotName: plotName || `Thửa ${cleanPlotCode}`, 
      crop: crop || 'Cây trồng VietGAP' 
    };
    if (foundIdx >= 0) {
      existingPlots[foundIdx] = { ...existingPlots[foundIdx], ...newPlotEntry };
    } else {
      existingPlots.push(newPlotEntry);
    }
  }
  const combinedPlotCodes = existingPlots.length > 0 
    ? existingPlots.map(p => p.plotCode).join(', ')
    : cleanPlotCode;

  const thread = {
    ...(existing || {}),
    id: existing?.id || threadId,
    rentalId: rentalId || existing?.rentalId || null,
    role: 'customer',
    roleLabel: 'Khách Thuê Đất',
    rentalStatus: 'RENTED',
    customerName: customerName || existing?.customerName || 'Khách hàng Farmely',
    customerAvatar: customerAvatar || existing?.customerAvatar || getSafeAvatar(null, 'customer'),
    plotCode: combinedPlotCodes,
    plotName: plotName || existing?.plotName || `Thửa ${cleanPlotCode}`,
    crop: crop || existing?.crop || 'Cây trồng VietGAP',
    plots: existingPlots.length > 0 ? existingPlots : (cleanPlotCode ? [{ plotCode: cleanPlotCode, plotName: plotName || `Thửa ${cleanPlotCode}`, crop }] : []),
    stage: existing?.stage || 'Đã xác nhận thuê thửa',
    expertName: existing?.expertName || 'ThS. Nguyễn Hoàng Nam',
    isOnline: true,
    lastTime: 'Vừa cập nhật',
    status: existing?.status || 'PENDING',
    unread: existing?.unread || false,
    messages: existing?.messages || []
  };

  const updatedThreads = existingIndex >= 0
    ? threads.map((item, index) => index === existingIndex ? thread : item)
    : [thread, ...threads];

  saveThreads(updatedThreads);
  return { thread, threads: updatedThreads };
}
