// Application Data
const appData = {
  cropDatabase: [
    {"name": "Rice", "image": "🌾", "season": "Kharif", "duration": "120-150 days", "waterReq": "High"},
    {"name": "Wheat", "image": "🌾", "season": "Rabi", "duration": "120-150 days", "waterReq": "Medium"},
    {"name": "Cotton", "image": "🌿", "season": "Kharif", "duration": "180-200 days", "waterReq": "Medium"},
    {"name": "Sugarcane", "image": "🎋", "season": "Year-round", "duration": "365 days", "waterReq": "Very High"},
    {"name": "Corn", "image": "🌽", "season": "Kharif", "duration": "90-120 days", "waterReq": "Medium"},
    {"name": "Tomato", "image": "🍅", "season": "Both", "duration": "75-85 days", "waterReq": "Medium"},
    {"name": "Potato", "image": "🥔", "season": "Rabi", "duration": "90-120 days", "waterReq": "Medium"},
    {"name": "Onion", "image": "🧅", "season": "Rabi", "duration": "120-150 days", "waterReq": "Low"}
  ],
  diseases: [
    {"name": "Leaf Blight", "severity": "High", "treatment": "Fungicide spray every 7-10 days", "prevention": "Proper spacing, avoid overhead irrigation"},
    {"name": "Powdery Mildew", "severity": "Medium", "treatment": "Neem oil application", "prevention": "Good air circulation, resistant varieties"},
    {"name": "Root Rot", "severity": "High", "treatment": "Improve drainage, apply biocontrol agents", "prevention": "Well-draining soil, avoid overwatering"},
    {"name": "Aphid Infestation", "severity": "Low", "treatment": "Insecticidal soap or neem oil", "prevention": "Regular monitoring, beneficial insects"}
  ],
  marketData: [
    {"crop": "Rice", "currentPrice": 2500, "trend": "up", "prediction": "increase", "confidence": 85},
    {"crop": "Wheat", "currentPrice": 2200, "trend": "stable", "prediction": "stable", "confidence": 78},
    {"crop": "Cotton", "currentPrice": 6800, "trend": "down", "prediction": "decrease", "confidence": 82},
    {"crop": "Corn", "currentPrice": 1950, "trend": "up", "prediction": "increase", "confidence": 90}
  ]
};

// Chart instances
let yieldChart, priceChart, yieldForecastChart, resourceChart, marketTrendChart;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing CropGenius application...');
  initializeNavigation();
  initializeDashboardCharts();
  initializeForms();
  initializeImageUpload();
});

// Navigation functionality - Fixed
function initializeNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.section');

  console.log('Found navigation buttons:', navButtons.length);
  console.log('Found sections:', sections.length);

  navButtons.forEach((button, index) => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const targetSection = this.getAttribute('data-section');
      console.log('Navigation clicked:', targetSection);
      
      // Update active button
      navButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Update active section
      sections.forEach(section => {
        section.classList.remove('active');
      });
      
      const targetElement = document.getElementById(targetSection);
      if (targetElement) {
        targetElement.classList.add('active');
        console.log('Section activated:', targetSection);
      } else {
        console.error('Section not found:', targetSection);
      }
    });
  });
}

// Dashboard Charts
function initializeDashboardCharts() {
  try {
    // Yield Trends Chart
    const yieldCtx = document.getElementById('yieldChart');
    if (yieldCtx) {
      yieldChart = new Chart(yieldCtx.getContext('2d'), {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Yield (kg/ha)',
            data: [2400, 2600, 2800, 2500, 2900, 2847],
            borderColor: '#1FB8CD',
            backgroundColor: 'rgba(31, 184, 205, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              min: 2000
            }
          }
        }
      });
    }

    // Price Chart
    const priceCtx = document.getElementById('priceChart');
    if (priceCtx) {
      priceChart = new Chart(priceCtx.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Rice', 'Wheat', 'Cotton', 'Corn'],
          datasets: [{
            label: 'Price (₹/quintal)',
            data: [2500, 2200, 6800, 1950],
            backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#5D878F']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }

    // Resource Chart
    const resourceCtx = document.getElementById('resourceChart');
    if (resourceCtx) {
      resourceChart = new Chart(resourceCtx.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Seeds', 'Fertilizer', 'Water', 'Labor'],
          datasets: [{
            data: [25, 35, 20, 20],
            backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#5D878F']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }

    // Market Trend Chart
    const marketCtx = document.getElementById('marketTrendChart');
    if (marketCtx) {
      marketTrendChart = new Chart(marketCtx.getContext('2d'), {
        type: 'line',
        data: {
          labels: Array.from({length: 30}, (_, i) => `Day ${i + 1}`),
          datasets: [
            {
              label: 'Rice',
              data: generatePriceData(2500, 30),
              borderColor: '#1FB8CD',
              tension: 0.4
            },
            {
              label: 'Wheat',
              data: generatePriceData(2200, 30),
              borderColor: '#FFC185',
              tension: 0.4
            },
            {
              label: 'Cotton',
              data: generatePriceData(6800, 30),
              borderColor: '#B4413C',
              tension: 0.4
            },
            {
              label: 'Corn',
              data: generatePriceData(1950, 30),
              borderColor: '#5D878F',
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top'
            }
          }
        }
      });
    }
  } catch (error) {
    console.error('Error initializing charts:', error);
  }
}

// Generate realistic price data
function generatePriceData(basePrice, days) {
  const data = [];
  let price = basePrice;
  
  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.5) * (basePrice * 0.1);
    price += change;
    price = Math.max(price, basePrice * 0.8); // Don't go below 80% of base
    price = Math.min(price, basePrice * 1.2); // Don't go above 120% of base
    data.push(Math.round(price));
  }
  
  return data;
}

// Form initialization - Fixed to prevent navigation interference
function initializeForms() {
  // Crop Recommendation Form
  const cropForm = document.getElementById('cropRecommendationForm');
  if (cropForm) {
    cropForm.addEventListener('submit', function(e) {
      e.preventDefault();
      e.stopPropagation();
      handleCropRecommendation(e);
    });

    // Prevent form field clicks from triggering navigation
    const formInputs = cropForm.querySelectorAll('input, select');
    formInputs.forEach(input => {
      input.addEventListener('click', function(e) {
        e.stopPropagation();
      });
      input.addEventListener('focus', function(e) {
        e.stopPropagation();
      });
    });
  }

  // Yield Prediction Form
  const yieldForm = document.getElementById('yieldPredictionForm');
  if (yieldForm) {
    yieldForm.addEventListener('submit', function(e) {
      e.preventDefault();
      e.stopPropagation();
      handleYieldPrediction(e);
    });

    // Prevent form field clicks from triggering navigation
    const yieldInputs = yieldForm.querySelectorAll('input, select');
    yieldInputs.forEach(input => {
      input.addEventListener('click', function(e) {
        e.stopPropagation();
      });
      input.addEventListener('focus', function(e) {
        e.stopPropagation();
      });
    });
  }
}

// Crop Recommendation Handler
async function handleCropRecommendation(e) {
  e.preventDefault();
  console.log('Processing crop recommendation...');
  
  const loadingElement = document.getElementById('loadingRecommendation');
  const resultsElement = document.getElementById('recommendationResults');
  
  if (!loadingElement || !resultsElement) {
    console.error('Required elements not found for crop recommendation');
    return;
  }
  
  // Show loading
  loadingElement.classList.remove('hidden');
  resultsElement.classList.add('hidden');
  
  // Simulate AI processing
  await sleep(2000);
  
  // Get form data
  const nitrogen = parseFloat(document.getElementById('nitrogen').value) || 40;
  const phosphorus = parseFloat(document.getElementById('phosphorus').value) || 35;
  const potassium = parseFloat(document.getElementById('potassium').value) || 25;
  const ph = parseFloat(document.getElementById('ph').value) || 6.5;
  const temperature = parseFloat(document.getElementById('temperature').value) || 28;
  const rainfall = parseFloat(document.getElementById('rainfall').value) || 45;
  
  // AI Logic Simulation
  const recommendations = generateCropRecommendations(nitrogen, phosphorus, potassium, ph, temperature, rainfall);
  
  // Display results
  displayCropRecommendations(recommendations);
  
  // Hide loading, show results
  loadingElement.classList.add('hidden');
  resultsElement.classList.remove('hidden');
  
  console.log('Crop recommendation complete');
}

// Generate AI crop recommendations
function generateCropRecommendations(n, p, k, ph, temp, rain) {
  const recommendations = [];
  
  // AI decision logic based on parameters
  appData.cropDatabase.forEach(crop => {
    let score = 0;
    let reasons = [];
    
    // NPK scoring
    if (crop.name === 'Rice' && n > 30 && rain > 40) {
      score += 30;
      reasons.push('High nitrogen and rainfall suitable for rice');
    }
    if (crop.name === 'Wheat' && temp < 30 && ph > 6) {
      score += 25;
      reasons.push('Optimal temperature and pH for wheat');
    }
    if (crop.name === 'Cotton' && k > 20 && temp > 25) {
      score += 28;
      reasons.push('Good potassium levels and temperature for cotton');
    }
    if (crop.name === 'Corn' && n > 35 && p > 30) {
      score += 32;
      reasons.push('Excellent N-P ratio for corn cultivation');
    }
    
    // Add randomness for realism
    score += Math.random() * 20;
    
    if (score > 20) {
      recommendations.push({
        ...crop,
        confidence: Math.min(Math.round(score), 95),
        reasons: reasons.length > 0 ? reasons : ['Suitable soil and weather conditions']
      });
    }
  });
  
  // Sort by confidence and return top 4
  return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 4);
}

// Display crop recommendations
function displayCropRecommendations(recommendations) {
  const container = document.getElementById('cropRecommendations');
  if (!container) return;
  
  container.innerHTML = '';
  
  recommendations.forEach(crop => {
    const cropCard = document.createElement('div');
    cropCard.className = 'crop-card';
    cropCard.innerHTML = `
      <div class="crop-icon">${crop.image}</div>
      <div class="crop-details">
        <h4>${crop.name}</h4>
        <div class="crop-meta">
          Season: ${crop.season} | Duration: ${crop.duration} | Water: ${crop.waterReq}
        </div>
        <p style="margin-top: 8px; font-size: 12px; color: var(--color-text-secondary);">
          ${crop.reasons[0]}
        </p>
      </div>
      <div class="confidence-score">${crop.confidence}%</div>
    `;
    container.appendChild(cropCard);
  });
}

// Yield Prediction Handler
async function handleYieldPrediction(e) {
  e.preventDefault();
  console.log('Processing yield prediction...');
  
  const loadingElement = document.getElementById('loadingYield');
  const resultsElement = document.getElementById('yieldResults');
  
  if (!loadingElement || !resultsElement) {
    console.error('Required elements not found for yield prediction');
    return;
  }
  
  // Show loading
  loadingElement.classList.remove('hidden');
  resultsElement.classList.add('hidden');
  
  // Simulate AI processing
  await sleep(2500);
  
  // Get form data
  const crop = document.getElementById('cropSelect').value || 'rice';
  const area = parseFloat(document.getElementById('fieldArea').value) || 5.0;
  const soilQuality = document.getElementById('soilQuality').value || 'good';
  const irrigation = document.getElementById('irrigationType').value || 'sprinkler';
  const fertilizer = document.getElementById('fertilizerUsage').value || 'synthetic';
  
  // Generate prediction
  const prediction = generateYieldPrediction(crop, area, soilQuality, irrigation, fertilizer);
  
  // Display results
  displayYieldPrediction(prediction);
  
  // Hide loading, show results
  loadingElement.classList.add('hidden');
  resultsElement.classList.remove('hidden');
  
  console.log('Yield prediction complete');
}

// Generate yield prediction
function generateYieldPrediction(crop, area, soilQuality, irrigation, fertilizer) {
  const basePrices = { rice: 3500, wheat: 2800, corn: 2200, cotton: 1500 };
  let baseYield = basePrices[crop] || 2500;
  
  // Quality multipliers
  const qualityMultiplier = {
    excellent: 1.3,
    good: 1.1,
    average: 1.0,
    poor: 0.8
  }[soilQuality];
  
  const irrigationMultiplier = {
    drip: 1.2,
    sprinkler: 1.1,
    flood: 1.0,
    rainfed: 0.9
  }[irrigation];
  
  const fertilizerMultiplier = {
    organic: 1.15,
    synthetic: 1.25,
    mixed: 1.2,
    minimal: 0.9
  }[fertilizer];
  
  const predictedYield = Math.round(baseYield * qualityMultiplier * irrigationMultiplier * fertilizerMultiplier);
  const confidence = Math.round(75 + Math.random() * 20);
  
  const riskFactors = [];
  if (soilQuality === 'poor') riskFactors.push('Poor soil quality');
  if (irrigation === 'rainfed') riskFactors.push('Weather dependent');
  if (fertilizer === 'minimal') riskFactors.push('Low fertilizer input');
  
  const riskLevel = riskFactors.length === 0 ? 'Low' : riskFactors.length === 1 ? 'Medium' : 'High';
  
  return {
    yield: predictedYield,
    confidence,
    riskLevel,
    totalYield: Math.round(predictedYield * area)
  };
}

// Display yield prediction
function displayYieldPrediction(prediction) {
  const yieldElement = document.getElementById('predictedYield');
  const confidenceElement = document.getElementById('confidenceScore');
  const riskElement = document.getElementById('riskLevel');
  
  if (yieldElement) yieldElement.textContent = prediction.yield.toLocaleString();
  if (confidenceElement) confidenceElement.textContent = `${prediction.confidence}%`;
  if (riskElement) riskElement.textContent = prediction.riskLevel;
  
  // Update yield forecast chart
  const forecastCanvas = document.getElementById('yieldForecastChart');
  if (forecastCanvas) {
    if (yieldForecastChart) {
      yieldForecastChart.destroy();
    }
    
    const forecastCtx = forecastCanvas.getContext('2d');
    yieldForecastChart = new Chart(forecastCtx, {
      type: 'line',
      data: {
        labels: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Harvest'],
        datasets: [{
          label: 'Predicted Yield',
          data: [0, prediction.yield * 0.2, prediction.yield * 0.5, prediction.yield * 0.8, prediction.yield],
          borderColor: '#1FB8CD',
          backgroundColor: 'rgba(31, 184, 205, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
}

// Profit Calculator - Fixed with proper event handling
function calculateProfit() {
  console.log('Calculating profit...');
  
  const cropElement = document.getElementById('profitCrop');
  const quantityElement = document.getElementById('profitQuantity');
  
  if (!cropElement || !quantityElement) {
    console.error('Profit calculator elements not found');
    return;
  }
  
  const crop = cropElement.value || 'rice';
  const quantity = parseFloat(quantityElement.value) || 100;
  
  const prices = {
    rice: 2500,
    wheat: 2200,
    cotton: 6800,
    corn: 1950
  };
  
  const costPerQuintal = {
    rice: 1800,
    wheat: 1600,
    cotton: 5200,
    corn: 1400
  };
  
  const price = prices[crop];
  const cost = costPerQuintal[crop];
  
  const revenue = price * quantity;
  const totalCost = cost * quantity;
  const profit = revenue - totalCost;
  
  const revenueElement = document.getElementById('expectedRevenue');
  const costElement = document.getElementById('productionCost');
  const profitElement = document.getElementById('netProfit');
  const resultElement = document.getElementById('profitResult');
  
  if (revenueElement) revenueElement.textContent = `₹${revenue.toLocaleString()}`;
  if (costElement) costElement.textContent = `₹${totalCost.toLocaleString()}`;
  if (profitElement) profitElement.textContent = `₹${profit.toLocaleString()}`;
  if (resultElement) resultElement.classList.remove('hidden');
  
  console.log('Profit calculation complete');
}

// Image Upload for Disease Detection - Fixed
function initializeImageUpload() {
  const uploadArea = document.getElementById('uploadArea');
  const imageUpload = document.getElementById('imageUpload');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  
  if (!uploadArea || !imageUpload || !imagePreview || !previewImg) {
    console.log('Image upload elements not found, skipping initialization');
    return;
  }
  
  uploadArea.addEventListener('click', (e) => {
    e.stopPropagation();
    imageUpload.click();
  });
  
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.style.borderColor = 'var(--color-primary)';
  });
  
  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.style.borderColor = 'var(--color-border)';
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.style.borderColor = 'var(--color-border)';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  });
  
  imageUpload.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleImageUpload(e.target.files[0]);
    }
  });
  
  function handleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      imagePreview.classList.remove('hidden');
      uploadArea.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }
}

// Analyze Disease Image - Fixed
async function analyzeImage() {
  console.log('Analyzing disease image...');
  
  const loadingElement = document.getElementById('loadingAnalysis');
  const resultsElement = document.getElementById('diseaseResults');
  
  if (!loadingElement || !resultsElement) {
    console.error('Disease analysis elements not found');
    return;
  }
  
  // Show loading
  loadingElement.classList.remove('hidden');
  resultsElement.classList.add('hidden');
  
  // Simulate AI processing
  await sleep(3000);
  
  // Random disease detection
  const disease = appData.diseases[Math.floor(Math.random() * appData.diseases.length)];
  const confidence = Math.round(75 + Math.random() * 20);
  
  // Display results
  const nameElement = document.getElementById('diseaseName');
  const treatmentElement = document.getElementById('treatmentText');
  const preventionElement = document.getElementById('preventionText');
  const confidenceTextElement = document.getElementById('confidenceText');
  const confidenceFillElement = document.getElementById('confidenceFill');
  const severityElement = document.getElementById('diseaseSeverity');
  
  if (nameElement) nameElement.textContent = disease.name;
  if (treatmentElement) treatmentElement.textContent = disease.treatment;
  if (preventionElement) preventionElement.textContent = disease.prevention;
  if (confidenceTextElement) confidenceTextElement.textContent = `${confidence}%`;
  if (confidenceFillElement) confidenceFillElement.style.width = `${confidence}%`;
  
  if (severityElement) {
    severityElement.textContent = disease.severity;
    severityElement.className = `status status--${disease.severity.toLowerCase() === 'high' ? 'error' : disease.severity.toLowerCase() === 'medium' ? 'warning' : 'success'}`;
  }
  
  // Hide loading, show results
  loadingElement.classList.add('hidden');
  resultsElement.classList.remove('hidden');
  
  console.log('Disease analysis complete');
}

// Utility function for delays
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Add some dynamic updates to dashboard - Fixed
setInterval(() => {
  try {
    // Update weather data slightly
    const tempElement = document.querySelector('.weather-temp');
    if (tempElement) {
      const currentTemp = parseInt(tempElement.textContent);
      const newTemp = currentTemp + (Math.random() > 0.5 ? 1 : -1);
      tempElement.textContent = `${Math.max(20, Math.min(35, newTemp))}°C`;
    }
    
    // Update some metrics randomly
    const yieldElement = document.querySelector('.metric-card:nth-child(3) .metric-value');
    if (yieldElement) {
      const currentYield = parseInt(yieldElement.textContent.replace(/,/g, ''));
      const newYield = currentYield + Math.round((Math.random() - 0.5) * 50);
      yieldElement.textContent = `${Math.max(2500, newYield).toLocaleString()} kg`;
    }
  } catch (error) {
    console.error('Error in dynamic updates:', error);
  }
}, 30000); // Update every 30 seconds

// Smooth scroll behavior for better UX
document.documentElement.style.scrollBehavior = 'smooth';

// Global function to make calculateProfit available
window.calculateProfit = calculateProfit;
window.analyzeImage = analyzeImage;