import React, { useState, useEffect } from 'react';
import { getNews, syncNews } from '../services/api';
import { RefreshCw } from 'lucide-react';

const NewsCard = ({ article }) => (
  <div className="card">
    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
      {article.source} • {new Date(article.publishedAt).toLocaleDateString()}
      <span style={{ marginLeft: '1rem', color: article.sentimentScore > 0 ? '#10b981' : article.sentimentScore < 0 ? '#ef4444' : '#94a3b8' }}>
        Score: {article.sentimentScore}
      </span>
    </div>
    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>{article.title}</h3>
    <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
      {article.description ? (article.description.substring(0, 100) + '...') : 'No description available.'}
    </p>
    <a 
      href={article.url} 
      target="_blank" 
      rel="noopener noreferrer"
      style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}
    >
      Read more →
    </a>
  </div>
);

const Dashboard = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchNewsData = async () => {
    try {
      setLoading(true);
      const res = await getNews();
      setNews(res.data);
    } catch (err) {
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsData();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncNews();
      await fetchNewsData();
    } catch (err) {
      console.error('Error syncing news:', err);
    } finally {
      setSyncing(false);
    }
  };

  const positiveNews = news.filter(n => n.sentimentScore > 0).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Global Intelligence Feed</h2>
          <p style={{ color: '#94a3b8', margin: '0.5rem 0 0 0' }}>Monitoring {news.length} live financial sources.</p>
        </div>
        <button className="btn" onClick={handleSync} disabled={syncing}>
          <RefreshCw size={16} style={{ marginRight: '0.5rem' }} />
          {syncing ? 'Syncing...' : 'Sync Global Data'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Positive Signals</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{positiveNews}</div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Negative Signals</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{news.length - positiveNews}</div>
        </div>
      </div>

      {loading ? (
        <p>Synchronizing with financial satellites...</p>
      ) : (
        <div className="news-grid">
          {news.length > 0 ? (
            news.map(article => <NewsCard key={article._id} article={article} />)
          ) : (
            <p>No news articles found. Click "Sync News" to fetch latest data.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
