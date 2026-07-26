# Delivery Order Microservice (`delivery-order-service`)

A NestJS microservice managing delivery order lifecycles connected to **MongoDB** and **RabbitMQ**.

---

## 🚀 Key Features

- **RESTful HTTP API**: Endpoints for creating, fetching, and updating delivery order statuses.
- **MongoDB Persistence**: Mongoose ODM with schema validation for delivery orders.
- **RabbitMQ Event Messaging (Hybrid Microservice)**:
  - **Emits `order_placed`**: Fire-and-forget event sent via ClientProxy when an order is created.
  - **Consumes `order_assigned`**: Event pattern listener automatically assigning a rider and updating status to `"assigned"`.
- **Global Validation & DTO Transformation**: `class-validator` and `class-transformer` integration.
- **CORS Enabled**: Configured for cross-origin communication with `ridetrack-frontend`.

---

## 🛠 Project Structure

```text
delivery-order-service/
├── src/
│   ├── orders/
│   │   ├── dto/
│   │   │   ├── create-order.dto.ts        # DTO validating order placement payload
│   │   │   └── update-order-status.dto.ts # DTO validating status/rider update
│   │   ├── enums/
│   │   │   └── order-status.enum.ts       # Status Enum ("placed", "assigned", "picked_up", "delivered")
│   │   ├── schemas/
│   │   │   └── order.schema.ts            # Mongoose Order Document Schema
│   │   ├── orders.controller.ts           # REST Endpoints + @EventPattern("order_assigned")
│   │   ├── orders.service.ts              # Business logic & RabbitMQ event emission
│   │   └── orders.module.ts               # Feature Module with RMQ ClientProxy registration
│   ├── app.module.ts                      # Root Module with Mongoose & Config
│   └── main.ts                            # Hybrid Bootstrap (HTTP + RabbitMQ)
├── .env.example                           # Environment configuration template
├── Dockerfile                             # Multi-stage Docker build
└── README.md                              # Documentation
```

---

## ⚙️ Environment Variables

Create a `.env` file at project root (see `.env.example`):

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/delivery_db
RABBITMQ_URL=amqp://localhost:5672
```

---

## 🐰 RabbitMQ Event Messaging Architecture

The application runs as a **hybrid NestJS microservice**, serving HTTP REST requests while simultaneously listening for RabbitMQ messages.

### 1. Event Emitted: `order_placed`
When a new order is created via `POST /orders`, `OrdersService` emits an `order_placed` event over RabbitMQ:

- **Queue Name**: `order_placed`
- **Pattern**: `order_placed`
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

### 2. Event Consumed: `order_assigned`
The microservice listens on queue `order_assigned` via `@EventPattern('order_assigned')`:

- **Queue Name**: `order_assigned`
- **Pattern**: `order_assigned`
- **Payload Shape**:
  ```json
  {
    "orderId": "65b2f8a9c20e1a0012a9e4f1",
    "riderId": "c9a0b123-4567-89ab-cdef-0123456789ab"
  }
  ```
- **Service Action**: Updates the target order's status to `"assigned"` and sets `riderId` in MongoDB.

---

## ⚡ How to Run Locally

### 1. Prerequisites
- **Node.js**: v18 or higher
- **MongoDB**: Running instance on port `27017`
- **RabbitMQ**: Running instance on port `5672`

#### Start MongoDB & RabbitMQ via Docker (Quick Start)
```bash
docker run -d --name mongodb-local -p 27017:27017 mongo:latest
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
| `POST` | `/orders` | Create a new delivery order & emit `order_placed` event |
| `GET` | `/orders` | List all orders (filter with `?status=placed`) |
| `GET` | `/orders/:id` | Fetch order details by ID |
| `PATCH` | `/orders/:id/status` | Manually update order status & riderId |
