// Script to fix model-brand relationships in database
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixModelBrandRelationships() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'valve_test_suite'
    });

    console.log('✅ Connected to database');

    // Get current brands and models
    const [brands] = await connection.query('SELECT id, brand_name FROM valve_brands');
    const [models] = await connection.query('SELECT id, model_name, brand_id FROM valve_models');

    console.log('\n📊 Current Data:');
    console.log('Brands:', brands.map(b => `${b.id}: ${b.brand_name}`).join(', '));
    console.log('Models:', models.map(m => `${m.id}: ${m.model_name} (brand_id: ${m.brand_id})`).join(', '));

    // Update models to have proper brand associations
    const modelBrandMappings = [
      { model_name: 'DA20-C1', brand_name: 'Baitu' },
      { model_name: 'DA22-40P (20C1)', brand_name: 'Baitu' },
      { model_name: 'DA22-40P (25B1)', brand_name: 'Baitu' },
      { model_name: 'DA25-B1', brand_name: 'Goetze' },
      { model_name: 'Herose-06388.1006', brand_name: 'Herose' }
    ];

    console.log('\n🔧 Updating model-brand relationships...');

    for (const mapping of modelBrandMappings) {
      // Find brand ID
      const brand = brands.find(b => b.brand_name === mapping.brand_name);
      if (!brand) {
        console.log(`⚠️ Brand "${mapping.brand_name}" not found, skipping model "${mapping.model_name}"`);
        continue;
      }

      // Update model
      const [result] = await connection.query(
        'UPDATE valve_models SET brand_id = ? WHERE model_name = ?',
        [brand.id, mapping.model_name]
      );

      if (result.affectedRows > 0) {
        console.log(`✅ Updated "${mapping.model_name}" → Brand: "${mapping.brand_name}" (ID: ${brand.id})`);
      } else {
        console.log(`⚠️ Model "${mapping.model_name}" not found in database`);
      }
    }

    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const [updatedModels] = await connection.query(`
      SELECT vm.id, vm.model_name, vm.brand_id, vb.brand_name 
      FROM valve_models vm 
      LEFT JOIN valve_brands vb ON vm.brand_id = vb.id 
      ORDER BY vm.model_name
    `);

    console.log('Updated models:');
    updatedModels.forEach(model => {
      console.log(`  - ${model.model_name} → Brand: ${model.brand_name || 'null'} (ID: ${model.brand_id || 'null'})`);
    });

    console.log('\n✅ Model-brand relationships updated successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixModelBrandRelationships();
