const PrintingJob = require('../models/PrintingJob');
const LiveQueueItem = require('../models/LiveQueueItem');
const { getHistoricalJobAverages, estimateWaitTime } = require('../services/estimator');

/**
 * Get comprehensive dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const totalJobs = await PrintingJob.countDocuments();

    // Aggregations
    const averages = await getHistoricalJobAverages();
    
    // Live queue active count
    const liveWaitingCount = await LiveQueueItem.countDocuments({ status: 'waiting' });
    const liveInProgressCount = await LiveQueueItem.countDocuments({ status: 'in_progress' });
    const activeWaitingItems = await LiveQueueItem.find({ status: { $in: ['waiting', 'in_progress'] } })
      .sort('createdAt');

    // Quick estimation for next arriving customer with standard B&W job (15% buffer)
    const nextCustomerEstimate = await estimateWaitTime({
      queueAheadCount: liveWaitingCount + liveInProgressCount,
      queueAheadJobTypes: activeWaitingItems.map(item => item.job_type),
      targetJobType: 'B&W printing',
      bufferPercent: 15
    });

    // Revenue total
    const revenueAgg = await PrintingJob.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    res.json({
      success: true,
      data: {
        totalJobs,
        totalRevenue,
        overallAverageDurationSeconds: averages.overallAverageSeconds,
        overallAverageDurationMinutes: Number((averages.overallAverageSeconds / 60).toFixed(1)),
        averagesByJobType: averages.averagesByType,
        liveQueue: {
          waiting: liveWaitingCount,
          inProgress: liveInProgressCount,
          totalActive: liveWaitingCount + liveInProgressCount
        },
        nextCustomerEstimate,
        categoryBreakdown: averages.categoryBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Aggregate average duration and metrics by job type
 */
exports.getJobTypeMetrics = async (req, res) => {
  try {
    const metrics = await PrintingJob.aggregate([
      {
        $group: {
          _id: '$job_type',
          job_type: { $first: '$job_type' },
          count: { $sum: 1 },
          avgDurationMinutes: { $avg: { $divide: ['$duration_seconds', 60] } },
          minDurationMinutes: { $min: { $divide: ['$duration_seconds', 60] } },
          maxDurationMinutes: { $max: { $divide: ['$duration_seconds', 60] } },
          avgPages: { $avg: '$pages' },
          totalRevenue: { $sum: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          job_type: '$_id',
          count: 1,
          avgDurationMinutes: { $round: ['$avgDurationMinutes', 1] },
          minDurationMinutes: { $round: ['$minDurationMinutes', 1] },
          maxDurationMinutes: { $round: ['$maxDurationMinutes', 1] },
          avgPages: { $round: ['$avgPages', 0] },
          totalRevenue: 1
        }
      },
      { $sort: { avgDurationMinutes: 1 } }
    ]);

    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Aggregate busiest hours of the day (09:00 to 18:00)
 */
exports.getBusiestHours = async (req, res) => {
  try {
    const hourlyAggregation = await PrintingJob.aggregate([
      {
        $project: {
          hour: { $hour: '$arrival_time' },
          durationMinutes: { $divide: ['$duration_seconds', 60] },
          amount: '$amount'
        }
      },
      {
        $group: {
          _id: '$hour',
          hour: { $first: '$hour' },
          jobCount: { $sum: 1 },
          avgDurationMinutes: { $avg: '$durationMinutes' },
          totalRevenue: { $sum: '$amount' }
        }
      },
      { $sort: { hour: 1 } }
    ]);

    // Ensure all business hours from 9 to 17 are represented cleanly
    const hoursMap = {};
    hourlyAggregation.forEach(h => {
      hoursMap[h.hour] = h;
    });

    const fullDayHours = [];
    for (let h = 9; h <= 17; h++) {
      const label = `${String(h).padStart(2, '0')}:00 - ${String(h + 1).padStart(2, '0')}:00`;
      if (hoursMap[h]) {
        fullDayHours.push({
          hour: h,
          timeSlot: label,
          jobCount: hoursMap[h].jobCount,
          avgDurationMinutes: Number(hoursMap[h].avgDurationMinutes.toFixed(1)),
          totalRevenue: hoursMap[h].totalRevenue
        });
      } else {
        fullDayHours.push({
          hour: h,
          timeSlot: label,
          jobCount: 0,
          avgDurationMinutes: 0,
          totalRevenue: 0
        });
      }
    }

    res.json({ success: true, hours: fullDayHours });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Handle custom wait-time estimation requests
 */
exports.calculateCustomEstimate = async (req, res) => {
  try {
    const { queueAheadCount, queueAheadJobTypes, targetJobType, bufferPercent, targetPages } = req.body;

    const estimate = await estimateWaitTime({
      queueAheadCount: Number(queueAheadCount) || 0,
      queueAheadJobTypes: Array.isArray(queueAheadJobTypes) ? queueAheadJobTypes : [],
      targetJobType: targetJobType || 'B&W printing',
      bufferPercent: Number(bufferPercent) || 15,
      targetPages: Number(targetPages) || 10
    });

    res.json({ success: true, estimate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
