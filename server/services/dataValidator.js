/**
 * Data Validator for CampusPrint CSV Import
 * Enforces strict row-level validation. Does not silently discard invalid records.
 */

const ALLOWED_JOB_TYPES = [
  'B&W printing',
  'Colour printing',
  'Photocopy',
  'Scanning',
  'Spiral binding'
];

/**
 * Validates a single row of CSV data
 * @param {Object} row Raw key-value row from CSV
 * @param {number} rowNumber Physical row number in CSV file (1-based, excluding header)
 * @returns {Object} { isValid: boolean, errors: Array<{rowNumber, field, value, reason}>, sanitized: Object|null }
 */
function validateRow(row, rowNumber) {
  const errors = [];

  // Required keys check
  const requiredFields = [
    'job_id',
    'arrival_time',
    'service_start',
    'service_end',
    'job_type',
    'pages',
    'copies',
    'queue_ahead',
    'device',
    'amount'
  ];

  for (const field of requiredFields) {
    if (row[field] === undefined || row[field] === null || String(row[field]).trim() === '') {
      errors.push({
        rowNumber,
        field,
        value: row[field] ?? '',
        reason: `Missing required field '${field}'`
      });
    }
  }

  // If already missing basic fields, return early to avoid cascaded NaN checks
  if (errors.length > 0) {
    return { isValid: false, errors, sanitized: null };
  }

  const jobId = String(row.job_id).trim();
  const jobType = String(row.job_type).trim();
  const device = String(row.device).trim();

  // Validate job_type enum
  if (!ALLOWED_JOB_TYPES.includes(jobType)) {
    errors.push({
      rowNumber,
      field: 'job_type',
      value: jobType,
      reason: `Invalid job type '${jobType}'. Supported: ${ALLOWED_JOB_TYPES.join(', ')}`
    });
  }

  // Numeric: pages
  const pages = Number(row.pages);
  if (isNaN(pages) || !Number.isInteger(pages) || pages <= 0) {
    errors.push({
      rowNumber,
      field: 'pages',
      value: row.pages,
      reason: `Pages must be a positive integer >= 1. Received '${row.pages}'`
    });
  }

  // Numeric: copies
  const copies = Number(row.copies);
  if (isNaN(copies) || !Number.isInteger(copies) || copies <= 0) {
    errors.push({
      rowNumber,
      field: 'copies',
      value: row.copies,
      reason: `Copies must be a positive integer >= 1. Received '${row.copies}'`
    });
  }

  // Numeric: queue_ahead
  const queueAhead = Number(row.queue_ahead);
  if (isNaN(queueAhead) || !Number.isInteger(queueAhead) || queueAhead < 0) {
    errors.push({
      rowNumber,
      field: 'queue_ahead',
      value: row.queue_ahead,
      reason: `Queue ahead count cannot be negative. Received '${row.queue_ahead}'`
    });
  }

  // Numeric: amount
  const amount = Number(row.amount);
  if (isNaN(amount) || amount < 0) {
    errors.push({
      rowNumber,
      field: 'amount',
      value: row.amount,
      reason: `Amount cannot be negative. Received '${row.amount}'`
    });
  }

  // Timestamps validation
  const arrivalDate = new Date(row.arrival_time);
  const startDate = new Date(row.service_start);
  const endDate = new Date(row.service_end);

  if (isNaN(arrivalDate.getTime())) {
    errors.push({
      rowNumber,
      field: 'arrival_time',
      value: row.arrival_time,
      reason: `Invalid timestamp format for arrival_time: '${row.arrival_time}'`
    });
  }

  if (isNaN(startDate.getTime())) {
    errors.push({
      rowNumber,
      field: 'service_start',
      value: row.service_start,
      reason: `Invalid timestamp format for service_start: '${row.service_start}'`
    });
  }

  if (isNaN(endDate.getTime())) {
    errors.push({
      rowNumber,
      field: 'service_end',
      value: row.service_end,
      reason: `Invalid timestamp format for service_end: '${row.service_end}'`
    });
  }

  // Logical temporal consistency checks
  if (!isNaN(arrivalDate.getTime()) && !isNaN(startDate.getTime())) {
    if (startDate.getTime() < arrivalDate.getTime()) {
      errors.push({
        rowNumber,
        field: 'service_start',
        value: row.service_start,
        reason: `Service start (${row.service_start}) cannot precede arrival time (${row.arrival_time})`
      });
    }
  }

  if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
    if (endDate.getTime() <= startDate.getTime()) {
      errors.push({
        rowNumber,
        field: 'service_end',
        value: row.service_end,
        reason: `Service end (${row.service_end}) must be strictly later than service start (${row.service_start})`
      });
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors, sanitized: null };
  }

  const durationSeconds = Math.round((endDate.getTime() - startDate.getTime()) / 1000);
  const waitingTimeSeconds = Math.round((startDate.getTime() - arrivalDate.getTime()) / 1000);

  return {
    isValid: true,
    errors: [],
    sanitized: {
      job_id: jobId,
      arrival_time: arrivalDate,
      service_start: startDate,
      service_end: endDate,
      job_type: jobType,
      pages,
      copies,
      queue_ahead: queueAhead,
      device,
      amount,
      duration_seconds: durationSeconds,
      waiting_time_seconds: waitingTimeSeconds,
      is_synthetic: true
    }
  };
}

/**
 * Validates an array of raw rows
 */
function validateRows(rows) {
  const validRecords = [];
  const allErrors = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const result = validateRow(row, rowNumber);
    if (result.isValid) {
      validRecords.push(result.sanitized);
    } else {
      allErrors.push(...result.errors);
    }
  });

  return {
    totalRows: rows.length,
    validCount: validRecords.length,
    invalidCount: allErrors.length > 0 ? rows.length - validRecords.length : 0,
    validRecords,
    errors: allErrors
  };
}

module.exports = {
  validateRow,
  validateRows,
  ALLOWED_JOB_TYPES
};
