const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { validateRow, validateRows } = require('../services/dataValidator');

describe('Data Validator Unit Tests', () => {
  const validSampleRow = {
    job_id: 'JOB-999',
    arrival_time: '2026-11-20 09:00:00',
    service_start: '2026-11-20 09:02:00',
    service_end: '2026-11-20 09:06:30',
    job_type: 'B&W printing',
    pages: '20',
    copies: '1',
    queue_ahead: '1',
    device: 'Canon IR-2525',
    amount: '40'
  };

  test('validates a correct row successfully', () => {
    const res = validateRow(validSampleRow, 1);
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(res.sanitized.job_id).toBe('JOB-999');
    expect(res.sanitized.duration_seconds).toBe(270); // 4m 30s
    expect(res.sanitized.waiting_time_seconds).toBe(120); // 2m
  });

  test('detects missing job_type', () => {
    const row = { ...validSampleRow, job_type: '' };
    const res = validateRow(row, 2);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.field === 'job_type')).toBe(true);
  });

  test('detects negative page count', () => {
    const row = { ...validSampleRow, pages: '-5' };
    const res = validateRow(row, 3);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.field === 'pages')).toBe(true);
  });

  test('detects negative queue_ahead', () => {
    const row = { ...validSampleRow, queue_ahead: '-2' };
    const res = validateRow(row, 4);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.field === 'queue_ahead')).toBe(true);
  });

  test('detects invalid date format', () => {
    const row = { ...validSampleRow, arrival_time: 'not-a-date' };
    const res = validateRow(row, 5);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.field === 'arrival_time')).toBe(true);
  });

  test('detects service_start earlier than arrival_time', () => {
    const row = {
      ...validSampleRow,
      arrival_time: '2026-11-20 10:00:00',
      service_start: '2026-11-20 09:50:00',
      service_end: '2026-11-20 10:10:00'
    };
    const res = validateRow(row, 6);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.field === 'service_start')).toBe(true);
  });

  test('detects service_end earlier than service_start', () => {
    const row = {
      ...validSampleRow,
      service_start: '2026-11-20 10:00:00',
      service_end: '2026-11-20 09:55:00'
    };
    const res = validateRow(row, 7);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.field === 'service_end')).toBe(true);
  });

  test('validates the complete synthetic data.csv (25 records, 0 errors)', async () => {
    const csvPath = path.resolve(__dirname, '../../data.csv');
    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', d => rows.push(d))
        .on('end', resolve)
        .on('error', reject);
    });

    expect(rows.length).toBe(25);
    const result = validateRows(rows);
    expect(result.validCount).toBe(25);
    expect(result.invalidCount).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  test('validates invalid_test_data.csv and reports exact deliberate errors', async () => {
    const csvPath = path.resolve(__dirname, '../../invalid_test_data.csv');
    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', d => rows.push(d))
        .on('end', resolve)
        .on('error', reject);
    });

    const result = validateRows(rows);
    expect(result.invalidCount).toBeGreaterThan(0);
    expect(result.errors.length).toBeGreaterThanOrEqual(5);

    // Verify deliberate error types are captured
    const fieldsWithErrors = result.errors.map(e => e.field);
    expect(fieldsWithErrors).toContain('job_type');
    expect(fieldsWithErrors).toContain('pages');
    expect(fieldsWithErrors).toContain('arrival_time');
    expect(fieldsWithErrors).toContain('service_end');
    expect(fieldsWithErrors).toContain('queue_ahead');
  });
});
