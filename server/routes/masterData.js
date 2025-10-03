const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// GET /api/master-data/brands
router.get('/brands', verifyToken, async (req, res) => {
  try {
    const [brands] = await pool.query(
      'SELECT id, brand_name FROM valve_brands WHERE is_active = TRUE ORDER BY brand_name'
    );
    res.json({ 
      success: true, 
      data: brands.map(b => ({ id: b.id, name: b.brand_name }))
    });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/master-data/models?brand_id=1
router.get('/models', verifyToken, async (req, res) => {
  try {
    const { brand_id } = req.query;
    let query = `
      SELECT vm.id, vm.model_name, vb.brand_name 
      FROM valve_models vm 
      LEFT JOIN valve_brands vb ON vm.brand_id = vb.id 
      WHERE vm.is_active = TRUE
    `;
    const params = [];
    
    if (brand_id) {
      query += ' AND vm.brand_id = ?';
      params.push(brand_id);
    }
    
    query += ' ORDER BY vm.model_name';
    
    const [models] = await pool.query(query, params);
    res.json({ 
      success: true, 
      data: models.map(m => ({ 
        id: m.id, 
        name: m.model_name, 
        brand: m.brand_name 
      }))
    });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/master-data/materials
router.get('/materials', verifyToken, async (req, res) => {
  try {
    const [materials] = await pool.query(
      'SELECT id, material_name FROM valve_materials WHERE is_active = TRUE ORDER BY material_name'
    );
    res.json({ 
      success: true, 
      data: materials.map(m => ({ id: m.id, name: m.material_name }))
    });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/master-data/io-sizes
router.get('/io-sizes', verifyToken, async (req, res) => {
  try {
    const [sizes] = await pool.query(
      'SELECT inlet_size, outlet_size FROM valve_io_sizes WHERE is_active = TRUE ORDER BY inlet_size'
    );
    
    // Group by inlet size for easier frontend handling
    const groupedSizes = {};
    sizes.forEach(size => {
      if (!groupedSizes[size.inlet_size]) {
        groupedSizes[size.inlet_size] = [];
      }
      groupedSizes[size.inlet_size].push(size.outlet_size);
    });
    
    res.json({ 
      success: true, 
      data: {
        raw: sizes,
        grouped: groupedSizes,
        inletSizes: [...new Set(sizes.map(s => s.inlet_size))].sort(),
        outletSizes: [...new Set(sizes.map(s => s.outlet_size))].sort()
      }
    });
  } catch (error) {
    console.error('Get IO sizes error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/master-data/set-pressures
router.get('/set-pressures', verifyToken, async (req, res) => {
  try {
    const [pressures] = await pool.query(
      'SELECT set_pressure, input_pressure FROM valve_set_pressures WHERE is_active = TRUE ORDER BY set_pressure'
    );
    res.json({ 
      success: true, 
      data: pressures
    });
  } catch (error) {
    console.error('Get set pressures error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/master-data/valve-serials?equipment_no=SMAU9220460
router.get('/valve-serials', verifyToken, async (req, res) => {
  try {
    const { equipment_no } = req.query;
    
    if (!equipment_no) {
      return res.status(400).json({ 
        success: false, 
        message: 'Equipment No. is required' 
      });
    }
    
    const [serials] = await pool.query(
      'SELECT serial_number FROM valve_serials WHERE equipment_no = ? AND is_active = TRUE ORDER BY serial_number',
      [equipment_no]
    );
    
    res.json({ 
      success: true, 
      data: serials.map(s => s.serial_number)
    });
  } catch (error) {
    console.error('Get valve serials error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/master-data/valve-data?serial_number=PSV-001
router.get('/valve-data', verifyToken, async (req, res) => {
  try {
    const { serial_number } = req.query;
    
    if (!serial_number) {
      return res.status(400).json({ 
        success: false, 
        message: 'Serial number is required' 
      });
    }
    
    // Get the most recent valve data for this serial number
    const [valveData] = await pool.query(`
      SELECT 
        serial_number,
        brand,
        year_of_manufacture,
        material_type,
        model,
        inlet_size,
        outlet_size,
        coefficient_discharge,
        set_pressure,
        input_pressure
      FROM pop_test_valves 
      WHERE serial_number = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [serial_number]);
    
    if (valveData.length === 0) {
      return res.json({ 
        success: true, 
        data: null,
        message: 'No previous data found for this valve serial'
      });
    }
    
    res.json({ 
      success: true, 
      data: valveData[0]
    });
  } catch (error) {
    console.error('Get valve data error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/master-data/brands (Add new brand)
router.post('/brands', verifyToken, async (req, res) => {
  try {
    const { brand_name } = req.body;
    
    if (!brand_name || !brand_name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Brand name is required' 
      });
    }
    
    const [result] = await pool.query(
      'INSERT INTO valve_brands (brand_name) VALUES (?)',
      [brand_name.trim()]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Brand added successfully',
      data: { id: result.insertId, name: brand_name.trim() }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: 'Brand already exists' 
      });
    }
    console.error('Add brand error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/master-data/models (Add new model)
router.post('/models', verifyToken, async (req, res) => {
  try {
    const { model_name, brand_id } = req.body;
    
    if (!model_name || !model_name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Model name is required' 
      });
    }
    
    const [result] = await pool.query(
      'INSERT INTO valve_models (model_name, brand_id) VALUES (?, ?)',
      [model_name.trim(), brand_id || null]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Model added successfully',
      data: { id: result.insertId, name: model_name.trim(), brand_id }
    });
  } catch (error) {
    console.error('Add model error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/master-data/materials (Add new material)
router.post('/materials', verifyToken, async (req, res) => {
  try {
    const { material_name } = req.body;
    
    if (!material_name || !material_name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Material name is required' 
      });
    }
    
    const [result] = await pool.query(
      'INSERT INTO valve_materials (material_name) VALUES (?)',
      [material_name.trim()]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Material added successfully',
      data: { id: result.insertId, name: material_name.trim() }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: 'Material already exists' 
      });
    }
    console.error('Add material error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/master-data/valve-serials (Add new valve serial)
router.post('/valve-serials', verifyToken, async (req, res) => {
  try {
    const { equipment_no, serial_number } = req.body;
    
    if (!equipment_no || !equipment_no.trim() || !serial_number || !serial_number.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Equipment No. and Serial Number are required' 
      });
    }
    
    const [result] = await pool.query(
      'INSERT INTO valve_serials (equipment_no, serial_number) VALUES (?, ?)',
      [equipment_no.trim(), serial_number.trim()]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Valve serial added successfully',
      data: { id: result.insertId, equipment_no: equipment_no.trim(), serial_number: serial_number.trim() }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: 'Valve serial already exists for this equipment' 
      });
    }
    console.error('Add valve serial error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
