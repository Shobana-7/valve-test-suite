-- Create Database
CREATE DATABASE IF NOT EXISTS valve_test_suite;
USE valve_test_suite;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role ENUM('operator', 'admin', 'supervisor') NOT NULL DEFAULT 'operator',
  company VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Test Reports Table
CREATE TABLE IF NOT EXISTS test_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_number VARCHAR(50) UNIQUE NOT NULL,
  operator_id INT NOT NULL,
  operator_name VARCHAR(100) NOT NULL,
  company VARCHAR(100) NOT NULL,
  
  -- Valve Information
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_report_number (report_number),
  INDEX idx_operator_id (operator_id),
  INDEX idx_status (status),
  INDEX idx_test_date (test_date)
);

-- Valve Inventory Table (for Admin)
CREATE TABLE IF NOT EXISTS valve_inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tag_number VARCHAR(100) UNIQUE NOT NULL,
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  size VARCHAR(50),
  type VARCHAR(100),
  set_pressure DECIMAL(10, 2),
  set_pressure_unit VARCHAR(20),
  location VARCHAR(200),
  installation_date DATE,
  last_test_date DATE,
  next_test_date DATE,
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_tag_number (tag_number),
  INDEX idx_status (status)
);

-- Test Standards Table
CREATE TABLE IF NOT EXISTS test_standards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  standard_name VARCHAR(100) NOT NULL,
  standard_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(50),
  record_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);

-- Insert Default Admin User (password: admin123)
INSERT INTO users (username, password, name, email, role, company) VALUES
('admin', '$2a$10$YourHashedPasswordHere', 'System Administrator', 'admin@valvetest.com', 'admin', 'Valve Test Suite'),
('operator1', '$2a$10$YourHashedPasswordHere', 'John Operator', 'operator@valvetest.com', 'operator', 'ABC Company'),
('supervisor1', '$2a$10$YourHashedPasswordHere', 'Jane Supervisor', 'supervisor@valvetest.com', 'supervisor', 'ABC Company')
ON DUPLICATE KEY UPDATE username=username;

-- Insert Sample Test Standards
INSERT INTO test_standards (standard_name, standard_code, description) VALUES
('ASME Section VIII', 'ASME-VIII', 'ASME Boiler and Pressure Vessel Code Section VIII'),
('API 527', 'API-527', 'Seat Tightness of Pressure Relief Valves'),
('ISO 4126', 'ISO-4126', 'Safety devices for protection against excessive pressure')
ON DUPLICATE KEY UPDATE standard_code=standard_code;

