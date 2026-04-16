import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import MarketSentiment from './pages/MarketSentiment';
import Predictions from './pages/Predictions';
import AIAnalysis from './pages/AIAnalysis';
import AIAnalysisDashboard from './pages/AIAnalysisDashboard';

function App() {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/news" />} />
          <Route path="/news" element={<Dashboard />} />
          <Route path="/sentiment" element={<MarketSentiment />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/analysis" element={<AIAnalysis />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboardAi" element={<AIAnalysisDashboard />} />
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  );
}

export default App;
