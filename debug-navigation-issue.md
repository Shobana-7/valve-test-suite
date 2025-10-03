# Debug Navigation Issue - Step 2 to Step 3

## 🔍 **Issue Description**
When clicking "Next" button on Step 2 (Valve Test Data), the form skips Step 3 (Review & Submit) and goes directly to the View Reports page.

## 🧪 **Testing Steps**

### **1. Access Application**
- Open: http://localhost:5173
- Login: operator1 / operator123

### **2. Navigate to Create Report**
- Click "New POP Test Report"
- Should be on Step 1 (Test Information)

### **3. Complete Step 1**
Fill in required fields:
- Equipment No: SMAU 9220460
- Ref. No: (auto-generated)
- Test Date: (select any date)
- Test Medium: N2
- Ambient Temp: 23±5°C

Click "Next →" - should go to Step 2

### **4. Complete Step 2 (Valve Test Data)**
For Valve 1:
- Serial Number: PSV-001 (should auto-fill)
- OR manually fill:
  - Serial Number: TEST-001
  - Brand: Baitu
  - Model: DA20-C1
  - Year of Manufacture: 2024/01
  - Material Type: Stainless Steel
  - Inlet Size: 1"
  - Outlet Size: 1"
  - Coefficient: 1200nm3/h
  - Set Pressure: 22.0
  - Input Pressure: 23.0
  - Pop Pressure: 22.5
  - Reset Pressure: 21.8

For Valve 2:
- Fill similar data or leave empty

### **5. Click Next Button**
- Click "Next →" button
- **Expected:** Should go to Step 3 (Review & Submit)
- **Actual:** Goes directly to View Reports page

## 🔧 **Debug Information Added**

I've added console.log statements to track:
1. When nextStep() function is called
2. Current step number
3. Validation results for header and valve data
4. Step transition logic

## 🔍 **Check Browser Console**

Open browser Developer Tools (F12) and check Console tab for debug messages:
- "Next step clicked, current step: X"
- "Validating valve data..."
- "Valve validation passed/failed"
- "Moving to next step..."
- "New step will be: X"

## 🚨 **Possible Causes**

1. **Validation Failure:** validateValveData() returning false
2. **Form Submission:** Next button accidentally triggering form submit
3. **State Management:** currentStep not updating correctly
4. **Event Handler:** onClick not properly bound
5. **Component Re-render:** State reset causing navigation

## 🔧 **Quick Fixes to Try**

### **Fix 1: Check Validation Logic**
The validation might be too strict. Check if all required fields are filled.

### **Fix 2: Prevent Form Submission**
Ensure Next button has `type="button"` (already set).

### **Fix 3: Check Console Errors**
Look for JavaScript errors in browser console.

### **Fix 4: Test with Minimal Data**
Try with just the first valve filled completely.

## 📋 **Expected Console Output**

When clicking Next on Step 2:
```
Next step clicked, current step: 2
Validating valve data...
validateValveData called, valves: [valve1, valve2]
Validating valve 1: {serial_number: "PSV-001", ...}
Valve 1 hasAnyData: true
[validation checks for valve 1]
Validating valve 2: {serial_number: "", ...}
Valve 2 hasAnyData: false
Skipping valve 2 - no data
Valve validation passed
Moving to next step...
New step will be: 3
```

## 🎯 **Next Actions**

1. Test the form with debug output
2. Check browser console for error messages
3. Identify where the navigation is failing
4. Fix the specific issue found
5. Remove debug code once fixed

The debug information will help identify exactly where the navigation is breaking.
