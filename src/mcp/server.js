const { insertFeed, getFeeds, db } = require('../config/db');
const aedes = require('../mqtt/broker');
const logger = require('../utils/logger');

let mcpServerInstance = null;

async function initMcpServer() {
  if (mcpServerInstance) return mcpServerInstance;

  // Dynamic import for ESM packages
  const { McpServer, ResourceTemplate } = await import('@modelcontextprotocol/sdk/server/mcp.js');
  const { z } = require('zod');

  mcpServerInstance = new McpServer({
    name: "litespeak-mcp",
    version: "1.1.6"
  });

  // 1. Tool: publish_to_channel
  mcpServerInstance.tool(
    "publish_to_channel",
    "Publish a JSON payload to a specific IoT channel via MQTT. The data will also be saved to the database.",
    {
      channel_id: z.string().describe("The channel ID (e.g., KANDANG-1)"),
      payload: z.record(z.any()).describe("The JSON payload to send (e.g., { pump: 1 })")
    },
    async ({ channel_id, payload }) => {
      try {
        await insertFeed(channel_id, payload);
        aedes.publish({
          cmd: 'publish',
          qos: 0,
          topic: `channels/${channel_id}/publish`,
          payload: Buffer.from(JSON.stringify(payload)),
          retain: false
        });
        logger.info('MCP', `[${channel_id}] Published data via AI: ${JSON.stringify(payload)}`);
        return {
          content: [{ type: "text", text: `Successfully published to channel ${channel_id}` }]
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${err.message}` }],
          isError: true
        };
      }
    }
  );

  // 2. Tool: read_channel_history
  mcpServerInstance.tool(
    "read_channel_history",
    "Fetch historical sensor data for a specific IoT channel.",
    {
      channel_id: z.string().describe("The channel ID (e.g., KANDANG-1)"),
      limit: z.number().optional().describe("Number of records to fetch (default: 10)")
    },
    async ({ channel_id, limit }) => {
      try {
        const feeds = await getFeeds(channel_id, limit || 10);
        return {
          content: [{ type: "text", text: JSON.stringify(feeds, null, 2) }]
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error: ${err.message}` }],
          isError: true
        };
      }
    }
  );

  // 3. Resource: active_channels
  mcpServerInstance.resource(
    "active_channels",
    new ResourceTemplate("channels://active", { list: undefined }),
    async (uri) => {
      return new Promise((resolve, reject) => {
        db.all("SELECT DISTINCT channel_id FROM feeds", [], (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          const channels = rows.map(r => r.channel_id);
          resolve({
            contents: [{
              uri: uri.href,
              text: JSON.stringify(channels, null, 2),
              mimeType: "application/json"
            }]
          });
        });
      });
    }
  );

  return mcpServerInstance;
}

// Express Handlers
async function handleSse(req, res) {
  try {
    const { SSEServerTransport } = await import('@modelcontextprotocol/sdk/server/sse.js');
    const server = await initMcpServer();
    
    const transport = new SSEServerTransport("/mcp/messages", res);
    await server.connect(transport);
    
    // Store transport by sessionId globally in app.locals
    req.app.locals.mcpTransports = req.app.locals.mcpTransports || new Map();
    const sessionId = transport.sessionId;
    req.app.locals.mcpTransports.set(sessionId, transport);
    
    logger.info('MCP', `Client connected (Session ID: ${sessionId})`);

    res.on('close', () => {
      req.app.locals.mcpTransports.delete(sessionId);
      logger.info('MCP', `Client disconnected (Session ID: ${sessionId})`);
    });
  } catch (err) {
    logger.error('MCP', `SSE Error: ${err.message}`);
    res.status(500).send("Internal Server Error");
  }
}

async function handleMessage(req, res) {
  const sessionId = req.query.sessionId;
  if (!sessionId) {
    return res.status(400).send("Missing sessionId");
  }
  
  const transport = req.app.locals.mcpTransports?.get(sessionId);
  if (!transport) {
    return res.status(404).send("Session not found");
  }
  
  try {
    await transport.handlePostMessage(req, res);
  } catch (err) {
    logger.error('MCP', `Message Error: ${err.message}`);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  handleSse,
  handleMessage
};
