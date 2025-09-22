const express = require('express');
const { query, body, validationResult } = require('express-validator');
const Crop = require('../models/Crop');
const Disease = require('../models/Disease');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/crops
// @desc    Get all crops with filtering and pagination
// @access  Private
router.get('/', authMiddleware, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isIn(['cereals', 'pulses', 'oilseeds', 'cash_crops', 'vegetables', 'fruits', 'spices']),
  query('season').optional().isIn(['kharif', 'rabi', 'zaid', 'year_round']),
  query('waterRequirement').optional().isIn(['very_low', 'low', 'medium', 'high', 'very_high']),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    const query_obj = { isActive: true };

    if (req.query.category) query_obj.category = req.query.category;
    if (req.query.season) query_obj.season = req.query.season;
    if (req.query.waterRequirement) query_obj.waterRequirement = req.query.waterRequirement;

    if (req.query.search) {
      query_obj.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { scientificName: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const crops = await Crop.find(query_obj)
      .populate('commonDiseases', 'name type')
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    const total = await Crop.countDocuments(query_obj);

    res.json({
      success: true,
      data: crops,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get crops error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching crops'
    });
  }
});

// @route   GET /api/crops/:id
// @desc    Get single crop by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, isActive: true })
      .populate('commonDiseases');

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    res.json({
      success: true,
      data: crop
    });

  } catch (error) {
    console.error('Get crop error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid crop ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching crop'
    });
  }
});

// @route   POST /api/crops/recommend
// @desc    Get crop recommendations based on conditions
// @access  Private
router.post('/recommend', authMiddleware, [
  body('soilType').isIn(['clay', 'sandy', 'loamy', 'silt', 'peat', 'chalk']),
  body('pH').isFloat({ min: 0, max: 14 }),
  body('nitrogen').optional().isNumeric({ min: 0 }),
  body('phosphorus').optional().isNumeric({ min: 0 }),
  body('potassium').optional().isNumeric({ min: 0 }),
  body('temperature').isNumeric(),
  body('rainfall').optional().isNumeric({ min: 0 }),
  body('humidity').optional().isNumeric({ min: 0, max: 100 }),
  body('location.coordinates').optional().isArray({ min: 2, max: 2 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      soilType,
      pH,
      nitrogen = 0,
      phosphorus = 0,
      potassium = 0,
      temperature,
      rainfall = 0,
      humidity = 50
    } = req.body;

    // Get all active crops
    const allCrops = await Crop.find({ isActive: true });

    // Score each crop based on conditions
    const recommendations = allCrops.map(crop => {
      let score = 0;
      let reasons = [];

      // Soil type matching
      if (crop.soilRequirements.preferredSoilTypes.includes(soilType)) {
        score += 25;
        reasons.push(`Suitable for ${soilType} soil`);
      }

      // pH range matching
      if (crop.soilRequirements.pHRange) {
        const { min: pHMin, max: pHMax } = crop.soilRequirements.pHRange;
        if (pH >= pHMin && pH <= pHMax) {
          score += 20;
          reasons.push(`Optimal pH range (${pHMin}-${pHMax})`);
        } else if (Math.abs(pH - ((pHMin + pHMax) / 2)) <= 1) {
          score += 10;
          reasons.push(`Acceptable pH range`);
        }
      }

      // Temperature matching
      if (crop.climaticConditions.temperatureRange) {
        const { min: tempMin, max: tempMax } = crop.climaticConditions.temperatureRange;
        if (temperature >= tempMin && temperature <= tempMax) {
          score += 20;
          reasons.push(`Ideal temperature range (${tempMin}°C-${tempMax}°C)`);
        } else if (Math.abs(temperature - ((tempMin + tempMax) / 2)) <= 5) {
          score += 10;
          reasons.push(`Acceptable temperature`);
        }
      }

      // Rainfall matching
      if (crop.climaticConditions.rainfallRequirement) {
        const { min: rainMin, max: rainMax } = crop.climaticConditions.rainfallRequirement;
        if (rainfall >= rainMin && rainfall <= rainMax) {
          score += 15;
          reasons.push(`Suitable rainfall (${rainMin}-${rainMax}mm)`);
        }
      }

      // Nutrient requirements (NPK)
      const nutrientMap = { low: 20, medium: 50, high: 80 };

      if (crop.soilRequirements.nutrients) {
        if (nitrogen >= nutrientMap[crop.soilRequirements.nutrients.nitrogen]) {
          score += 8;
          reasons.push('Good nitrogen levels');
        }
        if (phosphorus >= nutrientMap[crop.soilRequirements.nutrients.phosphorus]) {
          score += 7;
          reasons.push('Good phosphorus levels');
        }
        if (potassium >= nutrientMap[crop.soilRequirements.nutrients.potassium]) {
          score += 5;
          reasons.push('Good potassium levels');
        }
      }

      // Season consideration (bonus points for current season)
      const currentMonth = new Date().getMonth() + 1;
      const currentSeason = getCurrentSeason(currentMonth);
      if (crop.season === currentSeason || crop.season === 'year_round') {
        score += 10;
        reasons.push(`Suitable for ${currentSeason} season`);
      }

      return {
        crop,
        score: Math.min(score, 100),
        confidence: Math.min(score, 95),
        reasons,
        suitability: score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low'
      };
    });

    // Sort by score and take top recommendations
    const topRecommendations = recommendations
      .filter(rec => rec.score >= 30) // Minimum threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    res.json({
      success: true,
      message: 'Crop recommendations generated successfully',
      data: {
        conditions: req.body,
        recommendations: topRecommendations,
        totalAnalyzed: allCrops.length
      }
    });

  } catch (error) {
    console.error('Crop recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating recommendations'
    });
  }
});

// Helper function to determine current season
function getCurrentSeason(month) {
  if (month >= 6 && month <= 10) return 'kharif'; // June-October
  if (month >= 11 || month <= 3) return 'rabi'; // November-March
  return 'zaid'; // April-May
}

// @route   POST /api/crops/yield-prediction
// @desc    Predict crop yield
// @access  Private
router.post('/yield-prediction', authMiddleware, [
  body('cropId').isMongoId().withMessage('Invalid crop ID'),
  body('area').isNumeric({ min: 0 }).withMessage('Area must be positive'),
  body('soilHealth.pH').optional().isFloat({ min: 0, max: 14 }),
  body('soilHealth.nitrogen').optional().isNumeric({ min: 0 }),
  body('soilHealth.phosphorus').optional().isNumeric({ min: 0 }),
  body('soilHealth.potassium').optional().isNumeric({ min: 0 }),
  body('weatherConditions.avgTemperature').isNumeric(),
  body('weatherConditions.totalRainfall').optional().isNumeric({ min: 0 }),
  body('weatherConditions.avgHumidity').optional().isNumeric({ min: 0, max: 100 }),
  body('farmingPractices.irrigationMethod').optional().isIn(['drip', 'sprinkler', 'surface', 'subsurface', 'manual']),
  body('farmingPractices.fertilizerUsage').optional().isIn(['organic', 'chemical', 'mixed', 'minimal'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { cropId, area, soilHealth = {}, weatherConditions, farmingPractices = {} } = req.body;

    // Get crop information
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    // Simple yield prediction algorithm
    let baseYield = (crop.averageYield.min + crop.averageYield.max) / 2;
    let yieldFactor = 1.0;
    let confidenceFactor = 0.7; // Base confidence
    let riskLevel = 'medium';
    let factors = [];

    // Soil health factors
    if (soilHealth.pH) {
      const optimalPH = (crop.soilRequirements.pHRange.min + crop.soilRequirements.pHRange.max) / 2;
      const pHDiff = Math.abs(soilHealth.pH - optimalPH);
      if (pHDiff <= 0.5) {
        yieldFactor += 0.1;
        factors.push('Optimal soil pH');
        confidenceFactor += 0.1;
      } else if (pHDiff > 2) {
        yieldFactor -= 0.15;
        factors.push('Suboptimal soil pH');
      }
    }

    // NPK factors
    const nutrientLevels = { low: 30, medium: 60, high: 90 };
    ['nitrogen', 'phosphorus', 'potassium'].forEach(nutrient => {
      if (soilHealth[nutrient]) {
        const required = nutrientLevels[crop.soilRequirements.nutrients[nutrient]] || 50;
        if (soilHealth[nutrient] >= required) {
          yieldFactor += 0.05;
          factors.push(`Adequate ${nutrient}`);
        } else if (soilHealth[nutrient] < required * 0.5) {
          yieldFactor -= 0.1;
          factors.push(`Low ${nutrient}`);
        }
      }
    });

    // Weather factors
    if (weatherConditions.avgTemperature) {
      const { min: tempMin, max: tempMax } = crop.climaticConditions.temperatureRange;
      const optimalTemp = (tempMin + tempMax) / 2;
      const tempDiff = Math.abs(weatherConditions.avgTemperature - optimalTemp);

      if (tempDiff <= 3) {
        yieldFactor += 0.08;
        factors.push('Favorable temperature');
        confidenceFactor += 0.05;
      } else if (tempDiff > 10) {
        yieldFactor -= 0.2;
        factors.push('Extreme temperature stress');
        riskLevel = 'high';
      }
    }

    // Rainfall factors
    if (weatherConditions.totalRainfall) {
      const { min: rainMin, max: rainMax } = crop.climaticConditions.rainfallRequirement;
      if (weatherConditions.totalRainfall >= rainMin && weatherConditions.totalRainfall <= rainMax) {
        yieldFactor += 0.1;
        factors.push('Adequate rainfall');
        confidenceFactor += 0.05;
      } else if (weatherConditions.totalRainfall < rainMin * 0.7) {
        yieldFactor -= 0.15;
        factors.push('Water stress likely');
      }
    }

    // Farming practices
    if (farmingPractices.irrigationMethod) {
      const irrigationBonus = {
        'drip': 0.15,
        'sprinkler': 0.1,
        'surface': 0.05,
        'subsurface': 0.12,
        'manual': 0
      };
      yieldFactor += irrigationBonus[farmingPractices.irrigationMethod] || 0;
      if (irrigationBonus[farmingPractices.irrigationMethod] > 0) {
        factors.push(`Efficient ${farmingPractices.irrigationMethod} irrigation`);
      }
    }

    // Calculate final yield
    const adjustedYield = baseYield * Math.max(yieldFactor, 0.3); // Minimum 30% of base yield
    const totalYield = adjustedYield * area;
    const confidence = Math.min(Math.max(confidenceFactor * 100, 50), 95);

    // Risk assessment
    if (yieldFactor >= 1.1) riskLevel = 'low';
    else if (yieldFactor <= 0.8) riskLevel = 'high';

    // Generate forecast data for visualization
    const forecast = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      predictedYield: adjustedYield * (0.9 + Math.random() * 0.2),
      confidence: confidence + (Math.random() - 0.5) * 10
    }));

    res.json({
      success: true,
      message: 'Yield prediction completed successfully',
      data: {
        crop: {
          id: crop._id,
          name: crop.name,
          category: crop.category
        },
        prediction: {
          yieldPerHectare: Math.round(adjustedYield * 100) / 100,
          totalYield: Math.round(totalYield * 100) / 100,
          confidence: Math.round(confidence),
          riskLevel,
          factors,
          baseYield,
          yieldFactor: Math.round(yieldFactor * 1000) / 1000
        },
        forecast,
        conditions: {
          area,
          soilHealth,
          weatherConditions,
          farmingPractices
        }
      }
    });

  } catch (error) {
    console.error('Yield prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while predicting yield'
    });
  }
});

// @route   GET /api/crops/categories
// @desc    Get crop categories with counts
// @access  Private
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const categories = await Crop.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
});

module.exports = router;
