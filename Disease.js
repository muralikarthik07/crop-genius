const mongoose = require('mongoose');

const diseaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Disease name is required'],
    trim: true,
    unique: true
  },
  scientificName: String,
  type: {
    type: String,
    enum: ['fungal', 'bacterial', 'viral', 'pest', 'nutritional', 'environmental'],
    required: true
  },
  affectedCrops: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop'
  }],
  symptoms: [{
    description: String,
    stage: { type: String, enum: ['early', 'intermediate', 'advanced'] },
    severity: { type: String, enum: ['mild', 'moderate', 'severe'] }
  }],
  causes: [String],
  favorableConditions: {
    temperature: {
      min: Number,
      max: Number
    },
    humidity: {
      min: Number,
      max: Number
    },
    rainfall: String,
    soilConditions: [String]
  },
  treatment: {
    chemical: [{
      name: String,
      dosage: String,
      applicationMethod: String,
      frequency: String,
      precautions: [String]
    }],
    organic: [{
      method: String,
      materials: [String],
      procedure: String
    }],
    biological: [{
      agent: String,
      application: String
    }]
  },
  prevention: {
    culturalPractices: [String],
    resistantVarieties: [String],
    cropRotation: [String],
    soilManagement: [String]
  },
  economicImpact: {
    yieldLoss: {
      min: Number,
      max: Number,
      unit: String
    },
    treatmentCost: Number
  },
  images: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Disease', diseaseSchema);
