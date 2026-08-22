const aedes = require('aedes')();
const { insertFeed } = require('../config/db');
const logger = require('../utils/logger');

aedes.on('client', (client) => {
  logger.info('MQTT', `Client Connected: \x1b[33m${(client ? client.id : client)}\x1b[0m`);
});

aedes.on('clientDisconnect', (client) => {
  logger.info('MQTT', `Client Disconnected: \x1b[31m${(client ? client.id : client)}\x1b[0m`);
});

aedes.on('clientError', (client, err) => {
  logger.error('MQTT', `Client Error (${client ? client.id : 'unknown'}): ${err.message}`);
});

aedes.on('connectionError', (client, err) => {
  logger.error('MQTT', `Connection Error: ${err.message}`);
});

aedes.on('publish', async (packet, client) => {
  if (client) {
    const topic = packet.topic;
    const payload = packet.payload.toString();
    
    const topicRegex = /^channels\/([^\/]+)\/publish$/;
    const match = topic.match(topicRegex);
    
    if (match) {
      const channelId = match[1];
      let data = {};
      
      try {
        data = JSON.parse(payload);
      } catch (e) {
        const params = new URLSearchParams(payload);
        for (const [key, value] of params.entries()) {
          data[key] = isNaN(value) ? value : Number(value);
        }
      }
      
      if (Object.keys(data).length > 0) {
        try {
          await insertFeed(channelId, data);
          logger.info('MQTT', `[${channelId}] Incoming Data: ${JSON.stringify(data)}`);
        } catch (err) {
          logger.error('MQTT', `DB Error: ${err.message}`);
        }
      }
    }
  }
});

module.exports = aedes;
