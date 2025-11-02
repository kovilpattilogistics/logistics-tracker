// ============================================
// ECO EXPRESS LOGISTICS - CONFIGURATION FILE
// ============================================
// Version: 1.0.0
// Last Updated: November 2, 2025
// 
// INSTRUCTIONS:
// 1. Replace YOUR_CLIENT_ID_HERE with your actual Google OAuth Client ID
// 2. Replace YOUR_SPREADSHEET_ID_HERE with your actual Google Spreadsheet ID
// 3. Save this file
// 4. Upload to your GitHub repository
//
// ============================================

const CONFIG = {
  
  // ==========================================
  // GOOGLE OAUTH CONFIGURATION
  // ==========================================
  
  // Your Google OAuth 2.0 Client ID
  // Example: "123456789-abc123def456.apps.googleusercontent.com"
  // Get this from: Google Cloud Console → APIs & Services → Credentials
  GOOGLE_CLIENT_ID: "804353330014-4sf3nusl9go935in3kq8ro00j76125ed.apps.googleusercontent.com",
  
  
  // ==========================================
  // GOOGLE SHEETS CONFIGURATION
  // ==========================================
  
  // Your Google Spreadsheet ID
  // Example: "1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P7q8R9s0T1u2"
  // Get this from: The URL of your Google Sheet (between /d/ and /edit)
  SPREADSHEET_ID: "1u_pePFoCdMlFGIFlfT9cP2vD8XCHJ1P4lBogOVqr84w",
  
  
  // ==========================================
  // GOOGLE SHEETS API CONFIGURATION
  // ==========================================
  
  // API Scopes (DO NOT MODIFY)
  SCOPES: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file"
  ],
  
  // Discovery Docs (DO NOT MODIFY)
  DISCOVERY_DOCS: [
    "https://sheets.googleapis.com/$discovery/rest?version=v4"
  ],
  
  
  // ==========================================
  // SHEET NAMES (MUST MATCH YOUR EXCEL TABS)
  // ==========================================
  
  SHEETS: {
    TRIPS: "Trips",
    CUSTOMERS: "Customers",
    DELIVERIES: "Deliveries",
    CHARGING: "Charging",
    VEHICLE_HEALTH: "Vehicle Health",
    FINANCIAL: "Financial",
    SETTINGS: "Settings",
    DASHBOARD: "Dashboard"
  },
  
  
  // ==========================================
  // APP CONFIGURATION
  // ==========================================
  
  // App Version
  VERSION: "1.0.0",
  
  // App Name
  APP_NAME: "Eco Express Logistics",
  
  // Auto-sync interval (in seconds)
  SYNC_INTERVAL: 30,
  
  // Offline mode enabled
  OFFLINE_MODE: true,
  
  // GPS auto-capture enabled
  GPS_AUTO_CAPTURE: true,
  
  // Max photo file size (in KB)
  MAX_PHOTO_SIZE: 500,
  
  // Photo compression quality (0-1)
  PHOTO_QUALITY: 0.8,
  
  
  // ==========================================
  // DEFAULT VALUES
  // ==========================================
  
  DEFAULTS: {
    // Default electricity rate (₹ per kWh)
    ELECTRICITY_RATE: 8.5,
    
    // Default delivery rate (₹)
    DELIVERY_RATE: 150,
    
    // Vehicle specifications
    VEHICLE: {
      REGISTRATION: "TN01AB1234",
      BATTERY_CAPACITY: 14.4, // kWh
      MAX_PAYLOAD: 750, // kg
      MAX_RANGE: 154 // km
    },
    
    // Default location (Kovilpatti coordinates)
    LOCATION: {
      LAT: 9.1718,
      LNG: 77.4538,
      NAME: "Main Hub, Kovilpatti"
    }
  },
  
  
  // ==========================================
  // WHATSAPP MESSAGE TEMPLATES
  // ==========================================
  
  WHATSAPP_TEMPLATES: {
    TRIP_STARTED: "Hello {CUSTOMER_NAME}, your delivery trip {TRIP_ID} has started. We will update you when we are on the way!",
    
    ENROUTE_PICKUP: "Hi {CUSTOMER_NAME}, we are on the way to pick up your order. ETA: {ETA} minutes.",
    
    ENROUTE_DELIVERY: "Hi {CUSTOMER_NAME}, your order is on the way! We will reach in approximately {ETA} minutes.",
    
    DELIVERY_COMPLETED: "Thank you {CUSTOMER_NAME}! Your delivery has been completed successfully. We hope to serve you again soon!"
  },
  
  
  // ==========================================
  // FEATURE FLAGS
  // ==========================================
  
  FEATURES: {
    // Enable customer ratings
    CUSTOMER_RATINGS: true,
    
    // Enable proof of delivery photos
    PROOF_PHOTOS: true,
    
    // Enable digital signatures
    DIGITAL_SIGNATURES: true,
    
    // Enable WhatsApp integration
    WHATSAPP_INTEGRATION: true,
    
    // Enable next trip suggestions
    TRIP_SUGGESTIONS: true,
    
    // Enable offline mode
    OFFLINE_SUPPORT: true,
    
    // Enable push notifications (future)
    PUSH_NOTIFICATIONS: false
  },
  
  
  // ==========================================
  // UI CONFIGURATION
  // ==========================================
  
  UI: {
    // Theme: "light", "dark", or "auto"
    THEME: "auto",
    
    // Language
    LANGUAGE: "en",
    
    // Currency symbol
    CURRENCY: "₹",
    
    // Date format
    DATE_FORMAT: "DD/MM/YYYY",
    
    // Time format (12 or 24 hour)
    TIME_FORMAT: "12",
    
    // Distance unit
    DISTANCE_UNIT: "km",
    
    // Weight unit
    WEIGHT_UNIT: "kg"
  },
  
  
  // ==========================================
  // OPENSTREETMAP CONFIGURATION
  // ==========================================
  
  MAP: {
    // Default zoom level
    DEFAULT_ZOOM: 13,
    
    // Default center (Kovilpatti)
    DEFAULT_CENTER: [9.1718, 77.4538],
    
    // Tile layer URL
    TILE_LAYER: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    
    // Attribution
    ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  
  
  // ==========================================
  // VALIDATION RULES
  // ==========================================
  
  VALIDATION: {
    // Phone number format (10 digits)
    PHONE_REGEX: /^[0-9]{10}$/,
    
    // PIN code format (6 digits)
    PINCODE_REGEX: /^[0-9]{6}$/,
    
    // Vehicle registration format
    REGISTRATION_REGEX: /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/,
    
    // Minimum trip distance (km)
    MIN_TRIP_DISTANCE: 0.1,
    
    // Maximum trip distance (km)
    MAX_TRIP_DISTANCE: 200,
    
    // Minimum cargo weight (kg)
    MIN_CARGO_WEIGHT: 0,
    
    // Maximum cargo weight (kg)
    MAX_CARGO_WEIGHT: 750
  },
  
  
  // ==========================================
  // ERROR MESSAGES
  // ==========================================
  
  ERRORS: {
    NO_CONNECTION: "Unable to connect to Google Sheets. Please check your internet connection.",
    AUTH_FAILED: "Google authentication failed. Please try again.",
    SYNC_FAILED: "Sync failed. Changes will be saved when connection is restored.",
    GPS_UNAVAILABLE: "GPS location unavailable. Please enable location services.",
    CAMERA_UNAVAILABLE: "Camera access denied. Please enable camera permissions.",
    INVALID_DATA: "Invalid data entered. Please check your inputs.",
    SHEET_NOT_FOUND: "Google Sheet not found. Please check your Spreadsheet ID."
  }
  
};

// ==========================================
// VALIDATION FUNCTION
// ==========================================

/**
 * Validates the configuration
 * Call this on app initialization to ensure config is correct
 */
CONFIG.validate = function() {
  const errors = [];
  
  // Check Client ID
  if (!this.GOOGLE_CLIENT_ID || this.GOOGLE_CLIENT_ID === "YOUR_CLIENT_ID_HERE") {
    errors.push("Google Client ID not configured");
  }
  
  // Check Spreadsheet ID
  if (!this.SPREADSHEET_ID || this.SPREADSHEET_ID === "YOUR_SPREADSHEET_ID_HERE") {
    errors.push("Spreadsheet ID not configured");
  }
  
  // Validate Client ID format
  if (this.GOOGLE_CLIENT_ID !== "YOUR_CLIENT_ID_HERE" && 
      !this.GOOGLE_CLIENT_ID.includes(".apps.googleusercontent.com")) {
    errors.push("Invalid Client ID format");
  }
  
  if (errors.length > 0) {
    console.error("Configuration errors:", errors);
    return {
      valid: false,
      errors: errors
    };
  }
  
  return {
    valid: true,
    errors: []
  };
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get WhatsApp message with placeholders replaced
 */
CONFIG.getWhatsAppMessage = function(template, data) {
  let message = this.WHATSAPP_TEMPLATES[template] || "";
  
  // Replace placeholders
  Object.keys(data).forEach(key => {
    const placeholder = `{${key}}`;
    message = message.replace(new RegExp(placeholder, 'g'), data[key]);
  });
  
  return message;
};

/**
 * Get formatted date
 */
CONFIG.formatDate = function(date) {
  const d = date || new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Get formatted time
 */
CONFIG.formatTime = function(date) {
  const d = date || new Date();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  if (this.UI.TIME_FORMAT === "12") {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes}:${seconds} ${ampm}`;
  }
  
  return `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
};

/**
 * Generate Trip ID
 */
CONFIG.generateTripId = function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  
  return `TRP_${year}${month}${day}_${timestamp}${random}`;
};

/**
 * Generate Customer ID
 */
CONFIG.generateCustomerId = function() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  
  return `CUST_${timestamp}${random}`;
};

/**
 * Format currency
 */
CONFIG.formatCurrency = function(amount) {
  return `${this.UI.CURRENCY}${Number(amount).toLocaleString('en-IN')}`;
};

/**
 * Calculate distance between two coordinates
 */
CONFIG.calculateDistance = function(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
};

// ==========================================
// EXPORT CONFIG
// ==========================================

// Make CONFIG available globally
window.CONFIG = CONFIG;

// Log configuration status on load
console.log("Eco Express Configuration Loaded");
console.log("Version:", CONFIG.VERSION);
console.log("Validation:", CONFIG.validate());

// ==========================================
// END OF CONFIGURATION
// ==========================================
