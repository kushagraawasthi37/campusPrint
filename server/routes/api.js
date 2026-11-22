const express = require('express');
const multer = require('multer');
const path = require('path');
const os = require('os');

const router = express.Router();

// Multer storage setup for CSV uploads
const upload = multer({
  dest: path.join(os.tmpdir(), 'campusprint-uploads'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Controllers
const jobController = require('../controllers/jobController');
const statsController = require('../controllers/statsController');
const queueController = require('../controllers/queueController');

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CampusPrint API',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Dashboard and Stats
router.get('/stats', statsController.getDashboardStats);
router.get('/stats/by-job-type', statsController.getJobTypeMetrics);
router.get('/stats/busiest-hours', statsController.getBusiestHours);
router.post('/estimate', statsController.calculateCustomEstimate);

// Jobs Management
router.get('/jobs', jobController.getJobs);
router.post('/jobs', jobController.createJob);
router.post('/jobs/upload-csv', upload.single('file'), jobController.uploadCSV);
router.post('/jobs/seed', jobController.seedSyntheticData);

// Live Queue Management
router.get('/live-queue', queueController.getLiveQueue);
router.post('/live-queue', queueController.addToLiveQueue);
router.patch('/live-queue/:id', queueController.updateQueueItemStatus);
router.post('/live-queue/advance', queueController.advanceQueue);
router.delete('/live-queue/:id', queueController.deleteQueueItem);

module.exports = router;
