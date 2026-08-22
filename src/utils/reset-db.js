const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const dbPath = path.resolve(__dirname, '../../data');

const filesToDelete = [
  'database.sqlite',
  'database.sqlite-wal',
  'database.sqlite-shm'
];

logger.info('DB', 'Starting database reset process...');

let failedCount = 0;
let deletedCount = 0;
filesToDelete.forEach(file => {
  const filePath = path.join(dbPath, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      logger.info('DB', `Successfully deleted file: ${file}`);
      deletedCount++;
    } catch (err) {
      logger.error('DB', `Failed to delete ${file} (Make sure the main server is stopped!): ${err.message}`);
      failedCount++;
    }
  }
});

if (failedCount > 0) {
  logger.error('DB', 'Failed to reset database. Stop the running server first (Ctrl+C).');
} else if (deletedCount === 0) {
  logger.info('DB', 'No database files found (database is already clean).');
} else {
  logger.info('DB', 'Database reset completed successfully! You can run npm start again.');
}
