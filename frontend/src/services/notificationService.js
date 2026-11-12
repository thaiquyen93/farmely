/**
 * Dịch vụ Thông báo Đồng bộ Toàn Hệ Thống (In-App Notification Service)
 * Hỗ trợ giao tiếp thời gian thực giữa các Role:
 * 1. Chuyên gia (Expert) tạo quy trình -> Thông báo cho Quản trị viên (Admin) phê duyệt.
 * 2. Khách hàng (Customer) thuê thửa đất -> Thông báo cho Nhân viên (Staff) phụ trách nhận việc.
 * 3. Công việc hàng ngày (Daily Care Tasks) -> Thông báo cho Nhân viên (Staff) làm nhiệm vụ.
 */

const STORAGE_KEY = 'farmely_system_notifications_v1';
const CHANNEL_NAME = 'farmely_notifications_channel';
let localNotifSeq = 0;

const normalizeNotifRole = (role) => {
  const upper = String(role || '').toUpperCase();
  return (upper === 'FIELD_WORKER' || upper === 'WORKER') ? 'STAFF' : upper;
};

const getBroadcastChannel = () => {
  if (typeof window !== 'undefined' && window.BroadcastChannel) {
    try {
      return new BroadcastChannel(CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return null;
};

export const getStoredNotifications = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

export const saveStoredNotifications = (notifications) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {}
};

/**
 * Gửi thông báo mới tới người dùng hoặc vai trò cụ thể
 * @param {Object} params
 * @param {number|string} [params.userId] - ID người nhận (tùy chọn nếu gửi theo role)
 * @param {string} [params.targetRole] - Vai trò nhận ('ADMIN', 'STAFF', 'EXPERT', 'CUSTOMER')
 * @param {string} params.title - Tiêu đề thông báo
 * @param {string} params.content - Nội dung thông báo
 * @param {string} [params.type] - Phân loại ('PROCESS_TEMPLATE', 'PLOT_ASSIGNMENT', 'DAILY_TASK', 'GENERAL')
 * @param {string} [params.link] - Đường dẫn chuyển hướng khi bấm vào thông báo
 */
export const sendNotification = async ({
  userId,
  targetRole,
  title,
  content,
  type = 'GENERAL',
  link,
  notificationId = null,
  skipApiPost = false
}) => {
  localNotifSeq = (localNotifSeq + 1) % 1000;
  const newNotice = {
    id: notificationId ? `DB-NOTIF-${notificationId}` : `NOTIF-${Date.now()}-${localNotifSeq}-${Math.floor(Math.random() * 1000)}`,
    notificationId: notificationId ? Number(notificationId) : Number(`${Date.now()}${String(localNotifSeq).padStart(3, '0')}`),
    userId: userId ? Number(userId) : null,
    targetRole: targetRole ? normalizeNotifRole(targetRole) : null,
    title,
    content,
    type,
    link: link || null,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  // 1. Lưu vào LocalStorage
  const list = getStoredNotifications();
  const deduped = notificationId
    ? list.filter((n) => String(n.notificationId) !== String(newNotice.notificationId) && String(n.id) !== String(newNotice.id))
    : list;
  deduped.unshift(newNotice);
  // Giữ tối đa 100 thông báo gần nhất
  saveStoredNotifications(deduped.slice(0, 100));

  // 2. Phát tín hiệu qua BroadcastChannel cho các tab khác
  try {
    const bc = getBroadcastChannel();
    if (bc) {
      bc.postMessage({ type: 'NEW_NOTIFICATION', data: newNotice });
      setTimeout(() => bc.close(), 500);
    }
  } catch {}

  // 3. Kích hoạt CustomEvent nội bộ cùng tab
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('farmely_notification_received', { detail: newNotice }));
  }

  // 4. Đồng bộ lên Backend notification API nếu chưa được endpoint nghiệp vụ lưu trước đó
  try {
    if (!skipApiPost && userId && Number.isFinite(Number(userId))) {
      fetch('/api/v1/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: Number(userId), title, content, link, type })
      }).catch(() => {});
    }
  } catch {}

  return newNotice;
};

/**
 * Lấy danh sách thông báo dành riêng cho người dùng hiện tại
 */
export const getNotificationsForUser = (user) => {
  if (!user) return [];
  const list = getStoredNotifications();
  const currentUserId = Number(user.userId || user.id);
  const currentRole = normalizeNotifRole(user.role);

  return list.filter((n) => {
    // Nếu thông báo đích danh theo userId
    if (n.userId && currentUserId && n.userId === currentUserId) return true;
    // Nếu thông báo gửi chung theo vai trò (ví dụ tất cả ADMIN hoặc STAFF/FIELD_WORKER)
    if (n.targetRole && normalizeNotifRole(n.targetRole) === currentRole) return true;
    return false;
  });
};

/**
 * Đánh dấu một thông báo đã đọc
 */
export const markAsRead = (notificationId) => {
  const list = getStoredNotifications();
  let dbId = null;
  const updated = list.map((n) => {
    if (String(n.id) === String(notificationId) || String(n.notificationId) === String(notificationId)) {
      if (n.notificationId && /^\d+$/.test(String(n.notificationId)) && Number(n.notificationId) < 1000000000000) {
        dbId = Number(n.notificationId);
      }
      return { ...n, isRead: true };
    }
    return n;
  });
  saveStoredNotifications(updated);

  const dbMatch = String(notificationId || '').match(/^DB-NOTIF-(\d+)$/) || String(notificationId || '').match(/^(\d+)$/);
  if (!dbId && dbMatch && Number(dbMatch[1]) < 1000000000000) {
    dbId = Number(dbMatch[1]);
  }
  if (dbId && typeof fetch === 'function') {
    try {
      fetch(`/api/v1/notifications/${dbId}/read`, { method: 'PATCH' }).catch(() => {});
    } catch {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('farmely_notification_received'));
  }
};

/**
 * Đánh dấu tất cả thông báo của người dùng là đã đọc
 */
export const markAllAsReadForUser = (user) => {
  if (!user) return;
  const currentUserId = Number(user.userId || user.id);
  const currentRole = normalizeNotifRole(user.role);
  const list = getStoredNotifications();

  const updated = list.map((n) => {
    const matchUser = n.userId && currentUserId && n.userId === currentUserId;
    const matchRole = n.targetRole && normalizeNotifRole(n.targetRole) === currentRole;
    if (matchUser || matchRole) {
      return { ...n, isRead: true };
    }
    return n;
  });
  saveStoredNotifications(updated);

  if (currentUserId && Number.isFinite(currentUserId) && typeof fetch === 'function') {
    try {
      fetch(`/api/v1/notifications/read-all?userId=${currentUserId}`, { method: 'PATCH' }).catch(() => {});
    } catch {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('farmely_notification_received'));
  }
};
