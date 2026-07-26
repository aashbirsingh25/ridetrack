# Live Tracking Microservice (`live-tracking-service`)

A high-performance real-time location tracking microservice built with **NestJS**, **TypeScript**, **WebSockets (Socket.io)**, and **Redis (`ioredis`)**.

---

## 📌 Architecture & Design Scope

> [!NOTE]
> **Integration Context**: This service assumes `orderId` and `riderId` are supplied by the **Order Service** (`delivery-order-service`) and **Rider Service** (`rider-dispatch-service`). It operates independently without calling those services directly yet. Service-to-service communication will be added in a subsequent integration phase.

This proof-of-concept phase focuses on proving real-time location streaming from rider to customer backed by Redis in-memory storage for instant last-known-location lookups.

---

## 🚀 Key Features

- **Socket.io WebSocket Gateway**: Subscribes rider location updates and manages room-based fan-out to customers watching specific orders.
- **In-Memory Caching (Redis)**: Stores latest location state under key pattern `location:{orderId}`.
- **Instant Join Hydration**: Customers joining an order room immediately receive the last recorded location via `"location:current"`.
- **REST Testing Endpoint**: `GET /tracking/:orderId/location` allows inspecting Redis state without opening a WebSocket client connection.

---

## 🛠 Project Structure

```text
live-tracking-service/
├── src/
│   ├── redis/
│   │   └── redis.module.ts       # Global Redis Provider wrapping ioredis & ConfigService
│   ├── tracking/
│   │   ├── dto/
│   │   │   ├── location-update.dto.ts # DTO for rider GPS payload validation
│   │   │   └── track-join.dto.ts      # DTO for customer room join payload
│   │   ├── tracking.controller.ts     # REST Controller (GET /tracking/:orderId/location)
│   │   ├── tracking.gateway.ts        # Socket.io WebSocket Gateway (Rider & Customer handlers)
│   │   ├── tracking.service.ts        # Redis read/write business logic
│   │   └── tracking.module.ts         # Tracking Feature Module
│   ├── app.module.ts             # Root Module compiling Config, Redis & Tracking
│   └── main.ts                   # Entry point (port 3002)
├── .env.example                  # Environment configuration template
├── Dockerfile                    # Multi-stage Docker build (builder & runner)
└── README.md                     # Documentation
```

---

## ⚙️ Environment Variables

Create a `.env` file at the root of the project (refer to `.env.example`):

```env
PORT=3002
REDIS_URL=redis://localhost:6379
```

---

## ⚡ How to Run Locally

### 1. Prerequisites
- **Node.js**: v18 or higher
- **Redis Server**: Local Redis instance or Docker container

### 2. Start Redis using Docker (Quick Start)
```bash
docker run -d --name redis-local -p 6379:6379 redis:alpine
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run in Development Mode
```bash
npm run start:dev
```

The service will start on port `3002`.

---

## 📦 Running with Docker

### Build Image
```bash
docker build -t live-tracking-service .
```

### Run Container
```bash
docker run -p 3002:3002 -e REDIS_URL=redis://host.docker.internal:6379 live-tracking-service
```

---

## 📡 WebSocket Event API (Socket.io)

Connect your Socket.io client to `ws://localhost:3002`.

### 🛵 Rider Flow

#### 1. Emit Location Update: `location:update`
Rider app periodically emits current GPS coordinates:

- **Event Name**: `location:update`
- **Payload Shape**:
  ```json
  {
    "riderId": "rider-101",
    "orderId": "order-555",
    "lat": 37.7749,
    "lng": -122.4194
  }
  ```
- **Service Action**:
  - Persists JSON in Redis key `location:order-555`
  - Broadcasts `location:update` event to all clients in Socket.io room `order-555`

---

### 👤 Customer Flow

#### 1. Join Order Room: `track:join`
Customer app emits `track:join` to subscribe to live updates for their order:

- **Event Name**: `track:join`
- **Payload Shape**:
  ```json
  {
    "orderId": "order-555"
  }
  ```
- **Service Action**:
  - Adds customer socket to Socket.io room `order-555`
  - Queries Redis for key `location:order-555`
  - Emits `"location:current"` back to customer socket

#### 2. Receive Last Known Location: `location:current` (Listen)
Customer socket immediately receives cached location upon joining room:

- **Event Name**: `location:current`
- **Payload Shape**:
  ```json
  {
    "riderId": "rider-101",
    "orderId": "order-555",
    "lat": 37.7749,
    "lng": -122.4194,
    "timestamp": "2026-07-26T14:22:56.000Z"
  }
  ```

#### 3. Receive Live Broadcasts: `location:update` (Listen)
While in room `order-555`, customer receives live real-time location updates whenever rider moves:

- **Event Name**: `location:update`
- **Payload Shape**:
  ```json
  {
    "riderId": "rider-101",
    "orderId": "order-555",
    "lat": 37.7752,
    "lng": -122.4198,
    "timestamp": "2026-07-26T14:23:10.000Z"
  }
  ```

---

## 🔍 REST Testing API

### GET `/tracking/:orderId/location`
Queries Redis directly for the last known location of an order without WebSockets.

#### Request Example
```bash
curl http://localhost:3002/tracking/order-555/location
```

#### Response (200 OK)
```json
{
  "statusCode": 200,
  "message": "Last known location retrieved successfully",
  "data": {
    "riderId": "rider-101",
    "orderId": "order-555",
    "lat": 37.7749,
    "lng": -122.4194,
    "timestamp": "2026-07-26T14:22:56.000Z"
  }
}
```

#### Response (404 Not Found)
```json
{
  "message": "No last known location found for orderId: order-555",
  "error": "Not Found",
  "statusCode": 404
}
```
