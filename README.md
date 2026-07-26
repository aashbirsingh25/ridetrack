# RideTrack Frontend (`ridetrack-frontend`)

A modern Next.js 14 (App Router) web application built with **TypeScript**, **Tailwind CSS**, **Leaflet Maps (`react-leaflet`)**, and **Socket.io** for real-time order placement and live rider location tracking.

---

## 📌 Prerequisites & Microservices Topology

> [!IMPORTANT]
> To experience full end-to-end live tracking, all **three backend microservices** and their respective database instances must be running first:

1. **Order Service** (`delivery-order-service`):
   - Runs on `http://localhost:3000`
   - Database: MongoDB
2. **Rider Service** (`rider-dispatch-service`):
   - Runs on `http://localhost:3001`
   - Database: PostgreSQL
3. **Live Tracking Service** (`live-tracking-service`):
   - Runs on `http://localhost:3002`
   - Database: Redis

---

## ⚙️ Environment Configuration

Create a `.env.local` file at the root of `ridetrack-frontend` (refer to `.env.local.example`):

```env
NEXT_PUBLIC_ORDER_SERVICE_URL=http://localhost:3000
NEXT_PUBLIC_RIDER_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_TRACKING_SERVICE_URL=http://localhost:3002
```

---

## 🚀 How to Run Locally

### 1. Install Dependencies
```bash
cd ridetrack-frontend
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or Next.js assigned port e.g. `http://localhost:3003` if port 3000 is occupied by `delivery-order-service`).

---

## 🗺 Application Workflow

### 1. Place an Order (`/`)
- User inputs customer ID, pickup address & coordinates (latitude/longitude), drop address & coordinates.
- Submits form which sends a `POST` request to `http://localhost:3000/orders`.
- Upon successful creation, redirects automatically to `/track/[orderId]`.

### 2. Live Order Tracking (`/track/[orderId]`)
- Fetches order details once on mount via `GET http://localhost:3000/orders/[orderId]`.
- Displays status badge (`placed` = gray, `assigned` = blue, `picked_up` = amber, `delivered` = green).
- Renders interactive Leaflet map featuring:
  - **Pickup Marker (A)**: Green pin at pickup coordinates.
  - **Drop Marker (B)**: Red pin at drop destination coordinates.
  - **Rider Marker 🛵**: Blue animated pin (hidden until first location event arrives).
- Establishes a Socket.io WebSocket connection to `http://localhost:3002`, emits `track:join` with `{ orderId }`, and listens for `location:current` and `location:update` events.
- Dynamically updates the rider pin and calculates live distance line (`"Rider is X.XX km away"`).
