const Sentiment = require('sentiment');
const sentiment = new Sentiment();

/**
 * Analyzes the sentiment of given text (e.g., title + description).
 * @param {string} text - The text to analyze.
 * @returns {object} - An object containing the sentimentScore.
 */
const analyzeSentiment = (text) => {
  if (!text) {
    return { sentimentScore: 0 };
  }

  const result = sentiment.analyze(text);
  
  return {
    sentimentScore: result.score,
  };
};

module.exports = {
  analyzeSentiment,
};
