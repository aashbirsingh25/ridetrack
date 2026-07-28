# RideTrack Microservices Deployment Guide

This guide details step-by-step instructions for deploying the RideTrack microservices platform to production using free-tier cloud hosting:
- **Backend Microservices (4 services)**: Deployed to [Render](https://render.com) as Docker Web Services.
- **Frontend App (1 service)**: Deployed to [Vercel](https://vercel.com) as a native Next.js application.

---

## Architecture Overview

```
                          ┌───────────────────────────┐
                          │   Vercel Next.js App      │
                          │   (ridetrack-frontend)    │
                          └─────────────┬─────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           │                            │                            │
           ▼                            ▼                            ▼
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│ delivery-order-srv   │    │ rider-dispatch-srv   │    │ live-tracking-srv    │
│ (Render Web Service) │    │ (Render Web Service) │    │ (Render Web Service) │
└──────────┬───────────┘    └──────────┬───────────┘    └──────────┬───────────┘
           │                           │                           │
           ▼                           ▼                           ▼
    MongoDB Atlas              Supabase Postgres             Upstash Redis
           │                           │
           └──────────────┬────────────┘
                          ▼
                  CloudAMQP RabbitMQ
                          ▲
                          │
            ┌─────────────┴────────────┐
            │   eta-prediction-srv     │
            │  (Render Web Service)    │
            └──────────────────────────┘
```

---

## ⚠️ Crucial Deployment Rule: Order of Operations

> [!IMPORTANT]
> **Deploy All 4 Backend Services on Render BEFORE Deploying the Frontend on Vercel.**
>
> Next.js bakes environment variables starting with `NEXT_PUBLIC_` into client-side static JavaScript bundles **at build time** (when `npm run build` runs on Vercel). You must have the active HTTPS URLs for all four Render services before setting up the Vercel project environment variables.

---

## Step 1: Deploy Backend Microservices to Render

Render will automatically detect the `Dockerfile` inside each service folder when configured as a Docker-based Web Service.

### General Render Setup Instructions
For each service:
1. Go to the [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your Git repository.
3. Set **Language** to `Docker`.
4. Set **Instance Type** to `Free`.
5. Set **Root Directory** to the specific service directory (e.g. `delivery-order-service`).
6. Configure the Environment Variables listed below.

---

### Service 1: `delivery-order-service`

- **Root Directory**: `delivery-order-service`
- **Environment**: Docker
- **Instance Type**: Free
- **Environment Variables**:
  | Variable Name | Description | Example / Required Format |
  | --- | --- | --- |
  | `PORT` | Service Port *(Optional, Render defaults dynamically)* | `3000` |
  | `MONGODB_URI` | Connection URI for MongoDB Atlas | `mongodb+srv://<user>:<password>@cluster.mongodb.net/delivery_db` |
  | `RABBITMQ_URL` | AMQP URL for CloudAMQP | `amqps://<user>:<password>@cloudamqp.com/vhost` |

- **Deployed URL Format**: `https://delivery-order-service.onrender.com`

---

### Service 2: `rider-dispatch-service`

- **Root Directory**: `rider-dispatch-service`
- **Environment**: Docker
- **Instance Type**: Free
- **Environment Variables**:
  | Variable Name | Description | Example / Required Format |
  | --- | --- | --- |
  | `PORT` | Service Port *(Optional, Render defaults dynamically)* | `3001` |
  | `DATABASE_URL` | PostgreSQL connection string (Supabase) | `postgresql://postgres:<password>@db.supabase.co:5432/postgres` |
  | `RABBITMQ_URL` | AMQP URL for CloudAMQP | `amqps://<user>:<password>@cloudamqp.com/vhost` |

- **Deployed URL Format**: `https://rider-dispatch-service.onrender.com`

---

### Service 3: `live-tracking-service`

- **Root Directory**: `live-tracking-service`
- **Environment**: Docker
- **Instance Type**: Free
- **Environment Variables**:
  | Variable Name | Description | Example / Required Format |
  | --- | --- | --- |
  | `PORT` | Service Port *(Optional, Render defaults dynamically)* | `3002` |
  | `REDIS_URL` | Redis Connection URI (Upstash Redis) | `rediss://default:<password>@upstash.io:6379` |

- **Deployed URL Format**: `https://live-tracking-service.onrender.com`

---

### Service 4: `eta-prediction-service`

- **Root Directory**: `eta-prediction-service`
- **Environment**: Docker
- **Instance Type**: Free
- **Environment Variables**:
  | Variable Name | Description | Example / Required Format |
  | --- | --- | --- |
  | `PORT` | Service Port *(Render dynamically injects `$PORT`)* | `3004` |

- **Deployed URL Format**: `https://eta-prediction-service.onrender.com`

---

## Step 2: Deploy Frontend Application to Vercel

Vercel natively detects Next.js applications and handles optimization, serverless functions, and static assets out of the box without requiring a Docker container.

### Vercel Setup Instructions
1. Go to the [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
2. Import your Git repository.
3. Set **Framework Preset** to `Next.js`.
4. Set **Root Directory** to `ridetrack-frontend`.
5. Under **Environment Variables**, enter the backend URLs generated in Step 1:

| Variable Name | Value |
| --- | --- |
| `NEXT_PUBLIC_ORDER_SERVICE_URL` | `https://delivery-order-service.onrender.com` |
| `NEXT_PUBLIC_RIDER_SERVICE_URL` | `https://rider-dispatch-service.onrender.com` |
| `NEXT_PUBLIC_TRACKING_SERVICE_URL` | `https://live-tracking-service.onrender.com` |
| `NEXT_PUBLIC_ETA_SERVICE_URL` | `https://eta-prediction-service.onrender.com` |

6. Click **Deploy**.

---

## ⚡ Free-Tier Operational Notes & Limitations

> [!NOTE]
> **Render Free Tier Spin-Down / Cold Starts**
> - Render free web services automatically **spin down to sleep** after **15 minutes of inactivity**.
> - When a request hits an inactive service, Render will wake it up automatically.
> - The **cold-start wake-up takes approximately 30–50 seconds**.
> - Initial HTTP requests or WebSocket connection attempts during a cold start may timeout until the service container finishes booting. Submitting a second request or retry once the service is awake will succeed immediately.

---

## 🔐 Security & Environment Checklist

- [x] All database credentials (`MONGODB_URI`, `DATABASE_URL`, `REDIS_URL`, `RABBITMQ_URL`) are loaded from environment variables.
- [x] No secrets or `.env` files are tracked in Git.
- [x] All `.env.example` and `.env.local.example` files contain template variable names only.
- [x] CORS is configured for cross-origin frontend communication (`*` enabled).
