/**
 * Water Supply Management System - Production Grade PWA
 * @version 2.0.0
 * @author Professional Developer
 * @description Enterprise-level water supply management with OOP architecture,
 * design patterns, and Google Sheets synchronization
 */

'use strict';

// ==================== CONSTANTS ====================

const CONFIG = {
  APP_VERSION: '2.0.0',
  STORAGE_KEYS: {
    APP_STATE: 'waterSupply_appState',
    UI_STATE: 'waterSupply_uiState',
    METADATA: 'waterSupply_metadata'
  },
  SYNC: {
    INTERVAL: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000,
    TIMEOUT: 10000
  },
  TOAST_DURATION: 3000,
  PRODUCTS: {
    '300ml': '300ml Bottles',
    '500ml': '500ml Bottles',
    '1l': '1L Bottles',
    '20l': '20L Cans',
    '20l_filled': '20L Filled',
    '20l_empty': '20L Empty'
  },
  GOOGLE_SCRIPT_URL: '' // TO BE CONFIGURED BY USER
};

const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR: 'error',
  OFFLINE: 'offline'
};

// ==================== UTILITY CLASSES ====================

/**
 * Logger utility for consistent logging
 */
class Logger {
  static log(message, data = null) {
    console.log(`[WaterSupply] ${message}`, data || '');
  }

  static error(message, error = null) {
    console.error(`[WaterSupply ERROR] ${message}`, error || '');
  }

  static warn(message, data = null) {
    console.warn(`[WaterSupply WARN] ${message}`, data || '');
  }
}

/**
 * Validation utility for data validation
 */
class Validator {
  static isValidMobile(mobile) {
    return /^[0-9]{10}$/.test(mobile);
  }

  static isValidNumber(value) {
    return !isNaN(value) && isFinite(value) && value >= 0;
  }

  static isValidString(str, minLength = 1) {
    return typeof str === 'string' && str.trim().length >= minLength;
  }

  static sanitizeNumber(value, defaultValue = 0) {
    const num = parseFloat(value);
    return this.isValidNumber(num) ? num : defaultValue;
  }
}

// ==================== ENTITY CLASSES ====================

/**
 * Customer Entity
 * Represents a customer with validation and serialization
 */
class Customer {
  constructor(data) {
    this.name = data.name || '';
    this.mobile = data.mobile || '';
    this.shopName = data.shopName || '';
    this.emptyCans = Validator.sanitizeNumber(data.emptyCans, 0);
    this.cansReturned = Validator.sanitizeNumber(data.cansReturned, 0);
    this.totalOrders = Validator.sanitizeNumber(data.totalOrders, 0);
    this.purchases = data.purchases || {
      '300ml': 0,
      '500ml': 0,
      '1l': 0,
      '20l': 0
    };
    this.createdDate = data.createdDate || new Date().toISOString();
  }

  /**
   * Validates customer data
   * @returns {Object} {valid: boolean, errors: string[]}
   */
  validate() {
    const errors = [];
    
    if (!Validator.isValidString(this.name, 2)) {
      errors.push('Name must be at least 2 characters');
    }
    
    if (!Validator.isValidMobile(this.mobile)) {
      errors.push('Mobile must be 10 digits');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Adds a purchase to customer history
   */
  addPurchase(product, quantity) {
    if (this.purchases[product] !== undefined) {
      this.purchases[product] += quantity;
      this.totalOrders++;
    }
  }

  /**
   * Serializes to JSON
   */
  toJSON() {
    return {
      name: this.name,
      mobile: this.mobile,
      shopName: this.shopName,
      emptyCans: this.emptyCans,
      cansReturned: this.cansReturned,
      totalOrders: this.totalOrders,
      purchases: { ...this.purchases },
      createdDate: this.createdDate
    };
  }

  /**
   * Creates Customer from JSON
   */
  static fromJSON(json) {
    return new Customer(json);
  }
}

/**
 * Order Entity
 */
class Order {
  constructor(data) {
    this.date = data.date || new Date().toISOString();
    this.customer = data.customer || '';
    this.type = data.type || 'sale';
    this.items = data.items || '';
    this.amount = Validator.sanitizeNumber(data.amount, 0);
  }

  validate() {
    const errors = [];
    
    if (!Validator.isValidString(this.customer)) {
      errors.push('Customer is required');
    }
    
    if (!['sale', 'return'].includes(this.type)) {
      errors.push('Invalid order type');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      date: this.date,
      customer: this.customer,
      type: this.type,
      items: this.items,
      amount: this.amount
    };
  }

  static fromJSON(json) {
    return new Order(json);
  }
}

/**
 * Transaction Entity
 */
class Transaction {
  constructor(data) {
    this.date = data.date || new Date().toISOString();
    this.product = data.product || '';
    this.type = data.type || 'add';
    this.quantity = Validator.sanitizeNumber(data.quantity, 0);
    this.cost = Validator.sanitizeNumber(data.cost, 0);
  }

  toJSON() {
    return {
      date: this.date,
      product: this.product,
      type: this.type,
      quantity: this.quantity,
      cost: this.cost
    };
  }

  static fromJSON(json) {
    return new Transaction(json);
  }
}

// ==================== STATE MANAGEMENT (OBSERVER PATTERN) ====================

/**
 * StateManager - Observable pattern for reactive state management
 * Implements pub/sub for UI updates
 */
class StateManager {
  constructor(initialState = {}) {
    this.state = initialState;
    this.observers = [];
    Logger.log('StateManager initialized');
  }

  /**
   * Subscribe to state changes
   * @param {Function} callback - Called when state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback);
    };
  }

  /**
   * Notify all observers of state change
   */
  notify(changedKeys = []) {
    this.observers.forEach(callback => {
      try {
        callback(this.state, changedKeys);
      } catch (error) {
        Logger.error('Observer callback error', error);
      }
    });
  }

  /**
   * Update state and notify observers
   */
  setState(updates) {
    const changedKeys = Object.keys(updates);
    this.state = { ...this.state, ...updates };
    this.notify(changedKeys);
    Logger.log('State updated', changedKeys);
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get specific state value
   */
  get(key) {
    return this.state[key];
  }
}

// ==================== DATA REPOSITORY (REPOSITORY PATTERN) ====================

/**
 * DataRepository - Handles all data persistence
 * Separates data access logic from business logic
 */
class DataRepository {
  constructor() {
    this.storageAvailable = this.checkStorageAvailability();
  }

  /**
   * Check if in-memory storage is available
   */
  checkStorageAvailability() {
    // Always use in-memory storage for sandboxed environment
    this.memoryStorage = {};
    return true;
  }

  /**
   * Load data from in-memory storage
   */
  loadFromLocal(key) {
    if (!this.storageAvailable) return null;
    
    try {
      const data = this.memoryStorage[key];
      return data ? JSON.parse(JSON.stringify(data)) : null;
    } catch (error) {
      Logger.error(`Error loading ${key} from memory storage`, error);
      return null;
    }
  }

  /**
   * Save data to in-memory storage
   */
  saveToLocal(key, data) {
    if (!this.storageAvailable) return false;
    
    try {
      this.memoryStorage[key] = JSON.parse(JSON.stringify(data));
      return true;
    } catch (error) {
      Logger.error(`Error saving ${key} to memory storage`, error);
      return false;
    }
  }

  /**
   * Load app state
   */
  loadAppState() {
    const defaultState = {
      inventory: {
        '300ml': 0,
        '500ml': 0,
        '1l': 0,
        '20l_filled': 0,
        '20l_empty': 0
      },
      customers: [],
      orders: [],
      transactions: []
    };
    
    const saved = this.loadFromLocal(CONFIG.STORAGE_KEYS.APP_STATE);
    return saved || defaultState;
  }

  /**
   * Save app state
   */
  saveAppState(state) {
    return this.saveToLocal(CONFIG.STORAGE_KEYS.APP_STATE, state);
  }

  /**
   * Load UI state
   */
  loadUIState() {
    const defaultState = {
      selectedCustomer: null,
      saleFormData: {},
      activeTab: 'inventory',
      scrollPositions: {}
    };
    
    const saved = this.loadFromLocal(CONFIG.STORAGE_KEYS.UI_STATE);
    return saved || defaultState;
  }

  /**
   * Save UI state
   */
  saveUIState(state) {
    return this.saveToLocal(CONFIG.STORAGE_KEYS.UI_STATE, state);
  }

  /**
   * Load metadata
   */
  loadMetadata() {
    const defaultMetadata = {
      version: CONFIG.APP_VERSION,
      lastSync: null,
      syncStatus: SYNC_STATUS.IDLE
    };
    
    const saved = this.loadFromLocal(CONFIG.STORAGE_KEYS.METADATA);
    return saved || defaultMetadata;
  }

  /**
   * Save metadata
   */
  saveMetadata(metadata) {
    return this.saveToLocal(CONFIG.STORAGE_KEYS.METADATA, metadata);
  }
}

// ==================== SYNC MANAGER (SINGLETON + STRATEGY PATTERN) ====================

/**
 * SyncManager - Handles synchronization with Google Sheets
 * Implements Singleton pattern and sync strategies
 */
class SyncManager {
  static instance = null;

  constructor(repository, stateManager) {
    if (SyncManager.instance) {
      return SyncManager.instance;
    }

    this.repository = repository;
    this.stateManager = stateManager;
    this.syncIntervalId = null;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.isSyncing = false;

    this.setupOnlineListener();
    SyncManager.instance = this;
    Logger.log('SyncManager initialized');
  }

  /**
   * Setup online/offline detection
   */
  setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      Logger.log('Network: Online');
      this.syncNow();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      Logger.log('Network: Offline');
      this.updateSyncStatus(SYNC_STATUS.OFFLINE);
    });
  }

  /**
   * Start automatic sync
   */
  startAutoSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    this.syncIntervalId = setInterval(() => {
      this.syncNow();
    }, CONFIG.SYNC.INTERVAL);

    Logger.log('Auto-sync started');
    this.syncNow(); // Initial sync
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
      Logger.log('Auto-sync stopped');
    }
  }

  /**
   * Force immediate sync
   */
  async syncNow() {
    if (!this.isOnline) {
      this.updateSyncStatus(SYNC_STATUS.OFFLINE);
      return;
    }

    if (this.isSyncing) {
      Logger.log('Sync already in progress');
      return;
    }

    if (!CONFIG.GOOGLE_SCRIPT_URL) {
      Logger.warn('Google Script URL not configured');
      return;
    }

    this.isSyncing = true;
    this.updateSyncStatus(SYNC_STATUS.SYNCING);

    try {
      const state = this.stateManager.getState();
      const result = await this.syncWithServer(state);
      
      if (result.success) {
        this.updateSyncStatus(SYNC_STATUS.SUCCESS);
        const metadata = this.repository.loadMetadata();
        metadata.lastSync = new Date().toISOString();
        this.repository.saveMetadata(metadata);
        Logger.log('Sync successful');
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      Logger.error('Sync error', error);
      this.updateSyncStatus(SYNC_STATUS.ERROR);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync with Google Sheets server
   */
  async syncWithServer(data) {
    try {
      const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'sync',
          data: data,
          timestamp: new Date().toISOString()
        })
      });

      // Note: no-cors mode doesn't allow reading response
      // Assume success if no error thrown
      return { success: true };
    } catch (error) {
      Logger.error('Server sync error', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update sync status in UI
   */
  updateSyncStatus(status) {
    const indicator = document.getElementById('syncIndicator');
    const statusText = document.getElementById('syncStatus');
    
    if (!indicator || !statusText) return;

    indicator.className = 'sync-indicator';
    
    switch (status) {
      case SYNC_STATUS.SYNCING:
        indicator.classList.add('syncing');
        statusText.textContent = 'Syncing...';
        break;
      case SYNC_STATUS.SUCCESS:
        indicator.classList.add('success');
        statusText.textContent = 'Synced';
        break;
      case SYNC_STATUS.ERROR:
        indicator.classList.add('error');
        statusText.textContent = 'Error';
        break;
      case SYNC_STATUS.OFFLINE:
        indicator.classList.add('error');
        statusText.textContent = 'Offline';
        break;
      default:
        statusText.textContent = 'Idle';
    }
  }
}

// ==================== UI STATE MANAGER ====================

/**
 * UIStateManager - Manages UI-specific state
 */
class UIStateManager {
  constructor(repository) {
    this.repository = repository;
    this.uiState = repository.loadUIState();
  }

  /**
   * Save scroll position
   */
  saveScrollPosition(tab, position) {
    this.uiState.scrollPositions[tab] = position;
    this.repository.saveUIState(this.uiState);
  }

  /**
   * Restore scroll position
   */
  restoreScrollPosition(tab) {
    return this.uiState.scrollPositions[tab] || 0;
  }

  /**
   * Save form state
   */
  saveFormState(formData) {
    this.uiState.saleFormData = formData;
    this.repository.saveUIState(this.uiState);
  }

  /**
   * Get form state
   */
  getFormState() {
    return this.uiState.saleFormData || {};
  }

  /**
   * Set selected customer
   */
  setSelectedCustomer(mobile) {
    this.uiState.selectedCustomer = mobile;
    this.repository.saveUIState(this.uiState);
  }

  /**
   * Get selected customer
   */
  getSelectedCustomer() {
    return this.uiState.selectedCustomer;
  }

  /**
   * Set active tab
   */
  setActiveTab(tab) {
    this.uiState.activeTab = tab;
    this.repository.saveUIState(this.uiState);
  }

  /**
   * Get active tab
   */
  getActiveTab() {
    return this.uiState.activeTab || 'inventory';
  }
}

// ==================== UI COMPONENTS ====================

/**
 * ToastNotification - User feedback
 */
class ToastNotification {
  static show(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, CONFIG.TOAST_DURATION);
  }

  static success(message) {
    this.show(message, 'success');
  }

  static error(message) {
    this.show(message, 'error');
  }
}

/**
 * Modal Controller
 */
class ModalController {
  static open(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  static close(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
}

// ==================== MAIN APPLICATION CLASS ====================

/**
 * WaterSupplyApp - Main application controller
 * Orchestrates all components and manages application lifecycle
 */
class WaterSupplyApp {
  constructor() {
    this.repository = new DataRepository();
    this.stateManager = new StateManager(this.repository.loadAppState());
    this.uiStateManager = new UIStateManager(this.repository);
    this.syncManager = new SyncManager(this.repository, this.stateManager);
    this.isInitialized = false;

    Logger.log('WaterSupplyApp instance created');
  }

  /**
   * Initialize application
   */
  async init() {
    if (this.isInitialized) {
      Logger.warn('App already initialized');
      return;
    }

    try {
      Logger.log('Initializing application...');

      // Subscribe to state changes
      this.stateManager.subscribe((state, changedKeys) => {
        this.onStateChange(state, changedKeys);
      });

      // Setup UI
      this.setupNavigation();
      this.setupModals();
      this.setupForms();
      this.setupQuantitySteppers();
      this.setupCustomerSelection();
      this.setupSearch();

      // Render initial state
      this.renderAll();

      // Restore UI state
      const activeTab = this.uiStateManager.getActiveTab();
      this.switchTab(activeTab);

      // Start sync
      this.syncManager.startAutoSync();

      this.isInitialized = true;
      Logger.log('Application initialized successfully');
      ToastNotification.success('Welcome to Water Supply Manager!');
    } catch (error) {
      Logger.error('Initialization error', error);
      ToastNotification.error('Failed to initialize app');
    }
  }

  /**
   * Handle state changes
   */
  onStateChange(state, changedKeys) {
    // Save state to localStorage
    this.repository.saveAppState(state);

    // Update UI based on changes
    if (changedKeys.includes('inventory')) {
      this.renderInventory();
    }
    if (changedKeys.includes('customers')) {
      this.renderCustomers();
      this.updateCustomerSelects();
    }
    if (changedKeys.includes('orders')) {
      this.renderOrders();
    }
    if (changedKeys.includes('transactions')) {
      this.renderTransactions();
    }

    // Trigger sync after state change
    setTimeout(() => this.syncManager.syncNow(), 500);
  }

  /**
   * Setup navigation
   */
  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        this.switchTab(tab);
      });
    });
  }

  /**
   * Switch active tab
   */
  switchTab(tabName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.toggle('active', tab.id === `${tabName}Tab`);
    });

    // Update FAB visibility
    document.getElementById('fabInventory').classList.toggle('hidden', tabName !== 'inventory');
    document.getElementById('fabCustomer').classList.toggle('hidden', tabName !== 'customers');

    // Save UI state
    this.uiStateManager.setActiveTab(tabName);

    Logger.log(`Switched to ${tabName} tab`);
  }

  /**
   * Setup modals
   */
  setupModals() {
    // Add Stock Modal
    document.getElementById('fabInventory').addEventListener('click', () => {
      ModalController.open('addStockModal');
    });

    document.getElementById('closeStockModal').addEventListener('click', () => {
      ModalController.close('addStockModal');
    });

    // Add Customer Modal
    document.getElementById('fabCustomer').addEventListener('click', () => {
      ModalController.open('addCustomerModal');
    });

    document.getElementById('closeCustomerModal').addEventListener('click', () => {
      ModalController.close('addCustomerModal');
    });

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });
  }

  /**
   * Setup forms
   */
  setupForms() {
    // Add Stock Form
    document.getElementById('addStockForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddStock();
    });

    // Add Customer Form
    document.getElementById('addCustomerForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddCustomer();
    });

    // Sale/Return buttons
    document.getElementById('saleBtn').addEventListener('click', () => {
      this.showSaleForm();
    });

    document.getElementById('returnBtn').addEventListener('click', () => {
      this.handleReturn();
    });

    // Complete Sale
    document.getElementById('completeSaleBtn').addEventListener('click', () => {
      this.handleCompleteSale();
    });
  }

  /**
   * Setup quantity steppers
   */
  setupQuantitySteppers() {
    document.querySelectorAll('.stepper-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const product = btn.dataset.product;
        const action = btn.dataset.action;
        this.updateQuantity(product, action);
      });
    });

    // Update total on price change
    ['price300ml', 'price500ml', 'price1l', 'price20l'].forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', () => this.updateTotal());
      }
    });
  }

  /**
   * Setup customer selection
   */
  setupCustomerSelection() {
    const select = document.getElementById('orderCustomerSelect');
    
    select.addEventListener('change', (e) => {
      const mobile = e.target.value;
      this.selectCustomerForOrder(mobile);
    });
  }

  /**
   * Setup search
   */
  setupSearch() {
    const searchInput = document.getElementById('customerSearch');
    
    searchInput.addEventListener('input', (e) => {
      this.filterCustomers(e.target.value);
    });
  }

  /**
   * Handle add stock
   */
  handleAddStock() {
    const product = document.getElementById('stockProduct').value;
    const quantity = parseInt(document.getElementById('stockQuantity').value);
    const cost = parseFloat(document.getElementById('stockCost').value) || 0;

    if (!product || !quantity || quantity <= 0) {
      ToastNotification.error('Please fill all required fields');
      return;
    }

    const state = this.stateManager.getState();
    const newInventory = { ...state.inventory };
    newInventory[product] = (newInventory[product] || 0) + quantity;

    const transaction = new Transaction({
      product: product,
      type: 'add',
      quantity: quantity,
      cost: cost
    });

    this.stateManager.setState({
      inventory: newInventory,
      transactions: [transaction.toJSON(), ...state.transactions]
    });

    // Reset form
    document.getElementById('addStockForm').reset();
    ModalController.close('addStockModal');
    ToastNotification.success(`Added ${quantity} ${CONFIG.PRODUCTS[product]}`);
  }

  /**
   * Handle add customer
   */
  handleAddCustomer() {
    const name = document.getElementById('customerName').value.trim();
    const mobile = document.getElementById('customerMobile').value.trim();
    const shopName = document.getElementById('customerShop').value.trim();
    const emptyCans = parseInt(document.getElementById('customerEmptyCans').value) || 0;

    const customer = new Customer({
      name,
      mobile,
      shopName,
      emptyCans
    });

    const validation = customer.validate();
    if (!validation.valid) {
      ToastNotification.error(validation.errors[0]);
      return;
    }

    const state = this.stateManager.getState();
    
    // Check duplicate
    if (state.customers.some(c => c.mobile === mobile)) {
      ToastNotification.error('Customer with this mobile already exists');
      return;
    }

    this.stateManager.setState({
      customers: [customer.toJSON(), ...state.customers]
    });

    // Reset form
    document.getElementById('addCustomerForm').reset();
    ModalController.close('addCustomerModal');
    ToastNotification.success(`Added customer: ${name}`);
  }

  /**
   * Select customer for order
   */
  selectCustomerForOrder(mobile) {
    const state = this.stateManager.getState();
    const customer = state.customers.find(c => c.mobile === mobile);

    if (!customer) {
      document.getElementById('customerInfoCard').classList.add('hidden');
      document.getElementById('saleFormSection').classList.add('hidden');
      return;
    }

    this.uiStateManager.setSelectedCustomer(mobile);

    // Show customer info
    const infoCard = document.getElementById('customerInfoCard');
    const nameEl = document.getElementById('selectedCustomerName');
    const infoEl = document.getElementById('selectedCustomerInfo');

    nameEl.textContent = customer.name;
    infoEl.innerHTML = `
      <div>📱 ${customer.mobile}</div>
      ${customer.shopName ? `<div>🏪 ${customer.shopName}</div>` : ''}
      <div>🪣 Empty Cans: ${customer.emptyCans}</div>
      <div>📦 Total Orders: ${customer.totalOrders}</div>
    `;

    infoCard.classList.remove('hidden');
  }

  /**
   * Show sale form
   */
  showSaleForm() {
    const selectedMobile = this.uiStateManager.getSelectedCustomer();
    
    if (!selectedMobile) {
      ToastNotification.error('Please select a customer first');
      return;
    }

    document.getElementById('saleFormSection').classList.remove('hidden');
    this.resetSaleForm();
  }

  /**
   * Reset sale form
   */
  resetSaleForm() {
    ['300ml', '500ml', '1l', '20l'].forEach(product => {
      document.getElementById(`qty${product}`).textContent = '0';
      const priceInput = document.getElementById(`price${product}`);
      if (priceInput) priceInput.value = '';
    });
    this.updateTotal();
  }

  /**
   * Update quantity
   */
  updateQuantity(product, action) {
    const qtyEl = document.getElementById(`qty${product}`);
    let qty = parseInt(qtyEl.textContent) || 0;

    if (action === 'increase') {
      qty++;
    } else if (action === 'decrease' && qty > 0) {
      qty--;
    }

    qtyEl.textContent = qty;
    this.updateTotal();
  }

  /**
   * Update total amount
   */
  updateTotal() {
    let total = 0;

    ['300ml', '500ml', '1l', '20l'].forEach(product => {
      const qty = parseInt(document.getElementById(`qty${product}`).textContent) || 0;
      const price = parseFloat(document.getElementById(`price${product}`).value) || 0;
      total += qty * price;
    });

    document.getElementById('totalAmount').textContent = `₹${total.toFixed(2)}`;
    
    const stickyTotal = document.getElementById('stickyTotal');
    if (total > 0) {
      stickyTotal.classList.remove('hidden');
    } else {
      stickyTotal.classList.add('hidden');
    }
  }

  /**
   * Handle complete sale
   */
  handleCompleteSale() {
    const selectedMobile = this.uiStateManager.getSelectedCustomer();
    const state = this.stateManager.getState();
    const customer = state.customers.find(c => c.mobile === selectedMobile);

    if (!customer) {
      ToastNotification.error('Customer not found');
      return;
    }

    const items = [];
    let totalAmount = 0;
    const newInventory = { ...state.inventory };

    ['300ml', '500ml', '1l', '20l'].forEach(product => {
      const qty = parseInt(document.getElementById(`qty${product}`).textContent) || 0;
      const price = parseFloat(document.getElementById(`price${product}`).value) || 0;

      if (qty > 0) {
        const inventoryKey = product === '20l' ? '20l_filled' : product;
        
        // Check inventory
        if (newInventory[inventoryKey] < qty) {
          ToastNotification.error(`Insufficient stock for ${CONFIG.PRODUCTS[product]}`);
          throw new Error('Insufficient stock');
        }

        items.push(`${qty}x ${CONFIG.PRODUCTS[product]} @ ₹${price}`);
        totalAmount += qty * price;
        newInventory[inventoryKey] -= qty;

        // Update customer purchases
        const purchaseKey = product === '20l' ? '20l' : product;
        customer.purchases[purchaseKey] = (customer.purchases[purchaseKey] || 0) + qty;
      }
    });

    if (items.length === 0) {
      ToastNotification.error('Please add at least one item');
      return;
    }

    customer.totalOrders++;

    const order = new Order({
      customer: customer.name,
      type: 'sale',
      items: items.join(', '),
      amount: totalAmount
    });

    // Update customers array
    const updatedCustomers = state.customers.map(c => 
      c.mobile === selectedMobile ? customer : c
    );

    this.stateManager.setState({
      inventory: newInventory,
      customers: updatedCustomers,
      orders: [order.toJSON(), ...state.orders]
    });

    this.resetSaleForm();
    document.getElementById('saleFormSection').classList.add('hidden');
    ToastNotification.success(`Sale completed! Total: ₹${totalAmount.toFixed(2)}`);
  }

  /**
   * Handle return
   */
  handleReturn() {
    const selectedMobile = this.uiStateManager.getSelectedCustomer();
    
    if (!selectedMobile) {
      ToastNotification.error('Please select a customer first');
      return;
    }

    const state = this.stateManager.getState();
    const customer = state.customers.find(c => c.mobile === selectedMobile);

    if (customer.emptyCans <= 0) {
      ToastNotification.error('No empty cans to return');
      return;
    }

    const returnQty = customer.emptyCans;
    customer.emptyCans = 0;
    customer.cansReturned += returnQty;

    const newInventory = { ...state.inventory };
    newInventory['20l_empty'] += returnQty;

    const order = new Order({
      customer: customer.name,
      type: 'return',
      items: `${returnQty}x Empty 20L Cans`,
      amount: 0
    });

    const updatedCustomers = state.customers.map(c => 
      c.mobile === selectedMobile ? customer : c
    );

    this.stateManager.setState({
      inventory: newInventory,
      customers: updatedCustomers,
      orders: [order.toJSON(), ...state.orders]
    });

    ToastNotification.success(`Returned ${returnQty} empty cans`);
  }

  /**
   * Filter customers
   */
  filterCustomers(searchTerm) {
    const term = searchTerm.toLowerCase();
    const customerCards = document.querySelectorAll('.customer-card');

    customerCards.forEach(card => {
      const name = card.querySelector('.customer-name').textContent.toLowerCase();
      const mobile = card.dataset.mobile;
      
      if (name.includes(term) || mobile.includes(term)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }

  /**
   * Render all
   */
  renderAll() {
    this.renderInventory();
    this.renderCustomers();
    this.renderOrders();
    this.renderTransactions();
    this.updateCustomerSelects();
  }

  /**
   * Render inventory
   */
  renderInventory() {
    const state = this.stateManager.getState();
    const inventory = state.inventory;

    document.getElementById('stat300ml').textContent = inventory['300ml'] || 0;
    document.getElementById('stat500ml').textContent = inventory['500ml'] || 0;
    document.getElementById('stat1l').textContent = inventory['1l'] || 0;
    document.getElementById('stat20lFilled').textContent = inventory['20l_filled'] || 0;
    document.getElementById('stat20lEmpty').textContent = inventory['20l_empty'] || 0;
  }

  /**
   * Render customers
   */
  renderCustomers() {
    const state = this.stateManager.getState();
    const customers = state.customers;
    const container = document.getElementById('customerList');

    if (customers.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <p>No customers yet. Add your first customer!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = customers.map(customer => `
      <div class="customer-card" data-mobile="${customer.mobile}">
        <div class="customer-name">${customer.name}</div>
        <div class="customer-info">
          <div>📱 ${customer.mobile}</div>
          ${customer.shopName ? `<div>🏪 ${customer.shopName}</div>` : ''}
          <div>🪣 Empty Cans: ${customer.emptyCans} | Total Orders: ${customer.totalOrders}</div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render orders
   */
  renderOrders() {
    const state = this.stateManager.getState();
    const orders = state.orders.slice(0, 20); // Show last 20
    const container = document.getElementById('ordersList');

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <p>No orders yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table class="orders-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Customer</th>
            <th>Type</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(order => `
            <tr>
              <td>${new Date(order.date).toLocaleDateString()}</td>
              <td>${order.customer}</td>
              <td>${order.type === 'sale' ? '💰' : '↩️'} ${order.type}</td>
              <td>₹${order.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Render transactions
   */
  renderTransactions() {
    const state = this.stateManager.getState();
    const transactions = state.transactions.slice(0, 10); // Show last 10
    const container = document.getElementById('transactionsList');

    if (transactions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <p>No transactions yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = transactions.map(txn => `
      <div class="card" style="padding: var(--space-12); margin-bottom: var(--space-8);">
        <div class="flex-between">
          <div>
            <strong>${CONFIG.PRODUCTS[txn.product]}</strong>
            <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">
              ${txn.type.toUpperCase()} | Qty: ${txn.quantity}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="color: var(--color-primary); font-weight: var(--font-weight-semibold);">
              ₹${txn.cost.toFixed(2)}
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">
              ${new Date(txn.date).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Update customer selects
   */
  updateCustomerSelects() {
    const state = this.stateManager.getState();
    const customers = state.customers;
    const select = document.getElementById('orderCustomerSelect');

    const currentValue = select.value;

    select.innerHTML = '<option value="">Choose a customer...</option>' +
      customers.map(c => `
        <option value="${c.mobile}">${c.name} - ${c.mobile}</option>
      `).join('');

    if (currentValue) {
      select.value = currentValue;
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.syncManager.stopAutoSync();
    Logger.log('Application destroyed');
  }
}

// ==================== APPLICATION INITIALIZATION ====================

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initApp() {
  try {
    const app = new WaterSupplyApp();
    app.init();

    // Make app instance globally accessible for debugging
    window.waterSupplyApp = app;

    Logger.log('✓ Application started successfully');
  } catch (error) {
    Logger.error('Failed to start application', error);
    alert('Failed to start application. Please refresh the page.');
  }
}

// Service Worker Registration (for PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Service worker would be registered here in production
    Logger.log('Service Worker support detected');
  });
}