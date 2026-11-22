require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    
    // Auto-seed if empty
    const PrintingJob = require('./models/PrintingJob');
    const count = await PrintingJob.countDocuments();
    if (count === 0) {
      console.log('[DB] No jobs found in database. Auto-seeding 25 synthetic development records...');
      const fs = require('fs');
      const path = require('path');
      const csv = require('csv-parser');
      const { validateRows } = require('./services/dataValidator');
      const csvPath = path.resolve(__dirname, '../data.csv');
      
      if (fs.existsSync(csvPath)) {
        const rows = [];
        fs.createReadStream(csvPath)
          .pipe(csv())
          .on('data', (data) => rows.push(data))
          .on('end', async () => {
            const result = validateRows(rows);
            if (result.validRecords.length > 0) {
              await PrintingJob.insertMany(result.validRecords);
              console.log(`[DB] Successfully seeded ${result.validRecords.length} synthetic jobs.`);
            }
          });
      }
    }

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` CampusPrint Backend running on http://localhost:${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Synthetic Data Disclaimer: All records are fictional.`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
