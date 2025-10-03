const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');

// Get all reports (with filters) - Updated for POP test reports
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, operator_id, start_date, end_date, search } = req.query;

    // First get old test_reports for backward compatibility
    let oldQuery = 'SELECT *, "legacy" as report_type FROM test_reports WHERE 1=1';
    const oldParams = [];

    // Then get new POP test reports
    let newQuery = `
      SELECT
        h.*,
        "pop_test" as report_type,
        COUNT(v.id) as valve_count,
        GROUP_CONCAT(v.serial_number) as valve_serials,
        GROUP_CONCAT(v.overall_result) as valve_results
      FROM pop_test_headers h
      LEFT JOIN pop_test_valves v ON h.id = v.header_id
      WHERE 1=1
    `;
    const newParams = [];

    // Apply filters to both queries
    // Operators can only see their own reports
    if (req.user.role === 'operator') {
      oldQuery += ' AND operator_id = ?';
      oldParams.push(req.user.id);
      newQuery += ' AND h.operator_id = ?';
      newParams.push(req.user.id);
    } else if (operator_id) {
      oldQuery += ' AND operator_id = ?';
      oldParams.push(operator_id);
      newQuery += ' AND h.operator_id = ?';
      newParams.push(operator_id);
    }

    if (status) {
      oldQuery += ' AND status = ?';
      oldParams.push(status);
      newQuery += ' AND h.status = ?';
      newParams.push(status);
    }

    if (start_date) {
      oldQuery += ' AND test_date >= ?';
      oldParams.push(start_date);
      newQuery += ' AND h.test_date >= ?';
      newParams.push(start_date);
    }

    if (end_date) {
      oldQuery += ' AND test_date <= ?';
      oldParams.push(end_date);
      newQuery += ' AND h.test_date <= ?';
      newParams.push(end_date);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      oldQuery += ' AND (report_number LIKE ? OR valve_tag_number LIKE ? OR valve_manufacturer LIKE ?)';
      oldParams.push(searchTerm, searchTerm, searchTerm);
      newQuery += ' AND (h.equipment_no LIKE ? OR h.ref_no LIKE ? OR h.report_number LIKE ? OR v.serial_number LIKE ?)';
      newParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    newQuery += ' GROUP BY h.id';

    // Add ordering
    oldQuery += ' ORDER BY created_at DESC';
    newQuery += ' ORDER BY h.created_at DESC';

    // Execute both queries
    const [oldReports] = await pool.query(oldQuery, oldParams);
    const [newReports] = await pool.query(newQuery, newParams);

    // Combine and sort by creation date
    const allReports = [...oldReports, ...newReports].sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    );

    res.json({
      success: true,
      count: allReports.length,
      reports: allReports
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get single report (supports both legacy and POP test reports)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // First try to get from legacy test_reports
    const [legacyReports] = await pool.query(
      'SELECT *, "legacy" as report_type FROM test_reports WHERE id = ?',
      [id]
    );

    if (legacyReports.length > 0) {
      const report = legacyReports[0];

      // Operators can only view their own reports
      if (req.user.role === 'operator' && report.operator_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden'
        });
      }

      return res.json({
        success: true,
        report
      });
    }

    // Try to get from POP test reports
    const [popHeaders] = await pool.query(
      'SELECT *, "pop_test" as report_type FROM pop_test_headers WHERE id = ?',
      [id]
    );

    if (popHeaders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const header = popHeaders[0];

    // Operators can only view their own reports
    if (req.user.role === 'operator' && header.operator_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden'
      });
    }

    // Get valves for this report
    const [valves] = await pool.query(
      'SELECT * FROM pop_test_valves WHERE header_id = ? ORDER BY valve_index',
      [id]
    );

    res.json({
      success: true,
      report: {
        ...header,
        valves
      }
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create new POP test report
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

    // Validate ref_no format
    const refNoPattern = /^KSE-\d{6}-\d{2}$/;
    if (!refNoPattern.test(ref_no)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Ref. No. format. Use: KSE-ddmmyy-##'
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
        calibration_cert, gauge_due_date, \`range\`,
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

      // Validate required valve fields
      if (!valve.serial_number || !valve.brand || !valve.model ||
          !valve.year_of_manufacture || !valve.material_type ||
          !valve.inlet_size || !valve.outlet_size || !valve.coefficient_discharge ||
          valve.set_pressure === undefined || valve.input_pressure === undefined ||
          valve.pop_pressure === undefined || valve.reset_pressure === undefined) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Valve ${i + 1}: All required fields must be filled`
        });
      }

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

      // Add valve serial to valve_serials table if not exists
      await connection.query(
        `INSERT IGNORE INTO valve_serials (equipment_no, serial_number) VALUES (?, ?)`,
        [equipment_no, valve.serial_number]
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

// Update report
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if report exists and user has permission
    const [reports] = await pool.query(
      'SELECT operator_id, status FROM test_reports WHERE id = ?',
      [id]
    );

    if (reports.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      });
    }

    const report = reports[0];

    // Operators can only edit their own pending reports
    if (req.user.role === 'operator') {
      if (report.operator_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access forbidden' 
        });
      }
      if (report.status !== 'pending') {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot edit approved or rejected reports' 
        });
      }
    }

    const {
      valve_tag_number, valve_manufacturer, valve_model, valve_size, valve_type,
      set_pressure, set_pressure_unit,
      test_date, test_location, test_medium, test_temperature, test_temperature_unit,
      opening_pressure, closing_pressure, seat_tightness, test_result, remarks
    } = req.body;

    const updates = [];
    const params = [];

    if (valve_tag_number !== undefined) { updates.push('valve_tag_number = ?'); params.push(valve_tag_number); }
    if (valve_manufacturer !== undefined) { updates.push('valve_manufacturer = ?'); params.push(valve_manufacturer); }
    if (valve_model !== undefined) { updates.push('valve_model = ?'); params.push(valve_model); }
    if (valve_size !== undefined) { updates.push('valve_size = ?'); params.push(valve_size); }
    if (valve_type !== undefined) { updates.push('valve_type = ?'); params.push(valve_type); }
    if (set_pressure !== undefined) { updates.push('set_pressure = ?'); params.push(set_pressure); }
    if (set_pressure_unit !== undefined) { updates.push('set_pressure_unit = ?'); params.push(set_pressure_unit); }
    if (test_date !== undefined) { updates.push('test_date = ?'); params.push(test_date); }
    if (test_location !== undefined) { updates.push('test_location = ?'); params.push(test_location); }
    if (test_medium !== undefined) { updates.push('test_medium = ?'); params.push(test_medium); }
    if (test_temperature !== undefined) { updates.push('test_temperature = ?'); params.push(test_temperature); }
    if (test_temperature_unit !== undefined) { updates.push('test_temperature_unit = ?'); params.push(test_temperature_unit); }
    if (opening_pressure !== undefined) { updates.push('opening_pressure = ?'); params.push(opening_pressure); }
    if (closing_pressure !== undefined) { updates.push('closing_pressure = ?'); params.push(closing_pressure); }
    if (seat_tightness !== undefined) { updates.push('seat_tightness = ?'); params.push(seat_tightness); }
    if (test_result !== undefined) { updates.push('test_result = ?'); params.push(test_result); }
    if (remarks !== undefined) { updates.push('remarks = ?'); params.push(remarks); }

    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No fields to update' 
      });
    }

    params.push(id);

    await pool.query(
      `UPDATE test_reports SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Report updated successfully'
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Approve/Reject report (Admin/Supervisor only)
router.patch('/:id/status', verifyToken, checkRole('admin', 'supervisor'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    if (status === 'rejected' && !rejection_reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rejection reason is required' 
      });
    }

    await pool.query(
      'UPDATE test_reports SET status = ?, approved_by = ?, approved_at = NOW(), rejection_reason = ? WHERE id = ?',
      [status, req.user.id, rejection_reason || null, id]
    );

    res.json({
      success: true,
      message: `Report ${status} successfully`
    });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Delete report
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // First check if it's a legacy report
    const [legacyReports] = await pool.query(
      'SELECT operator_id, status FROM test_reports WHERE id = ?',
      [id]
    );

    if (legacyReports.length > 0) {
      const report = legacyReports[0];

      // Operators can only delete their own pending reports
      if (req.user.role === 'operator') {
        if (report.operator_id !== req.user.id || report.status !== 'pending') {
          return res.status(403).json({
            success: false,
            message: 'Cannot delete this report'
          });
        }
      }

      await pool.query('DELETE FROM test_reports WHERE id = ?', [id]);

      return res.json({
        success: true,
        message: 'Report deleted successfully'
      });
    }

    // Check if it's a POP test report
    const [popReports] = await pool.query(
      'SELECT operator_id, status FROM pop_test_headers WHERE id = ?',
      [id]
    );

    if (popReports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const report = popReports[0];

    // Operators can only delete their own pending reports
    if (req.user.role === 'operator') {
      if (report.operator_id !== req.user.id || report.status !== 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete this report'
        });
      }
    }

    // Delete POP test report (delete valves first due to foreign key constraint)
    await pool.query('DELETE FROM pop_test_valves WHERE header_id = ?', [id]);
    await pool.query('DELETE FROM pop_test_headers WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get report statistics
router.get('/stats/dashboard', verifyToken, async (req, res) => {
  try {
    let operatorFilter = '';
    const params = [];

    if (req.user.role === 'operator') {
      operatorFilter = 'WHERE operator_id = ?';
      params.push(req.user.id);
    }

    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN test_result = 'pass' THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN test_result = 'fail' THEN 1 ELSE 0 END) as failed
      FROM test_reports ${operatorFilter}
    `, params);

    res.json({
      success: true,
      stats: stats[0]
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;

