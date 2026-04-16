import React, { useState, useEffect } from 'react';
import { getFullAnalysis } from '../services/api';
import { Brain, Info } from 'lucide-react';

const AIAnalysis = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getFullAnalysis();
        setAnalysis(res.data);
      } catch (err) {
        console.error('Error fetching AI analysis:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Brain color="#38bdf8" /> AI Strategic Analysis
      </h2>
      
      {loading ? (
        <p>Crunching latest market data...</p>
      ) : !analysis ? (
        <div className="card">Unable to load AI analysis data. Please check connection and try again.</div>
      ) : analysis.message ? (
        <div className="card">{analysis.message}</div>
      ) : (
        <div style={{ maxWidth: '800px' }}>
          <div className="card" style={{ borderLeft: '4px solid #38bdf8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#38bdf8', fontWeight: 'bold' }}>
              <Info size={18} /> EXECUTIVE SUMMARY
            </div>
            <div 
              style={{ lineHeight: '1.8', fontSize: '1.1rem' }}
              dangerouslySetInnerHTML={{ __html: analysis.explanation.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #38bdf8">$1</strong>') }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card">
              <h4 style={{ margin: '0 0 1rem 0', color: '#94a3b8' }}>Data Coverage</h4>
              <p>Analyzing <strong>{analysis.newsCount}</strong> recent financial reports and news sources.</p>
            </div>
            <div className="card">
              <h4 style={{ margin: '0 0 1rem 0', color: '#94a3b8' }}>Network Reliability</h4>
              <p>The statistical bridge to Python core is active and responding.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysis;
