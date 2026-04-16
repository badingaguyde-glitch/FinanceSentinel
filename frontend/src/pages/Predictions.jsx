import React, { useState, useEffect } from 'react';
import { getPredictionData } from '../services/api';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Predictions = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getPredictionData();
        setData(res.data);
      } catch (err) {
        console.error('Error fetching predictions:', err);
        setError('Failed to load predictions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Financial Predictions</h2>
      
      {loading ? (
        <p>Loading prediction models...</p>
      ) : error ? (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#ef4444' }}>
          <AlertCircle /> {error}
        </div>
      ) : data?.message ? (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#94a3b8' }}>
          <AlertCircle /> {data.message}
        </div>
      ) : data ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card">
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8' }}>Model Confidence</h4>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: data.confidence > 0.7 ? '#10b981' : '#f59e0b' }}>
                {((data.confidence || 0) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="card">
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8' }}>Target Price</h4>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>${(data.prediction || 0).toFixed(2)}</div>
            </div>
          </div>

          <div className="card">
            <h4 style={{ margin: '0 0 1rem 0' }}>Regression Summary</h4>
            <p style={{ color: '#94a3b8' }}>
              The current model indicates a strong correlation factor of <strong>{(data.correlation || 0).toFixed(3)}</strong>. 
              This suggests that news sentiment is a highly influential leading indicator for the current asset movement.
            </p>
          </div>
        </>
      ) : (
        <p>No prediction data available.</p>
      )}
    </div>
  );
};

export default Predictions;
