// Google Sheets Configuration
let gapiInitialized = false;
let isSignedIn = false;

// App State
const appState = {
  config: {
    clientId: '',
    spreadsheetId: '',
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
  // Check if already configured
  loadConfiguration();
  
  if (!appState.config.isConfigured) {
    showWelcomeScreen();
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
  setupConfigButtons();
  
  renderDashboard();
  renderSchedule();
  renderCustomers();
  
  // Update current date display
  updateCurrentDate();
  updateScheduleDate();
}

// Configuration Management
function loadConfiguration() {
  const config = {
    clientId: '',
    spreadsheetId: '',
    isConfigured: false
  };
  
  // Check for saved config in state
  if (appState.config.clientId && appState.config.spreadsheetId) {
    config.clientId = appState.config.clientId;
    config.spreadsheetId = appState.config.spreadsheetId;
    config.isConfigured = true;
  }
  
  appState.config = config;
}

function saveConfiguration(clientId, spreadsheetId) {
  appState.config = {
    clientId: clientId,
    spreadsheetId: spreadsheetId,
    isConfigured: true
  };
}

function showWelcomeScreen() {
  document.getElementById('welcomeScreen').classList.remove('hidden');
  document.getElementById('configScreen').classList.add('hidden');
  document.getElementById('mainContent').style.display = 'none';
  document.querySelector('.mobile-header').style.display = 'none';
  document.querySelector('.bottom-tabs').style.display = 'none';
}

function showConfigScreen() {
  document.getElementById('welcomeScreen').classList.add('hidden');
  document.getElementById('configScreen').classList.remove('hidden');
  document.getElementById('mainContent').style.display = 'none';
  document.querySelector('.mobile-header').style.display = 'none';
  document.querySelector('.bottom-tabs').style.display = 'none';
}

function showMainApp() {
  document.getElementById('welcomeScreen').classList.add('hidden');
  document.getElementById('configScreen').classList.add('hidden');
  document.getElementById('mainContent').style.display = 'block';
  document.querySelector('.mobile-header').style.display = 'flex';
  document.querySelector('.bottom-tabs').style.display = 'flex';
}

function setupConfigButtons() {
  const setupBtn = document.getElementById('setupNowBtn');
  if (setupBtn) {
    setupBtn.addEventListener('click', () => {
      showConfigScreen();
    });
  }
  
  const configForm = document.getElementById('configForm');
  if (configForm) {
    configForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveAndConnect();
    });
  }
  
  const testBtn = document.getElementById('testConnectionBtn');
  if (testBtn) {
    testBtn.addEventListener('click', () => {
      testConnection();
    });
  }
}

function testConnection() {
  const clientId = document.getElementById('clientIdInput').value.trim();
  const spreadsheetId = document.getElementById('spreadsheetIdInput').value.trim();
  
  if (!clientId || !spreadsheetId) {
    showConnectionStatus('Please fill in both fields', 'error');
    return;
  }
  
  showConnectionStatus('Testing connection...', 'info');
  
  // Basic validation
  if (!clientId.includes('.apps.googleusercontent.com')) {
    showConnectionStatus('Invalid Client ID format', 'error');
    return;
  }
  
  if (spreadsheetId.length < 20) {
    showConnectionStatus('Invalid Spreadsheet ID format', 'error');
    return;
  }
  
  showConnectionStatus('Credentials look valid! Click "Save & Connect" to proceed.', 'success');
}

function saveAndConnect() {
  const clientId = document.getElementById('clientIdInput').value.trim();
  const spreadsheetId = document.getElementById('spreadsheetIdInput').value.trim();
  
  if (!clientId || !spreadsheetId) {
    showConnectionStatus('Please fill in both fields', 'error');
    return;
  }
  
  showConnectionStatus('Saving configuration...', 'info');
  
  saveConfiguration(clientId, spreadsheetId);
  
  // Initialize Google API
  setTimeout(() => {
    initializeGoogleAPI();
  }, 500);
}

function showConnectionStatus(message, type) {
  const statusEl = document.getElementById('connectionStatus');
  statusEl.classList.remove('hidden');
  statusEl.className = `status status--${type}`;
  statusEl.style.display = 'block';
  statusEl.textContent = message;
}

// Google API Integration
function initializeGoogleAPI() {
  if (!window.gapi) {
    showToast('Google API not loaded. Please refresh the page.', 'error');
    return;
  }
  
  showToast('Initializing Google API...', 'info');
  updateSyncStatus('syncing');
  
  gapi.load('client:auth2', () => {
    gapi.client.init({
      clientId: appState.config.clientId,
      discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
      scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file'
    }).then(() => {
      gapiInitialized = true;
      
      // Listen for sign-in state changes
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
      
      // Handle initial sign-in state
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      
    }).catch(error => {
      console.error('Google API initialization error:', error);
      showToast('Failed to initialize Google API. Check your Client ID.', 'error');
      updateSyncStatus('offline');
      
      // Show config screen again
      setTimeout(() => {
        showConfigScreen();
        showConnectionStatus('API initialization failed. Please check your Client ID.', 'error');
      }, 1000);
    });
  });
}

function updateSigninStatus(signedIn) {
  isSignedIn = signedIn;
  
  if (signedIn) {
    onAuthSuccess();
  } else {
    // Trigger OAuth popup
    signIn();
  }
}

function signIn() {
  if (!gapiInitialized) {
    showToast('API not initialized yet', 'error');
    return;
  }
  
  showToast('Please authorize access in the popup...', 'info');
  
  gapi.auth2.getAuthInstance().signIn({
    prompt: 'consent'
  }).then(() => {
    showToast('Authorization successful!', 'success');
  }).catch(error => {
    console.error('Sign in error:', error);
    if (error.error === 'popup_closed_by_user') {
      showToast('Authorization cancelled. Please try again.', 'warning');
    } else {
      showToast('Authorization failed: ' + (error.error || 'Unknown error'), 'error');
    }
    updateSyncStatus('offline');
  });
}

function onAuthSuccess() {
  showToast('Connected to Google Sheets!', 'success');
  updateSyncStatus('synced');
  showMainApp();
  
  // Load data from sheets
  loadDataFromSheets();
  
  // Start auto-sync
  startSyncTimer();
}

// Google Sheets Operations
async function readSheet(sheetName, range) {
  if (!isSignedIn) {
    throw new Error('Not signed in to Google');
  }
  
  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: appState.config.spreadsheetId,
      range: `${sheetName}!${range}`
    });
    return response.result.values || [];
  } catch (error) {
    console.error('Read sheet error:', error);
    throw error;
  }
}

async function writeSheet(sheetName, range, values) {
  if (!isSignedIn) {
    throw new Error('Not signed in to Google');
  }
  
  try {
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: appState.config.spreadsheetId,
      range: `${sheetName}!${range}`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: values }
    });
  } catch (error) {
    console.error('Write sheet error:', error);
    throw error;
  }
}

async function appendRow(sheetName, values) {
  if (!isSignedIn) {
    throw new Error('Not signed in to Google');
  }
  
  try {
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: appState.config.spreadsheetId,
      range: `${sheetName}!A:A`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [values] }
    });
  } catch (error) {
    console.error('Append row error:', error);
    throw error;
  }
}

// Load data from Google Sheets
async function loadDataFromSheets() {
  showToast('Loading data from Google Sheets...', 'info');
  updateSyncStatus('syncing');
  
  try {
    // Load customers
    await loadCustomersFromSheet();
    
    // Load dashboard metrics
    await loadDashboardMetrics();
    
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

async function loadCustomersFromSheet() {
  try {
    const data = await readSheet('Customers', 'A2:P100');
    
    if (data && data.length > 0) {
      appState.customers = data.map(row => ({
        id: row[0] || '',
        name: row[1] || '',
        phone: row[2] || '',
        address: `${row[3] || ''}, ${row[4] || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
        city: row[5] || '',
        pincode: row[6] || '',
        type: row[7] || 'Individual',
        total_trips: parseInt(row[10]) || 0,
        last_delivery: row[12] || '-'
      })).filter(c => c.id && c.name);
    }
  } catch (error) {
    console.error('Load customers error:', error);
    throw error;
  }
}

async function loadDashboardMetrics() {
  try {
    const data = await readSheet('Dashboard', 'A2:B20');
    
    if (data && data.length > 0) {
      data.forEach(row => {
        const key = row[0];
        const value = row[1];
        
        if (key === 'Trips Today') appState.metrics.completed_trips = parseInt(value) || 0;
        if (key === 'Distance Today (km)') appState.metrics.total_distance = parseFloat(value) || 0;
        if (key === 'Revenue Today (₹)') appState.metrics.revenue_today = parseFloat(value) || 0;
        if (key === 'Customers Today') appState.metrics.customers_served = parseInt(value) || 0;
        if (key === 'Battery SOC (%)') appState.metrics.battery_soc = parseInt(value) || 78;
        if (key === 'Current Range (km)') appState.metrics.current_range = parseInt(value) || 120;
      });
    }
  } catch (error) {
    console.error('Load dashboard metrics error:', error);
    // Use default metrics if sheet doesn't exist
  }
}

async function loadTripsFromSheet() {
  try {
    const data = await readSheet('Trips', 'A2:P50');
    
    if (data && data.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      appState.scheduledTrips = data
        .filter(row => row[1] === today && row[4] === '') // Today's trips without start time
        .map(row => ({
          id: row[0],
          customer: row[3] || '',
          customer_id: row[2] || '',
          scheduled_time: row[4] || '09:00',
          order_type: 'Delivery',
          pickup: row[13] || 'Main Hub',
          delivery: row[14] || '',
          distance: parseFloat(row[9]) || 0,
          weight: 0,
          phone: appState.customers.find(c => c.id === row[2])?.phone || ''
        }));
    }
  } catch (error) {
    console.error('Load trips error:', error);
    // Use default trips
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
  document.getElementById('saveTripBtn').addEventListener('click', () => {
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
    
    appState.scheduledTrips.push(newTrip);
    renderSchedule();
    closeModal('addTripModal');
    showToast('Trip scheduled successfully!', 'success');
    syncToExcel();
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

function completeTrip() {
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
  
  // Clear active trip
  appState.activeTrip = null;
  
  renderDashboard();
  renderActiveTrip();
  renderCustomers();
  showToast('Trip completed successfully! 🎉', 'success');
  
  // Save to sheets
  if (isSignedIn) {
    saveTripToSheet(trip).catch(err => console.error('Save trip error:', err));
  }
  
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

function editTrip(tripId) {
  showToast('Edit trip feature coming soon', 'info');
}

function cancelTrip(tripId) {
  if (confirm('Are you sure you want to cancel this trip?')) {
    appState.scheduledTrips = appState.scheduledTrips.filter(t => t.id !== tripId);
    renderSchedule();
    showToast('Trip cancelled', 'warning');
    syncToExcel();
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

function deleteCustomer(customerId) {
  if (confirm('Are you sure you want to delete this customer?')) {
    appState.customers = appState.customers.filter(c => c.id !== customerId);
    renderCustomers();
    showToast('Customer deleted', 'warning');
    syncToExcel();
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
  if (!isSignedIn) {
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

// Save customer to Google Sheets
async function saveCustomerToSheet(customer) {
  if (!isSignedIn) {
    showToast('Not connected. Changes saved locally.', 'warning');
    return;
  }
  
  updateSyncStatus('syncing');
  
  try {
    const row = [
      customer.id,
      customer.name,
      customer.phone,
      customer.address.split(',')[0].trim(),
      customer.address.split(',').slice(1).join(',').trim(),
      customer.city,
      customer.pincode,
      customer.type,
      new Date().toISOString().split('T')[0],
      'Active',
      customer.total_trips || 0,
      0, // revenue
      customer.last_delivery || '',
      5, // rating
      '', // notes
      '' // tags
    ];
    
    await appendRow('Customers', row);
    updateSyncStatus('synced');
    showToast('Customer saved to Google Sheets!', 'success');
    
  } catch (error) {
    console.error('Save customer error:', error);
    updateSyncStatus('offline');
    showToast('Failed to save to sheet: ' + error.message, 'error');
  }
}

// Save trip to Google Sheets
async function saveTripToSheet(trip) {
  if (!isSignedIn) {
    showToast('Not connected. Trip saved locally.', 'warning');
    return;
  }
  
  updateSyncStatus('syncing');
  
  try {
    const row = [
      trip.id,
      new Date().toISOString().split('T')[0],
      trip.customer_id,
      trip.customer,
      trip.start_time || '',
      trip.end_time || '',
      '',
      trip.start_odometer || '',
      trip.end_odometer || '',
      trip.distance,
      trip.start_battery || '',
      trip.end_battery || '',
      '',
      trip.pickup,
      trip.delivery
    ];
    
    await appendRow('Trips', row);
    updateSyncStatus('synced');
    
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
      if (isSignedIn) {
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

// Initialize configuration and app on load
document.addEventListener('DOMContentLoaded', () => {
  setupConfigButtons();
  initApp();
});