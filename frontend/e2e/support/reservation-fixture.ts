import { test, expect, type APIRequestContext } from '@playwright/test';
import pg from 'pg';

export async function isolatedQuery<T>(sql: string, values: unknown[] = []): Promise<T[]> {
  const client = new pg.Client({
    host: '127.0.0.1', port: 5544, database: 'farmely_e2e',
    user: 'postgres', password: process.env.FARMELY_E2E_DB_PASSWORD || 'password',
  });
  try {
    await client.connect();
    const identity = await client.query('select current_database() as name');
    expect(identity.rows[0]?.name).toBe('farmely_e2e');
    return (await client.query(sql, values)).rows as T[];
  } finally {
    await client.end();
  }
}

type ReservationFixture = { landId: number; plotId: number; varietyId: number; contractId?: number; plotCode: string; preserveLand?: boolean };

export async function createFixture(request: APIRequestContext, id: string, status = 'AVAIL'): Promise<ReservationFixture> {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const land = await request.post('/api/lands', {
    data: { landName: `E2E ${id} ${suffix}`, address: 'Isolated E2E farm', boundary: [] },
  });
  expect(land.ok()).toBe(true);
  const landId = (await land.json()).data.landId as number;
  const varieties = await request.get('/api/varieties');
  expect(varieties.ok()).toBe(true);
  const varietyId = Number((await varieties.json()).data[0]?.id);
  expect(varietyId).toBeGreaterThan(0);
  const plotCode = `P-${String(100000 + (Date.now() % 900000))}`;
  const plot = await request.post('/api/plots', {
    data: { landId, plotCode, area: 100, pricePerPeriod: 1200000, status, isPublished: true, varietyIds: [varietyId] },
  });
  expect(plot.ok()).toBe(true);
  const plotId = Number((await plot.json()).data.plotId);
  expect(plotId).toBeGreaterThan(0);
  expect(plotId).toBeLessThan(2147483647);
  return { landId, plotId, varietyId, plotCode };
}

export async function createPlotInExistingLand(request: APIRequestContext, id: string, published = false): Promise<ReservationFixture> {
  const [land] = await isolatedQuery<{ land_id: number }>(
    'select land_id from lands where land_id = 1',
  );
  expect(land, 'Existing test land 1 is required').toBeTruthy();
  const [variety] = await isolatedQuery<{ variety_id: number }>(
    'select variety_id from varieties where variety_id = 1',
  );
  expect(variety, 'Existing variety 1 is required').toBeTruthy();
  const plotCode = `P-${1000000 + Math.floor(Math.random() * 9000000)}`;
  const west = id === 'CANCEL' ? 106.3433 : 106.343;
  const south = 10.693;
  const boundary = [[west, south], [west + 0.0001, south], [west + 0.0001, south + 0.0001], [west, south + 0.0001], [west, south]];
  const response = await request.post('/api/plots', { data: {
    landId: land.land_id, plotCode, area: 100, pricePerPeriod: 1200000,
    status: 'AVAIL', isPublished: published, varietyIds: [variety.variety_id], boundary,
  } });
  expect(response.status()).toBe(201);
  const plotId = Number((await response.json()).data.plotId);
  return { landId: land.land_id, plotId, varietyId: variety.variety_id, plotCode, preserveLand: true };
}

export async function cleanup(fixture: ReservationFixture) {
  const client = new pg.Client({
    host: '127.0.0.1', port: 5544, database: 'farmely_e2e',
    user: 'postgres', password: process.env.FARMELY_E2E_DB_PASSWORD || 'password',
  });
  try {
    await client.connect();
    expect((await client.query('select current_database() as name')).rows[0].name).toBe('farmely_e2e');
    await client.query('begin');
    await client.query('select plot_id from plots where plot_id = $1 for update', [fixture.plotId]);
    const contracts = await client.query('select distinct contract_id from rentals where plot_id = $1', [fixture.plotId]);
    await client.query('delete from sensor_readings where plot_id = $1', [fixture.plotId]);
    await client.query('delete from site_visits where plot_id = $1', [fixture.plotId]);
    await client.query('delete from harvest_results where rental_id in (select rental_id from rentals where plot_id = $1)', [fixture.plotId]);
    await client.query('delete from issue_reports where rental_id in (select rental_id from rentals where plot_id = $1)', [fixture.plotId]);
    await client.query('delete from farm_diaries where task_id in (select task_id from care_tasks where rental_id in (select rental_id from rentals where plot_id = $1))', [fixture.plotId]);
    await client.query('delete from farm_diaries where rental_id in (select rental_id from rentals where plot_id = $1)', [fixture.plotId]);
    await client.query('delete from care_tasks where rental_id in (select rental_id from rentals where plot_id = $1)', [fixture.plotId]);
    await client.query('delete from payment_transactions where service_request_id in (select request_id from service_requests where rental_id in (select rental_id from rentals where plot_id = $1))', [fixture.plotId]);
    await client.query('delete from service_requests where rental_id in (select rental_id from rentals where plot_id = $1)', [fixture.plotId]);
    await client.query('delete from messages where conversation_id in (select conversation_id from conversations where plot_id = $1 or rental_id in (select rental_id from rentals where plot_id = $1))', [fixture.plotId]);
    await client.query('delete from conversations where plot_id = $1 or rental_id in (select rental_id from rentals where plot_id = $1)', [fixture.plotId]);
    for (const row of contracts.rows) {
      await client.query('delete from payment_transactions where contract_id = $1', [row.contract_id]);
      await client.query("delete from audit_logs where entity_name = 'contracts' and entity_id = $1", [String(row.contract_id)]);
      await client.query('delete from contract_cancellations where contract_id = $1', [row.contract_id]);
    }
    await client.query('delete from rentals where plot_id = $1', [fixture.plotId]);
    for (const row of contracts.rows) {
      await client.query('delete from contracts where contract_id = $1 and not exists (select 1 from rentals where contract_id = $1)', [row.contract_id]);
    }
    await client.query('delete from plot_variety_compatibility where plot_id = $1', [fixture.plotId]);
    await client.query('delete from plots where plot_id = $1', [fixture.plotId]);
    if (!fixture.preserveLand) await client.query('delete from lands where land_id = $1', [fixture.landId]);
    await client.query('commit');
  } catch (error) {
    await client.query('rollback').catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

export function startInDays(days: number) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return new Date(Date.UTC(value('year'), value('month') - 1, value('day') + days)).toISOString().slice(0, 10);
}

export function startInTenDays() {
  return startInDays(10);
}


\n