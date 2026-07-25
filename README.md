# Delivery Order Service (`delivery-order-service`)

A production-ready NestJS microservice built with TypeScript, MongoDB, and Mongoose for managing delivery orders. Designed with clean architecture principles (Modules, Controllers, Services, DTOs) suitable for technical interviews and scalable production deployments.

---

## 🚀 Features

- **Standard NestJS Architecture**: Modules, Controllers, Services, and Schemas.
- **MongoDB & Mongoose**: Object modeling with schema validation, timestamps, and index support via `@nestjs/mongoose`.
- **Validation & Transformation**: Strict DTO validation using `class-validator` and payload transformation with `class-transformer`.
- **Environment Configuration**: Centralized dynamic configuration using `@nestjs/config`.
- **Multi-Stage Dockerfile**: Production-ready, light-weight container build (`node:18-alpine`).
- **Clean Code & Well-Commented**: Thorough JSDoc comments explaining business logic, routing, and schema structure.

---

## 🛠️ Tech Stack

- **Framework**: NestJS (v10)
- **Language**: TypeScript
- **Database**: MongoDB (via `mongoose` & `@nestjs/mongoose`)
- **Validation**: `class-validator` & `class-transformer`
- **Config**: `@nestjs/config`

---

## 📁 Project Structure

```
delivery-order-service/
├── .env.example              # Sample environment configuration
├── .env                      # Local environment configuration
├── Dockerfile                # Multi-stage production build definition
├── README.md                 # Project documentation
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript compiler settings
└── src/
    ├── main.ts               # Application entry point with global pipes
    ├── app.module.ts         # Root module with Config and Mongoose setup
    └── orders/
        ├── controllers/
        │   └── orders.controller.ts  # REST HTTP endpoints
        ├── services/
        │   └── orders.service.ts     # Business logic & Mongoose queries
        ├── dto/
        │   ├── create-order.dto.ts         # Validation DTO for POST /orders
        │   └── update-order-status.dto.ts  # Validation DTO for PATCH /orders/:id/status
        ├── enums/
        │   └── order-status.enum.ts        # Order lifecycle state enum
        ├── schemas/
        │   └── order.schema.ts             # Mongoose schema definition
        └── orders.module.ts                # Feature module definition
```

---

## ⚙️ Getting Started Locally

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MongoDB**: Running locally on `mongodb://localhost:27017` or a remote MongoDB URI.

### 2. Installation
Clone or navigate to the repository directory and install dependencies:
```bash
cd delivery-order-service
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env` and configure your database URI and port:
```bash
cp .env.example .env
```

Default `.env` contents:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/delivery_db
```

### 4. Run the Application

#### Development Mode (with hot-reload):
```bash
npm run start:dev
```

#### Production Mode:
```bash
npm run build
npm run start:prod
```

The service will start at `http://localhost:3000`.

---

## 🐳 Docker Deployment

To build and run the microservice using Docker:

### 1. Build the Docker image
```bash
docker build -t delivery-order-service .
```

### 2. Run the Docker container
```bash
docker run -d \
  -p 3000:3000 \
  -e PORT=3000 \
  -e MONGODB_URI="mongodb://host.docker.internal:27017/delivery_db" \
  --name delivery-order-service \
  delivery-order-service
```

---

## 📑 API Endpoint Documentation

### 1. Create a New Order
- **Endpoint**: `POST /orders`
- **Description**: Creates a new order. Default status set to `"placed"` and `riderId` to `null`.
- **Request Body**:
  ```json
  {
    "customerId": "cust_12345",
    "pickupAddress": "123 Market Street, Downtown",
    "pickupLat": 37.7749,
    "pickupLng": -122.4194,
    "dropAddress": "456 Mission Street, Bay Area",
    "dropLat": 37.7833,
    "dropLng": -122.4167
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "_id": "66a30c5e7b23f810f9a21b4a",
    "customerId": "cust_12345",
    "pickupAddress": "123 Market Street, Downtown",
    "pickupLat": 37.7749,
    "pickupLng": -122.4194,
    "dropAddress": "456 Mission Street, Bay Area",
    "dropLat": 37.7833,
    "dropLng": -122.4167,
    "status": "placed",
    "riderId": null,
    "createdAt": "2026-07-26T01:45:00.000Z",
    "updatedAt": "2026-07-26T01:45:00.000Z",
    "__v": 0
  }
  ```

---

### 2. Get Order by ID
- **Endpoint**: `GET /orders/:id`
- **Description**: Retrieves single order details by MongoDB ObjectId.
- **Example**: `GET /orders/66a30c5e7b23f810f9a21b4a`
- **Response** (`200 OK`):
  ```json
  {
    "_id": "66a30c5e7b23f810f9a21b4a",
    "customerId": "cust_12345",
    "pickupAddress": "123 Market Street, Downtown",
    "pickupLat": 37.7749,
    "pickupLng": -122.4194,
    "dropAddress": "456 Mission Street, Bay Area",
    "dropLat": 37.7833,
    "dropLng": -122.4167,
    "status": "placed",
    "riderId": null,
    "createdAt": "2026-07-26T01:45:00.000Z",
    "updatedAt": "2026-07-26T01:45:00.000Z"
  }
  ```

---

### 3. List All Orders (Optional Status Filter)
- **Endpoint**: `GET /orders`
- **Query Parameter**: `?status=placed` (Optional filter: `placed`, `assigned`, `picked_up`, `delivered`)
- **Examples**:
  - `GET /orders`
  - `GET /orders?status=placed`
- **Response** (`200 OK`):
  ```json
  [
    {
      "_id": "66a30c5e7b23f810f9a21b4a",
      "customerId": "cust_12345",
      "pickupAddress": "123 Market Street, Downtown",
      "pickupLat": 37.7749,
      "pickupLng": -122.4194,
      "dropAddress": "456 Mission Street, Bay Area",
      "dropLat": 37.7833,
      "dropLng": -122.4167,
      "status": "placed",
      "riderId": null,
      "createdAt": "2026-07-26T01:45:00.000Z",
      "updatedAt": "2026-07-26T01:45:00.000Z"
    }
  ]
  ```

---

### 4. Update Order Status
- **Endpoint**: `PATCH /orders/:id/status`
- **Description**: Updates order status and optionally assigns riderId. Valid statuses: `placed`, `assigned`, `picked_up`, `delivered`.
- **Request Body**:
  ```json
  {
    "status": "assigned",
    "riderId": "rider_9988"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "_id": "66a30c5e7b23f810f9a21b4a",
    "customerId": "cust_12345",
    "pickupAddress": "123 Market Street, Downtown",
    "pickupLat": 37.7749,
    "pickupLng": -122.4194,
    "dropAddress": "456 Mission Street, Bay Area",
    "dropLat": 37.7833,
    "dropLng": -122.4167,
    "status": "assigned",
    "riderId": "rider_9988",
    "createdAt": "2026-07-26T01:45:00.000Z",
    "updatedAt": "2026-07-26T01:45:10.000Z"
  }
  ```

---

## 🧪 Error Handling

The application uses standard NestJS Exception Filters:
- `400 Bad Request`: Returned when DTO validation fails (e.g. invalid latitude/longitude range, invalid status enum, malformed ObjectId).
- `404 Not Found`: Returned when attempting to fetch or update an order ID that does not exist in MongoDB.
