require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { connectDB, disconnectDB } = require('./config/db');
const PrintingJob = require('./models/PrintingJob');
const { validateRows } = require('./services/dataValidator');

async function seed() {
  console.log('[SEED] Connecting to database...');
  await connectDB();

  const csvPath = path.resolve(__dirname, '../data.csv');
  console.log(`[SEED] Reading synthetic data from: ${csvPath}`);

  if (!fs.existsSync(csvPath)) {
    console.error(`[SEED ERROR] data.csv not found at ${csvPath}`);
    process.exit(1);
  }

  const rawRows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (d) => rawRows.push(d))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`[SEED] Parsed ${rawRows.length} raw rows. Running data validation...`);
  const validationResult = validateRows(rawRows);

  if (validationResult.invalidCount > 0) {
    console.warn(`[SEED WARN] Found ${validationResult.invalidCount} invalid rows during validation!`);
  }

  console.log(`[SEED] Valid records: ${validationResult.validRecords.length}`);

  await PrintingJob.deleteMany({});
  console.log('[SEED] Cleared previous records.');

  const inserted = await PrintingJob.insertMany(validationResult.validRecords);
  console.log(`[SEED SUCCESS] Successfully imported ${inserted.length} synthetic printing jobs.`);

  await disconnectDB();
  console.log('[SEED] Database disconnected.');
}

seed().catch((err) => {
  console.error('[SEED FATAL ERROR]', err);
  process.exit(1);
});
