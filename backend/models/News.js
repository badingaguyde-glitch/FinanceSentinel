const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true, // Avoid duplicates
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  source: {
    type: String,
    required: true,
    trim: true,
  },
  publishedAt: {
    type: Date,
    required: true,
    index: { expires: '30d' }, // TTL index: automatically delete after 30 days
  },
  sentimentScore: {
    type: Number,
    default: 0,
  },
  url: { type: String, required: true, trim: true   }, // Optional field for article URL
}, {
  timestamps: false, // Optimize storage size by removing auto timestamps
  versionKey: false, // Optimize storage size by removing __v field
});

// Explicitly add an index for better performance on sorting/searching if needed
newsSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('News', newsSchema);
