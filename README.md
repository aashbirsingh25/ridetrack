# RideTrack Microservices Platform 🚴📦

RideTrack is an event-driven, production-grade microservices system designed for real-time delivery order placement, automated rider dispatching, live GPS location tracking over WebSockets, and ML-powered ETA duration predictions.

---

## 🏗️ Architecture & Services Overview

The system consists of five decoupled services containerized with multi-stage Docker builds and coordinated via Docker Compose:

| Service Name | Tech Stack | Port | Responsibilities & External Dependencies |
| :--- | :--- | :--- | :--- |
| **`delivery-order-service`** | NestJS, TypeScript, Mongoose, RabbitMQ | `3000` | Manages order creation, status transitions, and lifecycle events. Persists orders to **MongoDB Atlas** and publishes/subscribes to **CloudAMQP RabbitMQ** (`order_placed` / `order_assigned`). |
| **`rider-dispatch-service`** | NestJS, TypeScript, TypeORM, PostgreSQL, RabbitMQ | `3001` | Handles rider availability, location updates, and automatic rider dispatch algorithms based on proximity. Connected to **Supabase PostgreSQL** and **CloudAMQP RabbitMQ**. |
| **`live-tracking-service`** | NestJS, TypeScript, Socket.io, Redis | `3002` | Facilitates real-time bidirectional WebSocket streaming of rider location coordinates to tracking clients. Uses **Upstash Redis** for pub/sub state caching. |
| **`eta-prediction-service`** | Python 3.11, FastAPI, Scikit-learn, Pandas | `3004` | Serves machine learning regression predictions (`eta_model.pkl`) to estimate delivery duration (in minutes) based on Haversine distance and time-of-day traffic dynamics. |
| **`ridetrack-frontend`** | Next.js 14, React, TailwindCSS, Leaflet | `3003` | Modern interactive web dashboard providing customer order placement, real-time rider tracking maps, and rider status control panels. |

---

## ⚡ Prerequisites

- **Docker Desktop** installed (with Docker Engine and Docker Compose v2+)
- Active Cloud Service Credentials configured in each service's `.env` file:
  - `delivery-order-service/.env` -> `MONGODB_URI`, `RABBITMQ_URL`
  - `rider-dispatch-service/.env` -> `DATABASE_URL`, `RABBITMQ_URL`
  - `live-tracking-service/.env` -> `REDIS_URL`
  - `eta-prediction-service/.env` -> `PORT`
  - `ridetrack-frontend/.env` -> `NEXT_PUBLIC_*_SERVICE_URL`

---

## 🚀 Running the Stack

To build and start all five services in detached mode with a single command, run from the root directory:

```bash
docker compose up --build -d
```

*(Or `docker-compose up --build -d` if using Docker Compose v1)*

---

## 📊 Monitoring & Log Inspection

To view the status of all running containers:

```bash
docker compose ps
```

To stream real-time logs across all services:

```bash
docker compose logs -f
```

To view logs for a specific service (e.g., ETA Prediction Service):

```bash
docker compose logs -f eta-prediction-service
```

To stop and remove containers and network:

```bash
docker compose down
```

---

## 🌐 Endpoint Access Summary

- **Frontend App**: [http://localhost:3003](http://localhost:3003)
- **Order Service REST API**: [http://localhost:3000](http://localhost:3000)
- **Rider Dispatch Service REST API**: [http://localhost:3001](http://localhost:3001)
- **Live Tracking Service (REST & WebSockets)**: [http://localhost:3002](http://localhost:3002)
- **ETA Prediction API Docs / Health**: [http://localhost:3004/health](http://localhost:3004/health)
