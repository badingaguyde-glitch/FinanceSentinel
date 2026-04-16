import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import json
import sys

def perform_statistical_analysis(sentiment_scores, timestamps, price_data):
    """
    Performs correlation analysis, linear regression, and trend detection.
    
    Args:
        sentiment_scores (list): List of sentiment scores.
        timestamps (list): List of timestamps.
        price_data (list): List of financial price data.
        
    Returns:
        dict: Analysis results.
    """
    # Create a DataFrame
    df = pd.DataFrame({
        'timestamp': pd.to_datetime(timestamps),
        'sentiment': sentiment_scores,
        'price': price_data
    })
    
    # Ensure data is sorted by timestamp
    df = df.sort_values('timestamp')
    
    # 1. Correlation Analysis
    correlation = df['sentiment'].corr(df['price'])
    if np.isnan(correlation):
        correlation = 0.0
    
    # 2. Linear Regression (Predict price based on sentiment)
    X = df['sentiment'].to_numpy().reshape(-1, 1)
    y = df['price'].to_numpy()
    
    model = LinearRegression()
    model.fit(X, y)
    
    # Simple prediction for the next mean sentiment
    mean_sentiment = np.array([[df['sentiment'].mean()]])
    prediction = model.predict(mean_sentiment)[0]
    
    # 3. Confidence (using R-squared)
    confidence = model.score(X, y)
    if np.isnan(confidence):
        confidence = 0.0
        
    # 4. Trend Detection (Price trend)
    price_diff = df['price'].iloc[-1] - df['price'].iloc[0]
    trend = "bullish" if price_diff > 0 else "bearish" if price_diff < 0 else "neutral"
    
    return {
        "correlation": float(correlation),
        "prediction": float(prediction),
        "confidence": float(confidence),
        "trend": trend
    }

if __name__ == "__main__":
    # Example usage / wrapper for calling from Node.js
    try:
        # Expected input format: JSON via stdin
        # input_data = json.load(sys.stdin)
        
        # For demonstration purposes, if no data is piped, use dummy data
        if sys.stdin.isatty():
            # Mock data for testing
            mock_data = {
                "sentiment_scores": [0.5, 0.2, 0.8, -0.1, 0.4],
                "timestamps": ["2026-03-16T08:00:00Z", "2026-03-16T08:15:00Z", "2026-03-16T08:30:00Z", "2026-03-16T08:45:00Z", "2026-03-16T09:00:00Z"],
                "price_data": [150.5, 150.2, 151.0, 149.8, 150.6]
            }
            results = perform_statistical_analysis(
                mock_data["sentiment_scores"], 
                mock_data["timestamps"], 
                mock_data["price_data"]
            )
            print(json.dumps(results, indent=2))
        else:
            input_data = json.load(sys.stdin)
            results = perform_statistical_analysis(
                input_data["sentiment_scores"], 
                input_data["timestamps"], 
                input_data["price_data"]
            )
            print(json.dumps(results))
            
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
