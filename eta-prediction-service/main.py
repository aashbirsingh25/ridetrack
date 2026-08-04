import math
import os
from datetime import datetime
from contextlib import asynccontextmanager

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from prometheus_fastapi_instrumentator import Instrumentator

load_dotenv()

# Global model reference
model = None

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the straight-line distance in kilometers between two points using Haversine formula."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager to load model on startup."""
    global model
    model_path = os.path.join(os.path.dirname(__file__), 'model', 'eta_model.pkl')
    if os.path.exists(model_path):
        model = joblib.load(model_path)
        print(f"[INFO] Loaded ETA prediction model from {model_path}")
    else:
        print(f"[WARNING] Model file not found at {model_path}. Run model/train_model.py first.")
    yield

app = FastAPI(
    title="ETA Prediction Service",
    description="Microservice providing estimated delivery duration predictions using ML regression.",
    version="1.0.0",
    lifespan=lifespan
)

# Instrument FastAPI with Prometheus metrics at /metrics
Instrumentator().instrument(app).expose(app)

# Enable CORS for frontend and cross-service access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictETARequest(BaseModel):
    pickupLat: float = Field(..., description="Latitude of pickup location")
    pickupLng: float = Field(..., description="Longitude of pickup location")
    dropLat: float = Field(..., description="Latitude of drop location")
    dropLng: float = Field(..., description="Longitude of drop location")

class PredictETAResponse(BaseModel):
    distance_km: float
    estimated_duration_minutes: float
    confidence_note: str

@app.get("/health")
def health_check():
    """Health check endpoint confirming service status and model loading status."""
    return {
        "status": "ok",
        "model_loaded": model is not None
    }

@app.post("/predict-eta", response_model=PredictETAResponse)
def predict_eta(payload: PredictETARequest):
    """Predict delivery duration in minutes based on pickup/drop coordinates."""
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="ETA model is not loaded. Please ensure model/eta_model.pkl exists."
        )
        
    distance_km = haversine(
        payload.pickupLat,
        payload.pickupLng,
        payload.dropLat,
        payload.dropLng
    )
    
    now = datetime.now()
    hour_of_day = now.hour
    is_weekend = 1 if now.weekday() >= 5 else 0
    default_traffic_factor = 1.2
    
    input_features = pd.DataFrame([{
        'distance_km': distance_km,
        'hour_of_day': hour_of_day,
        'is_weekend': is_weekend,
        'traffic_factor': default_traffic_factor
    }])
    
    prediction = model.predict(input_features)[0]
    estimated_duration = max(1.0, round(float(prediction), 2))
    
    return PredictETAResponse(
        distance_km=round(distance_km, 2),
        estimated_duration_minutes=estimated_duration,
        confidence_note="estimate based on distance and time-of-day patterns"
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3004))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
