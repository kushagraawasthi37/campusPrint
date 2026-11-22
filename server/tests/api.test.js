const request = require('supertest');
const app = require('../app');
const { connectDB, disconnectDB } = require('../config/db');
const path = require('path');

beforeAll(async () => {
  await connectDB();
  // Seed initial data
  await request(app).post('/api/jobs/seed');
});

afterAll(async () => {
  await disconnectDB();
});

describe('CampusPrint API Integration Tests', () => {
  test('GET /api/health returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('CampusPrint API');
  });

  test('GET /api/stats returns comprehensive metrics', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalJobs).toBe(25);
    expect(res.body.data.overallAverageDurationMinutes).toBeGreaterThan(0);
    expect(res.body.data.averagesByJobType).toBeDefined();
    expect(res.body.data.averagesByJobType['Spiral binding']).toBeGreaterThan(600);
  });

  test('GET /api/stats/by-job-type returns 5 job categories', async () => {
    const res = await request(app).get('/api/stats/by-job-type');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.metrics.length).toBe(5);
  });

  test('GET /api/stats/busiest-hours returns 9 hourly buckets (09:00 - 18:00)', async () => {
    const res = await request(app).get('/api/stats/busiest-hours');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.hours.length).toBe(9);
  });

  test('GET /api/jobs returns list with pagination', async () => {
    const res = await request(app).get('/api/jobs?limit=10&page=1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.jobs.length).toBe(10);
    expect(res.body.total).toBe(25);
  });

  test('POST /api/estimate calculates range and breakdown', async () => {
    const payload = {
      queueAheadCount: 2,
      targetJobType: 'Spiral binding',
      bufferPercent: 20
    };
    const res = await request(app).post('/api/estimate').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.estimate.targetJobType).toBe('Spiral binding');
    expect(res.body.estimate.estimatedTotalCompletionRangeMinutes.length).toBe(2);
  });

  test('POST /api/jobs/upload-csv rejects invalid records with row-level detail', async () => {
    const invalidCsvPath = path.resolve(__dirname, '../../invalid_test_data.csv');
    const res = await request(app)
      .post('/api/jobs/upload-csv')
      .attach('file', invalidCsvPath);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary.invalidCount).toBeGreaterThan(0);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(5);
  });

  test('Live Queue operations: add, list, advance', async () => {
    // Add item
    const addRes = await request(app).post('/api/live-queue').send({
      customer_name: 'Roll #54 Bilal',
      job_type: 'Photocopy',
      pages: 15
    });
    expect(addRes.status).toBe(201);
    expect(addRes.body.item.customer_name).toBe('Roll #54 Bilal');

    // List
    const listRes = await request(app).get('/api/live-queue');
    expect(listRes.status).toBe(200);
    expect(listRes.body.queue.some(i => i.customer_name === 'Roll #54 Bilal')).toBe(true);

    // Advance queue
    const advRes = await request(app).post('/api/live-queue/advance');
    expect(advRes.status).toBe(200);
    expect(advRes.body.success).toBe(true);
  });
});
