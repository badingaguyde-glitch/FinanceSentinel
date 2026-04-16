const statEngine = require('../services/statEngine');
const analysisGenerator = require('../services/analysisGenerator');
const NewsService = require('../services/NewsService');

const getNews = async (req, res) => {
  try {
    const news = await NewsService.getNewsFromDB();
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSentiment = async (req, res) => {
  try {
    const news = await NewsService.getNewsFromDB();
    const validNews = news.filter(n => typeof n.sentimentScore === 'number' && Number.isFinite(n.sentimentScore));
    if (validNews.length === 0) return res.json({ averageSentiment: 0, count: news.length });
    
    const totalSentiment = validNews.reduce((acc, curr) => acc + curr.sentimentScore, 0);
    const avgSentiment = totalSentiment / validNews.length;
    res.json({ averageSentiment: Number.isFinite(avgSentiment) ? avgSentiment : 0, count: news.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPrediction = async (req, res) => {
  try {
    // For the dashboard GET endpoint, we use recent cached analysis or perform one with dummy price data
    const news = await NewsService.getNewsFromDB();
    const validNews = news.filter(n => typeof n.sentimentScore === 'number' && Number.isFinite(n.sentimentScore));
    if (validNews.length < 5) return res.json({ message: 'Insufficient data for prediction' });

    const sentiment_scores = validNews.map(n => n.sentimentScore);
    const timestamps = validNews.map(n => n.publishedAt);

    const results = await statEngine.runStatisticalAnalysis({
      sentiment_scores,
      timestamps
    }, {
      tasks: ["statistics", "regression"],
      target_column: "price_data",
      features: ["sentiment_scores"],
      external_ticker: "^GSPC"
    });
    
    res.json(results);
  } catch (error) {
    if (error.message.includes('Insufficient') || error.message.includes('Mismatched')) {
      return res.status(200).json({ message: 'Statistical analysis unavailable: ' + error.message });
    }
    res.status(500).json({ message: 'Error generating prediction: ' + error.message });
  }
};

const getAnalysis = async (req, res) => {
  try {
    const news = await NewsService.getNewsFromDB();
    const validNews = news.filter(n => typeof n.sentimentScore === 'number' && Number.isFinite(n.sentimentScore));
    if (validNews.length < 5) return res.json({ message: 'Insufficient data for analysis' });

    const sentiment_scores = validNews.map(n => n.sentimentScore);
    const timestamps = validNews.map(n => n.publishedAt);

    const results = await statEngine.runStatisticalAnalysis({
      sentiment_scores,
      timestamps
    }, {
      tasks: ["statistics", "regression"],
      target_column: "price_data",
      features: ["sentiment_scores"],
      external_ticker: "^GSPC"
    });

    const filteredScores = sentiment_scores.filter(s => typeof s === 'number');
    const avgSentiment = filteredScores.length > 0 ? filteredScores.reduce((a, b) => a + b, 0) / filteredScores.length : 0;
    
    let correlation = 0;
    if (results.statistics?.correlations?.pearson?.sentiment_scores?.price_data) {
      correlation = results.statistics.correlations.pearson.sentiment_scores.price_data;
    } else if (results.statistics?.correlations?.pearson) {
      // Try to find the first correlation available if specific names are not present
      const keys = Object.keys(results.statistics.correlations.pearson);
      if (keys.length > 0) {
        const firstKeyVals = results.statistics.correlations.pearson[keys[0]];
        const secondKey = Object.keys(firstKeyVals).find(k => k !== keys[0]);
        if (secondKey) correlation = firstKeyVals[secondKey];
      }
    }

    let prediction = null;
    if (results.models?.ols_regression?.params) {
      const params = results.models.ols_regression.params;
      prediction = (params.const || 0) + (params.sentiment_scores || 0) * avgSentiment;
    }

    let explanation = "";
    if (results.insights && results.insights.length > 0) {
      // Prefer using the Python insights if available
      explanation = results.insights.join(' ');
    } else {
      explanation = analysisGenerator.generateExplanation({
        sentiment: avgSentiment,
        correlation: correlation,
        prediction: prediction
      });
    }
    
    res.json({
      ...results,
      explanation,
      newsCount: news.length
    });
  } catch (error) {
    if (error.message.includes('Insufficient') || error.message.includes('Mismatched')) {
      return res.status(200).json({ message: 'Analysis unavailable: ' + error.message });
    }
    res.status(500).json({ message: 'Error generating analysis: ' + error.message });
  }
};

const triggerSync = async (req, res) => {
  try {
    const count = await NewsService.fetchAndStoreNews();
    res.json({ message: `Successfully synced ${count} articles.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const analyzeNews = async (req, res) => {
  try {
    const { sentiment_scores, timestamps, price_data } = req.body;
    
    if (!sentiment_scores || !timestamps || !price_data) {
      return res.status(400).json({ message: 'Missing required analysis data (sentiment_scores, timestamps, price_data)' });
    }
    
    const results = await statEngine.runStatisticalAnalysis({
      sentiment_scores,
      timestamps,
      price_data
    }, {
      tasks: ["statistics", "regression"],
      target_column: "price_data",
      features: ["sentiment_scores"]
    });
    
    // Generate human-readable explanation
    const filteredScores = (sentiment_scores || []).filter(s => typeof s === 'number' && Number.isFinite(s));
    if (filteredScores.length === 0) return res.status(400).json({ message: 'No valid sentiment scores provided' });
    
    const avgSentiment = filteredScores.reduce((a, b) => a + b, 0) / filteredScores.length;
    
    let correlation = 0;
    if (results.statistics?.correlations?.pearson?.sentiment_scores?.price_data) {
      correlation = results.statistics.correlations.pearson.sentiment_scores.price_data;
    } else if (results.statistics?.correlations?.pearson) {
      // Try to find the first correlation available if specific names are not present
      const keys = Object.keys(results.statistics.correlations.pearson);
      if (keys.length > 0) {
        const firstKeyVals = results.statistics.correlations.pearson[keys[0]];
        const secondKey = Object.keys(firstKeyVals).find(k => k !== keys[0]);
        if (secondKey) correlation = firstKeyVals[secondKey];
      }
    }

    let prediction = price_data && price_data.length > 0 ? price_data[price_data.length - 1] : null;
    if (results.models?.ols_regression?.params) {
      const params = results.models.ols_regression.params;
      prediction = (params.const || 0) + (params.sentiment_scores || 0) * avgSentiment;
    }

    let explanation = "";
    if (results.insights && results.insights.length > 0) {
      // Prefer using the Python insights if available
      explanation = results.insights.join(' ');
    } else {
      explanation = analysisGenerator.generateExplanation({
        sentiment: avgSentiment,
        correlation: correlation,
        prediction: prediction
      });
    }
    
    res.json({
      ...results,
      explanation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNews,
  triggerSync,
  analyzeNews,
  getSentiment,
  getPrediction,
  getAnalysis
};
