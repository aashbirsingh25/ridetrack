# Rider Dispatch Microservice (`rider-dispatch-service`)

A NestJS microservice managing rider registration, GPS location tracking, availability toggling, and **automatic order dispatch matching** connected to **PostgreSQL (TypeORM)** and **RabbitMQ**.

---

## 🚀 Key Features

- **RESTful HTTP API**: Endpoints for rider registration, manual nearest-rider search, location updates, and availability toggles.
- **PostgreSQL Persistence**: TypeORM ORM with Spatial Haversine Distance calculations.
- **RabbitMQ Automatic Dispatch (Hybrid Microservice)**:
  - **Consumes `order_placed`**: Event pattern listener receiving new order placement events.
  - **Automated Dispatch Matching**: Calculates the nearest available rider to order pickup coordinates.
  - **Emits `order_assigned`**: Marks matched rider as unavailable in PostgreSQL and emits assignment event to Order Service.
- **CORS Enabled**: Configured for cross-origin communication with `ridetrack-frontend`.

---

## 🛠 Project Structure

```text
rider-dispatch-service/
├── src/
│   ├── riders/
│   │   ├── dto/
│   │   │   ├── register-rider.dto.ts      # DTO validating rider registration
│   │   │   ├── update-location.dto.ts     # DTO validating GPS coordinate update
│   │   │   ├── update-availability.dto.ts # DTO validating availability toggle
│   │   │   └── get-nearest-rider.dto.ts   # DTO validating nearest query params
│   │   ├── entities/
│   │   │   └── rider.entity.ts            # TypeORM Entity schema
│   │   ├── riders.controller.ts           # REST Endpoints + @EventPattern("order_placed")
│   │   ├── riders.service.ts              # Haversine calculation & rider management
│   │   └── riders.module.ts               # Feature Module with RMQ ClientProxy registration
│   ├── app.module.ts                      # Root Module with TypeORM & Config
│   └── main.ts                            # Hybrid Bootstrap (HTTP + RabbitMQ)
├── .env.example                           # Environment configuration template
├── Dockerfile                             # Multi-stage Docker build
└── README.md                              # Documentation
```

---

## ⚙️ Environment Variables

Create a `.env` file at project root (see `.env.example`):

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rider_db
RABBITMQ_URL=amqp://localhost:5672
```

---

## 🐰 RabbitMQ Automatic Dispatch Workflow

The application runs as a **hybrid NestJS microservice**, listening for `order_placed` events and performing real-time dispatch matching.

```text
[Order Service] ──( order_placed event )──► [RabbitMQ] ──► [Rider Dispatch Service]
                                                                  │
                                                        Finds Nearest Rider
                                                        Marks isAvailable = false
                                                                  │
[Order Service] ◄──( order_assigned event )── [RabbitMQ] ◄────────┘
```

### 1. Event Consumed: `order_placed`
Listens on queue `order_placed` via `@EventPattern('order_placed')`:

- **Payload Shape**:
  ```json
  {
    "orderId": "65b2f8a9c20e1a0012a9e4f1",
    "pickupLat": 37.7749,
    "pickupLng": -122.4194,
    "dropLat": 37.7833,
    "dropLng": -122.4167
  }
  ```

---

### 2. Automatic Matching Logic
- Calculates Haversine distance between `(pickupLat, pickupLng)` and all riders where `isAvailable = true`.
- Selects nearest rider and updates database: `isAvailable = false`.

---

### 3. Event Emitted: `order_assigned`
Emits event to queue `order_assigned` so Order Service can update the order status to `"assigned"`:

- **Queue Name**: `order_assigned`
- **Payload Shape**:
  ```json
  {
    "orderId": "65b2f8a9c20e1a0012a9e4f1",
    "riderId": "c9a0b123-4567-89ab-cdef-0123456789ab"
  }
  ```

---

## ⚡ How to Run Locally

### 1. Prerequisites
- **Node.js**: v18 or higher
- **PostgreSQL**: Running instance on port `5432`
- **RabbitMQ**: Running instance on port `5672`

#### Start PostgreSQL & RabbitMQ via Docker (Quick Start)
```bash
docker run -d --name postgres-local -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=rider_db -p 5432:5432 postgres:alpine
docker run -d --name rabbitmq-local -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run in Development Mode
```bash
npm run start:dev
```

---

## 🔗 HTTP REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/riders` | Register a new rider in PostgreSQL |
| `GET` | `/riders/nearest` | Find single nearest available rider (`?lat=X&lng=Y`) |
| `GET` | `/riders` | List all riders (optional `?available=true`) |
| `GET` | `/riders/:id` | Fetch single rider details by ID |
| `PATCH` | `/riders/:id/location` | Update rider current lat & lng |
| `PATCH` | `/riders/:id/availability` | Toggle rider availability (`isAvailable: true/false`) |
