const { estimateWaitTime, DEFAULT_DURATIONS_SECONDS } = require('../services/estimator');
const { connectDB, disconnectDB } = require('../config/db');

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

describe('Wait-Time Estimator Logic Tests', () => {
  test('returns 0 wait-to-start when queue ahead is empty', async () => {
    const res = await estimateWaitTime({
      queueAheadCount: 0,
      queueAheadJobTypes: [],
      targetJobType: 'B&W printing',
      bufferPercent: 15
    });

    expect(res.queueLengthAhead).toBe(0);
    expect(res.expectedWaitToStartMinutes).toBe(0);
    expect(res.estimatedWaitToStartRangeMinutes[0]).toBe(0);
    expect(res.estimatedWaitToStartRangeMinutes[1]).toBe(1);
    expect(res.isReliable).toBe(true);
  });

  test('calculates correct additive workload for explicit queue of jobs ahead', async () => {
    // 1 Photocopy + 1 Spiral binding
    const res = await estimateWaitTime({
      queueAheadJobTypes: ['Photocopy', 'Spiral binding'],
      targetJobType: 'Scanning',
      bufferPercent: 20
    });

    expect(res.queueLengthAhead).toBe(2);
    expect(res.breakdown).toHaveLength(2);
    expect(res.breakdown[0].jobType).toBe('Photocopy');
    expect(res.breakdown[1].jobType).toBe('Spiral binding');
    expect(res.safetyBufferPercent).toBe(20);
    expect(res.expectedWaitToStartMinutes).toBeGreaterThan(0);
    expect(res.estimatedTotalCompletionRangeMinutes[1]).toBeGreaterThan(
      res.estimatedTotalCompletionRangeMinutes[0]
    );
  });

  test('adjusts range dynamically when safety buffer increases', async () => {
    const bufferLow = await estimateWaitTime({
      queueAheadCount: 3,
      targetJobType: 'Colour printing',
      bufferPercent: 5
    });

    const bufferHigh = await estimateWaitTime({
      queueAheadCount: 3,
      targetJobType: 'Colour printing',
      bufferPercent: 40
    });

    expect(bufferHigh.estimatedTotalCompletionRangeMinutes[1]).toBeGreaterThan(
      bufferLow.estimatedTotalCompletionRangeMinutes[1]
    );
  });

  test('flags large orders (>100 pages) as unreliable with clear warning', async () => {
    const res = await estimateWaitTime({
      queueAheadCount: 1,
      targetJobType: 'B&W printing',
      targetPages: 180
    });

    expect(res.isReliable).toBe(false);
    expect(res.reliabilityWarnings.some(w => w.includes('Large volume order'))).toBe(true);
  });

  test('flags heavy queue (>8 jobs ahead) with counter congestion warning', async () => {
    const res = await estimateWaitTime({
      queueAheadCount: 10,
      targetJobType: 'Scanning',
      targetPages: 10
    });

    expect(res.isReliable).toBe(false);
    expect(res.reliabilityWarnings.some(w => w.includes('Heavy counter queue'))).toBe(true);
  });
});
