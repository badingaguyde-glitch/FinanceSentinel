# FinanceSentinel 📈🤖

## About The Project
FinanceSentinel is an advanced AI-powered financial dashboard and analysis tool. It aggregates financial news, performs market sentiment analysis, and runs sophisticated statistical and machine learning models to provide deep insights and predictions about market trends. 

## Features
- **Dashboard Overview:** Real-time summary of the financial market.
- **Market Sentiment Analysis:** Automated news collection and natural language processing for sentiment scoring.
- **AI Predictions:** Machine learning models (Random Forest, OLS regression) forecasting market behaviors.
- **Advanced Statistics & Clustering:** PCA and K-Means clustering for financial data segmentation and outlier detection.
- **Automated Data Pipelines:** Scheduled CRON jobs gathering and processing the latest financial news.
- **Live Stock Integration:** On-the-fly integration with `yfinance` for up-to-date market data processing.

## Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Routing:** React Router v7
- **Data Visualization:** Recharts
- **Icons:** Lucide React

### Backend
- **Server:** Node.js & Express
- **Database:** MongoDB (Mongoose)
- **AI Integration:** OpenAI API
- **Task Scheduling:** node-cron
- **NLP:** sentiment package

### Python AI/Stats Engine
- **Data Manipulation:** Pandas, Numpy, Scipy
- **Machine Learning:** Scikit-learn (Random Forest Classification/Regression, KMeans, PCA)
- **Statistics:** Statsmodels (OLS Regression)
- **Financial Data:** yfinance

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.8+)
- MongoDB instance (Local or Atlas)
- API Keys: OpenAI, and relevant news data providers.

### Installation & Execution

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd FinanceSentinel
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create a .env file and add your configuration (MONGO_URI, PORT, OPENAI_API_KEY, etc.)
   npm start # or node server.js
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Python Engine Setup:**
   Ensure you have the required Python packages installed to allow the backend's MCP wrapper to execute statistical models.
   ```bash
   cd python
   pip install numpy pandas scipy statsmodels scikit-learn yfinance
   ```

## Architecture Overview
- **Client (Frontend):** A responsive Single Page Application (SPA) offering multiple dashboards (`/dashboard`, `/sentiment`, `/predictions`, `/analysis`).
- **API (Backend):** Serves the frontend, manages the MongoDB database, triggers scheduled jobs for fetching and parsing news, and acts as the bridge for OpenAI interactions.
- **Stat Engine (Python):** Contains `stat_engine.py` to handle heavy computational tasks. It sanitizes input data, normalizes features, trains machine learning models on the fly, and returns robust statistical JSON results back to the application.
