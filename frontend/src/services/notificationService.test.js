import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sendNotification,
  getNotificationsForUser,
  markAsRead,
  markAllAsReadForUser,
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
});
