const mongoose = require('mongoose');

const marketDataSchema = new mongoose.Schema({
  crop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: true
  },
  market: {
    name: String,
    location: {
      city: String,
      state: String,
      country: String
    }
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  unit: {
    type: String,
    enum: ['per_kg', 'per_quintal', 'per_ton', 'per_piece'],
    default: 'per_quintal'
  },
  quality: {
    type: String,
    enum: ['premium', 'good', 'average', 'poor'],
    default: 'good'
  },
  volume: {
    quantity: Number,
    unit: String
  },
  priceChange: {
    amount: Number,
    percentage: Number,
    period: { type: String, enum: ['daily', 'weekly', 'monthly'] }
  },
  trend: {
    type: String,
    enum: ['increasing', 'decreasing', 'stable'],
    required: true
  },
  demandSupply: {
    demand: { type: String, enum: ['low', 'medium', 'high'] },
    supply: { type: String, enum: ['low', 'medium', 'high'] },
    ratio: Number
  },
  seasonalFactors: [String],
  externalFactors: [String],
  forecast: {
    nextWeek: {
      predictedPrice: Number,
      confidence: Number
    },
    nextMonth: {
      predictedPrice: Number,
      confidence: Number
    }
  },
  source: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
marketDataSchema.index({ crop: 1, date: -1 });
marketDataSchema.index({ date: -1 });
marketDataSchema.index({ 'market.location.state': 1, crop: 1 });

module.exports = mongoose.model('MarketData', marketDataSchema);
