// ============================================
// CONFIGURATION - PASTE YOUR APPS SCRIPT URL HERE
// ============================================
const APPS_SCRIPT_URL = 'PASTE_YOUR_APPS_SCRIPT_URL_HERE';
// Example: 'https://script.google.com/macros/s/AKfycbxyz...abc123/exec'
// ============================================

/*
APPS SCRIPT SETUP INSTRUCTIONS:

1. Create a new Google Sheet with these sheets:
   - Customers (columns: Customer ID, Name, Phone, Address, City, Pincode, Type, Total Trips, Last Delivery)
   - Trips (columns: Trip ID, Date, Customer ID, Customer Name, Distance, Start Battery, End Battery, Revenue, Status)

2. Go to Extensions → Apps Script

3. Paste the following code:

```javascript
function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const action = e.parameter.action;
  const params = e.parameter;
  
  switch(action) {
    case 'test':
      return jsonResponse({ success: true, message: 'Connection successful!' });
    case 'getDashboard':
      return getDashboard();
    case 'getCustomers':
      return getCustomers();
    case 'addCustomer':
      return addCustomer(params);
    case 'deleteCustomer':
      return deleteCustomer(params);
    case 'getTrips':
      return getTrips();
    case 'addTrip':
      return addTrip(params);
    case 'deleteTrip':
      return deleteTrip(params);
    default:
      return jsonResponse({ success: false, error: 'Unknown action' });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tripsSheet = ss.getSheetByName('Trips');
  
  const data = {
    trips_today: 8,
    distance_today: 47.5,
    revenue_today: 1800,
    customers_today: 12,
    battery_soc: 78,
    current_range: 120
  };
  
  return jsonResponse({ success: true, data: data });
}

function getCustomers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Customers');
  
  if (!sheet) {
    return jsonResponse({ success: false, error: 'Customers sheet not found' });
  }
  
  const data = sheet.getDataRange().getValues();
  const customers = [];
  
  for (let i = 1; i < data.length; i++) {
    customers.push({
      id: data[i][0],
      name: data[i][1],
      phone: data[i][2],
      address: data[i][3],
      city: data[i][4],
      pincode: data[i][5],
      type: data[i][6],
      total_trips: data[i][7] || 0,
      last_delivery: data[i][8] || '-'
    });
  }
  
  return jsonResponse({ success: true, data: customers });
}

function addCustomer(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Customers');
  
  if (!sheet) {
    return jsonResponse({ success: false, error: 'Customers sheet not found' });
  }
  
  const customerId = 'CUST_' + String(sheet.getLastRow()).padStart(3, '0');
  const row = [
    customerId,
    params.name,
    params.phone,
    params.address1,
    params.city,
    params.pincode,
    params.type,
    0,
    '-'
  ];
  
  sheet.appendRow(row);
  
  return jsonResponse({ success: true, customer_id: customerId });
}

function deleteCustomer(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Customers');
  
  if (!sheet) {
    return jsonResponse({ success: false, error: 'Customers sheet not found' });
  }
  
  try {
    const customerId = params.customer_id;
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === customerId) {
        sheet.deleteRow(i + 1);
        return jsonResponse({ success: true, message: 'Customer deleted successfully' });
      }
    }
    
    return jsonResponse({ success: false, error: 'Customer not found: ' + customerId });
  } catch (error) {
    return jsonResponse({ success: false, error: 'Delete customer error: ' + error.toString() });
  }
}

function getTrips() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Trips');
  
  if (!sheet) {
    return jsonResponse({ success: false, error: 'Trips sheet not found' });
  }
  
  const data = sheet.getDataRange().getValues();
  const trips = [];
  
  for (let i = 1; i < data.length; i++) {
    trips.push({
      id: data[i][0],
      date: data[i][1],
      customer_id: data[i][2],
      customer: data[i][3],
      distance: data[i][4],
      scheduled_time: data[i][5] || '09:00',
      order_type: data[i][6] || 'Delivery',
      pickup: data[i][7] || 'Main Hub',
      delivery: data[i][8] || '',
      phone: data[i][9] || ''
    });
  }
  
  return jsonResponse({ success: true, data: trips });
}

function addTrip(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Trips');
  
  if (!sheet) {
    return jsonResponse({ success: false, error: 'Trips sheet not found' });
  }
  
  const tripId = 'TRP_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd') + '_' + String(sheet.getLastRow()).padStart(3, '0');
  const row = [
    tripId,
    new Date(),
    params.customer_id,
    params.customer_name,
    params.distance || 0,
    params.scheduled_time || '09:00',
    params.order_type || 'Delivery',
    params.start_location || 'Main Hub',
    params.end_location || '',
    params.phone || ''
  ];
  
  sheet.appendRow(row);
  
  return jsonResponse({ success: true, trip_id: tripId });
}

function deleteTrip(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Trips');
  
  if (!sheet) {
    return jsonResponse({ success: false, error: 'Trips sheet not found' });
  }
  
  try {
    const tripId = params.trip_id;
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === tripId) {
        sheet.deleteRow(i + 1);
        return jsonResponse({ success: true, message: 'Trip deleted successfully' });
      }
    }
    
    return jsonResponse({ success: false, error: 'Trip not found: ' + tripId });
  } catch (error) {
    return jsonResponse({ success: false, error: 'Delete trip error: ' + error.toString() });
  }
}
```

4. Click Deploy → New deployment
5. Select type: Web app
6. Execute as: Me
7. Who has access: Anyone
8. Click Deploy
9. Copy the Web app URL
10. Paste it in the APPS_SCRIPT_URL constant above
11. Upload to GitHub and test!

*/

// Google Apps Script Bridge Configuration
let isConnected = false;

// App State
const appState = {
  config: {
    scriptUrl: '',
    isConfigured: false
  },
  currentPage: 'dashboard',
  syncStatus: 'synced',
  customers: [
    {
      id: 'CUST_001',
      name: 'Ramesh Vegetables',
      phone: '9876543210',
      address: 'Market Street, Kovilpatti',
      city: 'Kovilpatti',
      pincode: '628501',
      type: 'Business',
      total_trips: 45,
      last_delivery: '2025-11-01'
    },
    {
      id: 'CUST_002',
      name: 'Kumar Retail Store',
      phone: '9876543211',
      address: 'Main Road, Kovilpatti',
      city: 'Kovilpatti',
      pincode: '628502',
      type: 'Retail',
      total_trips: 32,
      last_delivery: '2025-11-02'
    }
  ],
  scheduledTrips: [
    {
      id: 'TRP_20251102_003',
      customer: 'Ramesh Vegetables',
      customer_id: 'CUST_001',
      scheduled_time: '14:00',
      order_type: 'Delivery',
      pickup: 'Main Hub, Kovilpatti',
      delivery: 'Market Street, Kovilpatti',
      distance: 5.2,
      weight: 120,
      phone: '9876543210'
    }
  ],
  activeTrip: null,
  settings: {
    electricity_rate: 8.5,
    default_delivery_rate: 150,
    auto_sync: true,
    sync_interval: 30,
    gps_auto_capture: true,
    theme: 'light',
    spreadsheet_id: '',
    vehicle_registration: 'TN01AB1234',
    battery_capacity: 14.4,
    max_payload: 750,
    current_odometer: 12450
  },
  metrics: {
    completed_trips: 8,
    total_distance: 47.5,
    revenue_today: 1800,
    customers_served: 12,
    battery_soc: 78,
    current_range: 120,
    last_charged: '2 hours ago',
    energy_consumed: 4.2
  },
  whatsappTemplates: {
    trip_started: 'Hello {CUSTOMER_NAME}, your delivery trip {TRIP_ID} has started. We\'ll update you when we\'re on the way!',
    enroute_pickup: 'Hi {CUSTOMER_NAME}, we\'re on the way to pick up your order. ETA: {ETA} minutes.',
    enroute_delivery: 'Hi {CUSTOMER_NAME}, your order is on the way! We\'ll reach in approximately {ETA} minutes.',
    delivery_completed: 'Thank you {CUSTOMER_NAME}! Your delivery has been completed successfully. We hope to serve you again soon!'
  },
  selectedLocation: null,
  locationTarget: null,
  map: null,
  marker: null
};

// Initialize App
function initApp() {
  // Check if URL is configured
  if (APPS_SCRIPT_URL === 'PASTE_YOUR_APPS_SCRIPT_URL_HERE') {
    showConfigError();
    return;
  }
  
  // Initialize Google API
  initializeGoogleAPI();
  
  updateDateTime();
  setInterval(updateDateTime, 60000);
  
  setupMobileNavigation();
  setupModals();
  setupForms();
  setupMap();
  setupFAB();
  
  renderDashboard();
  renderSchedule();
  renderCustomers();
  
  // Update current date display
  updateCurrentDate();
  updateScheduleDate();
}

// Configuration Management
function showConfigError() {
  document.getElementById('configError').classList.remove('hidden');
  document.getElementById('mainContent').style.display = 'none';
  document.querySelector('.mobile-header').style.display = 'none';
  document.querySelector('.bottom-tabs').style.display = 'none';
}

function showMainApp() {
  document.getElementById('configError').classList.add('hidden');
  document.getElementById('mainContent').style.display = 'block';
  document.querySelector('.mobile-header').style.display = 'flex';
  document.querySelector('.bottom-tabs').style.display = 'flex';
}

// Initialize connection with Apps Script Bridge
async function initializeGoogleAPI() {
  console.log('=== INITIALIZING WITH APPS SCRIPT BRIDGE ===');
  console.log('Apps Script URL:', APPS_SCRIPT_URL);
  
  showToast('Connecting to Google Sheets...', 'info');
  updateSyncStatus('syncing');
  
  try {
    console.log('Testing Apps Script access...');
    const result = await callScript(APPS_SCRIPT_URL, 'test');
    
    if (!result.success) {
      throw new Error(result.error || 'Connection test failed');
    }
    
    console.log('✅ Connected successfully!');
    isConnected = true;
    showToast('Connected to Google Sheets!', 'success');
    updateSyncStatus('synced');
    
    // Load initial data
    await loadDataFromSheets();
    startSyncTimer();
    
  } catch (error) {
    console.error('=== CONNECTION ERROR ===', error);
    showToast('Connection failed. Using sample data.', 'warning');
    updateSyncStatus('offline');
    isConnected = false;
  }
}

// Call Apps Script with parameters
async function callScript(scriptUrl, action, params = {}) {
  const url = new URL(scriptUrl);
  url.searchParams.append('action', action);
  
  // Add all params to URL
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });
  
  console.log(`Calling: ${action}`, params);
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown error from Apps Script');
    }
    
    console.log(`✅ ${action} successful`);
    return data;
    
  } catch (error) {
    console.error(`❌ ${action} failed:`, error);
    throw error;
  }
}

// Load data from Google Sheets via Apps Script
async function loadDataFromSheets() {
  showToast('Loading data from Google Sheets...', 'info');
  updateSyncStatus('syncing');
  
  try {
    // Load dashboard
    await loadDashboardMetrics();
    
    // Load customers
    await loadCustomersFromSheet();
    
    // Load trips
    await loadTripsFromSheet();
    
    // Render everything
    renderDashboard();
    renderSchedule();
    renderCustomers();
    
    updateSyncStatus('synced');
    showToast('Data loaded successfully!', 'success');
    
  } catch (error) {
    console.error('Load data error:', error);
    updateSyncStatus('offline');
    showToast('Failed to load data. Using local data.', 'warning');
  }
}

async function loadDashboardMetrics() {
  try {
    const result = await callScript(APPS_SCRIPT_URL, 'getDashboard');
    
    if (result.data) {
      appState.metrics.completed_trips = result.data.trips_today || 0;
      appState.metrics.total_distance = result.data.distance_today || 0;
      appState.metrics.revenue_today = result.data.revenue_today || 0;
      appState.metrics.customers_served = result.data.customers_today || 0;
      appState.metrics.battery_soc = result.data.battery_soc || 78;
      appState.metrics.current_range = result.data.current_range || 120;
    }
  } catch (error) {
    console.error('Load dashboard error:', error);
    // Use default metrics
  }
}

async function loadCustomersFromSheet() {
  try {
    const result = await callScript(APPS_SCRIPT_URL, 'getCustomers');
    
    if (result.data && Array.isArray(result.data)) {
      appState.customers = result.data.map(customer => ({
        id: customer.id || '',
        name: customer.name || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        pincode: customer.pincode || '',
        type: customer.type || 'Individual',
        total_trips: customer.total_trips || 0,
        last_delivery: customer.last_delivery || '-'
      })).filter(c => c.id && c.name);
      
      console.log(`Loaded ${appState.customers.length} customers`);
    }
  } catch (error) {
    console.error('Load customers error:', error);
    // Keep existing customers
  }
}

async function loadTripsFromSheet() {
  try {
    const result = await callScript(APPS_SCRIPT_URL, 'getTrips');
    
    if (result.data && Array.isArray(result.data)) {
      appState.scheduledTrips = result.data.map(trip => ({
        id: trip.id || '',
        customer: trip.customer || '',
        customer_id: trip.customer_id || '',
        scheduled_time: trip.scheduled_time || '09:00',
        order_type: trip.order_type || 'Delivery',
        pickup: trip.pickup || 'Main Hub',
        delivery: trip.delivery || '',
        distance: parseFloat(trip.distance) || 0,
        weight: parseFloat(trip.weight) || 0,
        phone: trip.phone || ''
      }));
      
      console.log(`Loaded ${appState.scheduledTrips.length} trips`);
    }
  } catch (error) {
    console.error('Load trips error:', error);
    // Keep existing trips
  }
}

function updateScheduleDate() {
  const now = new Date();
  const options = {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  };
  const dateEl = document.getElementById('scheduleDate');
  if (dateEl) {
    dateEl.textContent = 'Today, ' + now.toLocaleDateString('en-IN', options);
  }
}

// DateTime Update
function updateDateTime() {
  const now = new Date();
  const options = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  const dateTimeEl = document.getElementById('headerDateTime');
  if (dateTimeEl) {
    dateTimeEl.textContent = now.toLocaleDateString('en-IN', options);
  }
}

function updateCurrentDate() {
  const now = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  const dateEl = document.getElementById('currentDate');
  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString('en-IN', options);
  }
}

// Mobile Navigation
function setupMobileNavigation() {
  // Bottom tab navigation
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const page = button.dataset.page;
      navigateToPage(page);
    });
  });
  
  // Settings button
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      navigateToPage('settings');
    });
  }
}

function navigateToPage(page) {
  // Update tab active state
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
    const buttonPage = button.dataset.page;
    if (buttonPage === page) {
      button.classList.add('active');
    }
  });
  
  // Update page visibility
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });
  const targetPage = document.getElementById(`${page}Page`);
  if (targetPage) {
    targetPage.classList.add('active');
  }
  
  appState.currentPage = page;
  
  // Update FAB visibility
  updateFAB(page);
  
  // Scroll to top
  window.scrollTo(0, 0);
}

// FAB Setup
function setupFAB() {
  const fab = document.getElementById('fab');
  if (fab) {
    fab.addEventListener('click', () => {
      if (appState.currentPage === 'schedule') {
        openModal('addTripModal');
        populateCustomerDropdowns();
      } else if (appState.currentPage === 'customers') {
        openModal('addCustomerModal');
      }
    });
  }
}

function updateFAB(page) {
  const fab = document.getElementById('fab');
  if (!fab) return;
  
  if (page === 'schedule' || page === 'customers') {
    fab.classList.remove('hidden');
  } else {
    fab.classList.add('hidden');
  }
}



// Dashboard
function renderDashboard() {
  const metrics = appState.metrics;
  
  document.getElementById('completedTrips').textContent = metrics.completed_trips;
  document.getElementById('distanceTraveled').textContent = `${metrics.total_distance} km`;
  document.getElementById('revenueEarned').textContent = `₹${metrics.revenue_today.toLocaleString()}`;
  document.getElementById('customersServed').textContent = metrics.customers_served;
  
  document.getElementById('batteryPercentage').textContent = `${metrics.battery_soc}%`;
  document.getElementById('batteryLevel').style.width = `${metrics.battery_soc}%`;
  document.getElementById('currentRange').textContent = `${metrics.current_range} km remaining`;
  document.getElementById('lastCharged').textContent = metrics.last_charged;
  document.getElementById('energyConsumed').textContent = `${metrics.energy_consumed} kWh`;
}

// Schedule
function renderSchedule() {
  const tripsList = document.getElementById('tripsList');
  tripsList.innerHTML = '';
  
  if (appState.scheduledTrips.length === 0) {
    tripsList.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: 40px;">No trips scheduled for today. Click "Add New Trip" to schedule one.</p>';
    return;
  }
  
  appState.scheduledTrips.forEach((trip, index) => {
    const tripCard = document.createElement('div');
    tripCard.className = 'trip-card';
    tripCard.innerHTML = `
      <div class="trip-header">
        <div class="trip-title">
          <div>
            <div class="trip-number">Trip #${index + 1}</div>
            <div class="trip-customer">${trip.customer}</div>
          </div>
        </div>
        <div class="trip-time">${trip.scheduled_time}</div>
      </div>
      <div class="trip-details">
        <div class="trip-detail">
          <span class="status status--success">${trip.order_type}</span>
        </div>
        <div class="trip-detail">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="10" r="3"/>
            <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"/>
          </svg>
          <div class="trip-detail-content">
            <div class="trip-detail-label">Pickup</div>
            <div class="trip-detail-value">${trip.pickup}</div>
          </div>
        </div>
        <div class="trip-detail">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="15"></line>
          </svg>
          <div class="trip-detail-content">
            <div class="trip-detail-label">Delivery</div>
            <div class="trip-detail-value">${trip.delivery}</div>
          </div>
        </div>
        <div class="trip-detail">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          <div class="trip-detail-content">
            <div class="trip-detail-label">Customer Phone</div>
            <div class="trip-detail-value">
              <a href="tel:+91${trip.phone}" class="trip-phone">${trip.phone}</a>
            </div>
          </div>
        </div>
      </div>
      <div class="trip-actions">
        <button class="btn btn--primary" onclick="startScheduledTrip('${trip.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Start Trip
        </button>
        <button class="btn btn--secondary" onclick="sendWhatsApp('${trip.phone}', 'trip_started', '${trip.customer}', '${trip.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          WhatsApp
        </button>
        <button class="btn btn--outline btn--sm" onclick="editTrip('${trip.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="btn btn--outline btn--sm" onclick="cancelTrip('${trip.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
    tripsList.appendChild(tripCard);
  });
}

// Customers
function renderCustomers() {
  const customerCount = document.getElementById('customerCount');
  
  if (customerCount) {
    customerCount.textContent = `${appState.customers.length} Active Customers`;
  }
  
  // Check if we have mobile customers container
  let mobileContainer = document.getElementById('customersMobile');
  if (!mobileContainer) {
    // Create mobile container if it doesn't exist
    const customersPage = document.getElementById('customersPage');
    const tableContainer = customersPage.querySelector('.customers-table-container');
    if (tableContainer) {
      mobileContainer = document.createElement('div');
      mobileContainer.id = 'customersMobile';
      mobileContainer.className = 'customers-mobile';
      tableContainer.parentNode.insertBefore(mobileContainer, tableContainer);
    }
  }
  
  if (!mobileContainer) return;
  
  mobileContainer.innerHTML = '';
  
  appState.customers.forEach(customer => {
    const card = document.createElement('div');
    card.className = 'customer-card';
    card.innerHTML = `
      <div class="customer-card-header">
        <div>
          <div class="customer-card-name">${customer.name}</div>
          <a href="tel:+91${customer.phone}" class="customer-card-phone">${customer.phone}</a>
        </div>
        <span class="status status--success">${customer.type}</span>
      </div>
      <div class="customer-card-address">${customer.address}, ${customer.city}</div>
      <div class="customer-card-stats">
        <span>${customer.total_trips} trips</span>
        <span>•</span>
        <span>Last: ${customer.last_delivery}</span>
      </div>
      <div class="customer-card-actions">
        <button class="btn btn--secondary" onclick="callCustomer('${customer.phone}')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          Call
        </button>
        <button class="btn btn--secondary" onclick="sendWhatsApp('${customer.phone}', 'trip_started', '${customer.name}', 'NEW')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          WhatsApp
        </button>
      </div>
    `;
    mobileContainer.appendChild(card);
  });
}

function callCustomer(phone) {
  window.location.href = `tel:+91${phone}`;
}

// Modals
function setupModals() {
  // Add Trip Modal
  const addTripBtn = document.getElementById('addNewTripBtn');
  if (addTripBtn) {
    addTripBtn.addEventListener('click', () => {
      openModal('addTripModal');
      populateCustomerDropdowns();
    });
  }
  
  document.getElementById('addTripModalClose').addEventListener('click', () => {
    closeModal('addTripModal');
  });
  
  document.getElementById('addTripModalCancel').addEventListener('click', () => {
    closeModal('addTripModal');
  });
  
  // Add Customer Modal
  const addCustomerBtn = document.getElementById('addNewCustomerBtn');
  if (addCustomerBtn) {
    addCustomerBtn.addEventListener('click', () => {
      openModal('addCustomerModal');
    });
  }
  
  document.getElementById('addCustomerModalClose').addEventListener('click', () => {
    closeModal('addCustomerModal');
  });
  
  document.getElementById('addCustomerModalCancel').addEventListener('click', () => {
    closeModal('addCustomerModal');
  });
  
  // Map Modal
  document.getElementById('mapModalClose').addEventListener('click', () => {
    closeModal('mapModal');
  });
  
  document.getElementById('mapModalCancel').addEventListener('click', () => {
    closeModal('mapModal');
  });
  
  // Close modals on backdrop click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function populateCustomerDropdowns() {
  const selects = ['tripCustomer', 'deliveryCustomer'];
  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (select) {
      select.innerHTML = '<option value="">Choose a customer...</option>';
      appState.customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = customer.name;
        select.appendChild(option);
      });
    }
  });
}

// Forms
function setupForms() {
  // Add Trip Form
  document.getElementById('saveTripBtn').addEventListener('click', async () => {
    const customerId = document.getElementById('tripCustomer').value;
    const time = document.getElementById('tripTime').value;
    const orderType = document.getElementById('tripOrderType').value;
    const pickup = document.getElementById('tripPickup').value;
    const delivery = document.getElementById('tripDelivery').value;
    
    if (!customerId || !time || !pickup || !delivery) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    const customer = appState.customers.find(c => c.id === customerId);
    const tripId = `TRP_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_${String(appState.scheduledTrips.length + 1).padStart(3, '0')}`;
    
    const newTrip = {
      id: tripId,
      customer: customer.name,
      customer_id: customerId,
      scheduled_time: time,
      order_type: orderType,
      pickup: pickup,
      delivery: delivery,
      distance: parseFloat(document.getElementById('tripDistance').value) || 0,
      weight: parseFloat(document.getElementById('tripWeight').value) || 0,
      phone: customer.phone
    };
    
    showToast('Scheduling trip...', 'info');
    closeModal('addTripModal');
    
    // Save to Google Sheets
    await saveTripToSheet(newTrip);
    
    // Reload trips to ensure sync
    if (isConnected) {
      await loadTripsFromSheet();
    } else {
      appState.scheduledTrips.push(newTrip);
    }
    
    renderSchedule();
    renderDashboard();
    
    showToast('Trip scheduled successfully!', 'success');
    
    // Clear form
    document.getElementById('addTripForm').reset();
  });
  
  // Add Customer Form
  document.getElementById('saveCustomerBtn').addEventListener('click', async () => {
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const address1 = document.getElementById('customerAddress1').value;
    const city = document.getElementById('customerCity').value;
    const pincode = document.getElementById('customerPincode').value;
    
    if (!name || !phone || !address1 || !city || !pincode) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    if (!/^[0-9]{10}$/.test(phone)) {
      showToast('Please enter a valid 10-digit phone number', 'error');
      return;
    }
    
    if (!/^[0-9]{6}$/.test(pincode)) {
      showToast('Please enter a valid 6-digit PIN code', 'error');
      return;
    }
    
    const customerId = `CUST_${String(appState.customers.length + 1).padStart(3, '0')}`;
    const address2 = document.getElementById('customerAddress2').value;
    const fullAddress = address2 ? `${address1}, ${address2}` : address1;
    
    const newCustomer = {
      id: customerId,
      name: name,
      phone: phone,
      address: fullAddress,
      city: city,
      pincode: pincode,
      type: document.getElementById('customerType').value,
      total_trips: 0,
      last_delivery: '-'
    };
    
    appState.customers.push(newCustomer);
    renderCustomers();
    closeModal('addCustomerModal');
    showToast('Saving customer...', 'info');
    
    // Save to Google Sheets
    await saveCustomerToSheet(newCustomer);
    
    // Clear form
    document.getElementById('addCustomerForm').reset();
  });
  
  // New Delivery Form
  const newDeliveryForm = document.getElementById('newDeliveryForm');
  if (newDeliveryForm) {
    newDeliveryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      startNewDelivery();
    });
  }
  
  // Customer search
  document.getElementById('customerSearch').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#customersTableBody tr');
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  });
  
  // Settings
  document.getElementById('forceSyncBtn').addEventListener('click', () => {
    syncToExcel();
  });
  
  document.getElementById('autoSyncToggle').addEventListener('change', (e) => {
    appState.settings.auto_sync = e.target.checked;
    showToast(`Auto-sync ${e.target.checked ? 'enabled' : 'disabled'}`, 'success');
  });
  
  // Dashboard quick actions
  document.getElementById('startNewTripBtn').addEventListener('click', () => {
    navigateToPage('delivery');
  });
  
  document.getElementById('logChargingBtn').addEventListener('click', () => {
    showToast('Charging session logging coming in v2.0', 'info');
  });
  
  // Map buttons
  document.getElementById('pickupMapBtn')?.addEventListener('click', () => {
    appState.locationTarget = 'pickup';
    openModal('mapModal');
    initializeMap();
  });
  
  document.getElementById('deliveryMapBtn')?.addEventListener('click', () => {
    appState.locationTarget = 'delivery';
    openModal('mapModal');
    initializeMap();
  });
  
  document.getElementById('useCurrentLocationBtn').addEventListener('click', () => {
    getCurrentLocation();
  });
  
  document.getElementById('confirmLocationBtn').addEventListener('click', () => {
    confirmLocation();
  });
}

// Map Setup
function setupMap() {
  // Map will be initialized when modal is opened
}

function initializeMap() {
  if (appState.map) {
    appState.map.remove();
  }
  
  // Initialize Leaflet map
  appState.map = L.map('map').setView([9.1721, 77.8638], 13); // Kovilpatti coordinates
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(appState.map);
  
  // Add click handler
  appState.map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    setMapLocation(lat, lng);
  });
  
  // Fix map size after modal opens
  setTimeout(() => {
    appState.map.invalidateSize();
  }, 100);
}

function setMapLocation(lat, lng) {
  if (appState.marker) {
    appState.map.removeLayer(appState.marker);
  }
  
  appState.marker = L.marker([lat, lng]).addTo(appState.map);
  appState.selectedLocation = { lat, lng };
  
  document.getElementById('mapCoordinates').textContent = `Selected: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  
  // Reverse geocode to get address
  reverseGeocode(lat, lng);
}

function reverseGeocode(lat, lng) {
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
    .then(response => response.json())
    .then(data => {
      if (data.display_name) {
        document.getElementById('locationDescription').value = data.display_name;
      }
    })
    .catch(error => {
      console.error('Geocoding error:', error);
    });
}

function getCurrentLocation() {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser', 'error');
    return;
  }
  
  showToast('Getting your location...', 'info');
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setMapLocation(lat, lng);
      appState.map.setView([lat, lng], 15);
      showToast('Location detected successfully!', 'success');
    },
    (error) => {
      showToast('Unable to get your location', 'error');
      console.error('Geolocation error:', error);
    }
  );
}

function confirmLocation() {
  if (!appState.selectedLocation) {
    showToast('Please select a location on the map', 'error');
    return;
  }
  
  const description = document.getElementById('locationDescription').value;
  const locationString = description || `${appState.selectedLocation.lat.toFixed(6)}, ${appState.selectedLocation.lng.toFixed(6)}`;
  
  if (appState.locationTarget === 'pickup') {
    document.getElementById('deliveryPickupLocation').value = locationString;
  } else if (appState.locationTarget === 'delivery') {
    document.getElementById('deliveryDeliveryLocation').value = locationString;
  }
  
  closeModal('mapModal');
  showToast('Location selected successfully!', 'success');
}

// Trip Actions
function startScheduledTrip(tripId) {
  const trip = appState.scheduledTrips.find(t => t.id === tripId);
  if (!trip) return;
  
  appState.activeTrip = {
    ...trip,
    status: 'started',
    start_time: new Date().toISOString(),
    start_odometer: appState.settings.current_odometer,
    start_battery: appState.metrics.battery_soc
  };
  
  // Remove from scheduled
  appState.scheduledTrips = appState.scheduledTrips.filter(t => t.id !== tripId);
  
  navigateToPage('delivery');
  renderActiveTrip();
  showToast('Trip started successfully!', 'success');
  syncToExcel();
}

function startNewDelivery() {
  const customerId = document.getElementById('deliveryCustomer').value;
  const pickup = document.getElementById('deliveryPickupLocation').value;
  const delivery = document.getElementById('deliveryDeliveryLocation').value;
  const distance = document.getElementById('deliveryDistance').value;
  const weight = document.getElementById('deliveryWeight').value;
  
  if (!customerId || !pickup || !delivery || !distance || !weight) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  const customer = appState.customers.find(c => c.id === customerId);
  const tripId = `TRP_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_${String(Date.now()).slice(-3)}`;
  
  appState.activeTrip = {
    id: tripId,
    customer: customer.name,
    customer_id: customerId,
    phone: customer.phone,
    pickup: pickup,
    delivery: delivery,
    distance: parseFloat(distance),
    weight: parseFloat(weight),
    status: 'started',
    start_time: new Date().toISOString(),
    start_odometer: appState.settings.current_odometer,
    start_battery: appState.metrics.battery_soc
  };
  
  renderActiveTrip();
  showToast('Trip started successfully!', 'success');
  syncToExcel();
}

function renderActiveTrip() {
  const activeSection = document.getElementById('activeTripSection');
  const newSection = document.getElementById('newDeliverySection');
  
  if (!appState.activeTrip) {
    activeSection.classList.add('hidden');
    newSection.classList.remove('hidden');
    populateCustomerDropdowns();
    return;
  }
  
  activeSection.classList.remove('hidden');
  newSection.classList.add('hidden');
  
  const trip = appState.activeTrip;
  activeSection.innerHTML = `
    <div class="new-delivery-card">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
        <div>
          <h2>Active Trip: ${trip.id}</h2>
          <p style="color: var(--color-text-secondary); margin-top: 8px;">Customer: ${trip.customer}</p>
        </div>
        <span class="status status--success">In Progress</span>
      </div>
      
      <div class="trip-details" style="margin-bottom: 24px;">
        <div class="trip-detail">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="10" r="3"/>
            <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"/>
          </svg>
          <div class="trip-detail-content">
            <div class="trip-detail-label">Pickup</div>
            <div class="trip-detail-value">${trip.pickup}</div>
          </div>
        </div>
        <div class="trip-detail">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="15"></line>
          </svg>
          <div class="trip-detail-content">
            <div class="trip-detail-label">Delivery</div>
            <div class="trip-detail-value">${trip.delivery}</div>
          </div>
        </div>
      </div>
      
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button class="btn btn--primary" onclick="sendWhatsApp('${trip.phone}', 'enroute_pickup', '${trip.customer}', '${trip.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          Send Update
        </button>
        <button class="btn btn--secondary" onclick="completeTrip()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Complete Delivery
        </button>
        <button class="btn btn--outline" onclick="cancelActiveTrip()">
          Cancel Trip
        </button>
      </div>
    </div>
  `;
}

async function completeTrip() {
  if (!appState.activeTrip) return;
  
  const trip = appState.activeTrip;
  const customer = appState.customers.find(c => c.id === trip.customer_id);
  
  // Update metrics
  appState.metrics.completed_trips++;
  appState.metrics.total_distance += trip.distance;
  appState.metrics.revenue_today += appState.settings.default_delivery_rate;
  
  // Update customer
  if (customer) {
    customer.total_trips++;
    customer.last_delivery = new Date().toISOString().split('T')[0];
  }
  
  // Send completion WhatsApp
  sendWhatsApp(trip.phone, 'delivery_completed', trip.customer, trip.id);
  
  showToast('Completing trip...', 'info');
  
  // Save to sheets
  if (isConnected) {
    await saveTripToSheet(trip);
    // Reload data to ensure sync
    await loadDataFromSheets();
  }
  
  // Clear active trip
  appState.activeTrip = null;
  
  renderDashboard();
  renderActiveTrip();
  renderCustomers();
  showToast('Trip completed successfully! 🎉', 'success');
  
  // Show next trip suggestion
  setTimeout(() => {
    showToast('Would you like to start another trip?', 'info');
  }, 2000);
}

function cancelActiveTrip() {
  if (confirm('Are you sure you want to cancel this trip?')) {
    appState.activeTrip = null;
    renderActiveTrip();
    showToast('Trip cancelled', 'warning');
  }
}

async function deleteTrip(tripId) {
  const trip = appState.scheduledTrips.find(t => t.id === tripId);
  if (!trip) return;
  
  if (!confirm(`Delete trip to ${trip.customer}? This cannot be undone.`)) {
    return;
  }
  
  showToast('Deleting trip...', 'info');
  
  try {
    if (isConnected) {
      // Delete from Google Sheets
      const result = await callScript(APPS_SCRIPT_URL, 'deleteTrip', { trip_id: tripId });
      if (!result.success) {
        throw new Error(result.error);
      }
    }
    
    // Remove from local state
    appState.scheduledTrips = appState.scheduledTrips.filter(t => t.id !== tripId);
    
    // Reload data and update UI
    if (isConnected) {
      await loadTripsFromSheet();
    }
    
    renderSchedule();
    renderDashboard();
    
    showToast('Trip deleted successfully!', 'success');
    
  } catch (error) {
    console.error('Delete trip error:', error);
    showToast('Failed to delete trip: ' + error.message, 'error');
  }
}

// Customer Actions
function viewCustomer(customerId) {
  const customer = appState.customers.find(c => c.id === customerId);
  if (!customer) return;
  
  showToast(`Viewing ${customer.name} - Full details coming soon!`, 'info');
}

function editCustomer(customerId) {
  showToast('Edit customer feature coming soon', 'info');
}

async function deleteCustomer(customerId, customerName) {
  if (!confirm(`Delete customer "${customerName}"? This cannot be undone.`)) {
    return;
  }
  
  showToast('Deleting customer...', 'info');
  
  try {
    if (isConnected) {
      // Delete from Google Sheets
      const result = await callScript(APPS_SCRIPT_URL, 'deleteCustomer', { customer_id: customerId });
      if (!result.success) {
        throw new Error(result.error);
      }
    }
    
    // Remove from local state
    appState.customers = appState.customers.filter(c => c.id !== customerId);
    
    // Reload data and update UI
    if (isConnected) {
      await loadCustomersFromSheet();
    }
    
    renderCustomers();
    populateCustomerDropdowns();
    renderDashboard();
    
    showToast('Customer deleted successfully!', 'success');
    
  } catch (error) {
    console.error('Delete customer error:', error);
    showToast('Failed to delete customer: ' + error.message, 'error');
  }
}

// WhatsApp Integration
function sendWhatsApp(phone, templateKey, customerName, tripId) {
  let message = appState.whatsappTemplates[templateKey] || '';
  message = message.replace('{CUSTOMER_NAME}', customerName);
  message = message.replace('{TRIP_ID}', tripId);
  message = message.replace('{ETA}', '15'); // Default ETA
  
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/91${phone}?text=${encodedMessage}`;
  
  window.open(url, '_blank');
  showToast('WhatsApp opened with pre-filled message', 'success');
}

// Sync to Google Sheets
async function syncToExcel() {
  if (!isConnected) {
    showToast('Not connected to Google Sheets', 'error');
    updateSyncStatus('offline');
    return;
  }
  
  updateSyncStatus('syncing');
  
  try {
    await loadDataFromSheets();
    document.getElementById('lastSyncTime').textContent = 'Just now';
    console.log('Synced with Google Sheets');
  } catch (error) {
    console.error('Sync error:', error);
    updateSyncStatus('offline');
    showToast('Sync failed: ' + error.message, 'error');
  }
}

// Save customer to Google Sheets via Apps Script
async function saveCustomerToSheet(customer) {
  if (!isConnected) {
    // Add to local state even if offline
    appState.customers.push(customer);
    showToast('Not connected. Customer saved locally.', 'warning');
    return;
  }
  
  updateSyncStatus('syncing');
  
  try {
    const result = await callScript(APPS_SCRIPT_URL, 'addCustomer', {
      name: customer.name,
      phone: customer.phone,
      address1: customer.address,
      city: customer.city,
      pincode: customer.pincode,
      type: customer.type
    });
    
    if (result.success) {
      updateSyncStatus('synced');
      
      // Update customer ID from response
      if (result.customer_id) {
        customer.id = result.customer_id;
      }
    }
    
  } catch (error) {
    console.error('Save customer error:', error);
    updateSyncStatus('offline');
    // Still add locally if save failed
    appState.customers.push(customer);
    showToast('Failed to save to sheet, saved locally', 'warning');
  }
}

// Save trip to Google Sheets via Apps Script
async function saveTripToSheet(trip) {
  if (!isConnected) {
    showToast('Not connected. Trip saved locally.', 'warning');
    return;
  }
  
  updateSyncStatus('syncing');
  
  try {
    const result = await callScript(APPS_SCRIPT_URL, 'addTrip', {
      customer_id: trip.customer_id,
      customer_name: trip.customer,
      start_odometer: trip.start_odometer || 0,
      distance: trip.distance || 0,
      start_battery: trip.start_battery || 0,
      start_location: trip.pickup || '',
      end_location: trip.delivery || '',
      phone: trip.phone || ''
    });
    
    if (result.success) {
      updateSyncStatus('synced');
      
      // Update trip ID from response
      if (result.trip_id) {
        trip.id = result.trip_id;
      }
      
      // Reload trips to ensure sync
      await loadTripsFromSheet();
      renderSchedule();
    }
    
  } catch (error) {
    console.error('Save trip error:', error);
    updateSyncStatus('offline');
  }
}

function updateSyncStatus(status) {
  const indicator = document.querySelector('.sync-indicator');
  const text = document.querySelector('.sync-text');
  
  indicator.className = 'sync-indicator';
  
  switch(status) {
    case 'syncing':
      indicator.classList.add('syncing');
      text.textContent = 'Syncing...';
      break;
    case 'offline':
      indicator.classList.add('offline');
      text.textContent = 'Offline';
      break;
    default:
      text.textContent = 'Synced';
  }
}

function startSyncTimer() {
  if (appState.settings.auto_sync) {
    setInterval(() => {
      if (isConnected) {
        syncToExcel();
      }
    }, appState.settings.sync_interval * 1000);
  }
}



// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-message">${message}</div>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s var(--ease-standard) reverse';
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, 3000);
}

// Initialize app on load
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});