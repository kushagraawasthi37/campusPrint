/**
 * Waiting-Time Estimator Service for CampusPrint
 *
 * METHODOLOGY & ASSUMPTIONS:
 * 1. Historical Duration Baseline:
 *    Computes the arithmetic mean of service durations for each job type from historical records.
 *    Machine learning is avoided because sample sizes in single-shop campus environments are small
 *    (e.g., 25 synthetic records) and prone to severe overfitting.
 *
 * 2. Distinction between Historical and Live Queue:
 *    - Historical `queue_ahead` in data.csv records how many people were waiting when THAT past customer arrived.
 *    - Current Live Queue reflects active customers physically standing in the shop or logged in the queue right now.
 *    - Waiting-time estimation for a new arriving customer is strictly a function of the CURRENT LIVE QUEUE,
 *      not the past historical queue_ahead values.
 *
 * 3. Workload Formula:
 *    Workload = Sum(Average_Duration(job_type_i) for each job ahead in live queue)
 *    If individual job types in the queue are unknown, Workload = N_ahead * Overall_Average_Duration.
 *
 * 4. Safety Buffer:
 *    Configurable buffer (e.g., 10% to 50%, default 15%) accounts for human handoffs, file opening delays,
 *    paper replenishment, and minor jams.
 *
 * 5. Range Estimation:
 *    Rather than a misleading single exact minute, we provide a realistic lower and upper bound:
 *    - Min Wait: Workload * (1 - 0.15) (best case fast execution)
 *    - Max Wait: (Workload * (1 + SafetyBuffer%)) * 1.15 (handling minor friction)
 *
 * 6. Reliability Boundary:
 *    Orders with > 100 pages, hardware maintenance, or power cuts render statistical estimates unreliable.
 */

const mongoose = require('mongoose');
const PrintingJob = require('../models/PrintingJob');

// Fallback historical durations in seconds if database has no records yet
const DEFAULT_DURATIONS_SECONDS = {
  'B&W printing': 288,     // ~4.8 mins
  'Colour printing': 466,   // ~7.8 mins
  'Photocopy': 252,        // ~4.2 mins
  'Scanning': 222,         // ~3.7 mins
  'Spiral binding': 806    // ~13.4 mins
};

const DEFAULT_OVERALL_DURATION_SECONDS = 407; // ~6.8 mins

/**
 * Calculates historical average service durations grouped by job_type
 */
async function getHistoricalJobAverages() {
  if (mongoose.connection.readyState !== 1) {
    return {
      averagesByType: { ...DEFAULT_DURATIONS_SECONDS },
      overallAverageSeconds: DEFAULT_OVERALL_DURATION_SECONDS,
      totalJobsInHistory: 0,
      categoryBreakdown: []
    };
  }

  try {
    const stats = await PrintingJob.aggregate([
      {
        $group: {
          _id: '$job_type',
          averageDurationSeconds: { $avg: '$duration_seconds' },
          count: { $sum: 1 },
          minDurationSeconds: { $min: '$duration_seconds' },
          maxDurationSeconds: { $max: '$duration_seconds' }
        }
      }
    ]);

    if (!stats || stats.length === 0) {
      return {
        averagesByType: { ...DEFAULT_DURATIONS_SECONDS },
        overallAverageSeconds: DEFAULT_OVERALL_DURATION_SECONDS,
        totalJobsInHistory: 0,
        categoryBreakdown: []
      };
    }

    const averagesByType = { ...DEFAULT_DURATIONS_SECONDS };
    let totalJobs = 0;
    let totalDuration = 0;

    stats.forEach((item) => {
      averagesByType[item._id] = Math.round(item.averageDurationSeconds);
      totalJobs += item.count;
      totalDuration += item.averageDurationSeconds * item.count;
    });

    const overallAverageSeconds = totalJobs > 0 
      ? Math.round(totalDuration / totalJobs) 
      : DEFAULT_OVERALL_DURATION_SECONDS;

    return {
      averagesByType,
      overallAverageSeconds,
      totalJobsInHistory: totalJobs,
      categoryBreakdown: stats
    };
  } catch (err) {
    console.warn('[Estimator] Aggregation error or buffering timeout, falling back to defaults:', err.message);
    return {
      averagesByType: { ...DEFAULT_DURATIONS_SECONDS },
      overallAverageSeconds: DEFAULT_OVERALL_DURATION_SECONDS,
      totalJobsInHistory: 0,
      categoryBreakdown: []
    };
  }
}

/**
 * Estimates waiting time based on current queue workload and customer's job
 *
 * @param {Object} params
 * @param {number} [params.queueAheadCount] Number of customers ahead
 * @param {Array<string>} [params.queueAheadJobTypes] Specific job types in queue ahead
 * @param {string} params.targetJobType The arriving customer's requested job type
 * @param {number} [params.bufferPercent=15] Safety buffer percentage (0 - 50)
 * @param {number} [params.targetPages=10] Arriving job page count (used for warning thresholds)
 */
async function estimateWaitTime({
  queueAheadCount = 0,
  queueAheadJobTypes = [],
  targetJobType = 'B&W printing',
  bufferPercent = 15,
  targetPages = 10
}) {
  const historical = await getHistoricalJobAverages();
  const { averagesByType, overallAverageSeconds } = historical;

  // Validate buffer percentage
  const safeBuffer = Math.min(Math.max(Number(bufferPercent) || 15, 0), 100);

  let queueWorkloadSeconds = 0;
  const breakdown = [];

  if (Array.isArray(queueAheadJobTypes) && queueAheadJobTypes.length > 0) {
    // Exact workload calculation from known job types ahead
    queueAheadJobTypes.forEach((type, idx) => {
      const duration = averagesByType[type] || overallAverageSeconds;
      queueWorkloadSeconds += duration;
      breakdown.push({
        position: idx + 1,
        jobType: type,
        estimatedDurationMinutes: Number((duration / 60).toFixed(1))
      });
    });
  } else {
    // Approximation from count
    const count = Math.max(0, parseInt(queueAheadCount, 10) || 0);
    const avgDuration = overallAverageSeconds;
    queueWorkloadSeconds = count * avgDuration;
    for (let i = 0; i < count; i++) {
      breakdown.push({
        position: i + 1,
        jobType: 'Average Queue Item',
        estimatedDurationMinutes: Number((avgDuration / 60).toFixed(1))
      });
    }
  }

  // Duration for the target customer's own job
  const targetDurationSeconds = averagesByType[targetJobType] || overallAverageSeconds;

  // Wait time until target customer's turn begins (service start)
  const waitToStartSeconds = queueWorkloadSeconds;

  // Total time until target customer's job is finished and handed over (service end)
  const totalCompletionSeconds = waitToStartSeconds + targetDurationSeconds;

  // Apply safety buffer to service queue
  const bufferMultiplier = 1 + safeBuffer / 100;
  const bufferedCompletionSeconds = Math.round(totalCompletionSeconds * bufferMultiplier);

  // Range bounds in minutes
  // Lower bound: fast execution (workload - 15% variance)
  // Upper bound: buffered execution (+ 15% variance)
  const waitToStartMinutesMin = Math.max(0, Math.round((waitToStartSeconds * 0.85) / 60));
  const waitToStartMinutesMax = Math.max(1, Math.round((waitToStartSeconds * bufferMultiplier * 1.15) / 60));

  const totalMinutesMin = Math.max(1, Math.round((totalCompletionSeconds * 0.85) / 60));
  const totalMinutesMax = Math.max(1, Math.round((bufferedCompletionSeconds * 1.15) / 60));

  // Determine reliability condition
  let isReliable = true;
  const reliabilityWarnings = [];

  if (targetPages > 100) {
    isReliable = false;
    reliabilityWarnings.push('Large volume order (>100 pages). Mechanical speed and paper tray reload variances make historical averages unreliable.');
  }

  if (breakdown.length > 8) {
    isReliable = false;
    reliabilityWarnings.push('Heavy counter queue (>8 jobs). Operator fatigue, concurrent walk-ins, and counter crowding introduce high variance.');
  }

  reliabilityWarnings.push('Estimates assume standard FIFO counter order, operational equipment, and zero file-formatting delays.');

  return {
    queueLengthAhead: breakdown.length,
    targetJobType,
    safetyBufferPercent: safeBuffer,
    historicalAveragesMinutes: {
      'B&W printing': Number((averagesByType['B&W printing'] / 60).toFixed(2)),
      'Colour printing': Number((averagesByType['Colour printing'] / 60).toFixed(2)),
      'Photocopy': Number((averagesByType['Photocopy'] / 60).toFixed(2)),
      'Scanning': Number((averagesByType['Scanning'] / 60).toFixed(2)),
      'Spiral binding': Number((averagesByType['Spiral binding'] / 60).toFixed(2))
    },
    estimatedWaitToStartRangeMinutes: [waitToStartMinutesMin, waitToStartMinutesMax],
    estimatedTotalCompletionRangeMinutes: [totalMinutesMin, totalMinutesMax],
    expectedWaitToStartMinutes: Number((waitToStartSeconds / 60).toFixed(1)),
    expectedTotalCompletionMinutes: Number((bufferedCompletionSeconds / 60).toFixed(1)),
    breakdown,
    isReliable,
    reliabilityWarnings,
    methodologyNote: 'Estimates are derived from historical arithmetic averages per job type and adjusted with a configurable safety buffer. Not derived from machine learning.'
  };
}

module.exports = {
  getHistoricalJobAverages,
  estimateWaitTime,
  DEFAULT_DURATIONS_SECONDS
};
