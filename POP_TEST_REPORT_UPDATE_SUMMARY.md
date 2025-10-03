# POP Test Report Entry - Web Application Update

## Summary
Updated the web application's "Create New POP Test Report" form to match the field structure and validations from the Android application located at `C:\Users\User\Desktop\Project-Android\29-9-1\valve_test_suite`.

## Changes Made

### 1. Multi-Step Form Structure
The form now has **3 steps** instead of a single page:
- **Step 1:** Test Information (Header Data)
- **Step 2:** Valve Test Data (up to 5 valves)
- **Step 3:** Review & Submit

### 2. New Required Fields - Test Information (Step 1)

#### Required Fields:
- **Equipment No.** - Text input (uppercase), required
- **Ref. No.** - Auto-generated format: `KSE-ddmmyy-##`, required
  - Auto-generates on page load
  - Can be regenerated with refresh button
  - Validation: Must match pattern `KSE-\d{6}-\d{2}`

#### Pre-filled Read-only Fields:
- **Test Medium** - Default: "N2"
- **Ambient Temp** - Default: "(23±5)°C"
- **Master Pressure Gauge** - Default: "22024750"
- **Calibration Cert** - Default: "CMS-5009-24"
- **Range** - Default: "(0~600) psi"
- **Make / Model** - Default: "Winter/PFP"
- **Calibrate Company** - Default: "Caltek Pte Ltd"

#### Editable Fields:
- **Test Date** - Date picker, required, defaults to today
- **Next Test Date** - Auto-calculated (Test Date + 2.5 years / 912 days), read-only
- **Gauge Due Date** - Date picker, defaults to "2025-10-01"

### 3. New Valve Test Data Structure (Step 2)

Each valve now requires the following fields:

#### Valve Identification:
- **Valve Serial / Tag No.** * - Text input, required
- **Brand** * - Text input, required
- **Year of Manufacture** * - Number input (1900 - current year), required
- **Material Type** * - Text input, required
- **Model** * - Text input, required

#### Valve Specifications:
- **Inlet Size** * - Text input, required
- **Outlet Size** * - Text input, required
- **Coefficient of Discharge** * - Text input, required

#### Test Pressures (in Bar):
- **Set Pressure** * - Number input (step: 0.1), required, default: 22.0
- **Input Pressure** - Auto-calculated (Set Pressure + 1.0), read-only
- **Pop Pressure** * - Number input (step: 0.1), required
- **Reset Pressure** * - Number input (step: 0.1), required

#### Auto-Calculated Results:
- **Pop Tolerance** - Auto-calculated: `|(Pop - Set) / Set × 100|%`
- **Reset Tolerance** - Auto-calculated: `|(Reset - Set) / Set × 100|%`
- **Pop Result** - Auto-calculated:
  - "Passed" if Pop Tolerance ≤ 3%
  - "Failed" if Pop Tolerance > 3%
- **Reset Result** - Auto-calculated:
  - "Satisfactory" if Reset Tolerance ≤ 10%
  - "Failed" if Reset Tolerance > 10%
- **Overall Result** - Auto-calculated:
  - "Passed" if both Pop Result = "Passed" AND Reset Result = "Satisfactory"
  - "Failed" otherwise

### 4. Valve Management Features
- **Minimum valves:** 2 (default)
- **Maximum valves:** 5
- **Add Valve** button - Adds a new valve (up to 5)
- **Remove Valve** button - Removes the last valve (minimum 2)

### 5. Validation Rules

#### Step 1 Validation:
- Equipment No. must not be empty
- Ref. No. must not be empty and match format `KSE-ddmmyy-##`
- Test Date must be selected

#### Step 2 Validation (for each valve with data):
- All required fields (*) must be filled
- Year of Manufacture must be between 1900 and current year
- Set Pressure must be a valid number
- Pop Pressure and Reset Pressure must be valid numbers
- Validation only applies to valves that have any data entered

### 6. Auto-Calculation Logic

#### Input Pressure:
```javascript
Input Pressure = Set Pressure + 1.0
```

#### Pop Tolerance:
```javascript
Pop Tolerance = |(Pop Pressure - Set Pressure) / Set Pressure × 100|%
```

#### Reset Tolerance:
```javascript
Reset Tolerance = |(Reset Pressure - Set Pressure) / Set Pressure × 100|%
```

#### Pop Result:
```javascript
Pop Result = Pop Tolerance ≤ 3% ? "Passed" : "Failed"
```

#### Reset Result:
```javascript
Reset Result = Reset Tolerance ≤ 10% ? "Satisfactory" : "Failed"
```

#### Overall Result:
```javascript
Overall Result = (Pop Result === "Passed" && Reset Result === "Satisfactory") ? "Passed" : "Failed"
```

### 7. Review & Submit (Step 3)

Displays a comprehensive summary including:
- Test Information Summary (Equipment No., Ref. No., Test Date, etc.)
- Valve Test Results for all valves with data
- Color-coded results (Green for Passed/Satisfactory, Red for Failed)
- Comments/Remarks text area
- Certification notice with reference standards

### 8. User Interface Improvements

#### Progress Indicator:
- Visual progress bar showing current step (1/3, 2/3, 3/3)
- Step labels: "Test Information", "Valve Test Data", "Review & Submit"
- Current step highlighted in blue

#### Navigation:
- "Previous" button (appears on steps 2 and 3)
- "Next" button (appears on steps 1 and 2)
- "Submit Report" button (appears on step 3)
- Validation runs before proceeding to next step

#### Visual Feedback:
- Read-only fields have gray background (#f5f5f5)
- Auto-calculated fields are read-only with gray background
- Results are color-coded (green for pass, red for fail)
- Each valve is displayed in a bordered card with light gray background
- Review page uses color-coded borders (blue for test info, green for results)

### 9. Data Structure Changes

The form now collects data in this structure:
```javascript
{
  // Header Data
  equipment_no: string,
  ref_no: string,
  test_medium: string,
  ambient_temp: string,
  test_date: date,
  master_pressure_gauge: string,
  calibration_cert: string,
  gauge_due_date: date,
  range: string,
  make_model: string,
  calibrate_company: string,
  next_test_date: date,
  remarks: string,
  
  // Valve Data Array
  valves: [
    {
      serial_number: string,
      brand: string,
      year_of_manufacture: number,
      material_type: string,
      model: string,
      inlet_size: string,
      outlet_size: string,
      coefficient_discharge: string,
      set_pressure: number,
      input_pressure: number,
      pop_pressure: number,
      reset_pressure: number,
      pop_tolerance: string,
      reset_tolerance: string,
      pop_result: string,
      reset_result: string,
      overall_result: string
    }
  ]
}
```

## Compliance with Android Application

The web application now matches the Android application's:
✅ Field names and labels
✅ Required field validations
✅ Auto-calculation formulas (3% for pop, 10% for reset)
✅ Default values (N2, ambient temp, gauge info, etc.)
✅ Reference number format (KSE-ddmmyy-##)
✅ Next test date calculation (2.5 years)
✅ Multi-valve support (2-5 valves)
✅ Result determination logic
✅ Reference standards notation

## Next Steps (Recommended)

1. **Backend API Update** - Update the server-side API to handle the new data structure
2. **Database Schema Update** - Create/update tables to store:
   - Test header information
   - Multiple valve test records per report
3. **Dropdown Data** - Implement dropdown options for:
   - Brand (from database)
   - Model (from database, filtered by brand)
   - Material Type (from database)
   - Inlet/Outlet Size combinations (from database)
   - Set Pressure options (from database)
4. **Auto-fill Logic** - Implement logic to:
   - Load existing valve data when serial number is entered
   - Auto-fill outlet size based on inlet size selection
   - Load brand-model-material combinations from database
5. **PDF Generation** - Create PDF report matching the Android app's format
6. **Testing** - Comprehensive testing of all validations and calculations

## Files Modified

- `client/src/pages/CreateReport.jsx` - Complete rewrite with new structure

## Reference

Android Application Path: `C:\Users\User\Desktop\Project-Android\29-9-1\valve_test_suite\lib\screens\operator\new_pop_test_screen.dart`

