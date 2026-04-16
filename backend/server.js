const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const newsRoutes = require('./routes/newsRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
app.use('/api/news', newsRoutes);
app.use('/api/analysis', analysisRoutes);

// Jobs
const startNewsCollectorJob = require('./jobs/newsCollectorJob');
startNewsCollectorJob();

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
