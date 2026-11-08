import { test, expect, type APIRequestContext, type Browser, type Page } from '@playwright/test';
import { cleanup, createPlotInExistingLand, isolatedQuery, startInDays } from './support/reservation-fixture';

type PlotFixture = Awaited<ReturnType<typeof createPlotInExistingLand>>;
type RentalRow = { rental_id: number; expert_id: number | null; staff_id: number | null; status: string };

async function rolePage(browser: Browser, role: string, userId: number, route: string) {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
  const page = await context.newPage();
  await page.route('**/*', (request) =>
    ['127.0.0.1', 'localhost'].includes(new URL(request.request().url()).hostname)
      ? request.continue() : request.abort('blockedbyclient'));
  await page.addInitScript((user) => {
    localStorage.setItem('farmely_auth', JSON.stringify({ user, token: 'demo-token-e2e' }));
    localStorage.setItem('farmely_user', JSON.stringify(user));
    localStorage.setItem('farmely_token', 'demo-token-e2e');
  }, { userId, id: `USR-${userId}`, fullName: `E2E ${role}`, role });
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  return { page, context };
}

async function reserveAndPay(request: APIRequestContext, fixture: PlotFixture, mode: 'SELF' | 'ASSISTED') {
  const reserved = await request.post('/api/contracts/reservations', { data: {
    renterId: 1, items: [{ plotId: fixture.plotCode, varietyId: fixture.varietyId,
      cultivationMode: mode, startDate: startInDays(5), termMonths: 3 }],
  } });
  const reservationBody = await reserved.json();
  expect(reserved.status(), reservationBody.message || 'Reservation failed').toBe(201);
  const contract = reservationBody.data;
  fixture.contractId = Number(contract.contractId);
  const paid = await request.post(`/api/contracts/${fixture.contractId}/activate`, {
    data: { paymentMethod: 'MOCK' },
  });
  expect(paid.ok()).toBe(true);
  const [rental] = await isolatedQuery<RentalRow>(
    'select rental_id, expert_id, staff_id, status::text from rentals where contract_id = $1', [fixture.contractId]);
  expect(rental).toBeTruthy();
  return { contract, rental };
}

test('Demo four workflows use one new plot in an existing land, plus one cancellation plot', async ({ page, browser, request }, testInfo) => {
  test.setTimeout(180_000);
  const results: { step: string; status: 'PASS' | 'FAIL' | 'BLOCKED'; detail?: string }[] = [];
  let main: PlotFixture | undefined;
  let cancellation: PlotFixture | undefined;
  let rental: RentalRow | undefined;
  let mainAmount = 0;
  let serviceAmount = 0;
  let refundAmount = 0;
  let cancellationAmount = 0;
  const baseline = Number((await (await request.get('/api/admin/analytics')).json()).data.kpi.totalRevenue);
  const [landBefore] = await isolatedQuery<{ total: string }>('select count(*) as total from lands');

  async function check(step: string, fn: () => Promise<void>) {
    try {
      await test.step(step, fn);
      results.push({ step, status: 'PASS' });
    } catch (error) {
      const detail = error instanceof Error ? error.message.split('\n').slice(0, 9).join(' ') : String(error);
      results.push({ step, status: 'FAIL', detail });
      console.log(`FLOW_FAIL ${step}: ${detail}`);
    }
  }
  function blocked(step: string, reason: string) {
    results.push({ step, status: 'BLOCKED', detail: reason });
  }

  try {
    await check('F1 create and configure a plot in existing land 1', async () => {
      main = await createPlotInExistingLand(request, 'MAIN');
      const [plot] = await isolatedQuery<{ land_id: number; status: string; is_published: boolean; price_per_period: string }>(
        'select land_id, status::text, is_published, price_per_period from plots where plot_id = $1', [main.plotId]);
      expect(plot).toMatchObject({ land_id: 1, status: 'AVAIL', is_published: false });
      expect(Number(plot.price_per_period)).toBe(1200000);
      expect(await isolatedQuery('select variety_id from plot_variety_compatibility where plot_id = $1', [main.plotId])).toHaveLength(1);
      expect((await isolatedQuery('select step_id from template_steps where template_id in (select template_id from process_templates where variety_id = $1)', [main.varietyId])).length).toBeGreaterThan(1);
      expect((await isolatedQuery("select service_id from services where status = 'ACTIVE'")).length).toBeGreaterThan(0);
      const published = await request.put(`/api/plots/${main.plotId}`, { data: {
        landId: main.landId, plotCode: main.plotCode, area: 100, pricePerPeriod: 1200000,
        status: 'AVAIL', isPublished: true, varietyIds: [main.varietyId],
      } });
      expect(published.ok()).toBe(true);
      await page.goto(`/marketplace/plot/${main.plotCode}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(main.plotCode, { exact: false }).first()).toBeVisible();
      const [landAfter] = await isolatedQuery<{ total: string }>('select count(*) as total from lands');
      expect(landAfter.total).toBe(landBefore.total);
    });
    if (main) await check('F1 published plot is discoverable on Marketplace map', async () => {
      await page.goto('/marketplace', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(main!.plotCode, { exact: false }).first()).toBeVisible();
    });

    if (main) {
      await check('F2 Customer rents and mock pays the same plot', async () => {
        const paid = await reserveAndPay(request, main!, 'ASSISTED');
        rental = paid.rental;
        mainAmount = Number(paid.contract.totalAmount);
        const contractDetail = await request.get(`/api/contracts/${main!.contractId}`);
        expect(contractDetail.ok()).toBe(true);
        expect((await contractDetail.json()).data.rentals[0].plotCode).toBe(main!.plotCode);
        const payments = await isolatedQuery<{ amount: string; type: string; status: string }>(
          'select amount, type::text, status::text from payment_transactions where contract_id = $1', [main!.contractId]);
        expect(payments).toHaveLength(1);
        expect(payments[0]).toMatchObject({ type: 'PAYMENT', status: 'SUCCESS' });
        expect(Number(payments[0].amount)).toBe(mainAmount);
        const customer = await rolePage(browser, 'CUSTOMER', 1, '/customer/dashboard');
        try {
          await expect(customer.page.getByText(main!.plotCode, { exact: false }).first()).toBeVisible();
          await customer.page.reload({ waitUntil: 'domcontentloaded' });
          await expect(customer.page.getByText(main!.plotCode, { exact: false }).first()).toBeVisible();
        } finally { await customer.context.close(); }
      });
    }

    if (main && rental) {
      await check('F2 Admin assigns Nam and Luc to the rental', async () => {
        const assigned = await request.patch(`/api/rentals/${rental!.rental_id}/assign`, {
          data: { expertId: 5, staffId: 8 },
        });
        expect(assigned.ok()).toBe(true);
        const [stored] = await isolatedQuery<RentalRow>(
          'select rental_id, expert_id, staff_id, status::text from rentals where rental_id = $1', [rental!.rental_id]);
        expect(stored).toMatchObject({ expert_id: 5, staff_id: 8 });
        rental = stored;
      });
      await check('F2 Nam and Luc see their assigned plot after reload', async () => {
        for (const role of [
          { name: 'EXPERT', userId: 5, route: '/expert/dashboard?tab=plots' },
          { name: 'STAFF', userId: 8, route: '/staff/dashboard?tab=plots' },
        ]) {
          const session = await rolePage(browser, role.name, role.userId, role.route);
          try {
            await expect(session.page.getByText(main!.plotCode, { exact: false }).first()).toBeVisible();
            await session.page.reload({ waitUntil: 'domcontentloaded' });
            await expect(session.page.getByText(main!.plotCode, { exact: false }).first()).toBeVisible();
          } finally { await session.context.close(); }
        }
      });
      await check('F2 Customer buys a paid care service on the same rental', async () => {
        const [service] = await isolatedQuery<{ service_id: number; price: string; service_name: string }>(
          "select service_id, price, service_name from services where status = 'ACTIVE' and service_type = 'A_LA_CARTE' order by service_id limit 1");
        expect(service).toBeTruthy();
        const checkout = await request.post('/api/services/checkout', { data: {
          rentalId: rental!.rental_id, plotCode: main!.plotCode, serviceId: service.service_id,
          amount: Number(service.price), paymentMethod: 'MOCK', serviceName: service.service_name,
          scheduledDate: startInDays(5),
        } });
        expect(checkout.ok()).toBe(true);
        const [payment] = await isolatedQuery<{ amount: string; status: string }>(
          'select amount, status::text from payment_transactions where service_request_id in (select request_id from service_requests where rental_id = $1) order by transaction_id desc limit 1',
          [rental!.rental_id]);
        expect(payment.status).toBe('SUCCESS');
        serviceAmount = Number(payment.amount);
      });
      await check('F3 Customer and Nam automatically get a plot-specific chat', async () => {
        const rows = await isolatedQuery<{ conversation_id: number }>(
          "select conversation_id from conversations where rental_id = $1 and plot_id = $2 and participant_one = 1 and participant_two = 5 and type = 'CUST_EXP'",
          [rental!.rental_id, main!.plotId]);
        expect(rows).toHaveLength(1);
      });
      await check('F3 Luc and Nam can exchange messages on the same plot', async () => {
        const [thread] = await isolatedQuery<{ conversation_id: number }>(
          "select conversation_id from conversations where rental_id = $1 and plot_id = $2 and participant_one = 8 and participant_two = 5 and type = 'STAFF_EXP'",
          [rental!.rental_id, main!.plotId]);
        expect(thread, 'Staff to Expert channel should be created for assigned plot').toBeTruthy();
        const sent = await request.post(`/api/conversations/${thread.conversation_id}/messages`, {
          data: { senderId: 8, content: 'E2E plot consultation' },
        });
        expect(sent.ok()).toBe(true);
        const inbox = await request.get('/api/conversations?userId=5');
        expect((await inbox.json()).data.some((row: { conversationId: number }) => row.conversationId === thread.conversation_id)).toBe(true);
      });
      await check('F3 Manually linked chat channels can exchange messages', async () => {
        for (const [sender, recipient, kind] of [[1, 5, 'CUST_EXP'], [8, 5, 'STAFF_EXP']] as const) {
          const [thread] = await isolatedQuery<{ conversation_id: number }>(
            'insert into conversations (participant_one, participant_two, rental_id, plot_id, type, status) values ($1,$2,$3,$4,$5,\'OPEN\') returning conversation_id',
            [sender, recipient, rental!.rental_id, main!.plotId, kind]);
          for (const userId of [sender, recipient]) {
            const sent = await request.post(`/api/conversations/${thread.conversation_id}/messages`, {
              data: { senderId: userId, content: `E2E ${kind} message ${userId}` },
            });
            expect(sent.ok()).toBe(true);
          }
          const messages = await request.get(`/api/conversations/${thread.conversation_id}/messages`);
          expect(messages.ok()).toBe(true);
          expect((await messages.json()).data).toHaveLength(2);
          const expertInbox = await request.get('/api/conversations?userId=5');
          expect((await expertInbox.json()).data.some((row: { conversationId: number; plotId: number }) =>
            row.conversationId === thread.conversation_id && row.plotId === main!.plotId)).toBe(true);
        }
      });
      await check('F3 Expert chat inbox displays the new plot', async () => {
        const expert = await rolePage(browser, 'EXPERT', 5, '/expert/dashboard?tab=chat');
        try {
          await expect(expert.page.getByText(main!.plotCode, { exact: false }).first()).toBeVisible();
        } finally { await expert.context.close(); }
      });
      await check('F3 IoT alert uses the new plot sensor reading', async () => {
        await isolatedQuery(
          'insert into sensor_readings (plot_id, temperature, air_humidity, soil_humidity, recorded_at) values ($1, 39, 60, 25, now())',
          [main!.plotId]);
        const alert = await request.get(`/api/alerts?plotId=${main!.plotId}`);
        expect(alert.ok()).toBe(true);
        expect((await alert.json()).data.some((item: { plotId: number }) => item.plotId === main!.plotId)).toBe(true);
      });
      await check('F3 Customer can read latest IoT value for the new plot', async () => {
        const response = await request.get(`/api/sensors/plots/${main!.plotId}/latest`);
        expect(response.ok()).toBe(true);
        const reading = await response.json();
        expect(reading.plotId).toBe(main!.plotId);
        expect(Number(reading.temperature)).toBeGreaterThanOrEqual(39);
      });
      await check('F3 Admin rental assignment also updates Staff care tasks', async () => {
        const [task] = await isolatedQuery<{ task_id: number; task_assigned_to: number }>(
          'select task_id, task_assigned_to from care_tasks where rental_id = $1 order by task_id limit 1',
          [rental!.rental_id]);
        expect(task.task_assigned_to).toBe(8);
      });
      await check('F3 Admin reassigns task to Luc, who completes it with evidence', async () => {
        const [task] = await isolatedQuery<{ task_id: number }>(
          'select task_id from care_tasks where rental_id = $1 order by task_id limit 1',
          [rental!.rental_id]);
        const reassigned = await request.patch(`/api/care-tasks/${task.task_id}`, { data: { workerId: 8 } });
        expect(reassigned.ok()).toBe(true);
        const completed = await request.patch(`/api/care-tasks/${task.task_id}/complete`, { data: {
          workerId: 8, status: 'DONE', evidenceImageUrl: '/images/harvest/rau-muong-p03.jpg',
          notes: 'E2E completed on assigned plot',
        } });
        expect(completed.ok()).toBe(true);
        const [stored] = await isolatedQuery<{ status: string; task_assigned_to: number; evidence_image_url: string }>(
          'select status::text, task_assigned_to, evidence_image_url from care_tasks where task_id = $1', [task.task_id]);
        expect(stored).toMatchObject({ status: 'DONE', task_assigned_to: 8, evidence_image_url: '/images/harvest/rau-muong-p03.jpg' });
      });
      await check('F3 Completed task diary belongs to the same rental', async () => {
        const [task] = await isolatedQuery<{ task_id: number }>(
          'select task_id from care_tasks where rental_id = $1 order by task_id limit 1', [rental!.rental_id]);
        const diaries = await isolatedQuery<{ rental_id: number }>(
          'select rental_id from farm_diaries where task_id = $1', [task.task_id]);
        expect(diaries).toHaveLength(1);
        expect(diaries[0].rental_id).toBe(rental!.rental_id);
      });
      await check('F3 Luc reports an issue and Nam diagnoses it for the plot', async () => {
        const posted = await request.post('/api/issue-reports', { data: {
          rentalId: rental!.rental_id, reportedBy: 8, issueType: 'PEST',
          description: 'E2E pest on new plot', imageUrl: '/images/harvest/rau-muong-p03.jpg',
        } });
        expect(posted.ok()).toBe(true);
        const [issue] = await isolatedQuery<{ issue_id: number; rental_id: number }>(
          'select issue_id, rental_id from issue_reports where rental_id = $1 order by issue_id desc limit 1',
          [rental!.rental_id]);
        expect(issue.rental_id).toBe(rental!.rental_id);
        const diagnosed = await request.patch(`/api/issue-reports/${issue.issue_id}/diagnose`, { data: {
          handledBy: 5, diagnosis: 'E2E biological control',
        } });
        expect(diagnosed.ok()).toBe(true);
        const [stored] = await isolatedQuery<{ handled_by: number }>(
          'select handled_by from issue_reports where issue_id = $1', [issue.issue_id]);
        expect(stored.handled_by).toBe(5);
      });
      await check('F3 Customer harvest request reaches Expert', async () => {
        const planned = await request.post('/api/harvest-plans', { data: {
          rentalId: rental!.rental_id, requestedBy: 1, plannedDate: startInDays(14), deliveryType: 'PICKUP',
        } });
        expect([200, 201], `Harvest plan API returned HTTP ${planned.status()}`).toContain(planned.status());
        const listing = await request.get(`/api/harvest-plans?rentalId=${rental!.rental_id}`);
        expect(listing.ok()).toBe(true);
        expect((await listing.json()).data.length).toBeGreaterThan(0);
      });
      await check('F3 Luc records harvest and Customer confirms receipt', async () => {
        const saved = await request.post('/api/harvest', { data: {
          rentalId: rental!.rental_id, enteredBy: 8, harvestDate: startInDays(5),
          yieldAmount: 2.5, evidenceImageUrl: '/images/harvest/rau-muong-p03.jpg',
          deliveryType: 'PICKUP',
        } });
        expect(saved.ok()).toBe(true);
        const harvestId = Number((await saved.json()).data.harvestId);
        const confirmed = await request.post('/api/customer/harvest-results/confirm', { data: {
          harvestId, userId: 1, deliveryMethod: 'PICKUP', rating: 5, feedback: 'E2E accepted',
        } });
        expect(confirmed.ok()).toBe(true);
        const [stored] = await isolatedQuery<{ customer_confirmed: boolean; delivery_type: string }>(
          'select customer_confirmed, delivery_type::text from harvest_results where harvest_id = $1', [harvestId]);
        expect(stored).toMatchObject({ customer_confirmed: true, delivery_type: 'PICKUP' });
      });
    } else {
      blocked('F3 cultivation through harvest', 'Main plot was not booked and assigned');
    }

    await check('F2 cancellation and refund use a second plot in the same existing land', async () => {
      cancellation = await createPlotInExistingLand(request, 'CANCEL', true);
      const paid = await reserveAndPay(request, cancellation, 'SELF');
      cancellationAmount = Number(paid.contract.totalAmount);
      const requested = await request.post('/api/contracts/cancellations', { data: {
        contractId: cancellation.contractId, userId: 1, reason: 'E2E cancellation branch',
      } });
      expect(requested.ok()).toBe(true);
      const cancelInfo = (await requested.json()).data;
      refundAmount = Number(cancelInfo.refundAmount);
      expect(refundAmount).toBe(Math.round(cancellationAmount * 0.8));
      const approved = await request.post(`/api/contracts/cancellations/${cancelInfo.cancellationId}/approve`);
      expect(approved.ok()).toBe(true);
      const [refund] = await isolatedQuery<{ amount: string; status: string }>(
        "select amount, status::text from payment_transactions where contract_id = $1 and type = 'REFUND'",
        [cancellation.contractId]);
      expect(refund.status).toBe('SUCCESS');
      expect(Number(refund.amount)).toBe(refundAmount);
    });

    await check('F4 Admin net revenue and recent refund match the ledger', async () => {
      const response = await request.get('/api/admin/analytics');
      expect(response.ok()).toBe(true);
      const analytics = (await response.json()).data;
      const [ledger] = await isolatedQuery<{ net: string }>(
        "select coalesce(sum(case when type = 'REFUND' then -amount else amount end),0) as net from payment_transactions where status = 'SUCCESS'");
      expect(Number(analytics.kpi.totalRevenue)).toBe(Number(ledger.net));
      expect(Number(analytics.kpi.totalRevenue)).toBe(baseline + mainAmount + serviceAmount + cancellationAmount - refundAmount);
      if (cancellation?.contractId) {
        const [refund] = await isolatedQuery<{ transaction_id: number }>(
          "select transaction_id from payment_transactions where contract_id = $1 and type = 'REFUND'",
          [cancellation.contractId]);
        expect(analytics.recentTransactions.some((tx: { id: number; type: string }) =>
          Number(tx.id) === refund.transaction_id && tx.type === 'REFUND')).toBe(true);
      }
      const admin = await rolePage(browser, 'ADMIN', 11, '/admin/dashboard');
      try {
        await expect(admin.page.getByText(`${Number(ledger.net).toLocaleString('vi-VN')} đ`, { exact: true }).first()).toBeVisible();
        await testInfo.attach('admin-revenue', { body: await admin.page.screenshot(), contentType: 'image/png' });
      } finally { await admin.context.close(); }
    });
    await check('F4 Admin plot occupancy and task counts match DB', async () => {
      const analytics = (await (await request.get('/api/admin/analytics')).json()).data.kpi;
      const [plots] = await isolatedQuery<{ total: string; rented: string }>(
        "select count(*) as total, count(*) filter (where status = 'RENT') as rented from plots");
      const [tasks] = await isolatedQuery<{ total: string; done: string }>(
        "select count(*) as total, count(*) filter (where status = 'DONE') as done from care_tasks");
      expect(analytics.totalPlots).toBe(Number(plots.total));
      expect(analytics.rentedPlots).toBe(Number(plots.rented));
      expect(analytics.totalTasks).toBe(Number(tasks.total));
      expect(analytics.completedTasks).toBe(Number(tasks.done));
    });
  } finally {
    if (cancellation) await cleanup(cancellation);
    if (main) await cleanup(main);
    const [landAfter] = await isolatedQuery<{ total: string }>('select count(*) as total from lands');
    results.push({ step: 'No new land created', status: landAfter.total === landBefore.total ? 'PASS' : 'FAIL' });
    await testInfo.attach('four-workflow-results', {
      body: Buffer.from(JSON.stringify({ plotCode: main?.plotCode, cancellationPlotCode: cancellation?.plotCode, results }, null, 2)),
      contentType: 'application/json',
    });
    for (const row of results) console.log(`FLOW_${row.status} ${row.step}`);
  }
  expect(results.filter((row) => row.status !== 'PASS')).toEqual([]);
});
