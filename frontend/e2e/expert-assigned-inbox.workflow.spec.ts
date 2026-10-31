import { test, expect } from '@playwright/test';
import { cleanup, createPlotInExistingLand, isolatedQuery, startInDays } from './support/reservation-fixture';

test('Expert inbox shows only Admin and conversations for assigned plots', async ({ page, request }) => {
  test.setTimeout(90_000);
  const plot = await createPlotInExistingLand(request, 'CHAT');
  try {
    await page.addInitScript(() => {
      const user = { userId: 5, id: 'USR-5', fullName: 'ThS. Nguyễn Hoàng Nam', role: 'EXPERT' };
      localStorage.setItem('farmely_auth', JSON.stringify({ user, token: 'demo-token-e2e' }));
      localStorage.setItem('farmely_user', JSON.stringify(user));
      localStorage.setItem('farmely_token', 'demo-token-e2e');
    });

    const reservation = await request.post('/api/contracts/reservations', { data: {
      renterId: 1,
      items: [{ plotId: plot.plotCode, varietyId: plot.varietyId, cultivationMode: 'ASSISTED', startDate: startInDays(5), termMonths: 3 }],
    } });
    expect(reservation.status()).toBe(201);
    plot.contractId = Number((await reservation.json()).data.contractId);
    expect((await request.post(`/api/contracts/${plot.contractId}/activate`, { data: { paymentMethod: 'MOCK' } })).ok()).toBe(true);
    const [rental] = await isolatedQuery<{ rental_id: number }>('select rental_id from rentals where contract_id = $1', [plot.contractId]);

    await page.goto('/expert/dashboard?tab=chat');
    await expect(page.getByText('Ban Quản Trị Farmely').first()).toBeVisible();
    await expect(page.getByText(plot.plotCode)).toHaveCount(0);
    await expect(page.getByText('Phạm Thu Hương')).toHaveCount(0);

    const assigned = await request.patch(`/api/rentals/${rental.rental_id}/assign`, { data: { expertId: 5, staffId: 8 } });
    expect(assigned.ok()).toBe(true);
    await page.reload();
    await expect(page.getByText(plot.plotCode).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Lô Thái Quyền').first()).toBeVisible();
    await expect(page.getByText('Trần Văn Lực').first()).toBeVisible();
    await expect(page.getByText('Phạm Thu Hương')).toHaveCount(0);

    await page.getByRole('button', { name: /Trần Văn Lực/ }).first().click();
    const message = `E2E expert reply for ${plot.plotCode}`;
    await page.getByPlaceholder(/Soạn chỉ đạo kỹ thuật/).fill(message);
    await page.getByPlaceholder(/Soạn chỉ đạo kỹ thuật/).press('Enter');
    await expect.poll(async () => {
      const rows = await isolatedQuery<{ message_id: number }>(
        `select m.message_id from messages m join conversations c on c.conversation_id = m.conversation_id
         where c.rental_id = $1 and c.type = 'STAFF_EXP' and m.sender_id = 5 and m.content = $2`,
        [rental.rental_id, message]);
      return rows.length;
    }).toBe(1);

    await page.reload();
    await expect(page.getByText(plot.plotCode).first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /Trần Văn Lực/ }).first().click();
    await expect(page.getByText(message).first()).toBeVisible();
  } finally {
    await cleanup(plot);
  }
});
