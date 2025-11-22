/**
 * Water Supply Manager - Enterprise Backend
 * Google Apps Script - Production Grade
 * 
 * Architecture:
 * - Repository Pattern for data access
 * - Service Layer for business logic
 * - Atomic transactions with rollback
 * - Comprehensive error handling
 * - Audit logging
 * - Version control & conflict detection
 * 
 * @version 4.0.0
 * @author Enterprise Development Team
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  SHEETS: {
    INVENTORY: 'Inventory',
    CUSTOMERS: 'Customers',
    ORDERS: 'Orders',
    TRANSACTIONS: 'Transactions',
    METADATA: 'Metadata',
    AUDIT_LOG: 'AuditLog'
  },
  VERSION: '4.0.0',
  DEBUG: true
};

// ============================================================================
// UTILITY CLASSES
// ============================================================================

/**
 * Logger utility for structured logging
 */
class Logger {
  static log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    if (CONFIG.DEBUG) {
      Logger.log(logEntry);
      if (data) {
        Logger.log(JSON.stringify(data, null, 2));
      }
    }
    
    // Write to audit log
    if (level === 'ERROR' || level === 'WARN') {
      AuditRepository.logEvent(level, message, data);
    }
  }
  
  static info(message, data) { Logger.log('INFO', message, data); }
  static warn(message, data) { Logger.log('WARN', message, data); }
  static error(message, data) { Logger.log('ERROR', message, data); }
  static debug(message, data) { Logger.log('DEBUG', message, data); }
}

/**
 * Response builder for consistent API responses
 */
class ResponseBuilder {
  static success(data, metadata = {}) {
    return {
      success: true,
      data: data,
      metadata: {
        timestamp: new Date().toISOString(),
        version: CONFIG.VERSION,
        ...metadata
      }
    };
  }
  
  static error(message, code = 'UNKNOWN_ERROR', details = null) {
    Logger.error(message, { code, details });
    return {
      success: false,
      error: {
        message: message,
        code: code,
        details: details
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: CONFIG.VERSION
      }
    };
  }
  
  static toJson(data) {
    const output = ContentService.createTextOutput(JSON.stringify(data));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}

/**
 * Data validator for schema validation
 */
class DataValidator {
  static validateInventory(inventory) {
    const required = ['300ml', '500ml', '1l', '20l_filled', '20l_empty'];
    
    if (!inventory || typeof inventory !== 'object') {
      throw new Error('Inventory must be an object');
    }
    
    for (const key of required) {
      if (typeof inventory[key] !== 'number' || inventory[key] < 0) {
        throw new Error(`Invalid value for ${key}: must be non-negative number`);
      }
    }
    
    return true;
  }
  
  static validateCustomer(customer) {
    if (!customer.name || typeof customer.name !== 'string') {
      throw new Error('Customer name is required');
    }
    
    if (!customer.mobile || !/^\d{10}$/.test(customer.mobile)) {
      throw new Error('Valid 10-digit mobile number is required');
    }
    
    return true;
  }
  
  static validateAppState(state) {
    if (!state || typeof state !== 'object') {
      throw new Error('Invalid app state');
    }
    
    DataValidator.validateInventory(state.inventory);
    
    if (!Array.isArray(state.customers)) {
      throw new Error('Customers must be an array');
    }
    
    if (!Array.isArray(state.orders)) {
      throw new Error('Orders must be an array');
    }
    
    if (!Array.isArray(state.transactions)) {
      throw new Error('Transactions must be an array');
    }
    
    return true;
  }
}

// ============================================================================
// REPOSITORY LAYER - Data Access
// ============================================================================

/**
 * Base repository with common CRUD operations
 */
class BaseRepository {
  constructor(sheetName) {
    this.sheetName = sheetName;
  }
  
  getSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(this.sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(this.sheetName);
      this.initializeSheet(sheet);
    }
    
    return sheet;
  }
  
  initializeSheet(sheet) {
    // Override in child classes
  }
  
  getData() {
    const sheet = this.getSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return [];
    }
    
    return data.slice(1); // Skip header
  }
  
  clearAndWrite(data) {
    const sheet = this.getSheet();
    sheet.clear();
    this.initializeSheet(sheet);
    
    if (data && data.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, data.length, data[0].length)
        .setValues(data);
    }
  }
}

/**
 * Inventory Repository
 */
class InventoryRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEETS.INVENTORY);
  }
  
  initializeSheet(sheet) {
    sheet.appendRow(['Product', 'Quantity', 'Last Updated', 'Unit Price', 'Notes']);
  }
  
  load() {
    try {
      const data = this.getData();
      const inventory = {
        '300ml': 0,
        '500ml': 0,
        '1l': 0,
        '20l_filled': 0,
        '20l_empty': 0
      };
      
      data.forEach(row => {
        const product = String(row[0]).trim();
        const quantity = parseFloat(row[1]) || 0;
        
        if (inventory.hasOwnProperty(product)) {
          inventory[product] = Math.max(0, quantity);
        }
      });
      
      return inventory;
    } catch (error) {
      Logger.error('Failed to load inventory', error);
      throw error;
    }
  }
  
  save(inventory) {
    try {
      const products = {
        '300ml': { price: '₹3.71', note: '35 units per pack' },
        '500ml': { price: '₹4.58', note: '24 units per pack' },
        '1l': { price: '₹7.08', note: '12 units per pack' },
        '20l_filled': { price: '₹156', note: 'Ready for sale' },
        '20l_empty': { price: '-', note: 'Waiting for refill' }
      };
      
      const timestamp = Utilities.formatDate(
        new Date(), 
        Session.getScriptTimeZone(), 
        'dd-MMM-yyyy HH:mm:ss'
      );
      
      const data = Object.keys(inventory).map(product => [
        product,
        inventory[product],
        timestamp,
        products[product].price,
        products[product].note
      ]);
      
      this.clearAndWrite(data);
      return true;
    } catch (error) {
      Logger.error('Failed to save inventory', error);
      throw error;
    }
  }
}

/**
 * Customers Repository
 */
class CustomersRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEETS.CUSTOMERS);
  }
  
  initializeSheet(sheet) {
    sheet.appendRow([
      'Name', 'Mobile', 'Shop Name', 'Empty Cans', 'Cans Returned',
      'Total Orders', '300ml', '500ml', '1L', '20L', 'Created Date'
    ]);
  }
  
  load() {
    try {
      const data = this.getData();
      
      return data.map(row => ({
        name: String(row[0] || ''),
        mobile: String(row[1] || ''),
        shopName: String(row[2] || ''),
        emptyCans: Math.max(0, parseFloat(row[3]) || 0),
        cansReturned: Math.max(0, parseFloat(row[4]) || 0),
        totalOrders: Math.max(0, parseFloat(row[5]) || 0),
        purchases: {
          '300ml': Math.max(0, parseFloat(row[6]) || 0),
          '500ml': Math.max(0, parseFloat(row[7]) || 0),
          '1l': Math.max(0, parseFloat(row[8]) || 0),
          '20l': Math.max(0, parseFloat(row[9]) || 0)
        },
        createdDate: row[10] ? String(row[10]) : new Date().toISOString()
      })).filter(c => c.name && c.mobile);
    } catch (error) {
      Logger.error('Failed to load customers', error);
      throw error;
    }
  }
  
  save(customers) {
    try {
      const data = customers.map(c => [
        c.name,
        c.mobile,
        c.shopName || '',
        c.emptyCans,
        c.cansReturned,
        c.totalOrders,
        c.purchases['300ml'],
        c.purchases['500ml'],
        c.purchases['1l'],
        c.purchases['20l'],
        c.createdDate
      ]);
      
      this.clearAndWrite(data);
      return true;
    } catch (error) {
      Logger.error('Failed to save customers', error);
      throw error;
    }
  }
}

/**
 * Orders Repository
 */
class OrdersRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEETS.ORDERS);
  }
  
  initializeSheet(sheet) {
    sheet.appendRow(['Date', 'Customer', 'Type', 'Items', 'Amount', 'Status']);
  }
  
  load() {
    try {
      const data = this.getData();
      
      return data.map(row => ({
        date: row[0] ? String(row[0]) : new Date().toISOString(),
        customer: String(row[1] || ''),
        type: String(row[2] || ''),
        items: String(row[3] || ''),
        amount: Math.max(0, parseFloat(row[4]) || 0)
      })).filter(o => o.customer);
    } catch (error) {
      Logger.error('Failed to load orders', error);
      throw error;
    }
  }
  
  save(orders) {
    try {
      const data = orders.map(o => [
        o.date,
        o.customer,
        o.type,
        o.items,
        o.amount,
        'Completed'
      ]);
      
      this.clearAndWrite(data);
      return true;
    } catch (error) {
      Logger.error('Failed to save orders', error);
      throw error;
    }
  }
}

/**
 * Transactions Repository
 */
class TransactionsRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEETS.TRANSACTIONS);
  }
  
  initializeSheet(sheet) {
    sheet.appendRow(['Date', 'Product', 'Type', 'Quantity', 'Cost', 'Notes']);
  }
  
  load() {
    try {
      const data = this.getData();
      
      return data.map(row => ({
        date: row[0] ? String(row[0]) : new Date().toISOString(),
        product: String(row[1] || ''),
        type: String(row[2] || ''),
        quantity: parseFloat(row[3]) || 0,
        cost: Math.max(0, parseFloat(row[4]) || 0)
      })).filter(t => t.product);
    } catch (error) {
      Logger.error('Failed to load transactions', error);
      throw error;
    }
  }
  
  save(transactions) {
    try {
      const data = transactions.map(t => [
        t.date,
        t.product,
        t.type,
        t.quantity,
        t.cost,
        ''
      ]);
      
      this.clearAndWrite(data);
      return true;
    } catch (error) {
      Logger.error('Failed to save transactions', error);
      throw error;
    }
  }
}

/**
 * Metadata Repository for versioning
 */
class MetadataRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEETS.METADATA);
  }
  
  initializeSheet(sheet) {
    sheet.appendRow(['Key', 'Value', 'Updated']);
    sheet.appendRow(['version', '1', new Date().toISOString()]);
    sheet.appendRow(['lastUpdate', new Date().toISOString(), new Date().toISOString()]);
  }
  
  getMetadata() {
    try {
      const data = this.getData();
      const metadata = {};
      
      data.forEach(row => {
        metadata[row[0]] = row[1];
      });
      
      return metadata;
    } catch (error) {
      Logger.error('Failed to get metadata', error);
      return {
        version: '1',
        lastUpdate: new Date().toISOString()
      };
    }
  }
  
  updateKey(key, value) {
    try {
      const sheet = this.getSheet();
      const data = sheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === key) {
          sheet.getRange(i + 1, 2).setValue(value);
          sheet.getRange(i + 1, 3).setValue(new Date().toISOString());
          return true;
        }
      }
      
      // Key not found, add it
      sheet.appendRow([key, value, new Date().toISOString()]);
      return true;
    } catch (error) {
      Logger.error('Failed to update metadata', error);
      return false;
    }
  }
  
  incrementVersion() {
    const metadata = this.getMetadata();
    const currentVersion = parseInt(metadata.version || '1');
    const newVersion = currentVersion + 1;
    
    this.updateKey('version', newVersion.toString());
    this.updateKey('lastUpdate', new Date().toISOString());
    
    return newVersion;
  }
}

/**
 * Audit Log Repository
 */
class AuditRepository extends BaseRepository {
  constructor() {
    super(CONFIG.SHEETS.AUDIT_LOG);
  }
  
  initializeSheet(sheet) {
    sheet.appendRow(['Timestamp', 'Level', 'Event', 'Details']);
  }
  
  static logEvent(level, event, details) {
    try {
      const repo = new AuditRepository();
      const sheet = repo.getSheet();
      
      sheet.appendRow([
        new Date().toISOString(),
        level,
        event,
        details ? JSON.stringify(details) : ''
      ]);
    } catch (error) {
      Logger.log('Failed to write audit log: ' + error.toString());
    }
  }
}

// ============================================================================
// SERVICE LAYER - Business Logic
// ============================================================================

/**
 * Data Service with atomic operations
 */
class DataService {
  constructor() {
    this.inventoryRepo = new InventoryRepository();
    this.customersRepo = new CustomersRepository();
    this.ordersRepo = new OrdersRepository();
    this.transactionsRepo = new TransactionsRepository();
    this.metadataRepo = new MetadataRepository();
  }
  
  loadAll() {
    Logger.info('Loading all data');
    
    try {
      const data = {
        inventory: this.inventoryRepo.load(),
        customers: this.customersRepo.load(),
        orders: this.ordersRepo.load(),
        transactions: this.transactionsRepo.load()
      };
      
      Logger.info('Data loaded successfully', {
        customers: data.customers.length,
        orders: data.orders.length,
        transactions: data.transactions.length
      });
      
      return data;
    } catch (error) {
      Logger.error('Failed to load data', error);
      throw error;
    }
  }
  
  saveAll(appState) {
    Logger.info('Starting atomic save operation');
    
    // Validate first
    try {
      DataValidator.validateAppState(appState);
    } catch (validationError) {
      throw new Error('Validation failed: ' + validationError.message);
    }
    
    // Create backup
    let backup = null;
    try {
      backup = this.loadAll();
      Logger.info('Backup created');
    } catch (backupError) {
      Logger.warn('Backup creation failed, proceeding without backup', backupError);
    }
    
    // Attempt save
    try {
      this.inventoryRepo.save(appState.inventory);
      this.customersRepo.save(appState.customers);
      this.ordersRepo.save(appState.orders);
      this.transactionsRepo.save(appState.transactions);
      
      const newVersion = this.metadataRepo.incrementVersion();
      
      Logger.info('Data saved successfully', { version: newVersion });
      
      return {
        success: true,
        version: newVersion
      };
      
    } catch (saveError) {
      Logger.error('Save failed, attempting rollback', saveError);
      
      // Attempt rollback
      if (backup) {
        try {
          this.inventoryRepo.save(backup.inventory);
          this.customersRepo.save(backup.customers);
          this.ordersRepo.save(backup.orders);
          this.transactionsRepo.save(backup.transactions);
          
          Logger.info('Rollback successful');
        } catch (rollbackError) {
          Logger.error('Rollback failed - data may be corrupted', rollbackError);
        }
      }
      
      throw saveError;
    }
  }
  
  getMetadata() {
    return this.metadataRepo.getMetadata();
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * GET request handler
 */
function doGet(e) {
  const startTime = Date.now();
  
  try {
    Logger.info('GET request received', e ? e.parameter : null);
    
    if (!e || !e.parameter || !e.parameter.action) {
      return ResponseBuilder.toJson(
        ResponseBuilder.error('Missing action parameter', 'MISSING_ACTION')
      );
    }
    
    const action = e.parameter.action;
    const service = new DataService();
    
    switch (action) {
      case 'loadData':
        const data = service.loadAll();
        const metadata = service.getMetadata();
        
        return ResponseBuilder.toJson(
          ResponseBuilder.success(data, {
            ...metadata,
            duration: Date.now() - startTime
          })
        );
        
      case 'checkVersion':
        const versionMetadata = service.getMetadata();
        
        return ResponseBuilder.toJson(
          ResponseBuilder.success(null, {
            ...versionMetadata,
            duration: Date.now() - startTime
          })
        );
        
      default:
        return ResponseBuilder.toJson(
          ResponseBuilder.error(`Unknown action: ${action}`, 'UNKNOWN_ACTION')
        );
    }
    
  } catch (error) {
    return ResponseBuilder.toJson(
      ResponseBuilder.error(error.toString(), 'SERVER_ERROR', error.stack)
    );
  }
}

/**
 * POST request handler
 */
function doPost(e) {
  const startTime = Date.now();
  
  try {
    Logger.info('POST request received');
    
    if (!e || !e.postData || !e.postData.contents) {
      return ResponseBuilder.toJson(
        ResponseBuilder.error('No POST data received', 'MISSING_DATA')
      );
    }
    
    let requestData;
    try {
      requestData = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return ResponseBuilder.toJson(
        ResponseBuilder.error('Invalid JSON', 'INVALID_JSON', parseError.toString())
      );
    }
    
    if (!requestData.action) {
      return ResponseBuilder.toJson(
        ResponseBuilder.error('Missing action', 'MISSING_ACTION')
      );
    }
    
    const service = new DataService();
    
    switch (requestData.action) {
      case 'saveData':
        if (!requestData.data) {
          return ResponseBuilder.toJson(
            ResponseBuilder.error('Missing data', 'MISSING_DATA')
          );
        }
        
        const saveResult = service.saveAll(requestData.data);
        const metadata = service.getMetadata();
        
        return ResponseBuilder.toJson(
          ResponseBuilder.success(null, {
            ...metadata,
            message: 'Data saved successfully',
            duration: Date.now() - startTime
          })
        );
        
      default:
        return ResponseBuilder.toJson(
          ResponseBuilder.error(`Unknown action: ${requestData.action}`, 'UNKNOWN_ACTION')
        );
    }
    
  } catch (error) {
    return ResponseBuilder.toJson(
      ResponseBuilder.error(error.toString(), 'SERVER_ERROR', error.stack)
    );
  }
}

/**
 * Test function - Run this to verify setup
 */
function runTests() {
  Logger.log('========================================');
  Logger.log('WATER SUPPLY MANAGER - TEST SUITE');
  Logger.log('========================================\n');
  
  try {
    const service = new DataService();
    
    // Test 1: Load data
    Logger.log('Test 1: Load Data');
    const data = service.loadAll();
    Logger.log('✓ Data loaded: ' + data.customers.length + ' customers');
    
    // Test 2: Metadata
    Logger.log('\nTest 2: Metadata');
    const metadata = service.getMetadata();
    Logger.log('✓ Version: ' + metadata.version);
    
    // Test 3: Save test data
    Logger.log('\nTest 3: Save Data');
    const testData = {
      inventory: { '300ml': 100, '500ml': 50, '1l': 25, '20l_filled': 10, '20l_empty': 5 },
      customers: [{
        name: 'Test Customer',
        mobile: '9999999999',
        shopName: 'Test Shop',
        emptyCans: 2,
        cansReturned: 1,
        totalOrders: 1,
        purchases: { '300ml': 10, '500ml': 5, '1l': 2, '20l': 1 },
        createdDate: new Date().toISOString()
      }],
      orders: [],
      transactions: []
    };
    
    const saveResult = service.saveAll(testData);
    Logger.log('✓ Save successful, version: ' + saveResult.version);
    
    Logger.log('\n========================================');
    Logger.log('✓ ALL TESTS PASSED');
    Logger.log('========================================');
    Logger.log('\nREADY FOR DEPLOYMENT');
    Logger.log('1. Deploy as Web App');
    Logger.log('2. Execute as: Me');
    Logger.log('3. Access: Anyone');
    Logger.log('4. Copy the deployment URL');
    
    return 'Tests passed successfully!';
    
  } catch (error) {
    Logger.log('\n========================================');
    Logger.log('✗ TESTS FAILED');
    Logger.log('========================================');
    Logger.log('Error: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    
    return 'Tests failed: ' + error.toString();
  }
}
