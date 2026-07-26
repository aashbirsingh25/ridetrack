import math
import random
import os
import pandas as pd

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the straight-line distance in kilometers between two points using Haversine formula."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def generate_dataset(num_rows: int = 2000) -> pd.DataFrame:
    random.seed(42)
    rows = []
    
    # Bounding box around sample region (e.g., Delhi) for realistic coordinates
    base_lat, base_lng = 28.6139, 77.2090
    
    for _ in range(num_rows):
        lat1 = base_lat + random.uniform(-0.1, 0.1)
        lng1 = base_lng + random.uniform(-0.1, 0.1)
        lat2 = base_lat + random.uniform(-0.1, 0.1)
        lng2 = base_lng + random.uniform(-0.1, 0.1)
        
        distance_km = haversine(lat1, lng1, lat2, lng2)
        distance_km = max(0.5, min(20.0, distance_km))
        
        hour_of_day = random.randint(0, 23)
        is_weekend = random.choice([0, 1])
        traffic_factor = random.uniform(0.8, 2.5)
        
        # Rush hour adjustment (8-10 AM, 6-8 PM)
        if hour_of_day in [8, 9, 10, 18, 19, 20]:
            traffic_factor *= 1.3
            
        # Weekend adjustment
        if is_weekend == 1:
            traffic_factor *= 0.9
            
        # Target formula: (distance_km / 25) * 60 * traffic_factor + noise
        noise = random.gauss(0, 1.5)
        duration_minutes = (distance_km / 25.0) * 60.0 * traffic_factor + noise
        duration_minutes = max(1.0, round(duration_minutes, 2))
        
        rows.append({
            'distance_km': round(distance_km, 3),
            'hour_of_day': hour_of_day,
            'is_weekend': is_weekend,
            'traffic_factor': round(traffic_factor, 3),
            'duration_minutes': duration_minutes
        })
        
    return pd.DataFrame(rows)

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, 'training_data.csv')
    df = generate_dataset(2000)
    df.to_csv(output_path, index=False)
    print(f"[SUCCESS] Training data successfully generated and saved to {output_path} ({len(df)} rows)")
