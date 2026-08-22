# ⚡ LiteSpeak

> **A lightweight, zero-setup, high-performance MQTT Broker & REST API platform for IoT.**

LiteSpeak is an open-source, dual-protocol Internet of Things (IoT) platform designed to eliminate the friction of traditional brokers. By combining a low-latency MQTT Broker (powered by Aedes) with a dynamic REST API (Express), LiteSpeak allows microcontrollers and applications to communicate instantly without the need for prior channel registration or complex authentication.

It acts as a lightweight alternative to commercial IoT cloud platforms, running seamlessly on Node.js and utilizing SQLite in Write-Ahead Logging (WAL) mode to handle high-concurrency sensor data streams.

---

## 🌟 Key Features

- **Zero-Friction Setup:** No need to create accounts, generate tokens, or pre-register channels. Just publish to any topic and the system automatically tracks it.
- **Dual Protocol:** Receive data via **MQTT** (`mqtt://`) and retrieve/publish data via **REST API** (`http://`) simultaneously.
- **Dynamic Payloads:** Send any JSON structure. The database adapts dynamically without needing rigid schemas.
- **High Concurrency:** Built-in SQLite WAL mode ensures no database locking, even when receiving hundreds of requests per second.
- **Production-Ready:** Pre-configured with PM2, Helmet (Security headers), CORS, GZIP Compression, and graceful Uncaught Exception handling.

## 🛠️ Tech Stack

LiteSpeak is powered by a modern, lightweight JavaScript ecosystem:

- **Runtime:** [Node.js](https://nodejs.org)
- **MQTT Broker:** [Aedes](https://github.com/moscajs/aedes) (High-performance TCP stream broker)
- **REST API:** [Express.js](https://expressjs.com/) (Routing & HTTP handling)
- **Database:** [SQLite3](https://www.sqlite.org/index.html) (Using WAL mode for extreme concurrency)
- **Process Manager:** [PM2](https://pm2.keymetrics.io/) (For 24/7 production deployment)
- **Security & Perf:** `helmet`, `cors`, `compression`

## 🥊 Why LiteSpeak?

Tired of commercial IoT platforms that restrict your hardware? LiteSpeak was built to eliminate the artificial limitations typically found in enterprise cloud services:

| Feature              | 📉 Traditional Cloud Platforms (Free Tier)  | ⚡ LiteSpeak                                    |
| -------------------- | ------------------------------------------- | ----------------------------------------------- |
| **Cost**             | High subscription fees for serious usage    | **100% Free & Open Source**                     |
| **Rate Limit**       | Heavily throttled (e.g., 1 request per 15s) | **Unlimited / Zero Throttling**                 |
| **Channels/Devices** | Strictly capped (e.g., max 4 channels)      | **Unlimited** (Bound only by server specs)      |
| **Data Fields**      | Hardcoded limits (e.g., max 8 fields)       | **Unlimited JSON Fields**                       |
| **Setup Time**       | Tedious registration & API Key generation   | **Instant** (Zero-setup, just send the payload) |

## 🚀 Quick Start

### 1. Installation

Install LiteSpeak globally via NPM so you can run it from anywhere in your terminal:

```bash
npm install -g @rpiirmdhni/litespeak
```

### 2. Run the Server

Simply type the following command to start both the MQTT Broker and the REST API:

```bash
litespeak
```

You should see the following logs indicating the server is healthy:

```
[2026-08-23 01:00:00][REST] API Server listening on port 8883
[2026-08-23 01:00:00][MQTT] Broker listening on port 1883
[2026-08-23 01:00:00][DB] Connected to the SQLite database.
```

*(Tip: By default, the REST API runs on port `8883` and MQTT Broker runs on port `1883`. You can change this by setting the `REST_PORT` and `MQTT_PORT` environment variables in your terminal).*

## 📡 API Reference & Usage

### A. MQTT Protocol (Port 1883)

Use any MQTT Client (like MQTTX or ESP32 PubSubClient) to connect to `localhost:1883` without a username or password.

| Action           | Topic                           | Payload Example                       |
| ---------------- | ------------------------------- | ------------------------------------- |
| **Publish Data** | `channels/{channel_id}/publish` | `{"temperature": 32, "humidity": 60}` |

_Note: Replace `{channel_id}` with any unique identifier for your device (e.g., `channels/GREENHOUSE-01/publish`). The channel will be created automatically upon the first payload._

### B. REST API (Port 8883)

| Method         | Endpoint                            | Description                                                                     |
| -------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| **GET / POST** | `/update`                           | Publish data via HTTP. Example: <br>`GET /update?api_key=GREENHOUSE-01&temp=32` |
| **GET**        | `/channels/{channel_id}/feeds.json` | Retrieve the history of sensor data for a specific channel.                     |

**Example Response for `/feeds.json`:**

```json
{
  "channel": {
    "id": "GREENHOUSE-01"
  },
  "feeds": [
    {
      "entry_id": 1,
      "created_at": "2026-08-23T01:00:00Z",
      "temp": 32
    }
  ]
}
```

## 🛠️ CLI Utilities

Need to clear the database for a fresh start? Simply stop the server and run:

```bash
litespeak db:reset
```

This will cleanly wipe the SQLite database and WAL files.

## 🏭 Production Deployment

For continuous 24/7 operation on a VPS or cloud server, you can use PM2 to manage the LiteSpeak process:

```bash
npx pm2 start litespeak --name litespeak-server
```

PM2 will automatically manage the process, restarting it if the server reboots or encounters a fatal crash.

---

## 👨‍💻 Author

**Rafie Restu Ramadhani**

- GitHub: [@rpiirmdhni](https://github.com/rpiirmdhni)

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

_Built with ❤️ for IoT enthusiasts and the Maker community._
