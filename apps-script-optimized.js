// ============================================
// ECO EXPRESS LOGISTICS - OPTIMIZED APPS SCRIPT
// ============================================
// Version: 3.0 - Production Ready
// Optimized for: Eco_Express_Master_Data.xlsx structure
// Features: Full CRUD, Optimized queries, Error handling

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const params = e.parameter;
    const action = params.action;
    
    // Route to appropriate handler
    const handlers = {
      'test': () => testConnection(),
      'getDashboard': () => getDashboard(),
      'getCustomers': () => getCustomers(),
      'addCustomer': () => addCustomer(params),
      'updateCustomer': () => updateCustomer(params),
      'deleteCustomer': () => deleteCustomer(params),
      'getTrips': () => getTrips(params),
      'addTrip': () => addTrip(params),
      'updateTrip': () => updateTrip(params),
      'deleteTrip': () => deleteTrip(params),
      'getDeliveries': () => getDeliveries(params),
      'addDelivery': () => addDelivery(params),
      'getCharging': () => getCharging(params),
      'addCharging': () => addCharging(params),
      'getVehicleHealth': () => getVehicleHealth(),
      'updateVehicleHealth': () => updateVehicleHealth(params),
      'getFinancial': () => getFinancial(params),
      'getSettings': () => getSettings()
    };
    
    if (!handlers[action]) {
      return jsonResponse({ success: false, error: 'Invalid action: ' + action });
    }
    
    return handlers[action]();
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return jsonResponse({ success: false, error: error.toString() });
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }
  return sheet;
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'HH:mm:ss');
}

function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

// ============================================
// TEST CONNECTION
// ============================================

function testConnection() {
  return jsonResponse({ 
    success: true, 
    message: 'Eco Express API v3.0 - Optimized',
    timestamp: formatDateTime(new Date()),
    sheets: ['Trips', 'Customers', 'Deliveries', 'Charging', 'Vehicle Health', 'Financial', 'Settings', 'Dashboard']
  });
}

// ============================================
// DASHBOARD
// ============================================

function getDashboard() {
  try {
    const sheet = getSheet('Dashboard');
    const data = sheet.getDataRange().getValues();
    
    const metrics = {};
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        const key = data[i][0].toString().toLowerCase().replace(/\s+/g, '_');
        metrics[key] = {
          value: data[i][1] || 0,
          target: data[i][2] || 0,
          status: data[i][3] || '',
          last_updated: data[i][4] || ''
        };
      }
    }
    
    return jsonResponse({ success: true, data: metrics });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

// ============================================
// CUSTOMERS - Full CRUD
// ============================================

function getCustomers() {
  try {
    const sheet = getSheet('Customers');
    const data = sheet.getDataRange().getValues();
    
    const customers = data.slice(1)
      .filter(row => row[0])
      .map(row => ({
        id: row[0],
        name: row[1],
        phone: row[2],
        address1: row[3],
        address2: row[4] || '',
        city: row[5],
        pincode: row[6],
        landmark: row[7] || '',
        type: row[8],
        preferred_time: row[9] || '',
        total_trips: row[10] || 0,
        last_delivery: row[11] || '',
        total_revenue: row[12] || 0,
        avg_rating: row[13] || 5,
        instructions: row[14] || '',
        status: row[15]
      }));
    
    return jsonResponse({ success: true, data: customers, count: customers.length });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function addCustomer(params) {
  try {
    const sheet = getSheet('Customers');
    const customerId = 'CUST_' + new Date().getTime();
    
    const row = [
      customerId,
      params.name || '',
      params.phone || '',
      params.address1 || '',
      params.address2 || '',
      params.city || 'Kovilpatti',
      params.pincode || '',
      params.landmark || '',
      params.type || 'Individual',
      params.preferred_time || 'Anytime',
      0,  // Total Trips
      '',  // Last Delivery Date
      0,  // Total Revenue
      5,  // Average Rating
      params.instructions || '',
      'Active'
    ];
    
    sheet.appendRow(row);
    
    return jsonResponse({
      success: true,
      message: 'Customer added successfully',
      customer_id: customerId,
      customer_name: params.name
    });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function updateCustomer(params) {
  try {
    const sheet = getSheet('Customers');
    const data = sheet.getDataRange().getValues();
    const customerId = params.customer_id;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === customerId) {
        const rowIndex = i + 1;
        if (params.name) sheet.getRange(rowIndex, 2).setValue(params.name);
        if (params.phone) sheet.getRange(rowIndex, 3).setValue(params.phone);
        if (params.address1) sheet.getRange(rowIndex, 4).setValue(params.address1);
        if (params.address2) sheet.getRange(rowIndex, 5).setValue(params.address2);
        if (params.city) sheet.getRange(rowIndex, 6).setValue(params.city);
        if (params.pincode) sheet.getRange(rowIndex, 7).setValue(params.pincode);
        if (params.type) sheet.getRange(rowIndex, 9).setValue(params.type);
        if (params.status) sheet.getRange(rowIndex, 16).setValue(params.status);
        
        return jsonResponse({ success: true, message: 'Customer updated successfully' });
      }
    }
    
    return jsonResponse({ success: false, error: 'Customer not found' });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function deleteCustomer(params) {
  try {
    const sheet = getSheet('Customers');
    const data = sheet.getDataRange().getValues();
    const customerId = params.customer_id;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === customerId) {
        sheet.deleteRow(i + 1);
        return jsonResponse({ success: true, message: 'Customer deleted successfully' });
      }
    }
    
    return jsonResponse({ success: false, error: 'Customer not found' });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

// ============================================
// TRIPS - Full CRUD
// ============================================

function getTrips(params) {
  try {
    const sheet = getSheet('Trips');
    const data = sheet.getDataRange().getValues();
    
    let trips = data.slice(1)
      .filter(row => row[0])
      .map(row => ({
        id: row[0],
        date: formatDate(row[1]),
        customer_id: row[2],
        customer_name: row[3],
        start_time: formatTime(row[4]),
        end_time: formatTime(row[5]),
        start_odo: row[6],
        end_odo: row[7],
        start_battery: row[8],
        end_battery: row[9],
        pickup_location: row[10],
        pickup_lat: row[11],
        pickup_long: row[12],
        delivery_location: row[13],
        delivery_lat: row[14],
        delivery_long: row[15],
        pickup_distance: row[16] || 0,
        delivery_distance: row[17] || 0,
        return_distance: row[18] || 0,
        total_distance: row[19] || 0,
        cargo_weight: row[20] || 0,
        cargo_type: row[21] || '',
        packages: row[22] || 0,
        delivery_type: row[23] || '',
        order_type: row[24] || '',
        trip_status: row[25],
        delivery_status: row[26],
        revenue: row[27] || 0,
        payment_status: row[28],
        energy_consumed: row[29] || 0,
        cost_per_km: row[30] || 0,
        customer_rating: row[31] || 5,
        notes: row[32] || ''
      }));
    
    // Filter by date if provided
    if (params.date) {
      trips = trips.filter(t => t.date === params.date);
    }
    
    // Filter by status if provided
    if (params.status) {
      trips = trips.filter(t => t.trip_status === params.status);
    }
    
    return jsonResponse({ success: true, data: trips, count: trips.length });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function addTrip(params) {
  try {
    const sheet = getSheet('Trips');
    const tripId = 'TRP_' + formatDate(new Date()).replace(/-/g, '') + '_' + new Date().getTime();
    const now = new Date();
    
    const row = [
      tripId,
      formatDate(now),
      params.customer_id || '',
      params.customer_name || '',
      formatTime(now),
      '',  // End Time
      params.start_odo || 0,
      '',  // End Odometer
      params.start_battery || 0,
      '',  // End Battery
      params.pickup_location || '',
      params.pickup_lat || 0,
      params.pickup_long || 0,
      params.delivery_location || '',
      params.delivery_lat || 0,
      params.delivery_long || 0,
      0,  // Pickup Distance
      params.delivery_distance || 0,
      0,  // Return Distance
      params.delivery_distance || 0,  // Total Distance
      params.cargo_weight || 0,
      params.cargo_type || '',
      params.packages || 0,
      params.delivery_type || 'Standard',
      params.order_type || 'Delivery',
      'In Progress',  // Trip Status
      'Pending',  // Delivery Status
      params.revenue || 0,
      params.payment_status || 'Pending',
      0,  // Energy Consumed
      0,  // Cost per km
      0,  // Customer Rating
      params.notes || ''
    ];
    
    sheet.appendRow(row);
    
    return jsonResponse({
      success: true,
      message: 'Trip started successfully',
      trip_id: tripId
    });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function updateTrip(params) {
  try {
    const sheet = getSheet('Trips');
    const data = sheet.getDataRange().getValues();
    const tripId = params.trip_id;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === tripId) {
        const rowIndex = i + 1;
        
        if (params.end_time) sheet.getRange(rowIndex, 6).setValue(params.end_time);
        if (params.end_odo) sheet.getRange(rowIndex, 8).setValue(params.end_odo);
        if (params.end_battery) sheet.getRange(rowIndex, 10).setValue(params.end_battery);
        if (params.total_distance) sheet.getRange(rowIndex, 20).setValue(params.total_distance);
        if (params.trip_status) sheet.getRange(rowIndex, 26).setValue(params.trip_status);
        if (params.delivery_status) sheet.getRange(rowIndex, 27).setValue(params.delivery_status);
        if (params.revenue) sheet.getRange(rowIndex, 28).setValue(params.revenue);
        if (params.payment_status) sheet.getRange(rowIndex, 29).setValue(params.payment_status);
        if (params.energy_consumed) sheet.getRange(rowIndex, 30).setValue(params.energy_consumed);
        if (params.customer_rating) sheet.getRange(rowIndex, 32).setValue(params.customer_rating);
        if (params.notes) sheet.getRange(rowIndex, 33).setValue(params.notes);
        
        return jsonResponse({ success: true, message: 'Trip updated successfully' });
      }
    }
    
    return jsonResponse({ success: false, error: 'Trip not found' });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function deleteTrip(params) {
  try {
    const sheet = getSheet('Trips');
    const data = sheet.getDataRange().getValues();
    const tripId = params.trip_id;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === tripId) {
        sheet.deleteRow(i + 1);
        return jsonResponse({ success: true, message: 'Trip deleted successfully' });
      }
    }
    
    return jsonResponse({ success: false, error: 'Trip not found' });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

// ============================================
// DELIVERIES
// ============================================

function getDeliveries(params) {
  try {
    const sheet = getSheet('Deliveries');
    const data = sheet.getDataRange().getValues();
    
    let deliveries = data.slice(1)
      .filter(row => row[0])
      .map(row => ({
        id: row[0],
        trip_id: row[1],
        sequence: row[2],
        customer_id: row[3],
        stop_type: row[4],
        arrival_time: formatTime(row[5]),
        departure_time: formatTime(row[6]),
        service_time: row[7] || 0,
        location: row[8],
        lat: row[9],
        long: row[10],
        distance: row[11] || 0,
        packages: row[12] || 0,
        weight: row[13] || 0,
        proof: row[14] || '',
        confirmation: row[15] || '',
        recipient: row[16] || '',
        rating: row[17] || 5,
        issues: row[18] || ''
      }));
    
    // Filter by trip_id if provided
    if (params.trip_id) {
      deliveries = deliveries.filter(d => d.trip_id === params.trip_id);
    }
    
    return jsonResponse({ success: true, data: deliveries });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function addDelivery(params) {
  try {
    const sheet = getSheet('Deliveries');
    const deliveryId = 'DEL_' + new Date().getTime();
    
    const row = [
      deliveryId,
      params.trip_id || '',
      params.sequence || 1,
      params.customer_id || '',
      params.stop_type || 'Delivery',
      formatTime(new Date()),
      '',  // Departure Time
      0,  // Service Time
      params.location || '',
      params.lat || 0,
      params.long || 0,
      params.distance || 0,
      params.packages || 0,
      params.weight || 0,
      params.proof || '',
      params.confirmation || 'No',
      params.recipient || '',
      params.rating || 5,
      params.issues || ''
    ];
    
    sheet.appendRow(row);
    
    return jsonResponse({
      success: true,
      message: 'Delivery added successfully',
      delivery_id: deliveryId
    });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

// ============================================
// CHARGING
// ============================================

function getCharging(params) {
  try {
    const sheet = getSheet('Charging');
    const data = sheet.getDataRange().getValues();
    
    let charging = data.slice(1)
      .filter(row => row[0])
      .map(row => ({
        id: row[0],
        date: formatDate(row[1]),
        start_time: formatTime(row[2]),
        end_time: formatTime(row[3]),
        duration: row[4] || 0,
        start_soc: row[5],
        end_soc: row[6],
        charged: row[7],
        energy: row[8] || 0,
        rate: row[9] || 0,
        cost: row[10] || 0,
        charger_type: row[11],
        temp_before: row[12] || 0,
        temp_after: row[13] || 0,
        status: row[14],
        soh: row[15] || 0,
        cycles: row[16] || 0,
        location: row[17] || ''
      }));
    
    // Filter by date if provided
    if (params.date) {
      charging = charging.filter(c => c.date === params.date);
    }
    
    return jsonResponse({ success: true, data: charging });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function addCharging(params) {
  try {
    const sheet = getSheet('Charging');
    const chargingId = 'CHG_' + formatDate(new Date()).replace(/-/g, '') + '_' + new Date().getTime();
    
    const duration = (params.end_time - params.start_time) / (1000 * 60 * 60);
    const charged = (params.end_soc - params.start_soc);
    const energy = charged * 0.144; // Assuming 14.4 kWh battery
    const cost = energy * (params.rate || 8.5);
    
    const row = [
      chargingId,
      formatDate(new Date()),
      formatTime(params.start_time),
      formatTime(params.end_time),
      duration.toFixed(2),
      params.start_soc || 0,
      params.end_soc || 0,
      charged,
      energy.toFixed(2),
      params.rate || 8.5,
      cost.toFixed(2),
      params.charger_type || 'Home Charger',
      params.temp_before || 0,
      params.temp_after || 0,
      params.status || 'Completed',
      params.soh || 98.5,
      params.cycles || 0,
      params.location || 'Home'
    ];
    
    sheet.appendRow(row);
    
    return jsonResponse({
      success: true,
      message: 'Charging session logged',
      charging_id: chargingId
    });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

// ============================================
// VEHICLE HEALTH
// ============================================

function getVehicleHealth() {
  try {
    const sheet = getSheet('Vehicle Health');
    const data = sheet.getDataRange().getValues();
    
    // Get latest health record
    if (data.length > 1) {
      const row = data[data.length - 1];
      const health = {
        date: formatDate(row[0]),
        odometer: row[1],
        battery_soc: row[2],
        battery_soh: row[3],
        tire_fl: row[4],
        tire_fr: row[5],
        tire_rl: row[6],
        tire_rr: row[7],
        brake_status: row[8],
        brake_fluid: row[9],
        coolant: row[10],
        motor_temp: row[11],
        lights: row[12],
        warnings: row[13] || 'None',
        maintenance_due: row[14],
        last_maintenance: formatDate(row[15]),
        next_maintenance: formatDate(row[16]),
        days_since_maintenance: row[17],
        condition: row[18],
        notes: row[19] || ''
      };
      
      return jsonResponse({ success: true, data: health });
    }
    
    return jsonResponse({ success: true, data: {} });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function updateVehicleHealth(params) {
  try {
    const sheet = getSheet('Vehicle Health');
    
    const row = [
      formatDate(new Date()),
      params.odometer || 0,
      params.battery_soc || 0,
      params.battery_soh || 98.5,
      params.tire_fl || 33,
      params.tire_fr || 33,
      params.tire_rl || 32,
      params.tire_rr || 32,
      params.brake_status || 'Good',
      params.brake_fluid || 'Full',
      params.coolant || 'Full',
      params.motor_temp || 45,
      params.lights || 'All Working',
      params.warnings || '',
      params.maintenance_due || 'No',
      params.last_maintenance || '',
      params.next_maintenance || '',
      params.days_since_maintenance || 0,
      params.condition || 'Good',
      params.notes || ''
    ];
    
    sheet.appendRow(row);
    
    return jsonResponse({ success: true, message: 'Vehicle health updated' });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

// ============================================
// FINANCIAL
// ============================================

function getFinancial(params) {
  try {
    const sheet = getSheet('Financial');
    const data = sheet.getDataRange().getValues();
    
    let financial = data.slice(1)
      .filter(row => row[0])
      .map(row => ({
        date: formatDate(row[0]),
        trips: row[1] || 0,
        distance: row[2] || 0,
        revenue: row[3] || 0,
        energy_cost: row[4] || 0,
        charging_cost: row[5] || 0,
        depreciation: row[6] || 0,
        insurance: row[7] || 0,
        maintenance: row[8] || 0,
        toll: row[9] || 0,
        other: row[10] || 0,
        total_cost: row[11] || 0,
        profit: row[12] || 0,
        margin: row[13] || 0,
        cost_per_km: row[14] || 0,
        revenue_per_km: row[15] || 0,
        cost_per_trip: row[16] || 0,
        revenue_per_trip: row[17] || 0
      }));
    
    // Filter by date range if provided
    if (params.start_date && params.end_date) {
      financial = financial.filter(f => 
        f.date >= params.start_date && f.date <= params.end_date
      );
    }
    
    return jsonResponse({ success: true, data: financial });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

// ============================================
// SETTINGS
// ============================================

function getSettings() {
  try {
    const sheet = getSheet('Settings');
    const data = sheet.getDataRange().getValues();
    
    const settings = {};
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        const key = data[i][0].toString().toLowerCase().replace(/\s+/g, '_');
        settings[key] = {
          value: data[i][1],
          category: data[i][2],
          description: data[i][3]
        };
      }
    }
    
    return jsonResponse({ success: true, data: settings });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}
