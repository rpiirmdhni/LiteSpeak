const express = require('express');
const { insertFeed, getFeeds } = require('../config/db');
const logger = require('../utils/logger');
const router = express.Router();

const extractData = (req) => {
  const source = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
  const data = {};
  for (const key in source) {
    if (key !== 'api_key') {
      const value = source[key];
      data[key] = isNaN(value) ? value : Number(value);
    }
  }
  return data;
};

const updateHandler = async (req, res) => {
  const source = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
  const apiKey = source.api_key;
  
  if (!apiKey) {
    return res.status(400).send('0');
  }
  
  const data = extractData(req);
  
  if (Object.keys(data).length === 0) {
    return res.status(400).send('0');
  }

  try {
    const lastId = await insertFeed(apiKey, data);
    logger.info('REST', `[${apiKey}] Incoming Data: ${JSON.stringify(data)}`);
    res.status(200).send(lastId.toString());
  } catch (err) {
    logger.error('REST', `Update error: ${err.message}`);
    res.status(500).send('0');
  }
};

router.get('/update', updateHandler);
router.post('/update', updateHandler);
router.post('/update.json', updateHandler);

router.get('/channels/:channel_id/feeds.json', async (req, res) => {
  const channelId = req.params.channel_id;
  const resultsLimit = req.query.results;
  
  try {
    const feeds = await getFeeds(channelId, resultsLimit);
    
    const response = {
      channel: {
        id: channelId, 
        name: channelId,
        created_at: feeds.length > 0 ? feeds[0].created_at : new Date().toISOString(),
        updated_at: feeds.length > 0 ? feeds[feeds.length-1].created_at : new Date().toISOString(),
        last_entry_id: feeds.length > 0 ? feeds[feeds.length-1].entry_id : 0
      },
      feeds: feeds
    };
    
    res.json(response);
  } catch (err) {
    logger.error('REST', `Get feeds error: ${err.message}`);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
