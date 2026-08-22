const aedes = require('aedes')();
const { insertFeed } = require('../config/db');
const logger = require('../utils/logger');

// Handle new client connection
aedes.on('client', (client) => {
  logger.info('MQTT', `Client Connected: \x1b[33m${(client ? client.id : client)}\x1b[0m`);
});

// Handle client disconnection
aedes.on('clientDisconnect', (client) => {
  logger.info('MQTT', `Client Disconnected: \x1b[31m${(client ? client.id : client)}\x1b[0m`);
});

// Handle errors
aedes.on('clientError', (client, err) => {
  logger.error('MQTT', `Client Error (${client ? client.id : 'unknown'}): ${err.message}`);
});

aedes.on('connectionError', (client, err) => {
  logger.error('MQTT', `Connection Error: ${err.message}`);
});

// Handle publish
aedes.on('publish', async (packet, client) => {
  if (client) {
    const topic = packet.topic;
    const payload = packet.payload.toString();
    
    // Parse topic: channels/<channel_id>/publish
    const topicRegex = /^channels\/([^\/]+)\/publish$/;
    const match = topic.match(topicRegex);
    
    if (match) {
      const channelId = match[1];
      let data = {};
      
      try {
        // Try parsing as JSON first
        data = JSON.parse(payload);
      } catch (e) {
        // Fallback to URL-encoded (field1=10&field2=20)
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
