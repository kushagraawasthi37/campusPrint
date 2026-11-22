const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const PrintingJob = require('../models/PrintingJob');
const { validateRows } = require('../services/dataValidator');

/**
 * Get all historical jobs with filtering, pagination and sorting
 */
exports.getJobs = async (req, res) => {
  try {
    const { job_type, device, page = 1, limit = 50, sort = '-arrival_time' } = req.query;
    const query = {};

    if (job_type && job_type !== 'All') {
      query.job_type = job_type;
    }
    if (device && device !== 'All') {
      query.device = device;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await PrintingJob.countDocuments(query);
    const jobs = await PrintingJob.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      jobs
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ success: false, error: 'Internal server error fetching jobs' });
  }
};

/**
 * Add a single job record
 */
exports.createJob = async (req, res) => {
  try {
    const job = new PrintingJob(req.body);
    await job.save();
    res.status(201).json({ success: true, job });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Upload and process CSV with Multer and strict row validation
 */
exports.uploadCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No CSV file uploaded' });
  }

  const rawRows = [];
  const filePath = req.file.path;

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => rawRows.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Remove uploaded temporary file
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      // ignore
    }

    if (rawRows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Uploaded CSV is empty or has invalid headers'
      });
    }

    // Run row-by-row validation
    const validationResult = validateRows(rawRows);

    let insertedRecords = [];
    if (validationResult.validRecords.length > 0) {
      // Upsert or insert valid records safely
      for (const record of validationResult.validRecords) {
        try {
          const updated = await PrintingJob.findOneAndUpdate(
            { job_id: record.job_id },
            record,
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          insertedRecords.push(updated);
        } catch (dbErr) {
          validationResult.errors.push({
            rowNumber: 'DB',
            field: 'job_id',
            value: record.job_id,
            reason: `Database error: ${dbErr.message}`
          });
        }
      }
    }

    res.json({
      success: true,
      summary: {
        totalRows: validationResult.totalRows,
        validCount: insertedRecords.length,
        invalidCount: validationResult.invalidCount + (validationResult.validRecords.length - insertedRecords.length),
        status: validationResult.invalidCount === 0 ? 'COMPLETE_SUCCESS' : 'PARTIAL_SUCCESS_WITH_ERRORS'
      },
      errors: validationResult.errors,
      insertedCount: insertedRecords.length
    });
  } catch (err) {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {}
    console.error('Error processing CSV:', err);
    res.status(500).json({ success: false, error: `Error processing CSV file: ${err.message}` });
  }
};

/**
 * Seed synthetic data.csv directly into database
 */
exports.seedSyntheticData = async (req, res) => {
  try {
    const csvPath = path.resolve(__dirname, '../../data.csv');
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ success: false, error: 'Synthetic data.csv not found on server' });
    }

    const rawRows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => rawRows.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    const validationResult = validateRows(rawRows);
    if (validationResult.validRecords.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid records found in synthetic data.csv' });
    }

    await PrintingJob.deleteMany({ is_synthetic: true });
    const inserted = await PrintingJob.insertMany(validationResult.validRecords);

    res.json({
      success: true,
      message: 'Synthetic development dataset seeded successfully',
      count: inserted.length
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
