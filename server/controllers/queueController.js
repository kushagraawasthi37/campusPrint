const LiveQueueItem = require('../models/LiveQueueItem');

/**
 * Get active queue items (waiting or in_progress)
 */
exports.getLiveQueue = async (req, res) => {
  try {
    const queue = await LiveQueueItem.find({
      status: { $in: ['waiting', 'in_progress'] }
    }).sort('createdAt');

    res.json({ success: true, queue });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Add a new customer to live queue
 */
exports.addToLiveQueue = async (req, res) => {
  try {
    const { customer_name, job_type, pages, copies, target_device, notes } = req.body;
    
    // Generate ticket number e.g. T-101
    const countToday = await LiveQueueItem.countDocuments();
    const ticket_number = `T-${101 + countToday}`;

    const item = new LiveQueueItem({
      ticket_number,
      customer_name: customer_name || `Student #${ticket_number}`,
      job_type,
      pages: Number(pages) || 10,
      copies: Number(copies) || 1,
      target_device: target_device || 'Auto Assign',
      notes: notes || '',
      status: 'waiting'
    });

    await item.save();
    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Update status of a queue item (waiting -> in_progress -> completed / cancelled)
 */
exports.updateQueueItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['waiting', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const item = await LiveQueueItem.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, error: 'Queue item not found' });
    }

    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Advance queue: completes current in_progress and starts next waiting job
 */
exports.advanceQueue = async (req, res) => {
  try {
    // 1. Complete currently active job
    const inProgress = await LiveQueueItem.findOne({ status: 'in_progress' });
    if (inProgress) {
      inProgress.status = 'completed';
      await inProgress.save();
    }

    // 2. Pick next waiting customer
    const nextWaiting = await LiveQueueItem.findOne({ status: 'waiting' }).sort('createdAt');
    if (nextWaiting) {
      nextWaiting.status = 'in_progress';
      await nextWaiting.save();
    }

    const remainingActive = await LiveQueueItem.find({
      status: { $in: ['waiting', 'in_progress'] }
    }).sort('createdAt');

    res.json({
      success: true,
      completedItem: inProgress,
      nowActiveItem: nextWaiting,
      remainingQueue: remainingActive
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Delete / cancel a queue item
 */
exports.deleteQueueItem = async (req, res) => {
  try {
    const { id } = req.params;
    await LiveQueueItem.findByIdAndDelete(id);
    res.json({ success: true, message: 'Queue item removed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
