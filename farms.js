const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Farm = require('../models/Farm');
const YieldRecord = require('../models/YieldRecord');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Validation rules
const farmValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Farm name must be between 2-100 characters'),
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [longitude, latitude]'),
  body('totalArea').isNumeric({ min: 0 }).withMessage('Total area must be a positive number'),
  body('cultivatedArea').isNumeric({ min: 0 }).withMessage('Cultivated area must be a positive number'),
  body('soilType').isIn(['clay', 'sandy', 'loamy', 'silt', 'peat', 'chalk']).withMessage('Invalid soil type')
];

// @route   GET /api/farms
// @desc    Get all farms for authenticated user
// @access  Private
router.get('/', authMiddleware, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sort').optional().isIn(['name', 'createdAt', 'totalArea']),
  query('order').optional().isIn(['asc', 'desc'])
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
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const query_obj = { owner: req.user.id, isActive: true };

    const farms = await Farm.find(query_obj)
      .populate('currentCrops.cropId', 'name category season')
      .sort({ [sort]: order })
      .skip(skip)
      .limit(limit);

    const total = await Farm.countDocuments(query_obj);

    res.json({
      success: true,
      data: farms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get farms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching farms'
    });
  }
});

// @route   GET /api/farms/:id
// @desc    Get single farm by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const farm = await Farm.findOne({
      _id: req.params.id,
      owner: req.user.id,
      isActive: true
    }).populate([
      { path: 'currentCrops.cropId', select: 'name category season waterRequirement' },
      { path: 'yieldRecords', options: { sort: { year: -1, season: -1 }, limit: 10 } }
    ]);

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    res.json({
      success: true,
      data: farm
    });

  } catch (error) {
    console.error('Get farm error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid farm ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching farm'
    });
  }
});

// @route   POST /api/farms
// @desc    Create new farm
// @access  Private
router.post('/', authMiddleware, farmValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if cultivated area <= total area
    if (req.body.cultivatedArea > req.body.totalArea) {
      return res.status(400).json({
        success: false,
        message: 'Cultivated area cannot exceed total area'
      });
    }

    const farmData = {
      ...req.body,
      owner: req.user.id
    };

    const farm = new Farm(farmData);
    await farm.save();

    await farm.populate('currentCrops.cropId', 'name category season');

    res.status(201).json({
      success: true,
      message: 'Farm created successfully',
      data: farm
    });

  } catch (error) {
    console.error('Create farm error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while creating farm'
    });
  }
});

// @route   PUT /api/farms/:id
// @desc    Update farm
// @access  Private
router.put('/:id', authMiddleware, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('totalArea').optional().isNumeric({ min: 0 }),
  body('cultivatedArea').optional().isNumeric({ min: 0 }),
  body('soilType').optional().isIn(['clay', 'sandy', 'loamy', 'silt', 'peat', 'chalk'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const farm = await Farm.findOne({
      _id: req.params.id,
      owner: req.user.id,
      isActive: true
    });

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    // Check cultivated area constraint
    const totalArea = req.body.totalArea || farm.totalArea;
    const cultivatedArea = req.body.cultivatedArea || farm.cultivatedArea;

    if (cultivatedArea > totalArea) {
      return res.status(400).json({
        success: false,
        message: 'Cultivated area cannot exceed total area'
      });
    }

    Object.assign(farm, req.body);
    await farm.save();

    await farm.populate('currentCrops.cropId', 'name category season');

    res.json({
      success: true,
      message: 'Farm updated successfully',
      data: farm
    });

  } catch (error) {
    console.error('Update farm error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid farm ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating farm'
    });
  }
});

// @route   DELETE /api/farms/:id
// @desc    Delete (deactivate) farm
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const farm = await Farm.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    res.json({
      success: true,
      message: 'Farm deleted successfully'
    });

  } catch (error) {
    console.error('Delete farm error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid farm ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while deleting farm'
    });
  }
});

// @route   POST /api/farms/:id/crops
// @desc    Add crop to farm
// @access  Private
router.post('/:id/crops', authMiddleware, [
  body('cropId').isMongoId().withMessage('Invalid crop ID'),
  body('area').isNumeric({ min: 0 }).withMessage('Area must be a positive number'),
  body('plantingDate').isISO8601().withMessage('Invalid planting date'),
  body('expectedHarvestDate').isISO8601().withMessage('Invalid harvest date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const farm = await Farm.findOne({
      _id: req.params.id,
      owner: req.user.id,
      isActive: true
    });

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    // Check if total crop area doesn't exceed cultivated area
    const currentCropArea = farm.currentCrops.reduce((sum, crop) => sum + crop.area, 0);
    if (currentCropArea + req.body.area > farm.cultivatedArea) {
      return res.status(400).json({
        success: false,
        message: 'Total crop area cannot exceed cultivated area'
      });
    }

    farm.currentCrops.push(req.body);
    await farm.save();

    await farm.populate('currentCrops.cropId', 'name category season');

    res.json({
      success: true,
      message: 'Crop added to farm successfully',
      data: farm
    });

  } catch (error) {
    console.error('Add crop error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding crop'
    });
  }
});

// @route   PUT /api/farms/:id/crops/:cropIndex
// @desc    Update crop status
// @access  Private
router.put('/:id/crops/:cropIndex', authMiddleware, [
  body('status').optional().isIn(['planted', 'growing', 'flowering', 'harvesting', 'harvested'])
], async (req, res) => {
  try {
    const farm = await Farm.findOne({
      _id: req.params.id,
      owner: req.user.id,
      isActive: true
    });

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    const cropIndex = parseInt(req.params.cropIndex);
    if (!farm.currentCrops[cropIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    Object.assign(farm.currentCrops[cropIndex], req.body);
    await farm.save();

    await farm.populate('currentCrops.cropId', 'name category season');

    res.json({
      success: true,
      message: 'Crop updated successfully',
      data: farm
    });

  } catch (error) {
    console.error('Update crop error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating crop'
    });
  }
});

// @route   GET /api/farms/:id/analytics
// @desc    Get farm analytics
// @access  Private
router.get('/:id/analytics', authMiddleware, async (req, res) => {
  try {
    const farm = await Farm.findOne({
      _id: req.params.id,
      owner: req.user.id,
      isActive: true
    });

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    // Get yield records for analysis
    const yieldRecords = await YieldRecord.find({ farm: farm._id })
      .populate('crop', 'name category')
      .sort({ year: -1, season: -1 });

    // Calculate analytics
    const totalRecords = yieldRecords.length;
    const avgYield = yieldRecords.reduce((sum, record) => sum + record.yieldPerHectare, 0) / totalRecords || 0;
    const avgProfit = yieldRecords.reduce((sum, record) => sum + (record.profit || 0), 0) / totalRecords || 0;
    const avgProfitMargin = yieldRecords.reduce((sum, record) => sum + (record.profitMargin || 0), 0) / totalRecords || 0;

    // Yield trends by year
    const yieldTrends = {};
    yieldRecords.forEach(record => {
      if (!yieldTrends[record.year]) {
        yieldTrends[record.year] = [];
      }
      yieldTrends[record.year].push({
        crop: record.crop.name,
        yield: record.yieldPerHectare,
        profit: record.profit
      });
    });

    // Crop performance
    const cropPerformance = {};
    yieldRecords.forEach(record => {
      const cropName = record.crop.name;
      if (!cropPerformance[cropName]) {
        cropPerformance[cropName] = {
          totalYield: 0,
          totalProfit: 0,
          records: 0,
          category: record.crop.category
        };
      }
      cropPerformance[cropName].totalYield += record.yieldPerHectare;
      cropPerformance[cropName].totalProfit += (record.profit || 0);
      cropPerformance[cropName].records += 1;
    });

    // Calculate averages for each crop
    Object.keys(cropPerformance).forEach(crop => {
      const perf = cropPerformance[crop];
      perf.avgYield = perf.totalYield / perf.records;
      perf.avgProfit = perf.totalProfit / perf.records;
    });

    res.json({
      success: true,
      data: {
        farm: {
          id: farm._id,
          name: farm.name,
          totalArea: farm.totalArea,
          cultivatedArea: farm.cultivatedArea,
          currentCropsCount: farm.currentCrops.length
        },
        summary: {
          totalRecords,
          avgYield: Math.round(avgYield * 100) / 100,
          avgProfit: Math.round(avgProfit * 100) / 100,
          avgProfitMargin: Math.round(avgProfitMargin * 100) / 100
        },
        yieldTrends,
        cropPerformance,
        recentRecords: yieldRecords.slice(0, 5)
      }
    });

  } catch (error) {
    console.error('Farm analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    });
  }
});

module.exports = router;
