import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sendNotification,
  getNotificationsForUser,
  markAsRead,
  markAllAsReadForUser,
  notifyExpertsOfNewPlot,
  notifyAdminsOfSupportTicket,
  notifyCustomerOfSupportReply,
  getStoredNotifications,
  saveStoredNotifications
} from './notificationService';

describe('Notification Service & Scenarios', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('Scenario 1: Expert creates template -> Admin receives notification for approval', async () => {
    const expertUser = { userId: 5, fullName: 'Kỹ sư Hoàng', role: 'EXPERT' };
    const adminUser = { userId: 4, fullName: 'Admin Farmely', role: 'ADMIN' };

    await sendNotification({
      targetRole: 'ADMIN',
      title: '📋 Quy trình canh tác mới cần phê duyệt',
      content: `Chuyên gia ${expertUser.fullName} vừa thiết lập quy trình Dưa leo baby. Vui lòng kiểm tra và phê duyệt.`,
      type: 'PROCESS_TEMPLATE',
      link: '/admin/master-data/process-templates'
    });

    const adminNotifications = getNotificationsForUser(adminUser);
    expect(adminNotifications.length).toBe(1);
    expect(adminNotifications[0].title).toContain('Quy trình canh tác mới cần phê duyệt');
    expect(adminNotifications[0].isRead).toBe(false);

    // Expert should not see Admin's approval notification
    const expertNotifications = getNotificationsForUser(expertUser);
    expect(expertNotifications.length).toBe(0);
  });

  it('Scenario 2: Customer rents plot -> Staff receives plot assignment notification', async () => {
    const staffUser = { userId: 8, fullName: 'Trần Văn Nhân', role: 'STAFF' };

    await sendNotification({
      targetRole: 'STAFF',
      userId: 8,
      title: '🌱 Phân công phụ trách thửa đất mới',
      content: 'Bạn được phân công phụ trách thửa đất P-04 của khách hàng Lô Thái Quyền.',
      type: 'PLOT_ASSIGNMENT',
      link: '/staff/dashboard'
    });

    const staffNotifications = getNotificationsForUser(staffUser);
    expect(staffNotifications.length).toBe(1);
    expect(staffNotifications[0].title).toContain('Phân công phụ trách thửa đất mới');
    expect(staffNotifications[0].type).toBe('PLOT_ASSIGNMENT');
  });

  it('Scenario 3: Daily care tasks notification for Staff', async () => {
    const staffUser = { userId: 8, fullName: 'Trần Văn Nhân', role: 'STAFF' };

    await sendNotification({
      targetRole: 'STAFF',
      userId: 8,
      title: '📋 Nhiệm vụ ca trực hôm nay',
      content: 'Hôm nay bạn có 3 công việc chăm sóc cần thực hiện trên các thửa đất phụ trách.',
      type: 'DAILY_TASK',
      link: '/staff/dashboard?tab=tasks'
    });

    const staffNotifications = getNotificationsForUser(staffUser);
    expect(staffNotifications.length).toBe(1);
    expect(staffNotifications[0].type).toBe('DAILY_TASK');

    // Mark as read
    markAsRead(staffNotifications[0].id);
    const updated = getNotificationsForUser(staffUser);
    expect(updated[0].isRead).toBe(true);
  });

  it('markAllAsReadForUser marks all matching notifications as read', async () => {
    const adminUser = { userId: 4, role: 'ADMIN' };

    await sendNotification({
      targetRole: 'ADMIN',
      title: 'Thông báo 1',
      content: 'Nội dung 1'
    });
    await sendNotification({
      targetRole: 'ADMIN',
      title: 'Thông báo 2',
      content: 'Nội dung 2'
    });

    expect(getNotificationsForUser(adminUser).filter(n => !n.isRead).length).toBe(2);

    markAllAsReadForUser(adminUser);
    expect(getNotificationsForUser(adminUser).filter(n => !n.isRead).length).toBe(0);
  });

  it('Scenario 4: Admin creates new plot -> Expert receives notification linking to compatibility tab', async () => {
    const expertUser = { userId: 5, role: 'EXPERT' };
    const adminUser = { userId: 4, role: 'ADMIN' };

    await notifyExpertsOfNewPlot({
      plotId: 25,
      plotCode: 'P-18',
      area: 150,
      expertNotifications: [
        { notificationId: 901, userId: 5 }
      ]
    });

    const expertNotifs = getNotificationsForUser(expertUser);
    expect(expertNotifs).toHaveLength(1);
    expect(expertNotifs[0].title).toContain('P-18');
    expect(expertNotifs[0].title).toContain('cần gán giống cây trồng');
    expect(expertNotifs[0].link).toBe('/expert/dashboard?tab=compatibility&plot=P-18&plotId=25');
    expect(getNotificationsForUser(adminUser)).toHaveLength(0);
  });

  it('Scenario 5: Customer reports support/issue -> Admin receives notification linking to support ticket', async () => {
    const customerUser = { userId: 1, fullName: 'Lô Thái Quyền', role: 'CUSTOMER' };
    const adminUser = { userId: 11, fullName: 'Ban Quản Trị', role: 'ADMIN' };
    const secondAdmin = { userId: 4, fullName: 'Admin 2', role: 'ADMIN' };

    await notifyAdminsOfSupportTicket(
      {
        id: 33,
        customerId: 1,
        title: 'Hỗ trợ về canh tác & theo dõi',
        description: 'Hệ thống tưới ở thửa A1 bị rò rỉ nước.',
        adminNotifications: [{ notificationId: 950, userId: 11 }]
      },
      customerUser
    );

    const adminNotifs = getNotificationsForUser(adminUser);
    expect(adminNotifs).toHaveLength(1);
    expect(adminNotifs[0].title).toContain('#33');
    expect(adminNotifs[0].content).toContain('Lô Thái Quyền');
    expect(adminNotifs[0].link).toBe('/admin/dashboard?tab=support&ticket=33');
    expect(getNotificationsForUser(customerUser)).toHaveLength(0);
    expect(getNotificationsForUser(secondAdmin)).toHaveLength(0);
  });

  it('Scenario 6: Admin replies to Customer support ticket -> only target Customer receives notification', async () => {
    const customerUser = { userId: 1, role: 'CUSTOMER' };
    const otherCustomer = { userId: 2, role: 'CUSTOMER' };
    const adminUser = { userId: 11, role: 'ADMIN' };

    await notifyCustomerOfSupportReply({
      ticketId: 33,
      ticketTitle: 'Hỗ trợ về canh tác & theo dõi',
      customerId: 1,
      replyBody: 'Kỹ thuật viên đã khóa van phụ và sửa ống tưới lúc 14:00.',
      customerNotification: { notificationId: 951, userId: 1 }
    });

    const customerNotifs = getNotificationsForUser(customerUser);
    expect(customerNotifs).toHaveLength(1);
    expect(customerNotifs[0].title).toContain('#33');
    expect(customerNotifs[0].content).toContain('sửa ống tưới');
    expect(customerNotifs[0].link).toBe('/customer/support/33');
    expect(getNotificationsForUser(otherCustomer)).toHaveLength(0);
    expect(getNotificationsForUser(adminUser)).toHaveLength(0);
  });
});
