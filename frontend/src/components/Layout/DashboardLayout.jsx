import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Newspaper, Settings, LogOut, TrendingUp, Cpu, PieChart } from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const activeStyle = { color: '#38bdf8', opacity: 1 };
  const baseStyle = { 
    marginBottom: '1rem', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.75rem', 
    cursor: 'pointer', 
    textDecoration: 'none',
    color: 'inherit',
    opacity: 0.6,
    transition: 'all 0.2s'
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', color: '#38bdf8' }}>
          FinanceSentinel
        </h1>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>
              <NavLink to="/news" style={({ isActive }) => isActive ? { ...baseStyle, ...activeStyle } : baseStyle}>
                <Newspaper size={20} /> News Feed
              </NavLink>
            </li>
            <li>
              <NavLink to="/sentiment" style={({ isActive }) => isActive ? { ...baseStyle, ...activeStyle } : baseStyle}>
                <PieChart size={20} /> Sentiment
              </NavLink>
            </li>
            <li>
              <NavLink to="/predictions" style={({ isActive }) => isActive ? { ...baseStyle, ...activeStyle } : baseStyle}>
                <TrendingUp size={20} /> Predictions
              </NavLink>
            </li>
            <li>
              <NavLink to="/analysis" style={({ isActive }) => isActive ? { ...baseStyle, ...activeStyle } : baseStyle}>
                <Cpu size={20} /> AI Analysis
              </NavLink>
            </li>
            <li>
              <NavLink to="/dashboardAi" style={({ isActive }) => isActive ? { ...baseStyle, ...activeStyle } : baseStyle}>
                <LayoutDashboard size={20} /> AI Dashboard
              </NavLink>
            </li>
          </ul>
        </nav>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.6, cursor: 'pointer' }}>
          <LogOut size={20} /> Logout
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
