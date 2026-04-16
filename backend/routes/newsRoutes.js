const express = require('express');
const router = express.Router();
const NewsController = require('../controllers/NewsController');

router.get('/', NewsController.getNews);
router.get('/sentiment', NewsController.getSentiment);
router.get('/prediction', NewsController.getPrediction);
router.get('/analysis', NewsController.getAnalysis);
router.post('/sync', NewsController.triggerSync);
router.post('/analyze', NewsController.analyzeNews);

module.exports = router;
