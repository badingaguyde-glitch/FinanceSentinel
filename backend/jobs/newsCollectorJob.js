const cron = require('node-cron');
const NewsService = require('../services/NewsService');

/**
 * Scheduled job to collect financial news every hour.
 * Skip duplicates is handled by the News model unique index and upsert logic.
 */
const startNewsCollectorJob = () => {
  // '0 * * * *' means once every hour at the top of the hour
  cron.schedule('0 * * * *', async () => {
    console.log(`[${new Date().toISOString()}] Starting automated news collection...`);
    
    try {
      const count = await NewsService.fetchAndStoreNews();
      console.log(`[${new Date().toISOString()}] News collection completed. Processed ${count} articles.`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] News collection job failed:`, error.message);
    }
  });
  
  console.log('Automated News Collector Job scheduled (Every Hour).');
};

module.exports = startNewsCollectorJob;
