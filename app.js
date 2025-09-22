// Application State
let currentUser = null;
let isAuthenticated = false;
let farms = [];
let crops = [];
let marketData = [];
let weatherData = null;
let detectionHistory = [];
let currentAnalysis = null;

// Application Data (from provided JSON)
const sampleData = {
    farms: [
        {
            id: "1",
            name: "Green Valley Farm",
            location: {
                coordinates: [77.2090, 28.6139],
                address: {
                    city: "Delhi",
                    state: "Delhi",
                    country: "India"
                }
            },
            totalArea: 25.5,
            cultivatedArea: 22.3,
            soilType: "loamy",
            soilHealth: {
                pH: 6.8,
                nitrogen: 45,
                phosphorus: 38,
                potassium: 52
            },
            currentCrops: [
                {
                    name: "Rice",
                    area: 10.5,
                    status: "growing",
                    plantingDate: "2025-07-15",
                    expectedHarvest: "2025-11-20"
                }
            ]
        }
    ],
    crops: [
        { id: "1", name: "Rice", category: "cereals", season: "kharif", waterRequirement: "high", averageYield: { min: 3000, max: 6000 }, marketPrice: 2500 },
        { id: "2", name: "Wheat", category: "cereals", season: "rabi", waterRequirement: "medium", averageYield: { min: 2500, max: 4500 }, marketPrice: 2200 },
        { id: "3", name: "Cotton", category: "cash_crops", season: "kharif", waterRequirement: "medium", averageYield: { min: 300, max: 600 }, marketPrice: 6800 },
        { id: "4", name: "Tomato", category: "vegetables", season: "year_round", waterRequirement: "medium", averageYield: { min: 15000, max: 25000 }, marketPrice: 20 }
    ],
    market: [
        { crop: "Rice", price: 2547, change: 2.3, trend: "increasing" },
        { crop: "Wheat", price: 2198, change: -1.2, trend: "decreasing" },
        { crop: "Cotton", price: 6950, change: 5.1, trend: "increasing" },
        { crop: "Tomato", price: 22, change: 8.7, trend: "increasing" }
    ],
    weather: [
        { date: "2025-09-21", temp: { min: 22, max: 31 }, conditions: "Sunny", rainfall: 0 },
        { date: "2025-09-22", temp: { min: 24, max: 33 }, conditions: "Partly Cloudy", rainfall: 2 },
        { date: "2025-09-23", temp: { min: 23, max: 30 }, conditions: "Rainy", rainfall: 15 }
    ],
    diseases: [
        {
            id: "1",
            name: "Leaf Blight",
            scientificName: "Pyricularia oryzae",
            type: "fungal",
            affectedCrops: ["Rice", "Wheat", "Barley"],
            symptoms: ["Gray-green lesions on leaves", "Brown spots with yellow halos", "Leaf yellowing and death"],
            severity: "high",
            treatment: {
                chemical: [
                    {
                        name: "Propiconazole",
                        dosage: "1ml per liter",
                        method: "Foliar spray",
                        frequency: "Weekly for 3 weeks",
                        cost: "₹150 per application"
                    }
                ],
                organic: [
                    {
                        name: "Neem oil spray",
                        ingredients: ["Neem oil", "Water", "Soap"],
                        method: "Mix and spray",
                        frequency: "Bi-weekly",
                        cost: "₹80 per application"
                    }
                ]
            },
            prevention: ["Proper spacing", "Good drainage", "Crop rotation", "Resistant varieties"],
            riskFactors: ["High humidity (>80%)", "Temperature 26-32°C", "Poor air circulation"],
            confidence: 87
        },
        {
            id: "2",
            name: "Powdery Mildew",
            scientificName: "Erysiphe graminis",
            type: "fungal",
            affectedCrops: ["Wheat", "Barley", "Pea"],
            symptoms: ["White powdery coating on leaves", "Stunted growth", "Leaf curling"],
            severity: "medium",
            treatment: {
                chemical: [
                    {
                        name: "Sulfur fungicide",
                        dosage: "2g per liter",
                        method: "Foliar spray",
                        frequency: "Every 10 days",
                        cost: "₹120 per application"
                    }
                ],
                organic: [
                    {
                        name: "Baking soda spray",
                        ingredients: ["Baking soda", "Water", "Oil"],
                        method: "Mix and apply",
                        frequency: "Weekly",
                        cost: "₹40 per application"
                    }
                ]
            },
            prevention: ["Adequate spacing", "Reduce humidity", "Remove infected parts"],
            riskFactors: ["Moderate temperature", "High humidity", "Poor ventilation"],
            confidence: 92
        },
        {
            id: "3",
            name: "Bacterial Wilt",
            scientificName: "Ralstonia solanacearum",
            type: "bacterial",
            affectedCrops: ["Tomato", "Potato", "Eggplant"],
            symptoms: ["Sudden wilting", "Yellowing leaves", "Brown stem discoloration"],
            severity: "high",
            treatment: {
                chemical: [
                    {
                        name: "Copper oxychloride",
                        dosage: "3g per liter",
                        method: "Soil drench",
                        frequency: "Every 15 days",
                        cost: "₹200 per application"
                    }
                ],
                organic: [
                    {
                        name: "Trichoderma",
                        ingredients: ["Trichoderma spores", "Organic matter"],
                        method: "Soil application",
                        frequency: "Monthly",
                        cost: "₹180 per application"
                    }
                ]
            },
            prevention: ["Crop rotation", "Soil solarization", "Resistant varieties", "Proper drainage"],
            riskFactors: ["Warm temperature", "High soil moisture", "Wounded roots"],
            confidence: 78
        },
        {
            id: "4",
            name: "Mosaic Virus",
            scientificName: "Tobacco mosaic virus",
            type: "viral",
            affectedCrops: ["Tomato", "Cucumber", "Tobacco"],
            symptoms: ["Mosaic pattern on leaves", "Stunted growth", "Deformed fruits"],
            severity: "medium",
            treatment: {
                chemical: [],
                organic: [
                    {
                        name: "Remove infected plants",
                        method: "Physical removal",
                        frequency: "As needed",
                        cost: "₹50 per plant"
                    }
                ]
            },
            prevention: ["Control aphids", "Use certified seeds", "Avoid mechanical damage", "Quarantine new plants"],
            riskFactors: ["Aphid infestation", "Mechanical damage", "Infected tools"],
            confidence: 85
        },
        {
            id: "5",
            name: "Root Rot",
            scientificName: "Pythium spp.",
            type: "fungal",
            affectedCrops: ["Tomato", "Cucumber", "Bean"],
            symptoms: ["Yellowing leaves", "Stunted growth", "Black, mushy roots"],
            severity: "high",
            treatment: {
                chemical: [
                    {
                        name: "Metalaxyl",
                        dosage: "2g per liter",
                        method: "Soil drench",
                        frequency: "Bi-weekly",
                        cost: "₹180 per application"
                    }
                ],
                organic: [
                    {
                        name: "Improve drainage",
                        method: "Soil management",
                        frequency: "One time",
                        cost: "₹300 per plot"
                    }
                ]
            },
            prevention: ["Well-draining soil", "Avoid overwatering", "Raised beds", "Organic matter"],
            riskFactors: ["Waterlogged soil", "Poor drainage", "Overwatering"],
            confidence: 94
        }
    ],
    analysisSteps: [
        "Preprocessing image",
        "Extracting features", 
        "Comparing with database",
        "Calculating confidence scores",
        "Generating recommendations"
    ]
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadApplicationData();
    
    const savedUser = localStorage.getItem('cropgeniusUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            isAuthenticated = true;
            initializeDashboard();
        } catch (e) {
            localStorage.removeItem('cropgeniusUser');
            showAuthModal();
        }
    } else {
        showAuthModal();
    }
    
    setupEventListeners();
}

function setupEventListeners() {
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', handleAuth);
    }
    
    const recommendationForm = document.getElementById('recommendationForm');
    if (recommendationForm) {
        recommendationForm.addEventListener('submit', handleCropRecommendation);
    }
    
    const predictionForm = document.getElementById('predictionForm');
    if (predictionForm) {
        predictionForm.addEventListener('submit', handleYieldPrediction);
    }
    
    const addFarmForm = document.getElementById('addFarmForm');
    if (addFarmForm) {
        addFarmForm.addEventListener('submit', handleAddFarm);
    }
    
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            const modal = e.target;
            modal.classList.add('hidden');
        }
    });
}

function loadApplicationData() {
    farms = [...sampleData.farms];
    crops = [...sampleData.crops];
    marketData = [...sampleData.market];
    weatherData = sampleData.weather;
    
    // Initialize detection history with sample data
    detectionHistory = [
        {
            id: "1",
            date: "2025-09-18",
            disease: "Leaf Blight",
            confidence: 87,
            crop: "Rice",
            treatment: "Propiconazole spray"
        },
        {
            id: "2", 
            date: "2025-09-15",
            disease: "Powdery Mildew",
            confidence: 92,
            crop: "Wheat",
            treatment: "Sulfur fungicide"
        }
    ];
}

// Authentication Functions
function showAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function toggleAuthMode() {
    const title = document.getElementById('authModalTitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const registerFields = document.getElementById('registerFields');
    const toggleText = document.getElementById('authToggleText');
    const toggleLink = document.getElementById('authToggleLink');
    
    if (!title || !submitBtn || !registerFields || !toggleText || !toggleLink) return;
    
    const isLogin = title.textContent.includes('Login');
    
    if (isLogin) {
        title.textContent = 'Register for CropGenius';
        submitBtn.textContent = 'Register';
        registerFields.classList.remove('hidden');
        toggleText.textContent = 'Already have an account?';
        toggleLink.textContent = 'Sign in';
    } else {
        title.textContent = 'Login to CropGenius';
        submitBtn.textContent = 'Login';
        registerFields.classList.add('hidden');
        toggleText.textContent = "Don't have an account?";
        toggleLink.textContent = 'Sign up';
    }
}

function handleAuth(e) {
    e.preventDefault();
    
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const isLogin = document.getElementById('authSubmitBtn').textContent === 'Login';
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    if (isLogin) {
        currentUser = {
            id: '1',
            name: email.split('@')[0] || 'User',
            email: email,
            role: 'farmer'
        };
    } else {
        const name = document.getElementById('authName').value;
        const role = document.getElementById('authRole').value;
        
        if (!name) {
            alert('Please enter your full name');
            return;
        }
        
        currentUser = {
            id: Date.now().toString(),
            name: name,
            email: email,
            role: role || 'farmer'
        };
    }
    
    isAuthenticated = true;
    localStorage.setItem('cropgeniusUser', JSON.stringify(currentUser));
    closeAuthModal();
    initializeDashboard();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        isAuthenticated = false;
        localStorage.removeItem('cropgeniusUser');
        
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        showAuthModal();
    }
}

function initializeDashboard() {
    if (!isAuthenticated) return;
    
    showSection('dashboard');
    updateDashboard();
    renderMarketData();
    renderWeatherForecast();
    
    setTimeout(initializeCharts, 500);
}

// Navigation Functions
function showSection(sectionName) {
    if (!isAuthenticated && sectionName !== 'login') return;
    
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    document.querySelectorAll('.navbar-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionName) {
            item.classList.add('active');
        }
    });
    
    switch(sectionName) {
        case 'farms':
            renderFarms();
            break;
        case 'disease':
            initializeDiseaseSection();
            break;
        case 'market':
            renderMarketAnalysis();
            break;
        case 'weather':
            renderWeatherForecast();
            break;
        case 'analytics':
            setTimeout(renderAnalytics, 100);
            break;
    }
}

// Dashboard Functions
function updateDashboard() {
    if (!isAuthenticated) return;
    
    const totalFarmsEl = document.getElementById('totalFarms');
    const totalAreaEl = document.getElementById('totalArea');
    const activeCropsEl = document.getElementById('activeCrops');
    const estimatedValueEl = document.getElementById('estimatedValue');
    
    if (totalFarmsEl) totalFarmsEl.textContent = farms.length;
    if (totalAreaEl) totalAreaEl.textContent = farms.reduce((sum, farm) => sum + farm.totalArea, 0).toFixed(1);
    if (activeCropsEl) activeCropsEl.textContent = farms.reduce((sum, farm) => sum + farm.currentCrops.length, 0);
    
    const totalValue = farms.reduce((sum, farm) => {
        return sum + farm.currentCrops.reduce((cropSum, crop) => {
            const cropData = crops.find(c => c.name === crop.name);
            return cropSum + (crop.area * (cropData?.averageYield.min || 0) * (cropData?.marketPrice || 0));
        }, 0);
    }, 0);
    
    if (estimatedValueEl) estimatedValueEl.textContent = `₹${Math.round(totalValue).toLocaleString()}`;
    
    renderMarketPrices();
}

function renderMarketPrices() {
    const container = document.getElementById('marketPrices');
    if (!container) return;
    
    container.innerHTML = '';
    
    marketData.slice(0, 4).forEach(item => {
        const marketItem = document.createElement('div');
        marketItem.className = 'market-item';
        marketItem.innerHTML = `
            <div class="market-info">
                <div class="market-crop">${item.crop}</div>
                <div class="market-price">₹${item.price}/quintal</div>
            </div>
            <div class="market-change ${item.change >= 0 ? 'positive' : 'negative'}">
                ${item.change >= 0 ? '+' : ''}${item.change.toFixed(1)}%
            </div>
        `;
        container.appendChild(marketItem);
    });
}

// Disease Detection Functions
function initializeDiseaseSection() {
    showDiseaseTab('detection');
    renderDiseaseDatabase();
    renderDetectionHistory();
}

function showDiseaseTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.disease-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const targetTab = document.getElementById(`disease${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    const clickedBtn = event ? event.target : document.querySelector(`[onclick="showDiseaseTab('${tabName}')"]`);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
}

// File Upload Handling
function handleDrop(e) {
    e.preventDefault();
    const dragDropArea = document.getElementById('dragDropArea');
    dragDropArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processImageFile(files[0]);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    const dragDropArea = document.getElementById('dragDropArea');
    dragDropArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    const dragDropArea = document.getElementById('dragDropArea');
    dragDropArea.classList.remove('drag-over');
}

function handleImageUpload(input) {
    const file = input.files[0];
    if (file) {
        processImageFile(file);
    }
}

function processImageFile(file) {
    // File validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    
    if (!allowedTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, or GIF)');
        return;
    }
    
    if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
    }
    
    // Show progress
    showUploadProgress();
    
    // Simulate upload progress
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    let progress = 0;
    
    const progressInterval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress > 100) progress = 100;
        
        progressFill.style.width = progress + '%';
        progressText.textContent = `Uploading... ${Math.round(progress)}%`;
        
        if (progress >= 100) {
            clearInterval(progressInterval);
            setTimeout(() => {
                hideUploadProgress();
                showImagePreview(file);
            }, 500);
        }
    }, 200);
}

function showUploadProgress() {
    const progressDiv = document.getElementById('uploadProgress');
    if (progressDiv) {
        progressDiv.classList.remove('hidden');
    }
}

function hideUploadProgress() {
    const progressDiv = document.getElementById('uploadProgress');
    if (progressDiv) {
        progressDiv.classList.add('hidden');
    }
    
    // Reset progress
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    if (progressFill) progressFill.style.width = '0%';
    if (progressText) progressText.textContent = 'Uploading...';
}

function showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewImg = document.getElementById('previewImage');
        const previewSection = document.getElementById('imagePreview');
        
        if (previewImg && previewSection) {
            previewImg.src = e.target.result;
            previewSection.classList.remove('hidden');
        }
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    const previewSection = document.getElementById('imagePreview');
    const analysisSection = document.getElementById('analysisSection');
    const resultsSection = document.getElementById('resultsSection');
    const fileInput = document.getElementById('diseaseImageInput');
    
    if (previewSection) previewSection.classList.add('hidden');
    if (analysisSection) analysisSection.classList.add('hidden');
    if (resultsSection) resultsSection.classList.add('hidden');
    if (fileInput) fileInput.value = '';
    
    currentAnalysis = null;
}

// AI Analysis Functions
function analyzeImage() {
    const analysisSection = document.getElementById('analysisSection');
    const previewSection = document.getElementById('imagePreview');
    
    if (analysisSection) analysisSection.classList.remove('hidden');
    if (previewSection) previewSection.classList.add('hidden');
    
    runAnalysisSteps();
}

function runAnalysisSteps() {
    const stepsContainer = document.getElementById('analysisSteps');
    const statusEl = document.getElementById('analysisStatus');
    const steps = sampleData.analysisSteps;
    
    stepsContainer.innerHTML = '';
    
    // Create step elements
    steps.forEach((step, index) => {
        const stepEl = document.createElement('div');
        stepEl.className = 'analysis-step';
        stepEl.innerHTML = `
            <span>${step}</span>
            <span class="step-status" id="step-${index}">Waiting...</span>
        `;
        stepsContainer.appendChild(stepEl);
    });
    
    // Simulate analysis steps
    let currentStep = 0;
    
    function processStep() {
        if (currentStep > 0) {
            const prevStep = document.querySelector(`.analysis-step:nth-child(${currentStep})`);
            if (prevStep) {
                prevStep.classList.remove('active');
                prevStep.classList.add('completed');
                prevStep.querySelector('.step-status').textContent = 'Complete';
            }
        }
        
        if (currentStep < steps.length) {
            const currentStepEl = document.querySelector(`.analysis-step:nth-child(${currentStep + 1})`);
            if (currentStepEl) {
                currentStepEl.classList.add('active');
                currentStepEl.querySelector('.step-status').textContent = 'Processing...';
            }
            
            if (statusEl) {
                statusEl.textContent = `${steps[currentStep]}...`;
            }
            
            currentStep++;
            setTimeout(processStep, 1500 + Math.random() * 1000);
        } else {
            // Analysis complete
            setTimeout(() => {
                completeAnalysis();
            }, 1000);
        }
    }
    
    processStep();
}

function completeAnalysis() {
    const analysisSection = document.getElementById('analysisSection');
    const resultsSection = document.getElementById('resultsSection');
    
    if (analysisSection) analysisSection.classList.add('hidden');
    if (resultsSection) resultsSection.classList.remove('hidden');
    
    // Generate analysis results
    const detectedDisease = sampleData.diseases[Math.floor(Math.random() * sampleData.diseases.length)];
    currentAnalysis = {
        ...detectedDisease,
        timestamp: new Date().toISOString(),
        imageData: null // In real app, would store image
    };
    
    displayAnalysisResults(currentAnalysis);
}

function displayAnalysisResults(analysis) {
    const resultsContainer = document.getElementById('detectionResults');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = `
        <div class="disease-result">
            <div class="disease-header">
                <div>
                    <div class="disease-name">${analysis.name}</div>
                    <div class="scientific-name">${analysis.scientificName}</div>
                </div>
                <div class="confidence-meter">
                    <div class="confidence-bar">
                        <div class="confidence-fill ${getConfidenceLevel(analysis.confidence)}" style="width: ${analysis.confidence}%"></div>
                    </div>
                    <span>${analysis.confidence}%</span>
                </div>
            </div>
            
            <div class="disease-info">
                <div class="info-item">
                    <div class="info-label">Disease Type</div>
                    <div class="info-value">${analysis.type.charAt(0).toUpperCase() + analysis.type.slice(1)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Severity Level</div>
                    <div class="info-value">
                        <span class="severity-indicator severity-${analysis.severity}">${analysis.severity}</span>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Affected Crops</div>
                    <div class="info-value">${analysis.affectedCrops.join(', ')}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Symptoms</div>
                    <div class="info-value">${analysis.symptoms.join(', ')}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Risk Factors</div>
                    <div class="info-value">${analysis.riskFactors.join(', ')}</div>
                </div>
            </div>
        </div>
    `;
    
    // Show treatment recommendations
    showTreatmentTab('chemical');
    displayTreatmentRecommendations(analysis);
}

function getConfidenceLevel(confidence) {
    if (confidence >= 80) return 'high';
    if (confidence >= 60) return 'medium';
    return 'low';
}

function showTreatmentTab(tabType) {
    document.querySelectorAll('.treatment-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const clickedBtn = event ? event.target : document.querySelector(`[onclick="showTreatmentTab('${tabType}')"]`);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
    
    displayTreatmentContent(tabType);
}

function displayTreatmentContent(tabType) {
    const contentDiv = document.getElementById('treatmentContent');
    if (!contentDiv || !currentAnalysis) return;
    
    let content = '';
    
    switch(tabType) {
        case 'chemical':
            if (currentAnalysis.treatment.chemical.length > 0) {
                content = currentAnalysis.treatment.chemical.map(treatment => `
                    <div class="treatment-item">
                        <div class="treatment-name">${treatment.name}</div>
                        <div class="treatment-details">
                            <div class="treatment-detail"><strong>Dosage:</strong> ${treatment.dosage}</div>
                            <div class="treatment-detail"><strong>Method:</strong> ${treatment.method}</div>
                            <div class="treatment-detail"><strong>Frequency:</strong> ${treatment.frequency}</div>
                            <div class="treatment-detail"><strong>Cost:</strong> ${treatment.cost}</div>
                        </div>
                    </div>
                `).join('');
            } else {
                content = '<p>No chemical treatments recommended for this disease.</p>';
            }
            break;
            
        case 'organic':
            if (currentAnalysis.treatment.organic.length > 0) {
                content = currentAnalysis.treatment.organic.map(treatment => `
                    <div class="treatment-item">
                        <div class="treatment-name">${treatment.name}</div>
                        <div class="treatment-details">
                            ${treatment.ingredients ? `<div class="treatment-detail"><strong>Ingredients:</strong> ${treatment.ingredients.join(', ')}</div>` : ''}
                            <div class="treatment-detail"><strong>Method:</strong> ${treatment.method}</div>
                            <div class="treatment-detail"><strong>Frequency:</strong> ${treatment.frequency}</div>
                            <div class="treatment-detail"><strong>Cost:</strong> ${treatment.cost}</div>
                        </div>
                    </div>
                `).join('');
            } else {
                content = '<p>No organic treatments recommended for this disease.</p>';
            }
            break;
            
        case 'prevention':
            content = `
                <div class="treatment-item">
                    <div class="treatment-name">Prevention Measures</div>
                    <div class="treatment-details">
                        <div class="treatment-detail">
                            <strong>Recommended Actions:</strong>
                            <ul style="margin-top: 8px; padding-left: 20px;">
                                ${currentAnalysis.prevention.map(measure => `<li>${measure}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="treatment-detail">
                            <strong>Risk Factors to Monitor:</strong>
                            <ul style="margin-top: 8px; padding-left: 20px;">
                                ${currentAnalysis.riskFactors.map(factor => `<li>${factor}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            break;
    }
    
    contentDiv.innerHTML = content;
}

function displayTreatmentRecommendations(analysis) {
    // Default to showing chemical treatments
    showTreatmentTab('chemical');
}

// Disease Database Functions
function renderDiseaseDatabase() {
    const diseaseList = document.getElementById('diseaseList');
    if (!diseaseList) return;
    
    diseaseList.innerHTML = '';
    
    sampleData.diseases.forEach(disease => {
        const diseaseCard = document.createElement('div');
        diseaseCard.className = 'disease-card';
        diseaseCard.innerHTML = `
            <div class="disease-header">
                <div>
                    <div class="disease-name">${disease.name}</div>
                    <div class="scientific-name">${disease.scientificName}</div>
                </div>
                <span class="severity-indicator severity-${disease.severity}">${disease.severity}</span>
            </div>
            <div class="disease-info">
                <div class="info-item">
                    <div class="info-label">Type</div>
                    <div class="info-value">${disease.type.charAt(0).toUpperCase() + disease.type.slice(1)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Affected Crops</div>
                    <div class="info-value">${disease.affectedCrops.join(', ')}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Main Symptoms</div>
                    <div class="info-value">${disease.symptoms.slice(0, 2).join(', ')}</div>
                </div>
            </div>
        `;
        diseaseList.appendChild(diseaseCard);
    });
}

function filterDiseases() {
    const searchTerm = document.getElementById('diseaseSearch').value.toLowerCase();
    const typeFilter = document.getElementById('diseaseTypeFilter').value;
    const cropFilter = document.getElementById('cropFilter').value;
    
    const diseaseCards = document.querySelectorAll('.disease-card');
    
    diseaseCards.forEach(card => {
        const diseaseName = card.querySelector('.disease-name').textContent.toLowerCase();
        const diseaseType = card.querySelector('.info-value').textContent.toLowerCase();
        const affectedCrops = card.querySelectorAll('.info-value')[1].textContent;
        
        const matchesSearch = diseaseName.includes(searchTerm);
        const matchesType = !typeFilter || diseaseType.includes(typeFilter);
        const matchesCrop = !cropFilter || affectedCrops.includes(cropFilter);
        
        if (matchesSearch && matchesType && matchesCrop) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Detection History Functions
function renderDetectionHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    historyList.innerHTML = '';
    
    detectionHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-thumbnail">🔬</div>
            <div class="history-content">
                <div class="history-disease">${item.disease}</div>
                <div class="history-date">${new Date(item.date).toLocaleDateString()} - ${item.crop} - ${item.confidence}% confidence</div>
            </div>
            <div class="confidence-meter">
                <div class="confidence-bar">
                    <div class="confidence-fill ${getConfidenceLevel(item.confidence)}" style="width: ${item.confidence}%"></div>
                </div>
            </div>
        `;
        historyList.appendChild(historyItem);
    });
}

function saveResults() {
    if (!currentAnalysis) return;
    
    const newHistoryItem = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        disease: currentAnalysis.name,
        confidence: currentAnalysis.confidence,
        crop: currentAnalysis.affectedCrops[0],
        treatment: currentAnalysis.treatment.chemical[0]?.name || currentAnalysis.treatment.organic[0]?.name || 'No treatment'
    };
    
    detectionHistory.unshift(newHistoryItem);
    alert('Results saved successfully!');
}

function shareResults() {
    if (!currentAnalysis) return;
    
    const shareData = {
        title: 'CropGenius Disease Detection Results',
        text: `Detected: ${currentAnalysis.name} with ${currentAnalysis.confidence}% confidence`,
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData);
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        alert('Results copied to clipboard!');
    }
}

function exportHistory() {
    const csvContent = "data:text/csv;charset=utf-8," +
        "Date,Disease,Confidence,Crop,Treatment\n" +
        detectionHistory.map(item => 
            `${item.date},${item.disease},${item.confidence}%,${item.crop},${item.treatment}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "disease-detection-history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Farm Management Functions
function renderFarms() {
    const container = document.getElementById('farmsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    farms.forEach(farm => {
        const farmCard = document.createElement('div');
        farmCard.className = 'farm-card';
        farmCard.innerHTML = `
            <div class="farm-header">
                <div>
                    <h3>${farm.name}</h3>
                    <div class="farm-location">${farm.location.address.city}, ${farm.location.address.state}</div>
                </div>
            </div>
            <div class="farm-details">
                <div class="farm-detail">
                    <span class="farm-detail-value">${farm.totalArea}</span>
                    <span class="farm-detail-label">Total Area (acres)</span>
                </div>
                <div class="farm-detail">
                    <span class="farm-detail-value">${farm.cultivatedArea}</span>
                    <span class="farm-detail-label">Cultivated (acres)</span>
                </div>
                <div class="farm-detail">
                    <span class="farm-detail-value">${farm.soilType}</span>
                    <span class="farm-detail-label">Soil Type</span>
                </div>
                <div class="farm-detail">
                    <span class="farm-detail-value">${farm.currentCrops.length}</span>
                    <span class="farm-detail-label">Active Crops</span>
                </div>
            </div>
            <div class="farm-actions">
                <button class="btn btn--secondary btn--sm" onclick="viewFarm('${farm.id}')">View Details</button>
                <button class="btn btn--outline btn--sm" onclick="editFarm('${farm.id}')">Edit</button>
            </div>
        `;
        container.appendChild(farmCard);
    });
}

function showAddFarmModal() {
    const modal = document.getElementById('addFarmModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeAddFarmModal() {
    const modal = document.getElementById('addFarmModal');
    if (modal) {
        modal.classList.add('hidden');
        const form = document.getElementById('addFarmForm');
        if (form) form.reset();
    }
}

function handleAddFarm(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('farmName');
    const locationInput = document.getElementById('farmLocation');
    const areaInput = document.getElementById('farmArea');
    const soilTypeInput = document.getElementById('farmSoilType');
    
    if (!nameInput || !locationInput || !areaInput || !soilTypeInput) return;
    
    const newFarm = {
        id: Date.now().toString(),
        name: nameInput.value,
        location: {
            coordinates: [77.2090, 28.6139],
            address: {
                city: locationInput.value,
                state: "Unknown",
                country: "India"
            }
        },
        totalArea: parseFloat(areaInput.value),
        cultivatedArea: parseFloat(areaInput.value) * 0.9,
        soilType: soilTypeInput.value,
        soilHealth: {
            pH: 6.5,
            nitrogen: 40,
            phosphorus: 35,
            potassium: 50
        },
        currentCrops: []
    };
    
    farms.push(newFarm);
    closeAddFarmModal();
    renderFarms();
    updateDashboard();
    
    alert('Farm added successfully!');
}

function viewFarm(farmId) {
    const farm = farms.find(f => f.id === farmId);
    if (farm) {
        alert(`Farm Details:\nName: ${farm.name}\nLocation: ${farm.location.address.city}\nTotal Area: ${farm.totalArea} acres\nSoil Type: ${farm.soilType}`);
    }
}

function editFarm(farmId) {
    alert('Edit farm functionality would open a modal with farm details for editing.');
}

// Crop Management Functions
function showCropTab(tabName) {
    document.querySelectorAll('.crops-tabs ~ .tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.crops-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const targetTab = document.getElementById(`crop${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    const clickedBtn = event ? event.target : document.querySelector(`[onclick="showCropTab('${tabName}')"]`);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
}

function handleCropRecommendation(e) {
    e.preventDefault();
    
    const formData = {
        pH: parseFloat(document.getElementById('soilPH').value),
        nitrogen: parseFloat(document.getElementById('nitrogen').value),
        phosphorus: parseFloat(document.getElementById('phosphorus').value),
        potassium: parseFloat(document.getElementById('potassium').value),
        temperature: parseFloat(document.getElementById('temperature').value),
        rainfall: parseFloat(document.getElementById('rainfall').value),
        humidity: parseFloat(document.getElementById('humidity').value),
        season: document.getElementById('season').value
    };
    
    if (Object.values(formData).some(val => isNaN(val) && typeof val === 'number') || !formData.season) {
        alert('Please fill out all fields with valid values');
        return;
    }
    
    const recommendations = generateCropRecommendations(formData);
    displayRecommendations(recommendations);
}

function generateCropRecommendations(conditions) {
    const recommendations = [];
    
    crops.forEach(crop => {
        let score = 0;
        let reasoning = [];
        
        if (crop.season === conditions.season || crop.season === 'year_round') {
            score += 30;
            reasoning.push(`Suitable for ${conditions.season} season`);
        }
        
        if (conditions.pH >= 6.0 && conditions.pH <= 7.5) {
            score += 25;
            reasoning.push('Good soil pH for optimal growth');
        }
        
        if (conditions.nitrogen >= 40) {
            score += 15;
            reasoning.push('Adequate nitrogen levels');
        }
        if (conditions.phosphorus >= 35) {
            score += 15;
            reasoning.push('Good phosphorus content');
        }
        if (conditions.potassium >= 45) {
            score += 15;
            reasoning.push('Sufficient potassium levels');
        }
        
        if (conditions.temperature >= 20 && conditions.temperature <= 35) {
            score += 10;
            reasoning.push('Suitable temperature range');
        }
        
        if (score >= 50) {
            recommendations.push({
                crop: crop.name,
                confidence: Math.min(score, 95),
                reasoning: reasoning.join(', '),
                expectedYield: `${crop.averageYield.min}-${crop.averageYield.max} kg/acre`,
                marketPrice: `₹${crop.marketPrice}/quintal`
            });
        }
    });
    
    return recommendations.sort((a, b) => b.confidence - a.confidence);
}

function displayRecommendations(recommendations) {
    const resultsSection = document.getElementById('recommendationResults');
    const resultsList = document.getElementById('recommendationList');
    
    if (!resultsSection || !resultsList) return;
    
    resultsSection.classList.remove('hidden');
    resultsList.innerHTML = '';
    
    if (recommendations.length === 0) {
        resultsList.innerHTML = '<p>No suitable crop recommendations found for the given conditions. Try adjusting your inputs.</p>';
        return;
    }
    
    recommendations.forEach(rec => {
        const item = document.createElement('div');
        item.className = 'recommendation-item';
        item.innerHTML = `
            <div class="recommendation-header">
                <span class="recommendation-crop">${rec.crop}</span>
                <span class="confidence-score">${rec.confidence}% match</span>
            </div>
            <div class="recommendation-details">
                <p><strong>Reasoning:</strong> ${rec.reasoning}</p>
                <p><strong>Expected Yield:</strong> ${rec.expectedYield}</p>
                <p><strong>Current Market Price:</strong> ${rec.marketPrice}</p>
            </div>
        `;
        resultsList.appendChild(item);
    });
}

function handleYieldPrediction(e) {
    e.preventDefault();
    
    const cropName = document.getElementById('cropSelect').value;
    const area = parseFloat(document.getElementById('cropArea').value);
    
    if (!cropName || isNaN(area) || area <= 0) {
        alert('Please select a crop and enter a valid area');
        return;
    }
    
    const cropData = crops.find(c => c.name === cropName);
    if (!cropData) {
        alert('Crop data not found');
        return;
    }
    
    const baseYield = (cropData.averageYield.min + cropData.averageYield.max) / 2;
    const predictedYield = baseYield * area;
    const confidence = 85 + Math.random() * 10;
    const risk = confidence > 90 ? 'Low' : confidence > 80 ? 'Medium' : 'High';
    
    displayYieldPrediction({
        crop: cropName,
        area: area,
        predictedYield: Math.round(predictedYield),
        confidence: Math.round(confidence),
        risk: risk,
        marketValue: Math.round(predictedYield * cropData.marketPrice / 100)
    });
}

function displayYieldPrediction(prediction) {
    const resultsSection = document.getElementById('predictionResults');
    const detailsDiv = document.getElementById('predictionDetails');
    
    if (!resultsSection || !detailsDiv) return;
    
    resultsSection.classList.remove('hidden');
    detailsDiv.innerHTML = `
        <div class="prediction-summary">
            <h5>${prediction.crop} - ${prediction.area} acres</h5>
            <div class="prediction-stats">
                <div class="prediction-stat">
                    <span class="stat-label">Predicted Yield</span>
                    <span class="stat-value">${prediction.predictedYield.toLocaleString()} kg</span>
                </div>
                <div class="prediction-stat">
                    <span class="stat-label">Confidence</span>
                    <span class="stat-value">${prediction.confidence}%</span>
                </div>
                <div class="prediction-stat">
                    <span class="stat-label">Risk Level</span>
                    <span class="stat-value ${prediction.risk.toLowerCase()}">${prediction.risk}</span>
                </div>
                <div class="prediction-stat">
                    <span class="stat-label">Estimated Value</span>
                    <span class="stat-value">₹${prediction.marketValue.toLocaleString()}</span>
                </div>
            </div>
        </div>
    `;
}

// Market Analysis Functions
function renderMarketData() {
    renderMarketPrices();
}

function renderMarketAnalysis() {
    renderMarketTable();
    setTimeout(renderPriceChart, 100);
}

function renderMarketTable() {
    const container = document.getElementById('marketTable');
    if (!container) return;
    
    container.innerHTML = '';
    
    marketData.forEach(item => {
        const row = document.createElement('div');
        row.className = 'market-row';
        row.innerHTML = `
            <div class="market-crop">${item.crop}</div>
            <div class="market-price">₹${item.price}</div>
            <div class="market-change ${item.change >= 0 ? 'positive' : 'negative'}">
                ${item.change >= 0 ? '+' : ''}${item.change.toFixed(1)}%
            </div>
        `;
        container.appendChild(row);
    });
}

// Weather Functions
function renderWeatherForecast() {
    const container = document.getElementById('weatherForecast');
    if (!container) return;
    
    container.innerHTML = '';
    
    weatherData.forEach(day => {
        const item = document.createElement('div');
        item.className = 'forecast-item';
        
        const date = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        
        item.innerHTML = `
            <div class="forecast-date">${date}</div>
            <div class="forecast-condition">${day.conditions}</div>
            <div class="forecast-temp">${day.temp.min}° / ${day.temp.max}°</div>
            <div class="forecast-rain">${day.rainfall}mm</div>
        `;
        container.appendChild(item);
    });
}

// Chart Functions
function initializeCharts() {
    setTimeout(() => {
        renderPriceChart();
        renderAnalytics();
    }, 200);
}

function renderPriceChart() {
    const ctx = document.getElementById('priceChart');
    if (!ctx || !window.Chart) return;
    
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    ctx.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: marketData.map(item => item.crop),
            datasets: [{
                label: 'Price (₹/quintal)',
                data: marketData.map(item => item.price),
                borderColor: '#1FB8CD',
                backgroundColor: 'rgba(31, 184, 205, 0.1)',
                fill: true,
                tension: 0.4
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
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function renderAnalytics() {
    renderYieldChart();
    renderCropChart();
    renderFinanceChart();
}

function renderYieldChart() {
    const ctx = document.getElementById('yieldChart');
    if (!ctx || !window.Chart) return;
    
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    ctx.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Yield (kg)',
                data: [3200, 2800, 3500, 4100, 3800, 4200],
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545']
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

function renderCropChart() {
    const ctx = document.getElementById('cropChart');
    if (!ctx || !window.Chart) return;
    
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    ctx.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Rice', 'Wheat', 'Cotton', 'Vegetables'],
            datasets: [{
                data: [40, 25, 20, 15],
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function renderFinanceChart() {
    const ctx = document.getElementById('financeChart');
    if (!ctx || !window.Chart) return;
    
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    ctx.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [{
                label: 'Revenue',
                data: [180000, 220000, 280000, 350000],
                borderColor: '#5D878F',
                backgroundColor: 'rgba(93, 135, 143, 0.1)',
                fill: true
            }, {
                label: 'Profit',
                data: [50000, 75000, 120000, 180000],
                borderColor: '#1FB8CD',
                backgroundColor: 'rgba(31, 184, 205, 0.1)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Make functions available globally
window.showSection = showSection;
window.logout = logout;
window.showAddFarmModal = showAddFarmModal;
window.closeAddFarmModal = closeAddFarmModal;
window.viewFarm = viewFarm;
window.editFarm = editFarm;
window.showCropTab = showCropTab;
window.closeAuthModal = closeAuthModal;
window.toggleAuthMode = toggleAuthMode;
window.showDiseaseTab = showDiseaseTab;
window.handleDrop = handleDrop;
window.handleDragOver = handleDragOver;
window.handleDragLeave = handleDragLeave;
window.handleImageUpload = handleImageUpload;
window.clearImage = clearImage;
window.analyzeImage = analyzeImage;
window.showTreatmentTab = showTreatmentTab;
window.saveResults = saveResults;
window.shareResults = shareResults;
window.exportHistory = exportHistory;
window.filterDiseases = filterDiseases;