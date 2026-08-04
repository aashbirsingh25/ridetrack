# ☸️ RideTrack Kubernetes & Helm Deployment Guide

This guide details how to deploy the **RideTrack** microservices platform on a local **Kubernetes (Minikube)** cluster using **Helm**, along with architectural breakdowns and interview preparation notes.

---

## 🏗️ 1. Architecture Overview & Helm Chart Layout

```text
helm/ridetrack/
├── Chart.yaml                          # Chart metadata, API version, app version
├── values.yaml                         # Centralized values (replica counts, ports, resources, secrets)
├── .helmignore                         # Packaging exclusion rules
└── templates/
    ├── _helpers.tpl                    # Go template helper functions (common labels/selectors)
    ├── configmap.yaml                  # Non-sensitive environment variables
    ├── secret.yaml                     # Encrypted database URIs, RabbitMQ & Redis keys
    ├── delivery-order-service-deployment.yaml
    ├── delivery-order-service-service.yaml
    ├── rider-dispatch-service-deployment.yaml
    ├── rider-dispatch-service-service.yaml
    ├── live-tracking-service-deployment.yaml
    ├── live-tracking-service-service.yaml
    ├── eta-prediction-service-deployment.yaml
    ├── eta-prediction-service-service.yaml
    ├── ridetrack-frontend-deployment.yaml
    └── ridetrack-frontend-service.yaml
```

---

## 🎓 2. Key Educational Concepts for Resume & Interviews

### A. Deployment vs. StatefulSet
- **Deployment**: Designed for **stateless microservices** (NestJS APIs, Next.js frontend, Python FastAPI). Pods carry no local state and can be destroyed, recreated, or scaled dynamically across cluster nodes (`kubectl scale deployment ridetrack-frontend --replicas=3`).
- **StatefulSet**: Designed for **stateful databases/brokers** (PostgreSQL, Redis, RabbitMQ, MongoDB). Guarantees:
  - Stable, ordinal network identities (`postgres-0`, `postgres-1`).
  - Persistent volume binding per pod instance (`volumeClaimTemplates`).
  - Ordered deployment and automated rolling updates.

### B. Kubernetes Service Types
- **`ClusterIP`** *(Used for all 4 backend microservices)*: Exposes the service on a cluster-internal IP. Accessible **only within the K8s cluster**.
- **`NodePort`** *(Used for `ridetrack-frontend`)*: Exposes the service on a static port (`30003`) across every node's IP, allowing external browser access via `http://<minikube-ip>:30003`.
- **`LoadBalancer`**: Integrates with cloud provider load balancers (AWS ELB / GCP ALB). On Minikube, requires `minikube tunnel`.
- **`Headless Service` (`clusterIP: None`)**: Used by StatefulSets for direct pod-to-pod DNS resolution without VIP load balancing.

### C. Liveness vs. Readiness Probes
- **`readinessProbe`**: Determines if a container is ready to accept user traffic. If it fails, Kubernetes removes the pod IP from the Service endpoints list (stopping traffic without killing the pod).
- **`livenessProbe`**: Checks if the container process is alive and responsive. If it fails, Kubernetes kills the container and restarts it according to its restart policy.

### D. ConfigMaps vs. Secrets
- **ConfigMap**: Stores non-sensitive application settings (ports, service names, public URLs).
- **Secret**: Stores sensitive credentials (base64/opaque encoded database connection strings, API tokens, password strings).

---

## 🛢️ 3. Datastore Deployment Strategies & Trade-offs

| Strategy | Architecture | Resource Overhead | Setup Complexity | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Hybrid Cloud (Default)** | Pods in Minikube connect to MongoDB Atlas, Supabase PG, CloudAMQP, Upstash Redis via `Secret` | 0 MB RAM / 0 CPU | Low | **Recommended for local testing** |
| **Bitnami Helm Sub-Charts** | Adds `postgresql`, `redis`, `rabbitmq` sub-charts inside `Chart.yaml` | ~2–4 GB RAM | Medium | Ideal for fully offline local clusters |
| **Custom StatefulSets** | Manual `StatefulSet` + `PersistentVolumeClaim` manifests | ~2–4 GB RAM | High | Educational for deep K8s manifest practice |

---

## 🚀 4. Step-by-Step Minikube & Helm Deployment

### Prerequisites Installation (Windows PowerShell / Command Prompt)

If Helm or Minikube are not yet installed:
```powershell
winget install Kubernetes.minikube
winget install Helm.Helm
```

### Step 1: Start Minikube Cluster
```bash
minikube start --memory=4096 --cpus=2 --driver=docker
```

### Step 2: Build & Load Docker Images into Minikube

Minikube runs inside its own isolated Docker daemon. Load local Docker images directly into Minikube:

```bash
# Build local docker images (if not built already)
docker compose build

# Load images directly into Minikube
minikube image load delivery-order-service:latest
minikube image load rider-dispatch-service:latest
minikube image load live-tracking-service:latest
minikube image load eta-prediction-service:latest
minikube image load ridetrack-frontend:latest
```

### Step 3: Lint & Install the Helm Chart

```bash
# Validate chart syntax
helm lint helm/ridetrack

# Preview generated Kubernetes manifests
helm template ridetrack helm/ridetrack

# Deploy to Minikube
helm install ridetrack ./helm/ridetrack
```

### Step 4: Verify Deployment Status
```bash
# Watch pod initialization
kubectl get pods -w

# Check services and NodePorts
kubectl get svc
```

### Step 5: Access Frontend Application
```bash
# Option A: Open directly via Minikube helper
minikube service ridetrack-frontend

# Option B: Manual browser access
# Navigate to http://<minikube-ip>:30003 (run `minikube ip` to get cluster IP)
```

---

## 🛠️ 5. Useful Debugging Commands

```bash
# Check pod logs
kubectl logs -l app.kubernetes.io/component=delivery-order-service --tail=50 -f

# Inspect pod failures or events
kubectl describe pod -l app.kubernetes.io/component=rider-dispatch-service

# Rollback a Helm release if an update fails
helm rollback ridetrack 1

# Uninstall the Helm release
helm uninstall ridetrack
```
