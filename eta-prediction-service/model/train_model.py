import os
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

def train():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'training_data.csv')
    model_path = os.path.join(script_dir, 'eta_model.pkl')
    
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Training data file not found at {csv_path}. Please run generate_training_data.py first.")
        
    df = pd.read_csv(csv_path)
    
    feature_cols = ['distance_km', 'hour_of_day', 'is_weekend', 'traffic_factor']
    target_col = 'duration_minutes'
    
    X = df[feature_cols]
    y = df[target_col]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    predictions = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    
    print(f"Model Evaluation Metrics:")
    print(f"   - Mean Absolute Error (MAE): {mae:.4f} minutes")
    print(f"   - R^2 Score: {r2:.4f}")
    
    joblib.dump(model, model_path)
    print(f"[SUCCESS] Model successfully trained and saved to {model_path}")
    
    return mae, r2

if __name__ == '__main__':
    train()
