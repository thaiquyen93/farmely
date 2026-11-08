import { test, expect } from '@playwright/test';
import pg from 'pg';
import { createFixture, cleanup, startInDays, startInTenDays, isolatedQuery } from './support/reservation-fixture';

test('F2-06 SELF reservation creates one pending contract and rental', async ({ request }) => {
  const fixture = await createFixture(request, 'F2-06');
  try {
    const response = await request.post('/api/contracts/reservations', {
      data: { renterId: 1, items: [{ plotId: fixture.plotCode, varietyId: fixture.varietyId, cultivationMode: 'SELF', startDate: startInDays(5), termMonths: 3 }] },
    });
    expect(response.status()).toBe(201);
    const contract = (await response.json()).data;
    fixture.contractId = contract.contractId;
    expect(contract.status).toBe('PENDING_PAYMENT');
    expect(Number(contract.totalAmount)).toBe(3600000);
    const rows = await isolatedQuery<{ rental_id: number; cultivation_mode: string; status: string; plot_id: number }>(
      'select rental_id, cultivation_mode, status, plot_id from rentals where contract_id = $1', [fixture.contractId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ cultivation_mode: 'SELF', status: 'PENDING', plot_id: fixture.plotId });
  } finally {
    await cleanup(fixture);
  }
});

test('F2-07 ASSISTED reservation includes care fee in contract total', async ({ request }) => {
  const fixture = await createFixture(request, 'F2-07');
  try {
    const response = await request.post('/api/contracts/reservations', {
      data: { renterId: 1, items: [{ plotId: fixture.plotCode, varietyId: fixture.varietyId, cultivationMode: 'ASSISTED', startDate: startInTenDays(), termMonths: 3 }] },
    });
    expect(response.status()).toBe(201);
    const contract = (await response.json()).data;
    fixture.contractId = contract.contractId;
    expect(contract.status).toBe('PENDING_PAYMENT');
    expect(Number(contract.totalAmount)).toBeGreaterThan(3600000);
    const rows = await isolatedQuery<{ total_price: string; cultivation_mode: string }>(
      'select total_price, cultivation_mode from rentals where contract_id = $1', [fixture.contractId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].cultivation_mode).toBe('ASSISTED');
    expect(Number(rows[0].total_price)).toBe(Number(contract.totalAmount));
  } finally {
    await cleanup(fixture);
  }
});

test('F2-09 Empty reservation is rejected without creating a contract', async ({ request }) => {
  const [before] = await isolatedQuery<{ total: string }>('select count(*) as total from contracts');
  const response = await request.post('/api/contracts/reservations', { data: { renterId: 1, items: [] } });
  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.success).toBe(false);
  const [after] = await isolatedQuery<{ total: string }>('select count(*) as total from contracts');
  expect(after.total).toBe(before.total);
});

test('F2-10 Start date accepts T+5 through T+14 only', async ({ request }) => {
  const fixture = await createFixture(request, 'F2-10');
  try {
    for (const days of [4, 15]) {
      const rejected = await request.post('/api/contracts/reservations', {
        data: { renterId: 1, items: [{ plotId: fixture.plotCode, varietyId: fixture.varietyId, cultivationMode: 'SELF', startDate: startInDays(days), termMonths: 3 }] },
      });
      expect(rejected.status()).toBe(400);
      expect((await rejected.json()).success).toBe(false);
    }
    const shortTerm = await request.post('/api/contracts/reservations', {
      data: { renterId: 1, items: [{ plotId: fixture.plotCode, varietyId: fixture.varietyId, cultivationMode: 'SELF', startDate: startInDays(5), termMonths: 0 }] },
    });
    expect(shortTerm.status()).toBe(400);
    expect((await shortTerm.json()).success).toBe(false);
    const rows = await isolatedQuery('select contract_id from rentals where plot_id = $1', [fixture.plotId]);
    expect(rows).toHaveLength(0);
    const accepted = await request.post('/api/contracts/reservations', {
      data: { renterId: 1, items: [{ plotId: fixture.plotCode, varietyId: fixture.varietyId, cultivationMode: 'SELF', startDate: startInDays(14), termMonths: 3 }] },
    });
    expect(accepted.status()).toBe(201);
    fixture.contractId = Number((await accepted.json()).data.contractId);
  } finally {
    await cleanup(fixture);
  }
});

test('F2-11 Incompatible variety is rejected by reservation API', async ({ request }) => {
  const fixture = await createFixture(request, 'F2-11');
  try {
    const compatibility = await isolatedQuery<{ variety_id: number }>(
      'select variety_id from plot_variety_compatibility where plot_id = $1', [fixture.plotId],
    );
    expect(compatibility.map((row) => row.variety_id)).toEqual([fixture.varietyId]);
    const response = await request.get('/api/varieties');
    expect(response.ok()).toBe(true);
    const other = (await response.json()).data.find((item: { id: number }) => Number(item.id) !== fixture.varietyId);
    expect(other).toBeTruthy();
    const reserved = await request.post('/api/contracts/reservations', {
      data: { renterId: 1, items: [{ plotId: fixture.plotCode, varietyId: other.id, cultivationMode: 'SELF', startDate: startInTenDays(), termMonths: 3 }] },
    });
    expect(reserved.status()).toBe(400);
    expect((await reserved.json()).success).toBe(false);
    const rows = await isolatedQuery('select contract_id from rentals where plot_id = $1', [fixture.plotId]);
    expect(rows).toHaveLength(0);
  } finally {
    await cleanup(fixture);
  }
});

test('F2-12 MAINT plot cannot be reserved', async ({ request }) => {
  const fixture = await createFixture(request, 'F2-12', 'MAINT');
  try {
    const response = await request.post('/api/contracts/reservations', {
      data: { renterId: 1, items: [{ plotId: fixture.plotCode, varietyId: fixture.varietyId, cultivationMode: 'SELF', startDate: startInTenDays(), termMonths: 3 }] },
    });
    const body = await response.json();
    if (body.data?.contractId) fixture.contractId = Number(body.data.contractId);
    expect(response.status()).toBe(400);
    expect(body.success).toBe(false);
  } finally {
    await cleanup(fixture);
  }
});

test('F2-16 Mock activation records one payment and activates contract, rental and plot', async ({ request }) => {
  const fixture = await createFixture(request, 'F2-16');
  try {
    const reserved = await request.post('/api/contracts/reservations', {
      data: { renterId: 1, items: [{ plotId: fixture.plotCode, varietyId: fixture.varietyId, cultivationMode: 'ASSISTED', startDate: startInTenDays(), termMonths: 3 }] },
    });
    expect(reserved.status()).toBe(201);
    fixture.contractId = Number((await reserved.json()).data.contractId);
    const activated = await request.post(`/api/contracts/${fixture.contractId}/activate`, { data: { paymentMethod: 'MOCK' } });
    expect(activated.ok()).toBe(true);
    const [contract] = await isolatedQuery<{ status: string; total_amount: string }>(
      'select status, total_amount from contracts where contract_id = $1', [fixture.contractId],
    );
    expect(contract.status).toBe('ACTIVE');
    const rentals = await isolatedQuery<{ status: string; cultivation_mode: string }>(
      'select status, cultivation_mode from rentals where contract_id = $1', [fixture.contractId],
    );
    expect(rentals).toHaveLength(1);
    expect(rentals[0]).toMatchObject({ status: 'ACTIVE', cultivation_mode: 'ASSISTED' });
    const payments = await isolatedQuery<{ amount: string; status: string }>(
      'select amount, status from payment_transactions where contract_id = $1', [fixture.contractId],
    );
    expect(payments).toHaveLength(1);
    expect(payments[0].status).toBe('SUCCESS');
    expect(Number(payments[0].amount)).toBe(Number(contract.total_amount));
    const [plot] = await isolatedQuery<{ status: string }>('select status from plots where plot_id = $1', [fixture.plotId]);
    expect(plot.status).toBe('RENT');
  } finally {
    await cleanup(fixture);
  }
});

test('F3-04 Activated ASSISTED rental assigns care tasks to its Staff', async ({ request }) => {
  const fixture = await createFixture(request, 'F3-04');
  try {
    const reserved = await request.post('/api/contracts/reservations', {
      data: { renterId: 1, items: [{ plotId: fixture.plotCode, varietyId: fixture.varietyId, cultivationMode: 'ASSISTED', startDate: startInTenDays(), termMonths: 3 }] },
    });
    expect(reserved.status()).toBe(201);
    fixture.contractId = Number((await reserved.json()).data.contractId);
    expect((await request.post(`/api/contracts/${fixture.contractId}/activate`, { data: { paymentMethod: 'MOCK' } })).ok()).toBe(true);
    const [rental] = await isolatedQuery<{ rental_id: number; staff_id: number }>(
      'select rental_id, staff_id from rentals where contract_id = $1', [fixture.contractId],
    );
    expect(rental.staff_id).toBeGreaterThan(0);
    const tasks = await isolatedQuery<{ task_assigned_to: number; rental_id: number }>(
      'select task_assigned_to, rental_id from care_tasks where rental_id = $1', [rental.rental_id],
    );
    expect(tasks.length).toBeGreaterThan(0);
    for (const task of tasks) {
      expect(task.task_assigned_to).toBe(rental.staff_id);
      expect(task.rental_id).toBe(rental.rental_id);
    }
  } finally {
    await cleanup(fixture);
  }
});

test('F4-10 Mock payment updates Admin revenue, plot and task KPIs once', async ({ page, request }) => {
  const baselineResponse = await request.get('/api/admin/analytics');
  expect(baselineResponse.ok()).toBe(true);
  const baseline = (await baselineResponse.json()).data.kpi;
  const fixture = await createFixture(request, 'F4-10');
  try {
    const reserved = await request.post('/api/contracts/reservations', {
      data: { renterId: 1, items: [{ plotId: fixture.plotCode, varietyId: fixture.varietyId, cultivationMode: 'ASSISTED', startDate: startInTenDays(), termMonths: 3 }] },
    });
    expect(reserved.status()).toBe(201);
    const contract = (await reserved.json()).data;
    fixture.contractId = Number(contract.contractId);
    const activated = await request.post(`/api/contracts/${fixture.contractId}/activate`, { data: { paymentMethod: 'MOCK' } });
    expect(activated.ok()).toBe(true);
    const response = await request.get('/api/admin/analytics');
    expect(response.ok()).toBe(true);
    const current = (await response.json()).data.kpi;
    expect(Number(current.totalRevenue)).toBe(Number(baseline.totalRevenue) + Number(contract.totalAmount));
    expect(current.totalPlots).toBe(baseline.totalPlots + 1);
    expect(current.rentedPlots).toBe(baseline.rentedPlots + 1);
    expect(current.totalTasks).toBeGreaterThan(baseline.totalTasks);

    await page.addInitScript(() => {
      const user = { userId: 4, id: 'USR-004', fullName: 'E2E Admin', role: 'ADMIN' };
      localStorage.setItem('farmely_auth', JSON.stringify({ user, token: 'demo-token-e2e' }));
    });
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(`${Number(current.totalRevenue).toLocaleString('vi-VN')} Ä‘`, { exact: true }).first()).toBeVisible();
  } finally {
    await cleanup(fixture);
  }
  const restored = await request.get('/api/admin/analytics');
  expect(restored.ok()).toBe(true);
  const finalKpi = (await restored.json()).data.kpi;
  expect(Number(finalKpi.totalRevenue)).toBe(Number(baseline.totalRevenue));
  expect(finalKpi.totalPlots).toBe(baseline.totalPlots);
});

async function activeCareFixture(request: APIRequestContext, id: string) {
  const fixture = await createFixture(request, id);
  const reserved = await request.post('/api/contracts/reservations', {
    data: { renterId: 1, items: [{ plotId: fixture.plotCode, varietyId: fixture.varietyId, cultivationMode: 'ASSISTED', startDate: startInTenDays(), termMonths: 3 }] },
  });
  expect(reserved.status()).toBe(201);
  fixture.contractId = Number((await reserved.json()).data.contractId);
  expect((await request.post(`/api/contracts/${fixture.contractId}/activate`, { data: { paymentMethod: 'MOCK' } })).ok()).toBe(true);
  const [task] = await isolatedQuery<{ task_id: number; rental_id: number; task_assigned_to: number; status: string }>(
    `select ct.task_id, ct.rental_id, ct.task_assigned_to, ct.status
     from care_tasks ct join rentals r on r.rental_id = ct.rental_id
     where r.contract_id = $1 order by ct.task_id limit 1`, [fixture.contractId],
  );
  expect(task).toBeTruthy();
  return { fixture, task };
}

test('F3-05 Staff completes assigned task with proof and customer diary receives it', async ({ request }) => {
  const { fixture, task } = await activeCareFixture(request, 'F3-05');
  try {
    const response = await request.patch(`/api/care-tasks/${task.task_id}/complete`, {
      data: {
        workerId: task.task_assigned_to, status: 'DONE',
        evidenceImageUrl: '/images/harvest/rau-muong-p03.jpg', notes: 'E2E proof and care note',
      },
    });
    expect(response.ok()).toBe(true);
    const [updated] = await isolatedQuery<{ status: string; evidence_image_url: string; notes: string }>(
      'select status, evidence_image_url, notes from care_tasks where task_id = $1', [task.task_id],
    );
    expect(updated).toMatchObject({ status: 'DONE', evidence_image_url: '/images/harvest/rau-muong-p03.jpg', notes: 'E2E proof and care note' });
    const diary = await isolatedQuery<{ rental_id: number; content: string; image_url: string }>(
      'select rental_id, content, image_url from farm_diaries where task_id = $1', [task.task_id],
    );
    expect(diary).toHaveLength(1);
    expect(diary[0].rental_id).toBe(task.rental_id);
    expect(diary[0].content).toContain('E2E proof');
    expect(diary[0].image_url).toBe('/images/harvest/rau-muong-p03.jpg');
  } finally {
    await cleanup(fixture);
  }
});

test('F3-06 Task cannot be completed without proof image', async ({ request }) => {
  const { fixture, task } = await activeCareFixture(request, 'F3-06');
  try {
    const response = await request.patch(`/api/care-tasks/${task.task_id}/complete`, {
      data: { workerId: task.task_assigned_to, status: 'DONE', notes: 'E2E missing evidence' },
    });
    expect([400, 422]).toContain(response.status());
    const [updated] = await isolatedQuery<{ status: string }>(
      'select status from care_tasks where task_id = $1', [task.task_id],
    );
    expect(updated.status).not.toBe('DONE');
  } finally {
    await cleanup(fixture);
  }
});


\n