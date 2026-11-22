const mongoose = require('mongoose');

const PrintingJobSchema = new mongoose.Schema(
  {
    job_id: {
      type: String,
      required: [true, 'Job ID is required'],
      unique: true,
      trim: true
    },
    arrival_time: {
      type: Date,
      required: [true, 'Arrival time is required']
    },
    service_start: {
      type: Date,
      required: [true, 'Service start time is required']
    },
    service_end: {
      type: Date,
      required: [true, 'Service end time is required']
    },
    job_type: {
      type: String,
      required: [true, 'Job type is required'],
      enum: {
        values: ['B&W printing', 'Colour printing', 'Photocopy', 'Scanning', 'Spiral binding'],
        message: '{VALUE} is not a supported job type'
      }
    },
    pages: {
      type: Number,
      required: [true, 'Pages count is required'],
      min: [1, 'Pages must be at least 1']
    },
    copies: {
      type: Number,
      required: [true, 'Copies count is required'],
      min: [1, 'Copies must be at least 1'],
      default: 1
    },
    queue_ahead: {
      type: Number,
      required: [true, 'Historical queue count ahead is required'],
      min: [0, 'Queue ahead cannot be negative']
    },
    device: {
      type: String,
      required: [true, 'Device name is required'],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount in INR is required'],
      min: [0, 'Amount cannot be negative']
    },
    duration_seconds: {
      type: Number,
      required: true
    },
    waiting_time_seconds: {
      type: Number,
      required: true
    },
    is_synthetic: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Pre-validate hook to calculate durations
PrintingJobSchema.pre('validate', function (next) {
  if (this.service_start && this.service_end) {
    this.duration_seconds = Math.round((new Date(this.service_end) - new Date(this.service_start)) / 1000);
  }
  if (this.arrival_time && this.service_start) {
    this.waiting_time_seconds = Math.round((new Date(this.service_start) - new Date(this.arrival_time)) / 1000);
  }
  next();
});

module.exports = mongoose.model('PrintingJob', PrintingJobSchema);
