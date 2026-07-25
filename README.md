# Rider Dispatch Service (`rider-dispatch-service`)

A production-ready NestJS microservice built with TypeScript, PostgreSQL, and TypeORM for managing rider registration, real-time location updates, availability toggling, and dispatching nearest available riders using the **Haversine formula**.

---

## 🚀 Features

- **NestJS Clean Architecture**: Modules, Controllers, Services, DTOs, and TypeORM Entities.
- **PostgreSQL & TypeORM**: Relational modeling with UUID primary keys, float geolocation columns, and automatic timestamps.
- **Haversine Distance Dispatch**: In-service spatial algorithm calculating great-circle distance (in km) to find the single nearest available rider without needing external GIS extensions.
- **Validation & Transformation**: Strict DTO validation via `class-validator` and automatic query/body payload transformation using `class-transformer`.
- **Environment Configuration**: Loaded dynamically using `@nestjs/config`.
- **Multi-Stage Dockerfile**: Production-ready, light-weight container build (`node:18-alpine`).

---

## 🛠️ Tech Stack

- **Framework**: NestJS (v10)
- **Language**: TypeScript
- **Database**: PostgreSQL (via `pg` & `@nestjs/typeorm`)
- **Validation**: `class-validator` & `class-transformer`
- **Config**: `@nestjs/config`

---

## 📁 Project Structure

```
rider-dispatch-service/
├── .env.example              # Sample environment configuration
├── .env                      # Local environment configuration
├── Dockerfile                # Multi-stage production build definition
├── README.md                 # Project documentation
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript compiler settings
└── src/
    ├── main.ts               # Application entry point with global validation pipe
    ├── app.module.ts         # Root module with Config and TypeORM setup
    └── riders/
        ├── controllers/
        │   └── riders.controller.ts  # REST HTTP endpoints
        ├── services/
        │   └── riders.service.ts     # Business logic & Haversine formula calculation
        ├── dto/
        │   ├── register-rider.dto.ts       # Validation DTO for POST /riders
        │   ├── update-location.dto.ts      # Validation DTO for PATCH /riders/:id/location
        │   ├── update-availability.dto.ts  # Validation DTO for PATCH /riders/:id/availability
        │   └── get-nearest-rider.dto.ts    # Validation DTO for GET /riders/nearest
        ├── entities/
        │   └── rider.entity.ts             # TypeORM PostgreSQL entity definition
        └── riders.module.ts                # Feature module definition
```

---

## ⚙️ Getting Started Locally

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **PostgreSQL**: Running locally on port `5432` with database `rider_db`.

### 2. Installation
```bash
cd rider-dispatch-service
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default `.env` contents:
```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rider_db
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

The service will start at `http://localhost:3001`.

---

## 🐳 Docker Deployment

To build and run using Docker:

### 1. Build Docker image
```bash
docker build -t rider-dispatch-service .
```

### 2. Run Docker container
```bash
docker run -d \
  -p 3001:3001 \
  -e PORT=3001 \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/rider_db" \
  --name rider-dispatch-service \
  rider-dispatch-service
```

---

## 📐 Haversine Formula Implementation

The service method `findNearestAvailableRider(lat, lng)` computes the distance in kilometers between target coordinates $(lat_1, lon_1)$ and each available rider $(lat_2, lon_2)$ using the Haversine formula:

$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1) \cdot \cos(\phi_2) \cdot \sin^2\left(\frac{\Delta \lambda}{2}\right)$$
$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
$$d = R \cdot c$$

where $R = 6371\text{ km}$ (Earth's radius), $\phi$ is latitude, and $\lambda$ is longitude in radians.

---

## 📑 API Endpoint Documentation

### 1. Register a New Rider
- **Endpoint**: `POST /riders`
- **Description**: Registers a new rider. Initial `isAvailable` is set to `true`.
- **Request Body**:
  ```json
  {
    "name": "Alex Johnson",
    "phone": "+1234567890",
    "currentLat": 37.7749,
    "currentLng": -122.4194
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "id": "e4a21b36-9f12-4c28-8d01-6b71f92e4012",
    "name": "Alex Johnson",
    "phone": "+1234567890",
    "currentLat": 37.7749,
    "currentLng": -122.4194,
    "isAvailable": true,
    "createdAt": "2026-07-26T03:00:00.000Z",
    "lastUpdatedAt": "2026-07-26T03:00:00.000Z"
  }
  ```

---

### 2. Update Rider Location
- **Endpoint**: `PATCH /riders/:id/location`
- **Description**: Updates rider's live coordinates.
- **Request Body**:
  ```json
  {
    "currentLat": 37.7790,
    "currentLng": -122.4180
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "id": "e4a21b36-9f12-4c28-8d01-6b71f92e4012",
    "name": "Alex Johnson",
    "phone": "+1234567890",
    "currentLat": 37.7790,
    "currentLng": -122.4180,
    "isAvailable": true,
    "createdAt": "2026-07-26T03:00:00.000Z",
    "lastUpdatedAt": "2026-07-26T03:05:00.000Z"
  }
  ```

---

### 3. Toggle Rider Availability
- **Endpoint**: `PATCH /riders/:id/availability`
- **Description**: Changes rider availability status (`true` or `false`).
- **Request Body**:
  ```json
  {
    "isAvailable": false
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "id": "e4a21b36-9f12-4c28-8d01-6b71f92e4012",
    "name": "Alex Johnson",
    "phone": "+1234567890",
    "currentLat": 37.7790,
    "currentLng": -122.4180,
    "isAvailable": false,
    "createdAt": "2026-07-26T03:00:00.000Z",
    "lastUpdatedAt": "2026-07-26T03:06:00.000Z"
  }
  ```

---

### 4. List All Riders
- **Endpoint**: `GET /riders`
- **Query Parameter**: `?available=true` or `?available=false` (Optional filter)
- **Examples**:
  - `GET /riders`
  - `GET /riders?available=true`
- **Response** (`200 OK`):
  ```json
  [
    {
      "id": "e4a21b36-9f12-4c28-8d01-6b71f92e4012",
      "name": "Alex Johnson",
      "phone": "+1234567890",
      "currentLat": 37.7790,
      "currentLng": -122.4180,
      "isAvailable": true,
      "createdAt": "2026-07-26T03:00:00.000Z",
      "lastUpdatedAt": "2026-07-26T03:06:00.000Z"
    }
  ]
  ```

---

### 5. Find Nearest Available Rider
- **Endpoint**: `GET /riders/nearest?lat=X&lng=Y`
- **Description**: Calculates spatial Haversine distance to all riders where `isAvailable = true` and returns the single closest rider with calculated distance.
- **Example**: `GET /riders/nearest?lat=37.7749&lng=-122.4194`
- **Response** (`200 OK`):
  ```json
  {
    "rider": {
      "id": "e4a21b36-9f12-4c28-8d01-6b71f92e4012",
      "name": "Alex Johnson",
      "phone": "+1234567890",
      "currentLat": 37.7790,
      "currentLng": -122.4180,
      "isAvailable": true,
      "createdAt": "2026-07-26T03:00:00.000Z",
      "lastUpdatedAt": "2026-07-26T03:06:00.000Z"
    },
    "distanceKm": 0.47
  }
  ```
