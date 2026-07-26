# ETA Prediction Service ⏱️🤖

A standalone Python FastAPI microservice that predicts delivery trip durations (Estimated Time of Arrival) based on trip distance, time of day, day of week, and traffic congestion patterns using a Random Forest Regression model (`scikit-learn`).

> **Note**: This service is a lightweight, clearly-scoped AI/ML component designed for demonstration within a microservices ecosystem. It uses synthetic training data and a simple regression model rather than a production-grade live routing/traffic prediction engine.

---

## 📁 Project Structure

```text
eta-prediction-service/
├── .env                  # Environment configuration (PORT=3004)
├── .env.example          # Sample environment variables
├── Dockerfile            # Python 3.11-slim container definition
├── README.md             # Documentation and accuracy metrics
├── main.py               # FastAPI application with /predict-eta & /health endpoints
├── requirements.txt      # Python dependencies
└── model/
    ├── generate_training_data.py  # Synthesizes 2,000 delivery trip records
    ├── train_model.py             # Trains RandomForestRegressor & outputs metrics
    ├── training_data.csv          # Generated CSV dataset
    └── eta_model.pkl              # Serialized trained model
```

---

## 📊 Model Performance & Accuracy

The model was evaluated on an 80/20 train/test split of the synthetic dataset (400 test samples):

- **Mean Absolute Error (MAE)**: `1.5231` minutes
- **R² Score**: `0.9938`

---

## 🚀 Setup & Execution Instructions

### 1. Install Dependencies

Ensure Python 3.10+ is installed, then install required packages:

```bash
pip install -r requirements.txt
```

### 2. Generate Synthetic Training Data

Generate ~2,000 synthetic trip records simulating distances, rush hours, weekend patterns, and traffic factors:

```bash
python model/generate_training_data.py
```

This generates `model/training_data.csv`.

### 3. Train the Model

Train the `RandomForestRegressor` and save the serialized model (`eta_model.pkl`):

```bash
python model/train_model.py
```

### 4. Run the FastAPI Microservice

Start the service locally on port `3004`:

```bash
python main.py
```

Or using `uvicorn` directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 3004 --reload
```

---

## 🌐 API Endpoints

### 1. `GET /health`
Returns service status and whether the ML model is successfully loaded in memory.

**Response**:
```json
{
  "status": "ok",
  "model_loaded": true
}
```

### 2. `POST /predict-eta`
Predicts estimated duration in minutes between pickup and drop coordinates.

**Request Body**:
```json
{
  "pickupLat": 28.6139,
  "pickupLng": 77.2090,
  "dropLat": 28.7041,
  "dropLng": 77.1025
}
```

**Response**:
```json
{
  "distance_km": 14.37,
  "estimated_duration_minutes": 41.38,
  "confidence_note": "estimate based on distance and time-of-day patterns"
}
```

---

## 🐳 Docker Deployment

Build and run using Docker:

```bash
docker build -t eta-prediction-service .
docker run -p 3004:3004 eta-prediction-service
```
