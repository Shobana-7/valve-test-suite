# Backend Update Requirements for POP Test Report

## Overview
The frontend has been updated to match the Android application's POP test report structure. The backend now needs to be updated to handle the new data format.

## Current Backend Structure

### Current Database Schema
```sql
CREATE TABLE test_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_number VARCHAR(50) UNIQUE NOT NULL,
  operator_id INT NOT NULL,
  operator_name VARCHAR(100) NOT NULL,
  company VARCHAR(100) NOT NULL,
  
  -- Valve Information (single valve)
  valve_tag_number VARCHAR(100),
  valve_manufacturer VARCHAR(100),
  valve_model VARCHAR(100),
  valve_size VARCHAR(50),
  valve_type VARCHAR(100),
  set_pressure DECIMAL(10, 2),
  set_pressure_unit VARCHAR(20),
  
  -- Test Information
  test_date DATE NOT NULL,
  test_location VARCHAR(200),
  test_medium VARCHAR(100),
  test_temperature DECIMAL(10, 2),
  test_temperature_unit VARCHAR(20),
  
  -- Test Results
  opening_pressure DECIMAL(10, 2),
  closing_pressure DECIMAL(10, 2),
  seat_tightness VARCHAR(100),
  test_result ENUM('pass', 'fail', 'conditional') DEFAULT 'pass',
  
  -- Additional Information
  remarks TEXT,
  attachments JSON,
  
  -- Status and Approval
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT NULL,
  approved_at TIMESTAMP NULL,
  rejection_reason TEXT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Required Backend Changes

### 1. New Database Schema

#### Table 1: pop_test_headers
```sql
CREATE TABLE IF NOT EXISTS pop_test_headers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_number VARCHAR(50) UNIQUE NOT NULL,
  operator_id INT NOT NULL,
  operator_name VARCHAR(100) NOT NULL,
  company VARCHAR(100) NOT NULL,
  
  -- Test Information
  equipment_no VARCHAR(100) NOT NULL,
  ref_no VARCHAR(50) NOT NULL,
  test_medium VARCHAR(50) DEFAULT 'N2',
  ambient_temp VARCHAR(50) DEFAULT '(23±5)°C',
  test_date DATE NOT NULL,
  next_test_date DATE,
  master_pressure_gauge VARCHAR(50) DEFAULT '22024750',
  calibration_cert VARCHAR(50) DEFAULT 'CMS-5009-24',
  gauge_due_date DATE,
  range VARCHAR(50) DEFAULT '(0~600) psi',
  make_model VARCHAR(100) DEFAULT 'Winter/PFP',
  calibrate_company VARCHAR(100) DEFAULT 'Caltek Pte Ltd',
  
  -- Additional Information
  remarks TEXT,
  attachments JSON,
  
  -- Status and Approval
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT NULL,
  approved_at TIMESTAMP NULL,
  rejection_reason TEXT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_report_number (report_number),
  INDEX idx_equipment_no (equipment_no),
  INDEX idx_ref_no (ref_no),
  INDEX idx_operator_id (operator_id),
  INDEX idx_status (status),
  INDEX idx_test_date (test_date)
);
```

#### Table 2: pop_test_valves
```sql
CREATE TABLE IF NOT EXISTS pop_test_valves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  header_id INT NOT NULL,
  valve_index INT NOT NULL,
  
  -- Valve Identification
  serial_number VARCHAR(100) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  year_of_manufacture INT NOT NULL,
  material_type VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  
  -- Valve Specifications
  inlet_size VARCHAR(50) NOT NULL,
  outlet_size VARCHAR(50) NOT NULL,
  coefficient_discharge VARCHAR(50) NOT NULL,
  
  -- Test Pressures (in Bar)
  set_pressure DECIMAL(10, 2) NOT NULL,
  input_pressure DECIMAL(10, 2) NOT NULL,
  pop_pressure DECIMAL(10, 2) NOT NULL,
  reset_pressure DECIMAL(10, 2) NOT NULL,
  
  -- Calculated Results
  pop_tolerance VARCHAR(20),
  reset_tolerance VARCHAR(20),
  pop_result VARCHAR(20),
  reset_result VARCHAR(20),
  overall_result VARCHAR(20),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (header_id) REFERENCES pop_test_headers(id) ON DELETE CASCADE,
  INDEX idx_header_id (header_id),
  INDEX idx_serial_number (serial_number),
  INDEX idx_overall_result (overall_result)
);
```

#### Table 3: Master Data Tables (for dropdowns)
```sql
-- Brands
CREATE TABLE IF NOT EXISTS valve_brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_name VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Models
CREATE TABLE IF NOT EXISTS valve_models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,
  brand_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES valve_brands(id) ON DELETE SET NULL
);

-- Materials
CREATE TABLE IF NOT EXISTS valve_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  material_name VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inlet/Outlet Size Combinations
CREATE TABLE IF NOT EXISTS valve_io_sizes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inlet_size VARCHAR(50) NOT NULL,
  outlet_size VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_combination (inlet_size, outlet_size)
);

-- Set Pressure Options
CREATE TABLE IF NOT EXISTS valve_set_pressures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  set_pressure DECIMAL(10, 2) NOT NULL,
  input_pressure DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Brand-Model-Material Combinations
CREATE TABLE IF NOT EXISTS valve_bmm_combinations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_id INT NOT NULL,
  model_id INT NOT NULL,
  material_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES valve_brands(id) ON DELETE CASCADE,
  FOREIGN KEY (model_id) REFERENCES valve_models(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES valve_materials(id) ON DELETE CASCADE,
  UNIQUE KEY unique_bmm (brand_id, model_id, material_id)
);

-- Valve Serial Numbers by Equipment
CREATE TABLE IF NOT EXISTS valve_serials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipment_no VARCHAR(100) NOT NULL,
  serial_number VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_serial (equipment_no, serial_number),
  INDEX idx_equipment_no (equipment_no)
);
```

### 2. API Endpoint Updates

#### POST /api/reports (Create POP Test Report)

**New Request Body:**
```javascript
{
  // Header Data
  equipment_no: "SMAU 9220460",
  ref_no: "KSE-300925-01",
  test_medium: "N2",
  ambient_temp: "(23±5)°C",
  test_date: "2025-09-30",
  next_test_date: "2028-03-27",
  master_pressure_gauge: "22024750",
  calibration_cert: "CMS-5009-24",
  gauge_due_date: "2025-10-01",
  range: "(0~600) psi",
  make_model: "Winter/PFP",
  calibrate_company: "Caltek Pte Ltd",
  remarks: "Test completed successfully",
  
  // Valve Data Array
  valves: [
    {
      serial_number: "PSV-001",
      brand: "Crosby",
      year_of_manufacture: 2020,
      material_type: "Stainless Steel",
      model: "JOS-E",
      inlet_size: "2 inch",
      outlet_size: "3 inch",
      coefficient_discharge: "0.975",
      set_pressure: 22.0,
      input_pressure: 23.0,
      pop_pressure: 22.5,
      reset_pressure: 21.0,
      pop_tolerance: "2.3%",
      reset_tolerance: "4.5%",
      pop_result: "Passed",
      reset_result: "Satisfactory",
      overall_result: "Passed"
    },
    {
      serial_number: "PSV-002",
      brand: "Anderson Greenwood",
      year_of_manufacture: 2021,
      material_type: "Carbon Steel",
      model: "Series 200",
      inlet_size: "1 inch",
      outlet_size: "2 inch",
      coefficient_discharge: "0.965",
      set_pressure: 25.0,
      input_pressure: 26.0,
      pop_pressure: 26.0,
      reset_pressure: 22.0,
      pop_tolerance: "4.0%",
      reset_tolerance: "12.0%",
      pop_result: "Failed",
      reset_result: "Failed",
      overall_result: "Failed"
    }
  ]
}
```

**Updated Route Handler:**
```javascript
// server/routes/reports.js
router.post('/', verifyToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      equipment_no,
      ref_no,
      test_medium,
      ambient_temp,
      test_date,
      next_test_date,
      master_pressure_gauge,
      calibration_cert,
      gauge_due_date,
      range,
      make_model,
      calibrate_company,
      remarks,
      valves
    } = req.body;
    
    // Validate required fields
    if (!equipment_no || !ref_no || !test_date) {
      return res.status(400).json({
        success: false,
        message: 'Equipment No., Ref. No., and Test Date are required'
      });
    }
    
    if (!valves || valves.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one valve is required'
      });
    }
    
    // Generate report number
    const reportNumber = `RPT-${Date.now()}-${req.user.id}`;
    
    // Insert header
    const [headerResult] = await connection.query(
      `INSERT INTO pop_test_headers (
        report_number, operator_id, operator_name, company,
        equipment_no, ref_no, test_medium, ambient_temp,
        test_date, next_test_date, master_pressure_gauge,
        calibration_cert, gauge_due_date, range,
        make_model, calibrate_company, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reportNumber, req.user.id, req.user.name, req.user.company,
        equipment_no, ref_no, test_medium, ambient_temp,
        test_date, next_test_date, master_pressure_gauge,
        calibration_cert, gauge_due_date, range,
        make_model, calibrate_company, remarks
      ]
    );
    
    const headerId = headerResult.insertId;
    
    // Insert valves
    for (let i = 0; i < valves.length; i++) {
      const valve = valves[i];
      
      await connection.query(
        `INSERT INTO pop_test_valves (
          header_id, valve_index,
          serial_number, brand, year_of_manufacture, material_type, model,
          inlet_size, outlet_size, coefficient_discharge,
          set_pressure, input_pressure, pop_pressure, reset_pressure,
          pop_tolerance, reset_tolerance, pop_result, reset_result, overall_result
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          headerId, i + 1,
          valve.serial_number, valve.brand, valve.year_of_manufacture,
          valve.material_type, valve.model,
          valve.inlet_size, valve.outlet_size, valve.coefficient_discharge,
          valve.set_pressure, valve.input_pressure, valve.pop_pressure, valve.reset_pressure,
          valve.pop_tolerance, valve.reset_tolerance, valve.pop_result,
          valve.reset_result, valve.overall_result
        ]
      );
    }
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'POP Test Report created successfully',
      reportId: headerId,
      reportNumber
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Create POP test report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  } finally {
    connection.release();
  }
});
```

### 3. New API Endpoints for Master Data

```javascript
// GET /api/master-data/brands
router.get('/master-data/brands', verifyToken, async (req, res) => {
  try {
    const [brands] = await pool.query(
      'SELECT id, brand_name FROM valve_brands WHERE is_active = TRUE ORDER BY brand_name'
    );
    res.json({ success: true, data: brands });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/master-data/models?brand_id=1
router.get('/master-data/models', verifyToken, async (req, res) => {
  try {
    const { brand_id } = req.query;
    let query = 'SELECT id, model_name FROM valve_models WHERE is_active = TRUE';
    const params = [];
    
    if (brand_id) {
      query += ' AND brand_id = ?';
      params.push(brand_id);
    }
    
    query += ' ORDER BY model_name';
    
    const [models] = await pool.query(query, params);
    res.json({ success: true, data: models });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/master-data/materials
router.get('/master-data/materials', verifyToken, async (req, res) => {
  try {
    const [materials] = await pool.query(
      'SELECT id, material_name FROM valve_materials WHERE is_active = TRUE ORDER BY material_name'
    );
    res.json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/master-data/io-sizes
router.get('/master-data/io-sizes', verifyToken, async (req, res) => {
  try {
    const [sizes] = await pool.query(
      'SELECT inlet_size, outlet_size FROM valve_io_sizes WHERE is_active = TRUE ORDER BY inlet_size'
    );
    res.json({ success: true, data: sizes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/master-data/valve-serials?equipment_no=SMAU9220460
router.get('/master-data/valve-serials', verifyToken, async (req, res) => {
  try {
    const { equipment_no } = req.query;
    
    if (!equipment_no) {
      return res.status(400).json({ success: false, message: 'Equipment No. is required' });
    }
    
    const [serials] = await pool.query(
      'SELECT serial_number FROM valve_serials WHERE equipment_no = ? AND is_active = TRUE ORDER BY serial_number',
      [equipment_no]
    );
    res.json({ success: true, data: serials });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
```

## Implementation Steps

1. **Create Database Migration Script**
   - Create new tables
   - Migrate existing data if needed
   - Add sample master data

2. **Update API Routes**
   - Modify POST /api/reports endpoint
   - Add master data endpoints
   - Update GET /api/reports to join with valves

3. **Test API Endpoints**
   - Test report creation with multiple valves
   - Test master data retrieval
   - Test validation

4. **Update Frontend**
   - Connect dropdowns to master data APIs
   - Implement auto-fill logic
   - Test end-to-end flow

## Sample Master Data

```sql
-- Insert sample brands
INSERT INTO valve_brands (brand_name) VALUES
('Crosby'), ('Anderson Greenwood'), ('Consolidated'), ('Farris'), ('Leser');

-- Insert sample materials
INSERT INTO valve_materials (material_name) VALUES
('Stainless Steel'), ('Carbon Steel'), ('Bronze'), ('Brass'), ('Alloy Steel');

-- Insert sample IO sizes
INSERT INTO valve_io_sizes (inlet_size, outlet_size) VALUES
('1 inch', '2 inch'),
('2 inch', '3 inch'),
('3 inch', '4 inch'),
('4 inch', '6 inch');

-- Insert sample set pressures
INSERT INTO valve_set_pressures (set_pressure, input_pressure) VALUES
(22.0, 23.0),
(25.0, 26.0),
(30.0, 31.0),
(35.0, 36.0);
```

## Testing Checklist

- [ ] Create new database tables
- [ ] Insert sample master data
- [ ] Update POST /api/reports endpoint
- [ ] Test report creation with 2 valves
- [ ] Test report creation with 5 valves
- [ ] Test master data endpoints
- [ ] Update GET /api/reports to include valves
- [ ] Test report retrieval
- [ ] Test report approval workflow
- [ ] Test PDF generation (if applicable)

