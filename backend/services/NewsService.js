const News = require('../models/News');
const apiClient = require('../utils/apiClient');
const { analyzeSentiment } = require('./sentimentAnalyzer');

const fetchAndStoreNews = async () => {
  try {
    // Using a public API like NewsAPI or similar as a default example
    // In a real scenario, the API URL and Key would be in .env
    const apiKey = process.env.NEWS_API_KEY;
    const response = await apiClient.get(`https://newsapi.org/v2/top-headlines?category=business&apiKey=${apiKey}`);

    if (response.data && response.data.articles) {
      const articles = response.data.articles;
      
      for (const article of articles) {
        try {
          const combinedText = `${article.title} ${article.description || ''}`;
          const { sentimentScore } = analyzeSentiment(combinedText);

          // Avoid duplicates by checking the Title (unique index in schema)
          await News.findOneAndUpdate(
            { title: article.title },
            {
              description: article.description || article.content,
              source: article.source.name,
              publishedAt: new Date(article.publishedAt),
              sentimentScore: sentimentScore,
              url: article.url
            },
            { upsert: true, new: true }
          );
        } catch (innerErr) {
          if (innerErr.code !== 11000) { // Ignore duplicate key errors
            console.error(`Error saving article ${article.title}:`, innerErr.message);
          }
        }
      }
      return articles.length;
    }
  } catch (error) {
    console.error('Error in fetchAndStoreNews:', error.message);
    throw error;
  }
};

const getNewsFromDB = async () => {
  return await News.find().sort({ publishedAt: -1 }).limit(50).lean();
};

const getDatasetById = async (datasetId, options = {}) => {
    const { limit = 100, fields = [] } = options;

    const projection = {};
    if (fields.length > 0) {
        fields.forEach(f => {
            if (f) projection[f] = 1;
        });
        // Always include essential metadata for merging and display
        projection["publishedAt"] = 1;
        projection["title"] = 1;
        projection["source"] = 1;
    }

    return await News.find({})
        .select(projection)
        .limit(limit)
        .lean();
};

module.exports = {
  fetchAndStoreNews,
  getNewsFromDB,
  getDatasetById
};
