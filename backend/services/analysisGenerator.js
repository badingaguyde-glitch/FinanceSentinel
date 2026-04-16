/**
 * Generates a modern, easily understandable financial analysis explanation.
 * 
 * @param {object} params - Input parameters.
 * @param {number} params.sentiment - Average sentiment score.
 * @param {number} params.correlation - Correlation coefficient between sentiment and price.
 * @param {number} params.prediction - Predicted price based on linear regression.
 * @returns {string} - Human-readable explanation.
 */
const generateExplanation = ({ sentiment, correlation, prediction }) => {
  const sentimentStr = sentiment > 0 ? 'positive' : sentiment < 0 ? 'negative' : 'neutral';
  const correlationStrength = Math.abs(correlation) > 0.7 ? 'strong' : Math.abs(correlation) > 0.4 ? 'moderate' : 'weak';
  const correlationDirection = correlation > 0 ? 'positive correlation' : correlation < 0 ? 'inverse relationship' : 'no clear relationship';
  
  let explanation = `Currently, the market sentiment is trending **${sentimentStr}**. `;
  
  if (correlationStrength !== 'weak') {
    explanation += `We've detected a **${correlationStrength} ${correlationDirection}** between news sentiment and asset prices. `;
  } else {
    explanation += `Sentiment and price movements currently show a **weak correlation**, suggesting other market drivers are at play. `;
  }

  if (prediction !== null && prediction !== undefined && !Number.isNaN(prediction)) {
    explanation += `Based on our statistical modeling, the projected price target is approximately **$${prediction.toFixed(2)}**. `;
  } else {
    explanation += `We could not generate a conclusive statistical price target due to insufficient market density. `;
  }
  
  if (sentiment > 0.5 && correlation > 0.5) {
    explanation += `High positive sentiment combined with strong correlation suggests a **high-confidence bullish opportunity**.`;
  } else if (sentiment < -0.5 && correlation > 0.5) {
    explanation += `Heavy negative sentiment and strong correlation indicate a **high-risk bearish trend**.`;
  } else {
    explanation += `We recommend monitoring for further sentiment shifts before confirming any aggressive positions.`;
  }

  return explanation;
};

module.exports = {
  generateExplanation,
};
