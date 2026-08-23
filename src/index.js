#!/usr/bin/env node

const updateNotifier = require('update-notifier');
const pkg = require('../package.json');
updateNotifier({ pkg, updateCheckInterval: 0 }).notify({ defer: false });

if (process.argv.includes('db:reset')) {
  require('./utils/reset-db.js');
  process.exit(0);
}

if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log(`LiteSpeak v${pkg.version}`);
  process.exit(0);
}

if (process.argv.includes('help') || process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
⚡ LiteSpeak CLI

Commands:
  litespeak                 Start the Unified Broker (REST, MQTT & MCP)
  litespeak db:reset        Wipe and reset the SQLite database cleanly
  litespeak help            Show this help message

Options:
  -v, --version             Show current version

Environment Variables:
  REST_PORT                 Port for REST API (default: 8883)
  MQTT_PORT                 Port for MQTT Broker (default: 1883)
  
Example:
  REST_PORT=3000 litespeak
`);
  process.exit(0);
}

const origLog = console.log;
console.log = function(...args) {
  if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('injected env')) return;
  origLog.apply(console, args);
};
require('dotenv').config();
console.log = origLog;

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const aedesFactory = require('aedes-server-factory');
const aedes = require('./mqtt/broker');
const apiRoutes = require('./routes/api');
const logger = require('./utils/logger');

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

app.use(helmet());
app.use(cors());
app.use(compression());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/', apiRoutes);

app.use((err, req, res, next) => {
  logger.error('REST', `Server Error: ${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(REST_PORT, () => {
  logger.info('REST', `API Server listening on port ${REST_PORT}`);
});

const mqttServer = aedesFactory.createServer(aedes);
mqttServer.listen(MQTT_PORT, () => {
  logger.info('MQTT', `Broker listening on port ${MQTT_PORT}`);
});
