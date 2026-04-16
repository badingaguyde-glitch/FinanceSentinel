import React, { useState, useEffect } from 'react';
import { getNews, getSentimentSummary } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MarketSentiment = () => {
  const [news, setNews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [newsRes, summaryRes] = await Promise.all([getNews(), getSentimentSummary()]);
        setNews(newsRes.data);
        setSummary(summaryRes.data);
      } catch (err) {
        console.error('Error fetching sentiment data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  console.log('sentiment summary:', summary);

  const chartData = news
    .map(article => ({
      date: new Date(article.publishedAt).toLocaleDateString(),
      score: article.sentimentScore
    }))
    .reverse();

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Market Sentiment Analysis</h2>
      
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card">
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8' }}>Average Sentiment</h4>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: summary.averageSentiment > 0 ? '#10b981' : summary.averageSentiment < 0 ? '#ef4444' : '#f8fafc' }}>
              {summary.averageSentiment != null ? summary.averageSentiment.toFixed(2) : '0.00'}
            </div>
          </div>
          <div className="card">
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#94a3b8' }}>Processed Articles</h4>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{summary.count}</div>
          </div>
        </div>
      )}

      <div className="card" style={{ height: '400px' }}>
        <h4 style={{ margin: '0 0 1.5rem 0' }}>Sentiment Trend</h4>
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
              itemStyle={{ color: '#38bdf8' }}
            />
            <Line type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MarketSentiment;
