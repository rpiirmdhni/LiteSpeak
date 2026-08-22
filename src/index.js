if (process.argv.includes('db:reset')) {
  require('./utils/reset-db.js');
  process.exit(0);
}

// Matikan iklan dotenv dengan menahan console.log sejenak
const origLog = console.log;
console.log = function(...args) {
  if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('injected env')) return;
  origLog.apply(console, args);
};
require('dotenv').config(); // Load environment variables from .env
console.log = origLog; // Kembalikan console.log

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const aedesFactory = require('aedes-server-factory');
const aedes = require('./mqtt/broker');
const apiRoutes = require('./routes/api');
const logger = require('./utils/logger');

// Global Error Handlers (Uncaught Exception & Unhandled Rejection)
process.on('uncaughtException', (err) => {
  logger.error('SYSTEM', `Uncaught Exception: ${err.message}`);
  console.error(err.stack);
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error('SYSTEM', `Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

const app = express();
const REST_PORT = process.env.REST_PORT || 8883;
const MQTT_PORT = process.env.MQTT_PORT || 1883;

// Security and Performance Middlewares
app.use(helmet()); // Set secure HTTP headers
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(compression()); // GZIP compression for responses

// Middleware for parsing application/x-www-form-urlencoded and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use('/', apiRoutes);

// Global Express Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error('REST', `Server Error: ${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start REST API
app.listen(REST_PORT, () => {
  logger.info('REST', `API Server listening on port ${REST_PORT}`);
});

// Start MQTT Broker
const mqttServer = aedesFactory.createServer(aedes);
mqttServer.listen(MQTT_PORT, () => {
  logger.info('MQTT', `Broker listening on port ${MQTT_PORT}`);
});
