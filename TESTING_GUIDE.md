# Testing Guide - Updated POP Test Report Entry

## Quick Start

The development server is running at: **http://localhost:5174/**

## Test Credentials

Use these credentials to test the operator functionality:
- **Username:** `operator1`
- **Password:** `operator123`

## Testing Steps

### 1. Login
1. Navigate to http://localhost:5174/
2. Enter username: `operator1`
3. Enter password: `operator123`
4. Click "Login"

### 2. Access Create Report
1. After login, you'll be on the Operator Dashboard
2. Click "New POP Test Report" button
3. You should see the new 3-step form

### 3. Test Step 1 - Test Information

#### Auto-Generated Fields
- **Ref. No.** should be auto-generated in format `KSE-ddmmyy-##`
- Click the 🔄 button to regenerate a new reference number
- **Next Test Date** should auto-calculate when you select Test Date

#### Required Fields to Fill:
1. **Equipment No.** - Enter: `SMAU 9220460` (will auto-uppercase)
2. **Test Date** - Select today's date or any date
3. Verify **Next Test Date** updates to 2.5 years later

#### Pre-filled Read-Only Fields (verify they show):
- Test Medium: N2
- Ambient Temp: (23±5)°C
- Master Pressure Gauge: 22024750
- Calibration Cert: CMS-5009-24
- Range: (0~600) psi
- Make / Model: Winter/PFP
- Calibrate Company: Caltek Pte Ltd

#### Test Validation:
1. Try clicking "Next →" without filling Equipment No. - should show error
2. Fill Equipment No. and click "Next →" - should proceed to Step 2

### 4. Test Step 2 - Valve Test Data

You should see 2 valves by default (SV 1 and SV 2).

#### Test Valve 1:
1. **Valve Serial / Tag No.:** `PSV-001`
2. **Brand:** `Crosby`
3. **Year of Manufacture:** `2020`
4. **Material Type:** `Stainless Steel`
5. **Model:** `JOS-E`
6. **Inlet Size:** `2 inch`
7. **Outlet Size:** `3 inch`
8. **Coefficient of Discharge:** `0.975`
9. **Set Pressure:** `22.0` (default)
10. Verify **Input Pressure** auto-fills to `23.0`
11. **Pop Pressure:** `22.5`
12. **Reset Pressure:** `21.0`

#### Verify Auto-Calculations for Valve 1:
After entering Pop and Reset pressures, verify:
- **Pop Tolerance:** Should show `2.3%` (|(22.5-22)/22*100|)
- **Pop Result:** Should show "Passed" (green) because 2.3% ≤ 3%
- **Reset Tolerance:** Should show `4.5%` (|(21-22)/22*100|)
- **Reset Result:** Should show "Satisfactory" (green) because 4.5% ≤ 10%
- **Overall Result:** Should show "Passed" (green) because both passed

#### Test Valve 2:
1. **Valve Serial / Tag No.:** `PSV-002`
2. **Brand:** `Anderson Greenwood`
3. **Year of Manufacture:** `2021`
4. **Material Type:** `Carbon Steel`
5. **Model:** `Series 200`
6. **Inlet Size:** `1 inch`
7. **Outlet Size:** `2 inch`
8. **Coefficient of Discharge:** `0.965`
9. **Set Pressure:** `25.0`
10. Verify **Input Pressure** auto-fills to `26.0`
11. **Pop Pressure:** `26.0` (This will fail - 4% tolerance)
12. **Reset Pressure:** `22.0`

#### Verify Auto-Calculations for Valve 2:
- **Pop Tolerance:** Should show `4.0%`
- **Pop Result:** Should show "Failed" (red) because 4.0% > 3%
- **Reset Tolerance:** Should show `12.0%`
- **Reset Result:** Should show "Failed" (red) because 12.0% > 10%
- **Overall Result:** Should show "Failed" (red)

#### Test Add/Remove Valve:
1. Click "+ Add Valve" - should add SV 3
2. Click "+ Add Valve" twice more - should add SV 4 and SV 5
3. Verify "+ Add Valve" button disappears (max 5 valves)
4. Click "- Remove" - should remove SV 5
5. Click "- Remove" three times - should remove down to SV 2
6. Verify "- Remove" button disappears (min 2 valves)

#### Test Validation:
1. Try clicking "Next →" without filling all required fields - should show error
2. Fill all required fields for both valves
3. Click "Next →" - should proceed to Step 3

### 5. Test Step 3 - Review & Submit

#### Verify Test Information Summary:
- Equipment No.: SMAU 9220460
- Ref. No.: KSE-xxxxxx-xx
- Test Date: (your selected date)
- Next Test Date: (2.5 years later)
- Test Medium: N2
- Ambient Temp: (23±5)°C

#### Verify Valve Test Results:
Should show 2 valves with all their data:

**SV 1: PSV-001**
- Should have green left border (Passed)
- All fields should be displayed correctly
- Overall Result should be "Passed" in green

**SV 2: PSV-002**
- Should have red left border (Failed)
- All fields should be displayed correctly
- Overall Result should be "Failed" in red

#### Test Comments:
1. Enter some remarks: `Test completed successfully. Valve 2 requires adjustment.`

#### Verify Certification Notice:
Should show yellow warning box with:
"⚠️ Important: By submitting this report, you certify that all test data is accurate and complete.
Reference Standards: ISO 4126-1 / ASME III - Allowable Tolerance Guideline"

#### Test Navigation:
1. Click "← Previous" - should go back to Step 2
2. Click "Next →" - should return to Step 3
3. Click "← Previous" twice - should go to Step 1
4. Click "Next →" twice - should return to Step 3

### 6. Test Submission

**Note:** The backend API needs to be updated to handle the new data structure. The current submission will fail because the API expects the old format.

1. Click "✓ Submit Report"
2. You will likely see an error because the backend needs updating

## Expected Behavior Summary

### ✅ What Should Work:
- Multi-step form navigation (3 steps)
- Progress indicator updates
- Auto-generation of Ref. No.
- Auto-calculation of Next Test Date
- Auto-calculation of Input Pressure
- Auto-calculation of Pop Tolerance
- Auto-calculation of Reset Tolerance
- Auto-calculation of Pop Result (Passed/Failed)
- Auto-calculation of Reset Result (Satisfactory/Failed)
- Auto-calculation of Overall Result
- Add/Remove valve functionality (2-5 valves)
- Step-by-step validation
- Review page summary
- Color-coded results (green/red)
- Read-only field styling

### ⚠️ What Needs Backend Update:
- Form submission (API expects old format)
- Data persistence (database schema needs update)
- Dropdown data loading (brands, models, materials, sizes)
- Auto-fill from existing valve data

## Visual Checks

### Step 1:
- [ ] Progress bar shows 33% (1/3)
- [ ] "Test Information" is highlighted in blue
- [ ] Ref. No. has refresh button
- [ ] Read-only fields have gray background
- [ ] Next Test Date updates when Test Date changes

### Step 2:
- [ ] Progress bar shows 67% (2/3)
- [ ] "Valve Test Data" is highlighted in blue
- [ ] Each valve is in a bordered card
- [ ] Auto-calculated fields have gray background
- [ ] Results are color-coded (green/red)
- [ ] Add/Remove buttons work correctly

### Step 3:
- [ ] Progress bar shows 100% (3/3)
- [ ] "Review & Submit" is highlighted in blue
- [ ] Test Information summary is in blue-bordered box
- [ ] Valve Results are in green-bordered box
- [ ] Each valve has color-coded left border
- [ ] Yellow warning box appears at bottom
- [ ] Submit button shows checkmark icon

## Test Scenarios

### Scenario 1: All Valves Pass
- Set Pressure: 22.0
- Pop Pressure: 22.5 (2.3% tolerance - Pass)
- Reset Pressure: 21.0 (4.5% tolerance - Satisfactory)
- Expected: Overall Result = "Passed" (green)

### Scenario 2: Pop Fails
- Set Pressure: 22.0
- Pop Pressure: 23.0 (4.5% tolerance - Fail)
- Reset Pressure: 21.0 (4.5% tolerance - Satisfactory)
- Expected: Overall Result = "Failed" (red)

### Scenario 3: Reset Fails
- Set Pressure: 22.0
- Pop Pressure: 22.5 (2.3% tolerance - Pass)
- Reset Pressure: 19.0 (13.6% tolerance - Fail)
- Expected: Overall Result = "Failed" (red)

### Scenario 4: Both Fail
- Set Pressure: 22.0
- Pop Pressure: 23.0 (4.5% tolerance - Fail)
- Reset Pressure: 19.0 (13.6% tolerance - Fail)
- Expected: Overall Result = "Failed" (red)

## Known Issues / Next Steps

1. **Backend API Update Required:**
   - Update `/api/reports` POST endpoint to handle new data structure
   - Create separate tables for header and valve data
   - Implement proper foreign key relationships

2. **Database Schema Update Required:**
   - Create `pop_test_headers` table
   - Create `pop_test_valves` table
   - Migrate existing data if needed

3. **Dropdown Data:**
   - Implement API endpoints for brands, models, materials
   - Implement inlet/outlet size combinations
   - Implement set pressure options

4. **Auto-fill Logic:**
   - Load existing valve data when serial number is entered
   - Auto-fill outlet size based on inlet size
   - Load brand-model-material combinations

5. **PDF Generation:**
   - Create PDF template matching Android app format
   - Include company header and certification footer

## Success Criteria

The update is successful if:
- ✅ Form has 3 steps with progress indicator
- ✅ All required fields match Android app
- ✅ All auto-calculations work correctly
- ✅ Validation prevents invalid data entry
- ✅ Review page shows comprehensive summary
- ✅ Visual feedback is clear and intuitive
- ✅ Multi-valve support works (2-5 valves)
- ✅ Navigation between steps works smoothly

## Contact

If you encounter any issues or have questions, please refer to:
- `POP_TEST_REPORT_UPDATE_SUMMARY.md` - Detailed change summary
- `FIELD_COMPARISON.md` - Field-by-field comparison
- Android app reference: `C:\Users\User\Desktop\Project-Android\29-9-1\valve_test_suite\lib\screens\operator\new_pop_test_screen.dart`

