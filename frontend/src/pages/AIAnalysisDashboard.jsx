import React, { useState, useEffect } from 'react';
import { askAIEngine } from '../services/api';
import { BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Search, BrainCircuit, Activity, Database, Zap, Sparkles, TrendingUp, Cpu, CheckCircle, BarChart3 } from 'lucide-react';

export default function AIAnalysisDashboard() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  
  // Dynamic Loading animations
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingTexts = [
    "Analyzing semantic intent...",
    "Formulating AI statistical plan...",
    "Querying core dataset...",
    "Running Python MCP pipelines...",
    "Interpreting predictive results..."
  ];

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => Math.min(prev + 1, loadingTexts.length - 1));
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    setLoading(true);
    setError("");
    setResponse(null);
    
    try {
      const res = await askAIEngine({ 
           question, 
           datasetId: "active_dataset"
      });
      
      const data = res.data;
      if (data.error) throw new Error(data.error);
      
      setResponse(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to process complex analysis. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const renderPlots = (plots) => {
    if (!plots || plots.length === 0) return null;
    return plots.map((plot, idx) => {
      if (plot.type === "bar") {
        const plotData = plot.data.labels.map((lbl, i) => ({ name: lbl, value: plot.data.values[i] }));
        return (
          <div key={idx} className="glass-card" style={{height: '350px'}}>
            <h4 style={{ color: '#fff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} color="#38bdf8" /> {plot.data.title}
            </h4>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={plotData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                  contentStyle={{backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff'}} 
                />
                <Bar dataKey="value" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      }
      
      if (plot.type === "scatter_pca") {
         return (
           <div key={idx} className="glass-card" style={{height: '350px'}}>
              <h4 style={{ color: '#fff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#34d399" /> {plot.data.title}
              </h4>
              <ResponsiveContainer width="100%" height="80%">
                <ScatterChart>
                   <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                   <XAxis dataKey="x" type="number" stroke="#94a3b8" />
                   <YAxis dataKey="y" type="number" stroke="#94a3b8" />
                   <Tooltip 
                     cursor={{ strokeDasharray: '3 3' }} 
                     contentStyle={{backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff'}} 
                   />
                   <Scatter name="Clusters" data={plot.data.points} fill="#34d399" />
                </ScatterChart>
              </ResponsiveContainer>
           </div>
         );
      }
      return null;
    });
  };

  const formatText = (text) => {
    if (!text) return "";
    return text.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #60a5fa">$1</strong>').replace(/\n/g, '<br/>');
  };

  return (
    <div className="container" style={{ minHeight: '100vh', background: '#0f172a' }}>
      <style>{`
        .container { max-width: 1200px; margin: 0 auto; padding: 3rem 2rem; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
        .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; }
        .glass-card { background: rgba(30, 41, 59, 0.5); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 1rem; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); transition: transform 0.2s; }
        .glass-card:hover { border-color: rgba(255,255,255,0.15); }
        .flex-center { display: flex; align-items: center; gap: 0.5rem; }
        .text-gradient { background: linear-gradient(to right, #38bdf8, #818cf8); -webkit-background-clip: text; color: transparent; }
        .answer-hero { background: linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.9)); border: 1px solid rgba(56, 189, 248, 0.3); border-left: 4px solid #38bdf8; padding: 2rem; border-radius: 1rem; margin-bottom: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.3); position: relative; overflow: hidden; }
        .answer-hero::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.5), transparent); }
        .stat-badge { background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(51, 65, 85, 0.8); padding: 1rem; border-radius: 0.75rem; text-align: center; }
        .search-wrapper { position: relative; margin-bottom: 3rem; max-width: 800px; margin-left: auto; margin-right: auto; }
        .search-input { width: 100%; padding: 1.25rem 1.25rem 1.25rem 3.5rem; border-radius: 1rem; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(148, 163, 184, 0.2); color: white; font-size: 1.1rem; outline: none; transition: all 0.3s ease; box-sizing: border-box; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .search-input:focus { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15); }
        .search-btn { position: absolute; right: 0.75rem; top: 0.75rem; bottom: 0.75rem; background: linear-gradient(135deg, #2563eb, #7c3aed); border: none; color: white; padding: 0 2rem; border-radius: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 10px rgba(124, 58, 237, 0.3); }
        .search-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.1); box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4); }
        .search-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .search-icon { position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .section-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: #f8fafc; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.75rem; }
        .pulse-anim { animation: pulse 2s infinite; }
        .tag { background: rgba(56, 189, 248, 0.1); color: #38bdf8; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.875rem; border: 1px solid rgba(56, 189, 248, 0.2); display: inline-block; }
        .insight-item { padding: 1rem; border-left: 2px solid #818cf8; background: rgba(30, 41, 59, 0.4); margin-bottom: 0.75rem; border-radius: 0 0.5rem 0.5rem 0; font-size: 1rem; color: #cbd5e1; }
        
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <Sparkles size={32} color="#38bdf8" />
          </div>
          <h2 style={{ fontSize: '2.75rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }} className="text-gradient">
            Analytics AI Orchestrator
          </h2>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto' }}>
          Translate complex datasets into human strategic answers using natural language and real-time backend pipelines.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="search-wrapper">
        <Search className="search-icon" size={24} />
        <input 
          type="text" 
          value={question} 
          onChange={(e) => setQuestion(e.target.value)}
          className="search-input"
          placeholder="Ask a strategic question (e.g., 'What features predict our highest valuation?')"
          required
        />
        <button type="submit" disabled={loading} className="search-btn flex-center">
          {loading ? <Activity size={18} className="pulse-anim" /> : <Zap size={18} />}
          {loading ? "Thinking..." : "Analyze"}
        </button>
      </form>

      {/* Example Questions — visible only before any request */}
      {!loading && !response && !error && (
        <div className="animate-in" style={{ maxWidth: '800px', margin: '-1.5rem auto 2.5rem auto' }}>
          <p style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', fontWeight: '600' }}>
            💡 Example questions
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              {
                category: '🛢️ Energy',
                color: '#f59e0b',
                questions: [
                  'Does crude oil price (CL=F) react to negative financial news sentiment?',
                  'How did news sentiment about Iran and US tensions affect oil price?',
                ]
              },
              {
                category: '📈 Market Indices',
                color: '#38bdf8',
                questions: [
                  'Is there a correlation between business news sentiment and the S&P 500?',
                  'Can our news sentiment data predict the NASDAQ trend?',
                ]
              },
              {
                category: '₿ Crypto',
                color: '#a78bfa',
                questions: [
                  'How does financial news sentiment correlate with Bitcoin price volatility?',
                  'Does negative news predict a drop in Ethereum price?',
                ]
              },
              {
                category: '🏢 Stocks',
                color: '#34d399',
                questions: [
                  'Does negative news sentiment predict a drop in Tesla stock?',
                  'What is the statistical relationship between news sentiment and Apple stock?',
                ]
              },
            ].map((group) => (
              <div key={group.category} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: group.color, minWidth: '110px', paddingRight: '0.5rem', borderRight: `2px solid ${group.color}33` }}>
                  {group.category}
                </span>
                {group.questions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuestion(q)}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: `1px solid ${group.color}33`,
                      color: '#94a3b8',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '999px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      lineHeight: '1.4'
                    }}
                    onMouseEnter={e => { e.target.style.borderColor = group.color; e.target.style.color = '#e2e8f0'; e.target.style.background = `${group.color}15`; }}
                    onMouseLeave={e => { e.target.style.borderColor = `${group.color}33`; e.target.style.color = '#94a3b8'; e.target.style.background = 'rgba(15, 23, 42, 0.6)'; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="glass-card flex-center pulse-anim" style={{ justifyContent: 'center', padding: '4rem', flexDirection: 'column', gap: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
          <Cpu size={48} color="#818cf8" strokeWidth={1.5} />
          <h3 style={{ fontSize: '1.25rem', color: '#cbd5e1', fontWeight: '500', margin: 0 }}>{loadingTexts[loadingStep]}</h3>
          <div style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
             <div style={{ width: '30%', height: '100%', background: '#818cf8', animation: 'pulse 1s infinite alternate' }} />
          </div>
        </div>
      )}

      {error && (
        <div className="glass-card animate-in" style={{ borderLeft: '4px solid #ef4444', backgroundColor: 'rgba(127, 29, 29, 0.1)', maxWidth: '800px', margin: '0 auto' }}>
           <h3 style={{ color: '#fca5a5', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             Processing Error
           </h3>
           <p style={{ color: '#fecaca', marginTop: '0.5rem', lineHeight: '1.5' }}>{error}</p>
        </div>
      )}

      {response && !loading && (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Main Answer Hero */}
          <div className="answer-hero">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
               <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '10px', borderRadius: '12px' }}>
                  <BrainCircuit size={28} color="#38bdf8" /> 
               </div>
               <div>
                 <h3 style={{ color: '#f8fafc', margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: '600' }}>Executive Answer</h3>
                 <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>Interpreted from {response.results?.summary || "active dataset"}</p>
               </div>
            </div>
            
            <div 
              style={{ lineHeight: '1.8', fontSize: '1.2rem', color: '#f1f5f9', fontWeight: '400' }}
              dangerouslySetInnerHTML={{ __html: formatText(response.explanation || "No explanation dynamically generated.") }}
            />
          </div>

          <div className="grid-2">
            {/* AI Reflection & Methodology */}
            <div className="glass-card">
              <h3 className="section-title flex-center"><Database size={20} color="#c084fc" /> AI Methodology & Plan</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="stat-badge">
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.4rem' }}>Primary Intent</p>
                  <p style={{ fontWeight: '600', textTransform: 'capitalize', color: '#e2e8f0' }}>{response.plan?.intent || 'General Exploration'}</p>
                </div>
                <div className="stat-badge">
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.4rem' }}>Analysis Pipeline</p>
                  <p style={{ fontWeight: '600', textTransform: 'capitalize', color: '#c084fc' }}>{response.plan?.analysis_type || 'Statistical'}</p>
                </div>
                <div className="stat-badge" style={{ gridColumn: '1 / -1', textAlign: 'left' }}>
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.75rem' }}>Features Targeted</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                     <span className="tag" style={{ border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)' }}>
                       Target: {response.plan?.target_variable || 'Auto'}
                     </span>
                     {response.plan?.feature_candidates?.map(f => (
                       <span key={f} className="tag">{f}</span>
                     ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Supporting Data Evidences */}
            <div className="glass-card">
              <h3 className="section-title flex-center"><TrendingUp size={20} color="#10b981" /> Extracted Evidence</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                 <div className="stat-badge" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.4rem' }}>Confidence Level</p>
                    <p style={{ fontWeight: '800', fontSize: '1.75rem', color: '#34d399', margin: 0 }}>
                      {((response.results?.confidence_score || 0) * 100).toFixed(1)}%
                    </p>
                 </div>
                 
                 {response.results?.models && response.results.models.performance ? (
                   <div className="stat-badge" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                         Model Score ({response.results.models.type === 'regression' ? 'R²' : 'Acc'})
                      </p>
                      <p style={{ fontWeight: '800', fontSize: '1.75rem', color: '#818cf8', margin: 0 }}>
                        {((response.results.models.performance.r2 || response.results.models.performance.accuracy || 0) * 100).toFixed(1)}%
                      </p>
                   </div>
                 ) : (
                   <div className="stat-badge" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.4rem' }}>Statistics Status</p>
                      <p style={{ fontWeight: '800', fontSize: '1.25rem', color: '#818cf8', margin: 0 }}>Calculated</p>
                   </div>
                 )}
              </div>
              
              {response.results?.models?.model && (
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '0.75rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                   <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Underlying Predictor:</p>
                   <p style={{ fontWeight: '600', color: '#e2e8f0', margin: 0 }}>{response.results.models.model}</p>
                </div>
              )}
            </div>
          </div>

          {(response.results?.plots_metadata?.length > 0 || response.results?.insights?.length > 0) && (
            <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))' }}>
              
              {response.results?.plots_metadata?.length > 0 && (
                 <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {renderPlots(response.results.plots_metadata)}
                 </div>
              )}
              
              {response.results?.insights?.length > 0 && (
                <div className="glass-card" style={{ height: 'fit-content' }}>
                  <h3 className="section-title flex-center"><CheckCircle size={20} color="#f472b6" /> Specific Data Insights</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', marginTop: '1rem' }}>
                    {response.results.insights.map((insight, i) => (
                      <div key={i} className="insight-item">
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
            </div>
          )}
          
        </div>
      )}
    </div>
  );
}
