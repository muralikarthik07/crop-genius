const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Crop name is required'],
    trim: true,
    unique: true
  },
  scientificName: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['cereals', 'pulses', 'oilseeds', 'cash_crops', 'vegetables', 'fruits', 'spices'],
    required: true
  },
  season: {
    type: String,
    enum: ['kharif', 'rabi', 'zaid', 'year_round'],
    required: true
  },
  growthDuration: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  waterRequirement: {
    type: String,
    enum: ['very_low', 'low', 'medium', 'high', 'very_high'],
    required: true
  },
  soilRequirements: {
    preferredSoilTypes: [String],
    pHRange: {
      min: { type: Number, min: 0, max: 14 },
      max: { type: Number, min: 0, max: 14 }
    },
    nutrients: {
      nitrogen: { type: String, enum: ['low', 'medium', 'high'] },
      phosphorus: { type: String, enum: ['low', 'medium', 'high'] },
      potassium: { type: String, enum: ['low', 'medium', 'high'] }
    }
  },
  climaticConditions: {
    temperatureRange: {
      min: Number,
      max: Number
    },
    rainfallRequirement: {
      min: Number,
      max: Number
    },
    humidity: {
      min: Number,
      max: Number
    }
  },
  commonDiseases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Disease'
  }],
  averageYield: {
    min: Number,
    max: Number,
    unit: { type: String, default: 'kg/hectare' }
  },
  marketInfo: {
    averagePrice: Number,
    priceUnit: { type: String, default: 'per_quintal' },
    marketDemand: { type: String, enum: ['low', 'medium', 'high'] }
  },
  nutritionalInfo: {
    protein: Number,
    carbohydrates: Number,
    fat: Number,
    fiber: Number,
    vitamins: [String],
    minerals: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Crop', cropSchema);
