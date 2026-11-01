const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { Client } = require('pg');

module.exports = async () => {
  const compose = path.resolve(__dirname, '../../../docker-compose.e2e.yml');
  const services = [
    'identity-service', 'farm-service', 'knowledge-service', 'rental-service',
    'payment-service', 'cultivation-service', 'communication-service',
    'monitoring-service', 'frontend',
  ];
  for (const service of services) {
    const args = ['compose', '-f', compose, 'exec', '-T', service, 'printenv', 'DB_URL', 'DB_NAME'];
    const values = execFileSync('docker', args, { encoding: 'utf8', timeout: 15_000 }).trim().split(/\r?\n/);
    if (values[0] !== 'jdbc:postgresql://postgres:5432/farmely_e2e' || values[1] !== 'farmely_e2e') {
      throw new Error(`Unsafe DB target for ${service}; workflow tests stopped.`);
    }
  }
  const frontendDb = execFileSync('docker', [
    'compose', '-f', compose, 'exec', '-T', 'frontend', 'printenv', 'PGDATABASE',
  ], { encoding: 'utf8', timeout: 15_000 }).trim();
  if (frontendDb !== 'farmely_e2e') throw new Error('Unsafe Vite plugin DB target; workflow tests stopped.');

  const client = new Client({
    host: '127.0.0.1', port: 5544, database: 'farmely_e2e',
    user: 'postgres', password: process.env.FARMELY_E2E_DB_PASSWORD || 'password',
  });
  try {
    await client.connect();
    const { rows } = await client.query('select current_database() as name');
    if (rows[0]?.name !== 'farmely_e2e') throw new Error('Unexpected database identity.');
  } finally {
    await client.end();
  }
  const response = await fetch('http://127.0.0.1:3300/', { signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error('Isolated frontend is not available on port 3300.');
  console.log('Verified isolated Farmely E2E stack on port 3300 and database farmely_e2e.');
};
