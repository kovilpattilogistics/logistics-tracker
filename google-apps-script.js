/**
 * Google Apps Script - Water Supply Management System
 * Server-side sync handler for Google Sheets integration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open Google Sheets
 * 2. Extensions > Apps Script
 * 3. Copy this entire file
 * 4. Create the following sheets in your spreadsheet:
 *    - Inventory
 *    - Customers
 *    - Orders
 *    - Transactions
 * 5. Deploy as Web App (Deploy > New deployment > Web app)
 * 6. Set "Execute as: Me" and "Who has access: Anyone"
 * 7. Copy the deployment URL and paste it in app.js CONFIG.GOOGLE_SCRIPT_URL
 */

'use strict';

// ==================== CONFIGURATION ====================

const SHEET_CONFIG = {
  INVENTORY: 'Inventory',
  CUSTOMERS: 'Customers',
  ORDERS: 'Orders',
  TRANSACTIONS: 'Transactions',
  SYNC_LOG: 'SyncLog'
};

const HEADERS = {
  INVENTORY: ['Product', 'Quantity', 'Last Updated'],
  CUSTOMERS: ['Name', 'Mobile', 'Shop Name', 'Empty Cans', 'Cans Returned', 'Total Orders', 'Purchases 300ml', 'Purchases 500ml', 'Purchases 1L', 'Purchases 20L', 'Created Date'],
  ORDERS: ['Date', 'Customer', 'Type', 'Items', 'Amount'],
  TRANSACTIONS: ['Date', 'Product', 'Type', 'Quantity', 'Cost'],
  SYNC_LOG: ['Timestamp', 'Action', 'Status', 'Details']
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get or create a sheet by name
 */
function getOrCreateSheet(sheetName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }
  
  return sheet;
}

/**
 * Log sync operation
 */
function logSync(action, status, details) {
  try {
    const sheet = getOrCreateSheet(SHEET_CONFIG.SYNC_LOG, HEADERS.SYNC_LOG);
    const timestamp = new Date();
    sheet.appendRow([timestamp, action, status, details]);
  } catch (error) {
    console.error('Error logging sync:', error);
  }
}

/**
 * Clear sheet data (keep headers)
 */
function clearSheetData(sheetName) {
  const sheet = getOrCreateSheet(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
}

// ==================== SYNC HANDLERS ====================

/**
 * Sync inventory data
 */
function syncInventory(inventory) {
  try {
    const sheet = getOrCreateSheet(SHEET_CONFIG.INVENTORY, HEADERS.INVENTORY);
    clearSheetData(SHEET_CONFIG.INVENTORY);
    
    const timestamp = new Date();
    const rows = [
      ['300ml', inventory['300ml'] || 0, timestamp],
      ['500ml', inventory['500ml'] || 0, timestamp],
      ['1L', inventory['1l'] || 0, timestamp],
      ['20L Filled', inventory['20l_filled'] || 0, timestamp],
      ['20L Empty', inventory['20l_empty'] || 0, timestamp]
    ];
    
    sheet.getRange(2, 1, rows.length, 3).setValues(rows);
    return { success: true };
  } catch (error) {
    console.error('Error syncing inventory:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync customers data
 */
function syncCustomers(customers) {
  try {
    const sheet = getOrCreateSheet(SHEET_CONFIG.CUSTOMERS, HEADERS.CUSTOMERS);
    clearSheetData(SHEET_CONFIG.CUSTOMERS);
    
    if (customers.length === 0) {
      return { success: true };
    }
    
    const rows = customers.map(customer => [
      customer.name,
      customer.mobile,
      customer.shopName || '',
      customer.emptyCans || 0,
      customer.cansReturned || 0,
      customer.totalOrders || 0,
      customer.purchases['300ml'] || 0,
      customer.purchases['500ml'] || 0,
      customer.purchases['1l'] || 0,
      customer.purchases['20l'] || 0,
      customer.createdDate
    ]);
    
    sheet.getRange(2, 1, rows.length, HEADERS.CUSTOMERS.length).setValues(rows);
    return { success: true };
  } catch (error) {
    console.error('Error syncing customers:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync orders data
 */
function syncOrders(orders) {
  try {
    const sheet = getOrCreateSheet(SHEET_CONFIG.ORDERS, HEADERS.ORDERS);
    clearSheetData(SHEET_CONFIG.ORDERS);
    
    if (orders.length === 0) {
      return { success: true };
    }
    
    const rows = orders.map(order => [
      new Date(order.date),
      order.customer,
      order.type,
      order.items,
      order.amount
    ]);
    
    sheet.getRange(2, 1, rows.length, HEADERS.ORDERS.length).setValues(rows);
    return { success: true };
  } catch (error) {
    console.error('Error syncing orders:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync transactions data
 */
function syncTransactions(transactions) {
  try {
    const sheet = getOrCreateSheet(SHEET_CONFIG.TRANSACTIONS, HEADERS.TRANSACTIONS);
    clearSheetData(SHEET_CONFIG.TRANSACTIONS);
    
    if (transactions.length === 0) {
      return { success: true };
    }
    
    const rows = transactions.map(txn => [
      new Date(txn.date),
      txn.product,
      txn.type,
      txn.quantity,
      txn.cost
    ]);
    
    sheet.getRange(2, 1, rows.length, HEADERS.TRANSACTIONS.length).setValues(rows);
    return { success: true };
  } catch (error) {
    console.error('Error syncing transactions:', error);
    return { success: false, error: error.message };
  }
}

// ==================== WEB APP HANDLERS ====================

/**
 * Handle GET requests
 */
function doGet(e) {
  const response = {
    status: 'success',
    message: 'Water Supply Management System - Google Sheets Sync API',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests - Main sync handler
 */
function doPost(e) {
  try {
    // Parse request
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const data = requestData.data;
    const timestamp = requestData.timestamp;
    
    logSync(action, 'Started', `Request received at ${timestamp}`);
    
    // Process based on action
    let result;
    
    switch (action) {
      case 'sync':
        result = handleFullSync(data);
        break;
        
      case 'getInventory':
        result = getInventoryData();
        break;
        
      case 'getCustomers':
        result = getCustomersData();
        break;
        
      case 'getOrders':
        result = getOrdersData();
        break;
        
      default:
        result = { success: false, error: 'Unknown action' };
    }
    
    logSync(action, result.success ? 'Success' : 'Failed', 
            result.error || 'Completed successfully');
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    logSync('doPost', 'Error', error.message);
    
    const errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle full data sync
 */
function handleFullSync(data) {
  try {
    const results = {};
    
    // Sync inventory
    if (data.inventory) {
      results.inventory = syncInventory(data.inventory);
    }
    
    // Sync customers
    if (data.customers) {
      results.customers = syncCustomers(data.customers);
    }
    
    // Sync orders
    if (data.orders) {
      results.orders = syncOrders(data.orders);
    }
    
    // Sync transactions
    if (data.transactions) {
      results.transactions = syncTransactions(data.transactions);
    }
    
    // Check if all syncs were successful
    const allSuccess = Object.values(results).every(r => r.success);
    
    return {
      success: allSuccess,
      results: results,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error in handleFullSync:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get inventory data from sheet
 */
function getInventoryData() {
  try {
    const sheet = getOrCreateSheet(SHEET_CONFIG.INVENTORY, HEADERS.INVENTORY);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return {
        success: true,
        data: {
          '300ml': 0,
          '500ml': 0,
          '1l': 0,
          '20l_filled': 0,
          '20l_empty': 0
        }
      };
    }
    
    const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    const inventory = {};
    
    values.forEach(row => {
      const product = row[0];
      const quantity = row[1];
      
      if (product === '300ml') inventory['300ml'] = quantity;
      else if (product === '500ml') inventory['500ml'] = quantity;
      else if (product === '1L') inventory['1l'] = quantity;
      else if (product === '20L Filled') inventory['20l_filled'] = quantity;
      else if (product === '20L Empty') inventory['20l_empty'] = quantity;
    });
    
    return {
      success: true,
      data: inventory
    };
    
  } catch (error) {
    console.error('Error getting inventory:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get customers data from sheet
 */
function getCustomersData() {
  try {
    const sheet = getOrCreateSheet(SHEET_CONFIG.CUSTOMERS, HEADERS.CUSTOMERS);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return {
        success: true,
        data: []
      };
    }
    
    const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.CUSTOMERS.length).getValues();
    const customers = values.map(row => ({
      name: row[0],
      mobile: row[1],
      shopName: row[2],
      emptyCans: row[3],
      cansReturned: row[4],
      totalOrders: row[5],
      purchases: {
        '300ml': row[6],
        '500ml': row[7],
        '1l': row[8],
        '20l': row[9]
      },
      createdDate: row[10]
    }));
    
    return {
      success: true,
      data: customers
    };
    
  } catch (error) {
    console.error('Error getting customers:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get orders data from sheet
 */
function getOrdersData() {
  try {
    const sheet = getOrCreateSheet(SHEET_CONFIG.ORDERS, HEADERS.ORDERS);
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return {
        success: true,
        data: []
      };
    }
    
    const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.ORDERS.length).getValues();
    const orders = values.map(row => ({
      date: row[0],
      customer: row[1],
      type: row[2],
      items: row[3],
      amount: row[4]
    }));
    
    return {
      success: true,
      data: orders
    };
    
  } catch (error) {
    console.error('Error getting orders:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== UTILITY FUNCTIONS FOR MANUAL USE ====================

/**
 * Initialize all sheets with headers (run this manually once)
 */
function initializeSheets() {
  getOrCreateSheet(SHEET_CONFIG.INVENTORY, HEADERS.INVENTORY);
  getOrCreateSheet(SHEET_CONFIG.CUSTOMERS, HEADERS.CUSTOMERS);
  getOrCreateSheet(SHEET_CONFIG.ORDERS, HEADERS.ORDERS);
  getOrCreateSheet(SHEET_CONFIG.TRANSACTIONS, HEADERS.TRANSACTIONS);
  getOrCreateSheet(SHEET_CONFIG.SYNC_LOG, HEADERS.SYNC_LOG);
  
  Logger.log('All sheets initialized successfully!');
}

/**
 * Clear all data (use with caution!)
 */
function clearAllData() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Clear All Data',
    'Are you sure you want to clear all data? This cannot be undone!',
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    clearSheetData(SHEET_CONFIG.INVENTORY);
    clearSheetData(SHEET_CONFIG.CUSTOMERS);
    clearSheetData(SHEET_CONFIG.ORDERS);
    clearSheetData(SHEET_CONFIG.TRANSACTIONS);
    Logger.log('All data cleared!');
  }
}

/**
 * Export data as JSON (for backup)
 */
function exportDataAsJSON() {
  const data = {
    inventory: getInventoryData().data,
    customers: getCustomersData().data,
    orders: getOrdersData().data,
    exportDate: new Date().toISOString()
  };
  
  Logger.log(JSON.stringify(data, null, 2));
  return data;
}

/**
 * Get sync statistics
 */
function getSyncStats() {
  const sheet = getOrCreateSheet(SHEET_CONFIG.SYNC_LOG, HEADERS.SYNC_LOG);
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    Logger.log('No sync logs found');
    return;
  }
  
  const values = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  const stats = {
    total: values.length,
    success: values.filter(row => row[2] === 'Success').length,
    failed: values.filter(row => row[2] === 'Failed').length,
    lastSync: values[values.length - 1][0]
  };
  
  Logger.log('Sync Statistics:');
  Logger.log(JSON.stringify(stats, null, 2));
  return stats;
}
