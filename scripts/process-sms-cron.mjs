#!/usr/bin/env node
/**
 * Local SMS queue processor – calls POST /api/v1/sms/process on a schedule.
 * For production use Vercel Cron (vercel.json). Run while dev server is up:
 *   CRON_SECRET=xxx BASE_URL=http://localhost:3000 node scripts/process-sms-cron.mjs
 */

import cron from 'node-cron';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || process.env.SMS_CRON_SECRET || '';

function run() {
  const url = `${BASE_URL}/api/v1/sms/process`;
  const headers = { 'Content-Type': 'application/json' };
  if (CRON_SECRET) headers['Authorization'] = `Bearer ${CRON_SECRET}`;
  fetch(url, { method: 'POST', headers })
    .then((r) => r.json())
    .then((body) => console.log(new Date().toISOString(), 'SMS process:', body))
    .catch((err) => console.error(new Date().toISOString(), 'SMS process error:', err.message));
}

// Every 2 minutes when run as standalone
cron.schedule('*/2 * * * *', run, { scheduled: true });
console.log('SMS cron started (every 2 min). BASE_URL=', BASE_URL);
run(); // run once immediately
