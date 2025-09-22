const express = require('express');
const { query, body, validationResult } = require('express-validator');
const MarketData = require('../models/MarketData');
const Crop = require('../models/Crop');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/market/prices
// @desc    Get market prices with filtering
// @access  Private
router.get('/prices', authMiddleware, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('cropId').optional().isMongoId(),
  query('state').optional().isString(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('quality').optional().isIn(['premium', 'good', 'average', 'poor'])
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
    const query_obj = {};

    if (req.query.cropId) query_obj.crop = req.query.cropId;
    if (req.query.state) query_obj['market.location.state'] = new RegExp(req.query.state, 'i');
    if (req.query.quality) query_obj.quality = req.query.quality;

    if (req.query.dateFrom || req.query.dateTo) {
      query_obj.date = {};
      if (req.query.dateFrom) query_obj.date.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) query_obj.date.$lte = new Date(req.query.dateTo);
    }

    const marketData = await MarketData.find(query_obj)
      .populate('crop', 'name category')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MarketData.countDocuments(query_obj);

    res.json({
      success: true,
      data: marketData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get market prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching market prices'
    });
  }
});

// @route   GET /api/market/prices/:cropId/latest
// @desc    Get latest price for a specific crop
// @access  Private
router.get('/prices/:cropId/latest', authMiddleware, async (req, res) => {
  try {
    const latestPrice = await MarketData.findOne({
      crop: req.params.cropId
    })
    .populate('crop', 'name category')
    .sort({ date: -1 });

    if (!latestPrice) {
      return res.status(404).json({
        success: false,
        message: 'No price data found for this crop'
      });
    }

    res.json({
      success: true,
      data: latestPrice
    });

  } catch (error) {
    console.error('Get latest price error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid crop ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching latest price'
    });
  }
});

// @route   GET /api/market/trends/:cropId
// @desc    Get price trends for a specific crop
// @access  Private
router.get('/trends/:cropId', authMiddleware, [
  query('period').optional().isIn(['7days', '30days', '90days', '1year']),
  query('state').optional().isString()
], async (req, res) => {
  try {
    const period = req.query.period || '30days';
    const state = req.query.state;

    // Calculate date range
    const now = new Date();
    const daysMap = { '7days': 7, '30days': 30, '90days': 90, '1year': 365 };
    const fromDate = new Date(now.getTime() - (daysMap[period] * 24 * 60 * 60 * 1000));

    // Build query
    const query_obj = {
      crop: req.params.cropId,
      date: { $gte: fromDate, $lte: now }
    };

    if (state) {
      query_obj['market.location.state'] = new RegExp(state, 'i');
    }

    const priceData = await MarketData.find(query_obj)
      .populate('crop', 'name category')
      .sort({ date: 1 });

    if (priceData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No price data found for the specified period'
      });
    }

    // Calculate statistics
    const prices = priceData.map(d => d.price);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const latestPrice = prices[prices.length - 1];
    const firstPrice = prices[0];
    const priceChange = latestPrice - firstPrice;
    const priceChangePercent = (priceChange / firstPrice) * 100;

    // Calculate trend
    let trend = 'stable';
    if (Math.abs(priceChangePercent) > 5) {
      trend = priceChangePercent > 0 ? 'increasing' : 'decreasing';
    }

    // Group by date for visualization
    const dailyPrices = {};
    priceData.forEach(data => {
      const date = data.date.toISOString().split('T')[0];
      if (!dailyPrices[date]) {
        dailyPrices[date] = [];
      }
      dailyPrices[date].push(data.price);
    });

    const chartData = Object.keys(dailyPrices).map(date => ({
      date,
      price: dailyPrices[date].reduce((sum, p) => sum + p, 0) / dailyPrices[date].length,
      volume: dailyPrices[date].length
    }));

    res.json({
      success: true,
      data: {
        crop: priceData[0].crop,
        period,
        statistics: {
          avgPrice: Math.round(avgPrice * 100) / 100,
          minPrice,
          maxPrice,
          latestPrice,
          priceChange: Math.round(priceChange * 100) / 100,
          priceChangePercent: Math.round(priceChangePercent * 100) / 100,
          trend,
          dataPoints: priceData.length
        },
        chartData,
        rawData: priceData
      }
    });

  } catch (error) {
    console.error('Get price trends error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid crop ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching price trends'
    });
  }
});

// @route   GET /api/market/overview
// @desc    Get market overview with top performing crops
// @access  Private
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    // Get latest prices for all crops
    const latestPrices = await MarketData.aggregate([
      {
        $sort: { crop: 1, date: -1 }
      },
      {
        $group: {
          _id: '$crop',
          latestPrice: { $first: '$price' },
          latestDate: { $first: '$date' },
          trend: { $first: '$trend' },
          priceChange: { $first: '$priceChange.percentage' }
        }
      },
      {
        $lookup: {
          from: 'crops',
          localField: '_id',
          foreignField: '_id',
          as: 'crop'
        }
      },
      {
        $unwind: '$crop'
      },
      {
        $project: {
          cropName: '$crop.name',
          category: '$crop.category',
          latestPrice: 1,
          latestDate: 1,
          trend: 1,
          priceChange: { $ifNull: ['$priceChange', 0] }
        }
      },
      {
        $sort: { priceChange: -1 }
      }
    ]);

    // Get market summary
    const totalCrops = await Crop.countDocuments({ isActive: true });
    const totalMarketData = await MarketData.countDocuments();

    // Top gainers and losers
    const topGainers = latestPrices
      .filter(item => item.priceChange > 0)
      .slice(0, 5);

    const topLosers = latestPrices
      .filter(item => item.priceChange < 0)
      .sort((a, b) => a.priceChange - b.priceChange)
      .slice(0, 5);

    // Price distribution by category
    const categoryPrices = await MarketData.aggregate([
      {
        $lookup: {
          from: 'crops',
          localField: 'crop',
          foreignField: '_id',
          as: 'crop'
        }
      },
      {
        $unwind: '$crop'
      },
      {
        $group: {
          _id: '$crop.category',
          avgPrice: { $avg: '$price' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { avgPrice: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalCrops,
          totalMarketData,
          lastUpdated: new Date()
        },
        topGainers,
        topLosers,
        categoryPrices,
        allCrops: latestPrices
      }
    });

  } catch (error) {
    console.error('Get market overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching market overview'
    });
  }
});

// @route   POST /api/market/profit-calculator
// @desc    Calculate potential profit for crop
// @access  Private
router.post('/profit-calculator', authMiddleware, [
  body('cropId').isMongoId().withMessage('Invalid crop ID'),
  body('area').isNumeric({ min: 0 }).withMessage('Area must be positive'),
  body('expectedYield').optional().isNumeric({ min: 0 }),
  body('inputCosts.seeds').optional().isNumeric({ min: 0 }),
  body('inputCosts.fertilizer').optional().isNumeric({ min: 0 }),
  body('inputCosts.pesticides').optional().isNumeric({ min: 0 }),
  body('inputCosts.labor').optional().isNumeric({ min: 0 }),
  body('inputCosts.irrigation').optional().isNumeric({ min: 0 }),
  body('inputCosts.other').optional().isNumeric({ min: 0 }),
  body('sellingPrice').optional().isNumeric({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { cropId, area, inputCosts = {}, sellingPrice } = req.body;
    let { expectedYield } = req.body;

    // Get crop and latest market price
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    const latestMarketData = await MarketData.findOne({ crop: cropId })
      .sort({ date: -1 });

    // Use expected yield or crop average
    if (!expectedYield) {
      expectedYield = (crop.averageYield.min + crop.averageYield.max) / 2;
    }

    // Calculate total production
    const totalProduction = expectedYield * area;

    // Calculate total input costs
    const totalInputCosts = Object.values(inputCosts).reduce((sum, cost) => sum + (cost || 0), 0);

    // Determine selling price
    const marketPrice = latestMarketData ? latestMarketData.price : crop.marketInfo.averagePrice;
    const finalSellingPrice = sellingPrice || marketPrice;

    // Calculate revenue and profit
    const grossRevenue = totalProduction * finalSellingPrice;
    const netProfit = grossRevenue - totalInputCosts;
    const profitMargin = (netProfit / grossRevenue) * 100;
    const profitPerHectare = netProfit / area;
    const returnOnInvestment = (netProfit / totalInputCosts) * 100;

    // Risk assessment
    let riskLevel = 'medium';
    if (profitMargin > 30) riskLevel = 'low';
    else if (profitMargin < 10) riskLevel = 'high';

    // Recommendations
    const recommendations = [];
    if (profitMargin < 20) {
      recommendations.push('Consider reducing input costs or improving yield');
    }
    if (latestMarketData && latestMarketData.trend === 'increasing') {
      recommendations.push('Market trend is favorable - good time to sell');
    }
    if (expectedYield < crop.averageYield.min) {
      recommendations.push('Expected yield is below average - review farming practices');
    }

    res.json({
      success: true,
      data: {
        crop: {
          id: crop._id,
          name: crop.name,
          category: crop.category
        },
        inputs: {
          area,
          expectedYield,
          totalProduction,
          inputCosts,
          totalInputCosts,
          sellingPrice: finalSellingPrice,
          marketPrice
        },
        calculations: {
          grossRevenue: Math.round(grossRevenue * 100) / 100,
          netProfit: Math.round(netProfit * 100) / 100,
          profitMargin: Math.round(profitMargin * 100) / 100,
          profitPerHectare: Math.round(profitPerHectare * 100) / 100,
          returnOnInvestment: Math.round(returnOnInvestment * 100) / 100,
          riskLevel
        },
        marketInfo: latestMarketData ? {
          currentPrice: latestMarketData.price,
          trend: latestMarketData.trend,
          priceChange: latestMarketData.priceChange?.percentage || 0,
          lastUpdated: latestMarketData.date
        } : null,
        recommendations
      }
    });

  } catch (error) {
    console.error('Profit calculator error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating profit'
    });
  }
});

// @route   GET /api/market/forecast/:cropId
// @desc    Get price forecast for crop
// @access  Private
router.get('/forecast/:cropId', authMiddleware, [
  query('period').optional().isIn(['1week', '1month', '3months', '6months'])
], async (req, res) => {
  try {
    const period = req.query.period || '1month';
    const periodDays = { '1week': 7, '1month': 30, '3months': 90, '6months': 180 };
    const days = periodDays[period];

    // Get historical data for the past year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const historicalData = await MarketData.find({
      crop: req.params.cropId,
      date: { $gte: oneYearAgo }
    }).sort({ date: 1 });

    if (historicalData.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient historical data for forecasting'
      });
    }

    // Simple price forecasting using moving averages and seasonal patterns
    const prices = historicalData.map(d => d.price);
    const recentPrices = prices.slice(-30); // Last 30 data points
    const avgPrice = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;

    // Calculate seasonal factor (very simplified)
    const currentMonth = new Date().getMonth();
    const seasonalFactors = [1.0, 1.0, 1.1, 1.1, 1.0, 0.9, 0.8, 0.8, 0.9, 1.0, 1.1, 1.1]; // Example factors
    const seasonalFactor = seasonalFactors[currentMonth];

    // Generate forecast
    const forecast = [];
    let currentPrice = avgPrice;
    const volatility = 0.05; // 5% volatility

    for (let i = 1; i <= days; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);

      // Apply trend and seasonality
      const trendFactor = 1 + (Math.random() - 0.5) * volatility;
      const futureSeasonalFactor = seasonalFactors[futureDate.getMonth()];

      currentPrice = currentPrice * trendFactor * (futureSeasonalFactor / seasonalFactor);

      const confidence = Math.max(90 - (i / days) * 30, 50); // Decreasing confidence over time

      forecast.push({
        date: futureDate,
        predictedPrice: Math.round(currentPrice * 100) / 100,
        confidence: Math.round(confidence),
        range: {
          low: Math.round(currentPrice * 0.9 * 100) / 100,
          high: Math.round(currentPrice * 1.1 * 100) / 100
        }
      });
    }

    // Calculate forecast summary
    const forecastPrices = forecast.map(f => f.predictedPrice);
    const avgForecastPrice = forecastPrices.reduce((sum, p) => sum + p, 0) / forecastPrices.length;
    const priceChange = avgForecastPrice - avgPrice;
    const priceChangePercent = (priceChange / avgPrice) * 100;

    res.json({
      success: true,
      data: {
        crop: req.params.cropId,
        period,
        currentPrice: avgPrice,
        forecast,
        summary: {
          avgForecastPrice: Math.round(avgForecastPrice * 100) / 100,
          priceChange: Math.round(priceChange * 100) / 100,
          priceChangePercent: Math.round(priceChangePercent * 100) / 100,
          trend: priceChangePercent > 2 ? 'increasing' : priceChangePercent < -2 ? 'decreasing' : 'stable',
          avgConfidence: Math.round(forecast.reduce((sum, f) => sum + f.confidence, 0) / forecast.length)
        },
        disclaimers: [
          'Forecasts are based on historical data and market trends',
          'Actual prices may vary due to unforeseen market conditions',
          'Use forecasts as guidance only, not for investment decisions'
        ]
      }
    });

  } catch (error) {
    console.error('Price forecast error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid crop ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while generating forecast'
    });
  }
});

module.exports = router;
