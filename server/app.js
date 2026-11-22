const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', apiRoutes);

// Root informative endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'CampusPrint API',
    description: 'Printing shop queue and waiting-time estimator backend for NIT Srinagar campus zone',
    disclaimer: 'This API serves a synthetic development scenario. All baseline data are explicitly fictional.',
    endpoints: {
      health: 'GET /api/health',
      stats: 'GET /api/stats',
      metricsByJobType: 'GET /api/stats/by-job-type',
      busiestHours: 'GET /api/stats/busiest-hours',
      jobs: 'GET /api/jobs',
      uploadCSV: 'POST /api/jobs/upload-csv',
      seed: 'POST /api/jobs/seed',
      estimate: 'POST /api/estimate',
      liveQueue: 'GET /api/live-queue'
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

module.exports = app;
