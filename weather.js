const express = require('express');
const axios = require('axios');
const { query, validationResult } = require('express-validator');
const Farm = require('../models/Farm');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/weather/current/:farmId
// @desc    Get current weather for a farm
// @access  Private
router.get('/current/:farmId', authMiddleware, async (req, res) => {
  try {
    const farm = await Farm.findOne({
      _id: req.params.farmId,
      owner: req.user.id,
      isActive: true
    });

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    const [longitude, latitude] = farm.location.coordinates;

    // Fetch weather data from OpenWeatherMap API
    const weatherResponse = await axios.get(
      `${process.env.WEATHER_API_URL}/weather`,
      {
        params: {
          lat: latitude,
          lon: longitude,
          appid: process.env.WEATHER_API_KEY,
          units: 'metric'
        }
      }
    );

    const weatherData = weatherResponse.data;

    // Update farm's weather data
    const updatedWeatherData = {
      lastUpdated: new Date(),
      temperature: weatherData.main.temp,
      humidity: weatherData.main.humidity,
      rainfall: weatherData.rain ? weatherData.rain['1h'] || 0 : 0,
      windSpeed: weatherData.wind.speed,
      conditions: weatherData.weather[0].description,
      pressure: weatherData.main.pressure,
      visibility: weatherData.visibility / 1000, // Convert to km
      uvIndex: weatherData.uvi || 0
    };

    farm.weatherData = { ...farm.weatherData, ...updatedWeatherData };
    await farm.save();

    res.json({
      success: true,
      data: {
        farm: {
          id: farm._id,
          name: farm.name,
          location: farm.location
        },
        weather: {
          ...updatedWeatherData,
          icon: weatherData.weather[0].icon,
          sunrise: new Date(weatherData.sys.sunrise * 1000),
          sunset: new Date(weatherData.sys.sunset * 1000)
        }
      }
    });

  } catch (error) {
    console.error('Get current weather error:', error);

    if (error.response?.status === 401) {
      return res.status(500).json({
        success: false,
        message: 'Weather API authentication failed'
      });
    }

    if (error.response?.status === 404) {
      return res.status(400).json({
        success: false,
        message: 'Weather data not available for this location'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching weather data'
    });
  }
});

// @route   GET /api/weather/forecast/:farmId
// @desc    Get weather forecast for a farm
// @access  Private
router.get('/forecast/:farmId', authMiddleware, [
  query('days').optional().isInt({ min: 1, max: 7 }).withMessage('Days must be between 1-7')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const days = parseInt(req.query.days) || 5;

    const farm = await Farm.findOne({
      _id: req.params.farmId,
      owner: req.user.id,
      isActive: true
    });

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    const [longitude, latitude] = farm.location.coordinates;

    // Fetch forecast data
    const forecastResponse = await axios.get(
      `${process.env.WEATHER_API_URL}/forecast`,
      {
        params: {
          lat: latitude,
          lon: longitude,
          appid: process.env.WEATHER_API_KEY,
          units: 'metric',
          cnt: days * 8 // 8 forecasts per day (3-hour intervals)
        }
      }
    );

    const forecastData = forecastResponse.data.list;

    // Group forecast by days
    const dailyForecast = {};

    forecastData.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString();

      if (!dailyForecast[date]) {
        dailyForecast[date] = {
          date: new Date(item.dt * 1000),
          temperature: { min: item.main.temp, max: item.main.temp },
          humidity: [],
          rainfall: 0,
          windSpeed: [],
          conditions: [],
          pressure: [],
          details: []
        };
      }

      const day = dailyForecast[date];
      day.temperature.min = Math.min(day.temperature.min, item.main.temp);
      day.temperature.max = Math.max(day.temperature.max, item.main.temp);
      day.humidity.push(item.main.humidity);
      day.rainfall += item.rain ? (item.rain['3h'] || 0) : 0;
      day.windSpeed.push(item.wind.speed);
      day.conditions.push(item.weather[0].description);
      day.pressure.push(item.main.pressure);

      day.details.push({
        time: new Date(item.dt * 1000),
        temperature: item.main.temp,
        humidity: item.main.humidity,
        conditions: item.weather[0].description,
        icon: item.weather[0].icon,
        windSpeed: item.wind.speed,
        rainfall: item.rain ? (item.rain['3h'] || 0) : 0
      });
    });

    // Calculate averages for each day
    const forecast = Object.values(dailyForecast).map(day => ({
      date: day.date,
      temperature: {
        min: Math.round(day.temperature.min * 10) / 10,
        max: Math.round(day.temperature.max * 10) / 10,
        avg: Math.round((day.temperature.min + day.temperature.max) / 2 * 10) / 10
      },
      humidity: Math.round(day.humidity.reduce((sum, h) => sum + h, 0) / day.humidity.length),
      rainfall: Math.round(day.rainfall * 10) / 10,
      windSpeed: Math.round(day.windSpeed.reduce((sum, w) => sum + w, 0) / day.windSpeed.length * 10) / 10,
      pressure: Math.round(day.pressure.reduce((sum, p) => sum + p, 0) / day.pressure.length),
      conditions: day.conditions[Math.floor(day.conditions.length / 2)], // Middle condition
      details: day.details
    }));

    // Update farm forecast
    farm.weatherData.forecast = forecast.slice(0, 7); // Store max 7 days
    await farm.save();

    // Generate farming recommendations based on forecast
    const recommendations = generateWeatherRecommendations(forecast, farm);

    res.json({
      success: true,
      data: {
        farm: {
          id: farm._id,
          name: farm.name,
          location: farm.location
        },
        forecast,
        recommendations,
        summary: {
          avgTemperature: forecast.reduce((sum, day) => sum + day.temperature.avg, 0) / forecast.length,
          totalRainfall: forecast.reduce((sum, day) => sum + day.rainfall, 0),
          avgHumidity: forecast.reduce((sum, day) => sum + day.humidity, 0) / forecast.length,
          avgWindSpeed: forecast.reduce((sum, day) => sum + day.windSpeed, 0) / forecast.length
        }
      }
    });

  } catch (error) {
    console.error('Get weather forecast error:', error);

    if (error.response?.status === 401) {
      return res.status(500).json({
        success: false,
        message: 'Weather API authentication failed'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching weather forecast'
    });
  }
});

// Helper function to generate weather-based recommendations
function generateWeatherRecommendations(forecast, farm) {
  const recommendations = [];

  const avgTemp = forecast.reduce((sum, day) => sum + day.temperature.avg, 0) / forecast.length;
  const totalRainfall = forecast.reduce((sum, day) => sum + day.rainfall, 0);
  const avgHumidity = forecast.reduce((sum, day) => sum + day.humidity, 0) / forecast.length;

  // Temperature-based recommendations
  if (avgTemp > 35) {
    recommendations.push({
      type: 'warning',
      category: 'temperature',
      message: 'High temperatures expected. Increase irrigation frequency and consider shade nets.',
      priority: 'high'
    });
  } else if (avgTemp < 10) {
    recommendations.push({
      type: 'warning',
      category: 'temperature',
      message: 'Low temperatures expected. Protect crops from frost damage.',
      priority: 'high'
    });
  }

  // Rainfall recommendations
  if (totalRainfall > 50) {
    recommendations.push({
      type: 'info',
      category: 'irrigation',
      message: 'Good rainfall expected. Reduce irrigation and ensure proper drainage.',
      priority: 'medium'
    });
  } else if (totalRainfall < 5) {
    recommendations.push({
      type: 'warning',
      category: 'irrigation',
      message: 'Low rainfall expected. Plan for increased irrigation.',
      priority: 'high'
    });
  }

  // Humidity recommendations
  if (avgHumidity > 80) {
    recommendations.push({
      type: 'warning',
      category: 'disease',
      message: 'High humidity increases disease risk. Monitor crops closely and ensure good air circulation.',
      priority: 'medium'
    });
  }

  // Check for extreme weather
  const hasHeavyRain = forecast.some(day => day.rainfall > 20);
  if (hasHeavyRain) {
    recommendations.push({
      type: 'alert',
      category: 'weather',
      message: 'Heavy rainfall expected. Secure equipment and ensure field drainage.',
      priority: 'high'
    });
  }

  const hasHighWind = forecast.some(day => day.windSpeed > 20);
  if (hasHighWind) {
    recommendations.push({
      type: 'alert',
      category: 'weather',
      message: 'Strong winds expected. Secure structures and support tall crops.',
      priority: 'high'
    });
  }

  return recommendations;
}

// @route   GET /api/weather/alerts/:farmId
// @desc    Get weather alerts for a farm
// @access  Private
router.get('/alerts/:farmId', authMiddleware, async (req, res) => {
  try {
    const farm = await Farm.findOne({
      _id: req.params.farmId,
      owner: req.user.id,
      isActive: true
    });

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    const [longitude, latitude] = farm.location.coordinates;

    // For demo purposes, generate mock alerts based on current conditions
    const alerts = [];

    if (farm.weatherData?.temperature) {
      const temp = farm.weatherData.temperature;
      const humidity = farm.weatherData.humidity;
      const rainfall = farm.weatherData.rainfall || 0;

      // Temperature alerts
      if (temp > 40) {
        alerts.push({
          id: 'temp_extreme_high',
          type: 'severe',
          category: 'temperature',
          title: 'Extreme Heat Warning',
          description: `Temperature is ${temp}°C. Take immediate action to protect crops.`,
          recommendations: [
            'Increase irrigation frequency',
            'Apply mulch to conserve soil moisture',
            'Consider temporary shade structures'
          ],
          issuedAt: new Date(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
      } else if (temp < 2) {
        alerts.push({
          id: 'temp_frost',
          type: 'severe',
          category: 'temperature',
          title: 'Frost Warning',
          description: `Temperature is ${temp}°C. Frost damage likely.`,
          recommendations: [
            'Cover sensitive crops',
            'Use frost protection methods',
            'Harvest mature crops if possible'
          ],
          issuedAt: new Date(),
          validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000)
        });
      }

      // Humidity and disease risk
      if (humidity > 85 && temp > 20 && temp < 30) {
        alerts.push({
          id: 'disease_risk_high',
          type: 'moderate',
          category: 'disease',
          title: 'High Disease Risk',
          description: `High humidity (${humidity}%) and favorable temperature create disease-friendly conditions.`,
          recommendations: [
            'Increase crop monitoring frequency',
            'Ensure good air circulation',
            'Consider preventive fungicide application'
          ],
          issuedAt: new Date(),
          validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000)
        });
      }

      // Drought conditions
      if (rainfall === 0 && temp > 30 && humidity < 40) {
        alerts.push({
          id: 'drought_warning',
          type: 'moderate',
          category: 'water',
          title: 'Dry Conditions Alert',
          description: 'No recent rainfall with high temperature and low humidity.',
          recommendations: [
            'Check soil moisture levels',
            'Plan irrigation schedule',
            'Consider drought-resistant practices'
          ],
          issuedAt: new Date(),
          validUntil: new Date(Date.now() + 72 * 60 * 60 * 1000)
        });
      }
    }

    res.json({
      success: true,
      data: {
        farm: {
          id: farm._id,
          name: farm.name
        },
        alerts,
        alertCounts: {
          severe: alerts.filter(a => a.type === 'severe').length,
          moderate: alerts.filter(a => a.type === 'moderate').length,
          mild: alerts.filter(a => a.type === 'mild').length,
          total: alerts.length
        },
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Get weather alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching weather alerts'
    });
  }
});

// @route   GET /api/weather/historical/:farmId
// @desc    Get historical weather data for a farm
// @access  Private
router.get('/historical/:farmId', authMiddleware, [
  query('days').optional().isInt({ min: 1, max: 30 }).withMessage('Days must be between 1-30')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const days = parseInt(req.query.days) || 7;

    const farm = await Farm.findOne({
      _id: req.params.farmId,
      owner: req.user.id,
      isActive: true
    });

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    // For demo, generate mock historical data
    // In production, this would come from a weather data provider or stored data
    const historicalData = [];
    const now = new Date();

    for (let i = days; i >= 1; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const baseTemp = 25 + Math.sin((date.getMonth() / 12) * 2 * Math.PI) * 10;

      historicalData.push({
        date,
        temperature: {
          min: Math.round((baseTemp - 5 + Math.random() * 3) * 10) / 10,
          max: Math.round((baseTemp + 8 + Math.random() * 5) * 10) / 10,
          avg: Math.round((baseTemp + Math.random() * 4) * 10) / 10
        },
        humidity: Math.round(60 + Math.random() * 30),
        rainfall: Math.random() > 0.7 ? Math.round(Math.random() * 20 * 10) / 10 : 0,
        windSpeed: Math.round((5 + Math.random() * 15) * 10) / 10,
        pressure: Math.round(1013 + (Math.random() - 0.5) * 20),
        conditions: ['Clear', 'Partly cloudy', 'Cloudy', 'Light rain', 'Sunny'][Math.floor(Math.random() * 5)]
      });
    }

    // Calculate statistics
    const avgTemp = historicalData.reduce((sum, day) => sum + day.temperature.avg, 0) / historicalData.length;
    const totalRainfall = historicalData.reduce((sum, day) => sum + day.rainfall, 0);
    const avgHumidity = historicalData.reduce((sum, day) => sum + day.humidity, 0) / historicalData.length;
    const maxTemp = Math.max(...historicalData.map(d => d.temperature.max));
    const minTemp = Math.min(...historicalData.map(d => d.temperature.min));

    res.json({
      success: true,
      data: {
        farm: {
          id: farm._id,
          name: farm.name
        },
        period: {
          days,
          from: historicalData[0].date,
          to: historicalData[historicalData.length - 1].date
        },
        data: historicalData,
        statistics: {
          avgTemperature: Math.round(avgTemp * 10) / 10,
          maxTemperature: maxTemp,
          minTemperature: minTemp,
          totalRainfall: Math.round(totalRainfall * 10) / 10,
          avgHumidity: Math.round(avgHumidity),
          rainyDays: historicalData.filter(d => d.rainfall > 0).length
        }
      }
    });

  } catch (error) {
    console.error('Get historical weather error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching historical weather data'
    });
  }
});

module.exports = router;
