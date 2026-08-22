const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

const dbPath = path.resolve(__dirname, '../../data/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error('DB', `Error opening database: ${err.message}`);
  } else {
    logger.info('DB', 'Connected to the SQLite database.');
    
    db.run('PRAGMA journal_mode = WAL;');
    db.run('PRAGMA busy_timeout = 5000;');

    db.run(`CREATE TABLE IF NOT EXISTS feeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      data JSON NOT NULL
    )`);
  }
});

const insertFeed = (channelId, data) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO feeds (channel_id, data) VALUES (?, ?)`;
    db.run(sql, [channelId, JSON.stringify(data)], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

const getFeeds = (channelId, resultsLimit = null) => {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM feeds WHERE channel_id = ? ORDER BY created_at DESC`;
    if (resultsLimit) {
      sql += ` LIMIT ${parseInt(resultsLimit)}`;
    }
    db.all(sql, [channelId], (err, rows) => {
      if (err) reject(err);
      else {
        const feeds = rows.map(row => ({
          created_at: row.created_at,
          entry_id: row.id,
          ...JSON.parse(row.data)
        }));
        resolve(feeds.reverse());
      }
    });
  });
};

module.exports = { db, insertFeed, getFeeds };
