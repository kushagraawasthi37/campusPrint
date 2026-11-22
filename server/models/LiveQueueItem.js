const mongoose = require('mongoose');

const LiveQueueItemSchema = new mongoose.Schema(
  {
    ticket_number: {
      type: String,
      required: true
    },
    customer_name: {
      type: String,
      default: 'Walk-in Student'
    },
    job_type: {
      type: String,
      required: true,
      enum: ['B&W printing', 'Colour printing', 'Photocopy', 'Scanning', 'Spiral binding']
    },
    pages: {
      type: Number,
      default: 10,
      min: 1
    },
    copies: {
      type: Number,
      default: 1,
      min: 1
    },
    status: {
      type: String,
      enum: ['waiting', 'in_progress', 'completed', 'cancelled'],
      default: 'waiting'
    },
    target_device: {
      type: String,
      default: 'Auto Assign'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('LiveQueueItem', LiveQueueItemSchema);
