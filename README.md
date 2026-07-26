# RideTrack Frontend (`ridetrack-frontend`)

A modern Next.js 14 (App Router) web application built with **TypeScript**, **Tailwind CSS**, **Leaflet Maps (`react-leaflet`)**, and **Socket.io** for real-time order placement, live rider tracking, and rider dispatch management.

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

## 🗺 Application Flows

### 👤 1. Customer Order Flow

#### Place an Order (`/`)
- User inputs customer ID, pickup address & coordinates (latitude/longitude), drop address & coordinates.
- Submits form which sends a `POST` request to `http://localhost:3000/orders`.
- Upon successful creation, redirects automatically to `/track/[orderId]`.

#### Live Order Tracking (`/track/[orderId]`)
- Fetches order details once on mount via `GET http://localhost:3000/orders/[orderId]`.
- Displays status badge (`placed` = gray, `assigned` = blue, `picked_up` = amber, `delivered` = green).
- Renders interactive Leaflet map featuring:
  - **Pickup Marker (A)**: Green pin at pickup coordinates.
  - **Drop Marker (B)**: Red pin at drop destination coordinates.
  - **Rider Marker 🛵**: Blue animated pin (hidden until first location event arrives).
- Establishes a Socket.io WebSocket connection to `http://localhost:3002`, emits `track:join` with `{ orderId }`, and listens for `location:current` and `location:update` events.
- Dynamically updates the rider pin and calculates live distance line (`"Rider is X.XX km away"`).

---

### 🛵 2. Rider Dispatch Flow

#### Rider Registration (`/rider`)
- Enter rider name, phone, and initial location coordinates.
- Submits `POST http://localhost:3001/riders` to register the rider in PostgreSQL.
- Saves returned `riderId` in `localStorage` for seamless persistence.
- Automatically skips registration and redirects to `/rider/dashboard` if `riderId` exists in `localStorage`.

#### Rider Dashboard (`/rider/dashboard`)
- **Toggle Availability**: Switches rider status between `ONLINE` and `OFFLINE` via `PATCH http://localhost:3001/riders/:id/availability`.
- **Order Lookup**: Enter an `orderId` to fetch active delivery details (`GET http://localhost:3000/orders/:id`).
- **Start Location Broadcast**: Starts a 3-second interval streaming live GPS location coordinates via Socket.io (`location:update` to `http://localhost:3002`). Uses browser `navigator.geolocation` with fallback coordinate jitter for indoor demo testing.
- **Update Order Status**: Action buttons for:
  - **Mark Picked Up**: Calls `PATCH http://localhost:3000/orders/:id/status` with `{ status: "picked_up", riderId }`.
  - **Mark Delivered**: Calls `PATCH http://localhost:3000/orders/:id/status` with `{ status: "delivered", riderId }`.
