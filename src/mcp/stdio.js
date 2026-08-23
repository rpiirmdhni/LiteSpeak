const { McpServer, ResourceTemplate } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const http = require('http');

const server = new McpServer({
  name: "litespeak-mcp-stdio",
  version: "1.3.1"
});

const makeRequest = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

server.tool(
  "publish_to_channel",
  "Publish a JSON payload to a specific IoT channel via MQTT. The data will also be saved to the database.",
  {
    channel_id: z.string().describe("The channel ID (e.g., KANDANG-1)"),
    payload: z.record(z.any()).describe("The JSON payload to send (e.g., { pump: 1 })")
  },
  async ({ channel_id, payload }) => {
    try {
      const postData = JSON.stringify({ ...payload, api_key: channel_id });
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: 8883,
        path: '/update.json',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, postData);
      
      if (res.status === 200) {
        return {
          content: [{ type: "text", text: `Successfully published to channel ${channel_id}` }]
        };
      } else {
        return {
          content: [{ type: "text", text: `Error from server: ${res.status} ${res.data}` }],
          isError: true
        };
      }
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true
      };
    }
  }
);

server.tool(
  "read_channel_history",
  "Fetch historical sensor data for a specific IoT channel.",
  {
    channel_id: z.string().describe("The channel ID (e.g., KANDANG-1)"),
    limit: z.number().optional().describe("Number of records to fetch (default: 10)")
  },
  async ({ channel_id, limit }) => {
    try {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: 8883,
        path: `/channels/${channel_id}/feeds.json?results=${limit || 10}`,
        method: 'GET'
      });
      return {
        content: [{ type: "text", text: res.data }]
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true
      };
    }
  }
);

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch(console.error);
