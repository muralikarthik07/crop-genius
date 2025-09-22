const mongoose = require('mongoose');

const yieldRecordSchema = new mongoose.Schema({
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true
  },
  crop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
    required: true
  },
  season: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  area: {
    type: Number,
    required: [true, 'Cultivation area is required'],
    min: 0
  },
  actualYield: {
    type: Number,
    required: [true, 'Actual yield is required'],
    min: 0
  },
  predictedYield: Number,
  yieldPerHectare: {
    type: Number,
    required: true
  },
  plantingDate: {
    type: Date,
    required: true
  },
  harvestDate: {
    type: Date,
    required: true
  },
  weatherConditions: {
    avgTemperature: Number,
    totalRainfall: Number,
    avgHumidity: Number,
    extremeEvents: [String]
  },
  inputsUsed: {
    seeds: {
      variety: String,
      quantity: Number,
      cost: Number
    },
    fertilizers: [{
      type: String,
      quantity: Number,
      cost: Number,
      applicationDate: Date
    }],
    pesticides: [{
      type: String,
      quantity: Number,
      cost: Number,
      applicationDate: Date
    }],
    irrigation: {
      method: String,
      waterUsed: Number,
      cost: Number
    },
    labor: {
      hours: Number,
      cost: Number
    }
  },
  totalCost: {
    type: Number,
    required: true
  },
  revenue: {
    sellingPrice: Number,
    totalRevenue: Number,
    marketPlace: String
  },
  profit: Number,
  profitMargin: Number,
  quality: {
    grade: { type: String, enum: ['A', 'B', 'C', 'D'] },
    moistureContent: Number,
    impurities: Number
  },
  challenges: [String],
  notes: String,
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
yieldRecordSchema.index({ farm: 1, crop: 1, year: -1 });
yieldRecordSchema.index({ year: -1, season: 1 });

// Pre-save middleware to calculate derived fields
yieldRecordSchema.pre('save', function(next) {
  if (this.actualYield && this.area) {
    this.yieldPerHectare = this.actualYield / this.area;
  }

  if (this.revenue && this.revenue.totalRevenue && this.totalCost) {
    this.profit = this.revenue.totalRevenue - this.totalCost;
    this.profitMargin = (this.profit / this.revenue.totalRevenue) * 100;
  }

  next();
});

module.exports = mongoose.model('YieldRecord', yieldRecordSchema);
