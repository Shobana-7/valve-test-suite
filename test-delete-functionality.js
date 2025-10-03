// Test delete functionality for both legacy and POP test reports
const axios = require('axios');

async function testDeleteFunctionality() {
  console.log('🧪 Testing delete functionality...');
  
  try {
    // Login first
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'operator1',
      password: 'operator123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Get all reports first
    console.log('\n📋 Getting all reports...');
    const reportsResponse = await axios.get('http://localhost:5000/api/reports', { headers });
    const reports = reportsResponse.data.reports;
    
    console.log(`Found ${reports.length} reports:`);
    reports.forEach(report => {
      console.log(`  - ID: ${report.id}, Type: ${report.report_type}, Equipment: ${report.equipment_no}, Status: ${report.status}`);
    });

    // Find a POP test report to delete (should be pending and owned by operator1)
    const popTestReport = reports.find(r => 
      r.report_type === 'pop_test' && 
      r.status === 'pending' && 
      r.operator_name === 'Hossien Sajib'
    );

    if (popTestReport) {
      console.log(`\n🗑️  Testing delete of POP test report ID: ${popTestReport.id}`);
      
      try {
        const deleteResponse = await axios.delete(
          `http://localhost:5000/api/reports/${popTestReport.id}`,
          { headers }
        );
        
        console.log('✅ Delete successful!');
        console.log(`📊 Response: ${deleteResponse.data.message}`);
        
        // Verify the report is deleted
        console.log('\n🔍 Verifying deletion...');
        const verifyResponse = await axios.get('http://localhost:5000/api/reports', { headers });
        const remainingReports = verifyResponse.data.reports;
        
        const deletedReport = remainingReports.find(r => r.id === popTestReport.id);
        if (!deletedReport) {
          console.log('✅ Report successfully deleted from database');
        } else {
          console.log('❌ Report still exists in database');
        }
        
      } catch (deleteError) {
        console.log('❌ Delete failed:', deleteError.response?.data?.message || deleteError.message);
        
        if (deleteError.response?.status === 403) {
          console.log('🚨 Permission denied - check if report is pending and owned by current user');
        } else if (deleteError.response?.status === 404) {
          console.log('🚨 Report not found - may have been deleted already');
        }
      }
    } else {
      console.log('\n⚠️  No suitable POP test report found for deletion test');
      console.log('   (Need a pending POP test report owned by operator1)');
    }

    // Test deleting a non-existent report
    console.log('\n🧪 Testing delete of non-existent report...');
    try {
      await axios.delete('http://localhost:5000/api/reports/99999', { headers });
      console.log('❌ Should have failed for non-existent report');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Correctly returned 404 for non-existent report');
      } else {
        console.log(`❌ Unexpected error: ${error.response?.status} - ${error.response?.data?.message}`);
      }
    }

    // Test deleting someone else's report (if available)
    const otherUserReport = reports.find(r => 
      r.operator_name !== 'Hossien Sajib' && 
      r.status === 'pending'
    );

    if (otherUserReport) {
      console.log(`\n🧪 Testing delete of other user's report (ID: ${otherUserReport.id})...`);
      try {
        await axios.delete(`http://localhost:5000/api/reports/${otherUserReport.id}`, { headers });
        console.log('❌ Should have failed for other user\'s report');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✅ Correctly denied access to other user\'s report');
        } else {
          console.log(`❌ Unexpected error: ${error.response?.status} - ${error.response?.data?.message}`);
        }
      }
    }

    console.log('\n🎉 Delete functionality test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.log(`🚨 Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
    }
  }
}

testDeleteFunctionality();
