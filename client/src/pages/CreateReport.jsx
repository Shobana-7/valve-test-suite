import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DashboardFloatingButton from '../components/DashboardFloatingButton';
import { reportsAPI } from '../services/api';

// Master data API calls
const masterDataAPI = {
  getBrands: () => fetch('/api/master-data/brands', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(res => res.json()),

  getModels: (brandId = '') => fetch(`/api/master-data/models${brandId ? `?brand_id=${brandId}` : ''}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(res => res.json()),

  getMaterials: () => fetch('/api/master-data/materials', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(res => res.json()),

  getIOSizes: () => fetch('/api/master-data/io-sizes', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(res => res.json()),

  getSetPressures: () => fetch('/api/master-data/set-pressures', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(res => res.json()),

  getValveSerials: (equipmentNo) => fetch(`/api/master-data/valve-serials?equipment_no=${encodeURIComponent(equipmentNo)}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(res => res.json()),

  getValveData: (serialNumber) => fetch(`/api/master-data/valve-data?serial_number=${encodeURIComponent(serialNumber)}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(res => res.json()),

  addBrand: (brandName) => fetch('/api/master-data/brands', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ brand_name: brandName })
  }).then(res => res.json()),

  addModel: (modelName, brandId) => fetch('/api/master-data/models', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model_name: modelName, brand_id: brandId })
  }).then(res => res.json()),

  addMaterial: (materialName) => fetch('/api/master-data/materials', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ material_name: materialName })
  }).then(res => res.json()),

  addValveSerial: (equipmentNo, serialNumber) => fetch('/api/master-data/valve-serials', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ equipment_no: equipmentNo, serial_number: serialNumber })
  }).then(res => res.json())
};

const CreateReport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  // Master data states
  const [masterData, setMasterData] = useState({
    brands: [],
    models: [],
    materials: [],
    ioSizes: { raw: [], inletSizes: [], outletSizes: [], grouped: {} },
    setPressures: [],
    valveSerials: []
  });

  // New entry states for "Other" options
  const [newEntries, setNewEntries] = useState({
    brand: '',
    model: '',
    material: '',
    valveSerial: ''
  });

  // Show new entry modals
  const [showNewEntryModal, setShowNewEntryModal] = useState({
    brand: false,
    model: false,
    material: false,
    valveSerial: false
  });

  // Header Information
  const [headerData, setHeaderData] = useState({
    equipment_no: '',
    ref_no: '',
    test_medium: 'N2',
    ambient_temp: '(23±5)°C',
    test_date: new Date().toISOString().split('T')[0],
    master_pressure_gauge: '22024750',
    calibration_cert: 'CMS-5009-24',
    gauge_due_date: '2025-10-01',
    range: '(0~600) psi',
    make_model: 'Winter/PFP',
    calibrate_company: 'Caltek Pte Ltd',
    next_test_date: '',
    remarks: '',
  });

  // Valve Test Data (support up to 5 valves)
  const [valves, setValves] = useState([
    {
      serial_number: '',
      brand: '',
      year_of_manufacture: '',
      material_type: '',
      model: '',
      inlet_size: '',
      outlet_size: '',
      coefficient_discharge: '1200nm3/h',
      set_pressure: 22.0,
      input_pressure: 23.0,
      pop_pressure: '',
      reset_pressure: '',
      pop_tolerance: '',
      reset_tolerance: '',
      pop_result: '',
      reset_result: '',
      overall_result: '',
      is_saved: false,
    },
    {
      serial_number: '',
      brand: '',
      year_of_manufacture: '',
      material_type: '',
      model: '',
      inlet_size: '',
      outlet_size: '',
      coefficient_discharge: '1200nm3/h',
      set_pressure: 22.0,
      input_pressure: 23.0,
      pop_pressure: '',
      reset_pressure: '',
      pop_tolerance: '',
      reset_tolerance: '',
      pop_result: '',
      reset_result: '',
      overall_result: '',
      is_saved: false,
    },
  ]);

  // Auto-generate reference number on mount
  useEffect(() => {
    generateRefNo();
    calculateNextTestDate();
    loadMasterData();
  }, []);

  // Calculate next test date (2.5 years from test date)
  useEffect(() => {
    calculateNextTestDate();
  }, [headerData.test_date]);

  // Load valve serials when equipment number changes
  useEffect(() => {
    if (headerData.equipment_no.trim()) {
      loadValveSerials(headerData.equipment_no);
    } else {
      setMasterData(prev => ({ ...prev, valveSerials: [] }));
    }
  }, [headerData.equipment_no]);

  // Load master data from API
  const loadMasterData = async () => {
    try {
      const [brandsRes, materialsRes, modelsRes, ioSizesRes, setPressuresRes] = await Promise.all([
        masterDataAPI.getBrands(),
        masterDataAPI.getMaterials(),
        masterDataAPI.getModels(),
        masterDataAPI.getIOSizes(),
        masterDataAPI.getSetPressures()
      ]);



      setMasterData(prev => ({
        ...prev,
        brands: brandsRes.success ? brandsRes.data : [],
        materials: materialsRes.success ? materialsRes.data : [],
        models: modelsRes.success ? modelsRes.data : [],
        ioSizes: ioSizesRes.success ? ioSizesRes.data : { raw: [], inletSizes: [], outletSizes: [], grouped: {} },
        setPressures: setPressuresRes.success ? setPressuresRes.data : []
      }));
    } catch (error) {
      console.error('Error loading master data:', error);
      setError('Failed to load dropdown data');
    }
  };

  // Load valve serials for equipment number
  const loadValveSerials = async (equipmentNo) => {
    try {
      const response = await masterDataAPI.getValveSerials(equipmentNo);
      setMasterData(prev => ({
        ...prev,
        valveSerials: response.success ? response.data : []
      }));
    } catch (error) {
      console.error('Error loading valve serials:', error);
      setMasterData(prev => ({ ...prev, valveSerials: [] }));
    }
  };

  const generateRefNo = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const sequence = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    const refNo = `KSE-${day}${month}${year}-${sequence}`;
    setHeaderData(prev => ({ ...prev, ref_no: refNo }));
  };

  const calculateNextTestDate = () => {
    if (headerData.test_date) {
      const testDate = new Date(headerData.test_date);
      const nextDate = new Date(testDate);
      nextDate.setDate(nextDate.getDate() + 912); // 2.5 years ≈ 912 days
      setHeaderData(prev => ({
        ...prev,
        next_test_date: nextDate.toISOString().split('T')[0]
      }));
    }
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeaderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleValveChange = (index, field, value) => {
    const updatedValves = [...valves];
    updatedValves[index][field] = value;

    // Auto-fill valve data when serial number is selected
    if (field === 'serial_number' && value && value !== 'other') {
      loadAndFillValveData(index, value);
    }

    // Clear outlet size when inlet size changes
    if (field === 'inlet_size') {
      updatedValves[index].outlet_size = '';
    }

    // Auto-calculate input pressure when set pressure changes
    if (field === 'set_pressure') {
      const setPressure = parseFloat(value) || 0;
      // Find the corresponding input pressure from master data
      const pressureData = masterData.setPressures.find(p => p.set_pressure == value);
      if (pressureData) {
        updatedValves[index].input_pressure = pressureData.input_pressure;
      } else {
        updatedValves[index].input_pressure = (setPressure + 1.0).toFixed(1);
      }
    }

    // Auto-calculate results when pop or reset pressure changes
    if (field === 'pop_pressure' || field === 'reset_pressure' || field === 'set_pressure') {
      calculateValveResults(updatedValves[index]);
    }

    setValves(updatedValves);
  };

  // Load and auto-fill valve data from previous tests
  const loadAndFillValveData = async (index, serialNumber) => {
    try {
      const response = await masterDataAPI.getValveData(serialNumber);
      if (response.success && response.data) {
        const valveData = response.data;
        const updatedValves = [...valves];

        // Auto-fill fields from previous data
        updatedValves[index] = {
          ...updatedValves[index],
          serial_number: serialNumber,
          brand: valveData.brand || '',
          year_of_manufacture: valveData.year_of_manufacture || '',
          material_type: valveData.material_type || '',
          model: valveData.model || '',
          inlet_size: valveData.inlet_size || '',
          outlet_size: valveData.outlet_size || '',
          coefficient_discharge: valveData.coefficient_discharge || '',
          set_pressure: valveData.set_pressure || 22.0,
          input_pressure: valveData.input_pressure || 23.0
        };

        setValves(updatedValves);
        setSuccess(`Auto-filled valve data for ${serialNumber} from previous test`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error loading valve data:', error);
    }
  };

  const calculateValveResults = (valve) => {
    const setPressure = parseFloat(valve.set_pressure) || 0;
    const popPressure = parseFloat(valve.pop_pressure) || 0;
    const resetPressure = parseFloat(valve.reset_pressure) || 0;

    // Calculate pop tolerance and result (3% tolerance)
    if (setPressure > 0 && popPressure > 0) {
      const popToleranceValue = Math.abs((popPressure - setPressure) / setPressure * 100);
      valve.pop_tolerance = `${popToleranceValue.toFixed(1)}%`;
      valve.pop_result = popToleranceValue <= 3.0 ? 'Passed' : 'Failed';
    } else {
      valve.pop_tolerance = '';
      valve.pop_result = '';
    }

    // Calculate reset tolerance and result (10% tolerance)
    if (setPressure > 0 && resetPressure > 0) {
      const resetToleranceValue = Math.abs((resetPressure - setPressure) / setPressure * 100);
      valve.reset_tolerance = `${resetToleranceValue.toFixed(1)}%`;
      valve.reset_result = resetToleranceValue <= 10.0 ? 'Satisfactory' : 'Failed';
    } else {
      valve.reset_tolerance = '';
      valve.reset_result = '';
    }

    // Calculate overall result
    if (valve.pop_result === 'Passed' && valve.reset_result === 'Satisfactory') {
      valve.overall_result = 'Passed';
    } else if (valve.pop_result || valve.reset_result) {
      valve.overall_result = 'Failed';
    } else {
      valve.overall_result = '';
    }
  };

  // Handle "Other" option selection
  const handleOtherSelection = (field, valveIndex = null) => {
    setShowNewEntryModal(prev => ({ ...prev, [field]: true }));
    if (valveIndex !== null) {
      setNewEntries(prev => ({ ...prev, valveIndex }));
    }
  };

  // Add new master data entry
  const addNewEntry = async (field) => {
    const value = newEntries[field];
    if (!value.trim()) {
      setError(`Please enter a ${field} name`);
      return;
    }

    try {
      let response;
      switch (field) {
        case 'brand':
          response = await masterDataAPI.addBrand(value);
          if (response.success) {
            setMasterData(prev => ({
              ...prev,
              brands: [...prev.brands, response.data]
            }));
          }
          break;
        case 'model':
          // For model, we need the selected brand ID
          const selectedBrandId = valves[newEntries.valveIndex]?.brand || '';
          response = await masterDataAPI.addModel(value, selectedBrandId);
          if (response.success) {
            setMasterData(prev => ({
              ...prev,
              models: [...prev.models, response.data]
            }));
          }
          break;
        case 'material':
          response = await masterDataAPI.addMaterial(value);
          if (response.success) {
            setMasterData(prev => ({
              ...prev,
              materials: [...prev.materials, response.data]
            }));
          }
          break;
        case 'valveSerial':
          if (!headerData.equipment_no.trim()) {
            setError('Please enter Equipment No. first');
            return;
          }
          response = await masterDataAPI.addValveSerial(headerData.equipment_no, value);
          if (response.success) {
            setMasterData(prev => ({
              ...prev,
              valveSerials: [...prev.valveSerials, value]
            }));
          }
          break;
      }

      if (response && response.success) {
        setSuccess(`${field} "${value}" added successfully`);
        setNewEntries(prev => ({ ...prev, [field]: '' }));
        setShowNewEntryModal(prev => ({ ...prev, [field]: false }));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response?.message || `Failed to add ${field}`);
      }
    } catch (error) {
      console.error(`Error adding ${field}:`, error);
      setError(`Failed to add ${field}`);
    }
  };

  // Cancel new entry
  const cancelNewEntry = (field) => {
    setNewEntries(prev => ({ ...prev, [field]: '' }));
    setShowNewEntryModal(prev => ({ ...prev, [field]: false }));
  };

  // Save individual valve
  const saveValve = async (index) => {
    const valve = valves[index];

    // Validate required fields
    if (!valve.serial_number.trim()) {
      setError(`Valve ${index + 1}: Serial Number is required`);
      return;
    }
    if (!valve.brand.trim()) {
      setError(`Valve ${index + 1}: Brand is required`);
      return;
    }
    if (!valve.model.trim()) {
      setError(`Valve ${index + 1}: Model is required`);
      return;
    }

    try {
      // Mark valve as saved
      const updatedValves = [...valves];
      updatedValves[index].is_saved = true;
      setValves(updatedValves);

      setSuccess(`Valve ${index + 1} saved successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving valve:', error);
      setError(`Failed to save valve ${index + 1}`);
    }
  };

  const addValve = () => {
    if (valves.length < 5) {
      setValves([...valves, {
        serial_number: '',
        brand: '',
        year_of_manufacture: '',
        material_type: '',
        model: '',
        inlet_size: '',
        outlet_size: '',
        coefficient_discharge: '1200nm3/h',
        set_pressure: 22.0,
        input_pressure: 23.0,
        pop_pressure: '',
        reset_pressure: '',
        pop_tolerance: '',
        reset_tolerance: '',
        pop_result: '',
        reset_result: '',
        overall_result: '',
        is_saved: false,
      }]);
    }
  };

  const removeValve = () => {
    if (valves.length > 2) {
      setValves(valves.slice(0, -1));
    }
  };

  const validateHeaderInfo = () => {
    if (!headerData.equipment_no.trim()) {
      setError('Equipment No. is required');
      return false;
    }
    if (!headerData.ref_no.trim()) {
      setError('Ref. No. is required');
      return false;
    }
    if (!headerData.test_date) {
      setError('Test Date is required');
      return false;
    }
    return true;
  };

  const validateValveData = (forSubmission = false) => {
    // Count valves with data
    let valvesWithData = 0;

    for (let i = 0; i < valves.length; i++) {
      const valve = valves[i];
      // Skip validation for empty valves (all fields empty)
      const hasAnyData = valve.serial_number || valve.brand || valve.model;

      if (!hasAnyData) {
        continue;
      }

      valvesWithData++;

      // For step navigation, only require basic fields
      if (!forSubmission) {
        if (!valve.serial_number.trim()) {
          setError(`Valve ${i + 1}: Serial Number is required`);
          return false;
        }
        if (!valve.brand.trim()) {
          setError(`Valve ${i + 1}: Brand is required`);
          return false;
        }
        if (!valve.model.trim()) {
          setError(`Valve ${i + 1}: Model is required`);
          return false;
        }
        // For step navigation, we don't need all fields filled
        continue;
      }

      // For submission, require all fields
      if (!valve.serial_number.trim()) {
        setError(`Valve ${i + 1}: Serial Number is required`);
        return false;
      }
      if (!valve.brand.trim()) {
        setError(`Valve ${i + 1}: Brand is required`);
        return false;
      }
      if (!valve.model.trim()) {
        setError(`Valve ${i + 1}: Model is required`);
        return false;
      }
      if (!valve.year_of_manufacture) {
        setError(`Valve ${i + 1}: Year of Manufacture is required`);
        return false;
      }
      if (!valve.material_type.trim()) {
        setError(`Valve ${i + 1}: Material Type is required`);
        return false;
      }
      if (!valve.inlet_size.trim()) {
        setError(`Valve ${i + 1}: Inlet Size is required`);
        return false;
      }
      if (!valve.outlet_size.trim()) {
        setError(`Valve ${i + 1}: Outlet Size is required`);
        return false;
      }
      if (!valve.coefficient_discharge.trim()) {
        setError(`Valve ${i + 1}: Coefficient of Discharge is required`);
        return false;
      }
      if (!valve.set_pressure) {
        setError(`Valve ${i + 1}: Set Pressure is required`);
        return false;
      }
      if (!valve.input_pressure) {
        setError(`Valve ${i + 1}: Input Pressure is required`);
        return false;
      }
      if (!valve.pop_pressure) {
        setError(`Valve ${i + 1}: Pop Pressure is required`);
        return false;
      }
      if (!valve.reset_pressure) {
        setError(`Valve ${i + 1}: Reset Pressure is required`);
        return false;
      }
    }

    // For step navigation, just need at least one valve with basic data
    if (!forSubmission && valvesWithData === 0) {
      setError('Please fill at least one valve with Serial Number, Brand, and Model');
      return false;
    }

    // For submission, need at least one complete valve
    if (forSubmission && valvesWithData === 0) {
      setError('Please complete at least one valve with all required fields');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Only allow submission on Step 3
    if (currentStep !== 3) {
      return;
    }

    setError('');
    setSuccess('');

    // Validate all steps for submission
    if (!validateHeaderInfo()) return;
    if (!validateValveData(true)) return;

    setLoading(true);

    try {
      // Prepare data for submission
      const reportData = {
        ...headerData,
        valves: valves.filter(v => v.serial_number.trim() !== ''),
      };

      const response = await reportsAPI.create(reportData);
      setSuccess('POP Test Report created successfully!');
      setTimeout(() => {
        navigate('/reports');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setError('');

    if (currentStep === 1 && !validateHeaderInfo()) return;
    if (currentStep === 2 && !validateValveData(false)) return;

    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Handle Enter key press in form fields
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && currentStep !== 3) {
      e.preventDefault();
      // Optionally trigger next step on Enter
      if (currentStep === 1) {
        nextStep();
      } else if (currentStep === 2) {
        nextStep();
      }
    }
  };

  // Explicit submit button handler
  const handleSubmitButtonClick = async (e) => {
    e.preventDefault();

    if (currentStep !== 3) {
      setError('Please complete all steps before submitting');
      return;
    }

    await handleSubmit(e);
  };

  return (
    <>
      <Navbar />
      <div className="form-container">
        <div className="container">
          <div className="breadcrumb mb-2">
            <Link to="/operator" className="breadcrumb-link">
              📊 Dashboard
            </Link>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-current">Create New POP Test Report</span>
          </div>
          <div className="card">
            <div className="card-header">
              Create New POP Test Report
              <div style={{ fontSize: '14px', fontWeight: 'normal', marginTop: '5px' }}>
                Step {currentStep} of 3
              </div>
            </div>

            {/* Progress Indicator */}
            <div style={{ padding: '20px', paddingBottom: '10px' }}>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(currentStep / 3) * 100}%`,
                  height: '100%',
                  backgroundColor: '#1976D2',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '10px',
                fontSize: '12px',
                color: '#666'
              }}>
                <span style={{ fontWeight: currentStep === 1 ? 'bold' : 'normal', color: currentStep === 1 ? '#1976D2' : '#666' }}>
                  Test Information
                </span>
                <span style={{ fontWeight: currentStep === 2 ? 'bold' : 'normal', color: currentStep === 2 ? '#1976D2' : '#666' }}>
                  Valve Test Data
                </span>
                <span style={{ fontWeight: currentStep === 3 ? 'bold' : 'normal', color: currentStep === 3 ? '#1976D2' : '#666' }}>
                  Review & Submit
                </span>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
              {/* Step 1: Test Information */}
              {currentStep === 1 && (
                <div style={{ padding: '20px' }}>
                  <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>
                    Test Information
                  </h3>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Equipment No. *</label>
                      <input
                        type="text"
                        name="equipment_no"
                        className="form-input"
                        value={headerData.equipment_no}
                        onChange={handleHeaderChange}
                        placeholder="e.g., SMAU 9220460"
                        required
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ref. No. *</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text"
                          name="ref_no"
                          className="form-input"
                          value={headerData.ref_no}
                          readOnly
                          style={{ flex: 1, backgroundColor: '#f5f5f5' }}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={generateRefNo}
                          style={{ padding: '0 15px' }}
                        >
                          🔄
                        </button>
                      </div>
                      <small style={{ color: '#666', fontSize: '12px' }}>
                        Format: KSE-ddmmyy-##
                      </small>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Test Medium</label>
                      <input
                        type="text"
                        name="test_medium"
                        className="form-input"
                        value={headerData.test_medium}
                        onChange={handleHeaderChange}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ambient Temp</label>
                      <input
                        type="text"
                        name="ambient_temp"
                        className="form-input"
                        value={headerData.ambient_temp}
                        onChange={handleHeaderChange}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Test Date *</label>
                      <input
                        type="date"
                        name="test_date"
                        className="form-input"
                        value={headerData.test_date}
                        onChange={handleHeaderChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Next Test Date (Auto: Test Date + 2.5 years)</label>
                      <input
                        type="date"
                        name="next_test_date"
                        className="form-input"
                        value={headerData.next_test_date}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Master Pressure Gauge</label>
                    <input
                      type="text"
                      name="master_pressure_gauge"
                      className="form-input"
                      value={headerData.master_pressure_gauge}
                      onChange={handleHeaderChange}
                      readOnly
                      style={{ backgroundColor: '#f5f5f5' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Calibration Cert</label>
                    <input
                      type="text"
                      name="calibration_cert"
                      className="form-input"
                      value={headerData.calibration_cert}
                      onChange={handleHeaderChange}
                      readOnly
                      style={{ backgroundColor: '#f5f5f5' }}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Range</label>
                      <input
                        type="text"
                        name="range"
                        className="form-input"
                        value={headerData.range}
                        onChange={handleHeaderChange}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Gauge Due Date</label>
                      <input
                        type="date"
                        name="gauge_due_date"
                        className="form-input"
                        value={headerData.gauge_due_date}
                        onChange={handleHeaderChange}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Make / Model</label>
                      <input
                        type="text"
                        name="make_model"
                        className="form-input"
                        value={headerData.make_model}
                        onChange={handleHeaderChange}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Calibrate Company</label>
                      <input
                        type="text"
                        name="calibrate_company"
                        className="form-input"
                        value={headerData.calibrate_company}
                        onChange={handleHeaderChange}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Valve Test Data */}
              {currentStep === 2 && (
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
                      Valve Test Data ({valves.length} valves)
                    </h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {valves.length < 5 && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={addValve}
                          style={{ padding: '8px 16px', fontSize: '14px' }}
                        >
                          + Add Valve
                        </button>
                      )}
                      {valves.length > 2 && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={removeValve}
                          style={{ padding: '8px 16px', fontSize: '14px' }}
                        >
                          - Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {valves.map((valve, index) => (
                    <div key={index} style={{
                      marginBottom: '30px',
                      padding: '20px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: '#fafafa'
                    }}>
                      <h4 style={{ marginBottom: '15px', color: '#1976D2' }}>
                        SV {index + 1}
                      </h4>

                      <div className="form-group">
                        <label className="form-label">Valve Serial / Tag No. *</label>
                        <select
                          className="form-input"
                          value={valve.serial_number}
                          onChange={(e) => handleValveChange(index, 'serial_number', e.target.value)}
                          required={index < 2}
                        >
                          <option value="">Select valve serial number</option>
                          {masterData.valveSerials.map((serial, idx) => (
                            <option key={idx} value={serial}>{serial}</option>
                          ))}
                          <option value="other">+ Add New Serial Number</option>
                        </select>
                        {valve.serial_number === 'other' && (
                          <div style={{ marginTop: '10px' }}>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Enter new valve serial number"
                              value={newEntries.valveSerial}
                              onChange={(e) => setNewEntries(prev => ({ ...prev, valveSerial: e.target.value }))}
                            />
                            <div style={{ marginTop: '5px' }}>
                              <button
                                type="button"
                                onClick={() => addNewEntry('valveSerial')}
                                style={{
                                  backgroundColor: '#4CAF50',
                                  color: 'white',
                                  border: 'none',
                                  padding: '5px 10px',
                                  borderRadius: '4px',
                                  marginRight: '5px',
                                  cursor: 'pointer'
                                }}
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleValveChange(index, 'serial_number', '');
                                  cancelNewEntry('valveSerial');
                                }}
                                style={{
                                  backgroundColor: '#f44336',
                                  color: 'white',
                                  border: 'none',
                                  padding: '5px 10px',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Brand *</label>
                          <select
                            className="form-input"
                            value={valve.brand}
                            onChange={(e) => handleValveChange(index, 'brand', e.target.value)}
                            required={index < 2}
                          >
                            <option value="">Select brand</option>
                            {masterData.brands.map((brand) => (
                              <option key={brand.id} value={brand.name}>{brand.name}</option>
                            ))}
                            <option value="other">+ Add New Brand</option>
                          </select>
                          {valve.brand === 'other' && (
                            <div style={{ marginTop: '10px' }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Enter new brand name"
                                value={newEntries.brand}
                                onChange={(e) => setNewEntries(prev => ({ ...prev, brand: e.target.value }))}
                              />
                              <div style={{ marginTop: '5px' }}>
                                <button
                                  type="button"
                                  onClick={() => addNewEntry('brand')}
                                  style={{
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    marginRight: '5px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Add
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleValveChange(index, 'brand', '');
                                    cancelNewEntry('brand');
                                  }}
                                  style={{
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="form-group">
                          <label className="form-label">Year of Manufacture (YYYY/MM) *</label>
                          <input
                            type="month"
                            className="form-input"
                            value={valve.year_of_manufacture}
                            onChange={(e) => handleValveChange(index, 'year_of_manufacture', e.target.value)}
                            min="1900-01"
                            max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                            required={index < 2}
                            style={{
                              cursor: 'pointer'
                            }}
                            title={valve.year_of_manufacture ? `Selected: ${valve.year_of_manufacture.replace('-', '/')}` : 'Click to select year and month'}
                          />
                          {valve.year_of_manufacture && (
                            <div style={{
                              fontSize: '12px',
                              color: '#666',
                              marginTop: '4px'
                            }}>
                              Selected: {valve.year_of_manufacture.replace('-', '/')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Material Type *</label>
                          <select
                            className="form-input"
                            value={valve.material_type}
                            onChange={(e) => handleValveChange(index, 'material_type', e.target.value)}
                            required={index < 2}
                          >
                            <option value="">Select material type</option>
                            {masterData.materials.map((material) => (
                              <option key={material.id} value={material.name}>{material.name}</option>
                            ))}
                            <option value="other">+ Add New Material</option>
                          </select>
                          {valve.material_type === 'other' && (
                            <div style={{ marginTop: '10px' }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Enter new material type"
                                value={newEntries.material}
                                onChange={(e) => setNewEntries(prev => ({ ...prev, material: e.target.value }))}
                              />
                              <div style={{ marginTop: '5px' }}>
                                <button
                                  type="button"
                                  onClick={() => addNewEntry('material')}
                                  style={{
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    marginRight: '5px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Add
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleValveChange(index, 'material_type', '');
                                    cancelNewEntry('material');
                                  }}
                                  style={{
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="form-group">
                          <label className="form-label">Model *</label>
                          <select
                            className="form-input"
                            value={valve.model}
                            onChange={(e) => handleValveChange(index, 'model', e.target.value)}
                            required={index < 2}
                          >
                            <option value="">Select model</option>
                            {masterData.models
                              ?.filter(model => !valve.brand || model.brand === valve.brand)
                              .map((model) => (
                                <option key={model.id} value={model.name}>{model.name}</option>
                              )) || []}
                            <option value="other">+ Add New Model</option>
                          </select>
                          {valve.model === 'other' && (
                            <div style={{ marginTop: '10px' }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Enter new model name"
                                value={newEntries.model}
                                onChange={(e) => setNewEntries(prev => ({ ...prev, model: e.target.value, valveIndex: index }))}
                              />
                              <div style={{ marginTop: '5px' }}>
                                <button
                                  type="button"
                                  onClick={() => addNewEntry('model')}
                                  style={{
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    marginRight: '5px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Add
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleValveChange(index, 'model', '');
                                    cancelNewEntry('model');
                                  }}
                                  style={{
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Inlet Size *</label>
                          <select
                            className="form-input"
                            value={valve.inlet_size}
                            onChange={(e) => handleValveChange(index, 'inlet_size', e.target.value)}
                            required={index < 2}
                          >
                            <option value="">Select inlet size</option>
                            {masterData.ioSizes.inletSizes.map((size, idx) => (
                              <option key={idx} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Outlet Size *</label>
                          <select
                            className="form-input"
                            value={valve.outlet_size}
                            onChange={(e) => handleValveChange(index, 'outlet_size', e.target.value)}
                            required={index < 2}
                          >
                            <option value="">Select outlet size</option>
                            {valve.inlet_size && masterData.ioSizes.grouped && masterData.ioSizes.grouped[valve.inlet_size] ?
                              masterData.ioSizes.grouped[valve.inlet_size].map((size, idx) => (
                                <option key={idx} value={size}>{size}</option>
                              )) :
                              masterData.ioSizes.outletSizes?.map((size, idx) => (
                                <option key={idx} value={size}>{size}</option>
                              )) || []
                            }
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Coefficient of Discharge *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={valve.coefficient_discharge}
                          onChange={(e) => handleValveChange(index, 'coefficient_discharge', e.target.value)}
                          placeholder="Default: 1200nm3/h"
                          required={index < 2}
                        />
                      </div>

                      <h5 style={{ marginTop: '20px', marginBottom: '10px', color: '#333' }}>
                        Test Pressures (Bar)
                      </h5>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Set Pressure *</label>
                          <select
                            className="form-input"
                            value={valve.set_pressure}
                            onChange={(e) => handleValveChange(index, 'set_pressure', e.target.value)}
                            required={index < 2}
                          >
                            <option value="">Select set pressure</option>
                            {masterData.setPressures.map((pressure, idx) => (
                              <option key={idx} value={pressure.set_pressure}>
                                {pressure.set_pressure} Bar (Input: {pressure.input_pressure} Bar)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Input Pressure (Auto-calculated)</label>
                          <input
                            type="number"
                            step="0.1"
                            className="form-input"
                            value={valve.input_pressure}
                            readOnly
                            style={{ backgroundColor: '#f5f5f5' }}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Pop Pressure *</label>
                          <input
                            type="number"
                            step="0.1"
                            className="form-input"
                            value={valve.pop_pressure}
                            onChange={(e) => handleValveChange(index, 'pop_pressure', e.target.value)}
                            placeholder="Enter pop pressure"
                            required={index < 2}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Reset Pressure *</label>
                          <input
                            type="number"
                            step="0.1"
                            className="form-input"
                            value={valve.reset_pressure}
                            onChange={(e) => handleValveChange(index, 'reset_pressure', e.target.value)}
                            placeholder="Enter reset pressure"
                            required={index < 2}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Pop Tolerance (Auto-calculated)</label>
                          <input
                            type="text"
                            className="form-input"
                            value={valve.pop_tolerance}
                            readOnly
                            style={{ backgroundColor: '#f5f5f5' }}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Reset Tolerance (Auto-calculated)</label>
                          <input
                            type="text"
                            className="form-input"
                            value={valve.reset_tolerance}
                            readOnly
                            style={{ backgroundColor: '#f5f5f5' }}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Pop Result (Auto-calculated)</label>
                          <input
                            type="text"
                            className="form-input"
                            value={valve.pop_result}
                            readOnly
                            style={{
                              backgroundColor: '#f5f5f5',
                              color: valve.pop_result === 'Passed' ? 'green' : valve.pop_result === 'Failed' ? 'red' : 'inherit',
                              fontWeight: 'bold'
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Reset Result (Auto-calculated)</label>
                          <input
                            type="text"
                            className="form-input"
                            value={valve.reset_result}
                            readOnly
                            style={{
                              backgroundColor: '#f5f5f5',
                              color: valve.reset_result === 'Satisfactory' ? 'green' : valve.reset_result === 'Failed' ? 'red' : 'inherit',
                              fontWeight: 'bold'
                            }}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Overall Result (Auto-calculated)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={valve.overall_result}
                          readOnly
                          style={{
                            backgroundColor: '#f5f5f5',
                            color: valve.overall_result === 'Passed' ? 'green' : valve.overall_result === 'Failed' ? 'red' : 'inherit',
                            fontWeight: 'bold',
                            fontSize: '16px'
                          }}
                        />
                      </div>

                      {/* Save Valve Button */}
                      <div style={{ marginTop: '20px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => saveValve(index)}
                          disabled={valve.is_saved}
                          style={{
                            backgroundColor: valve.is_saved ? '#4CAF50' : '#2196F3',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            cursor: valve.is_saved ? 'default' : 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            opacity: valve.is_saved ? 0.7 : 1
                          }}
                        >
                          {valve.is_saved ? '✓ Saved' : 'Save Valve'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 3: Review & Submit */}
              {currentStep === 3 && (
                <div style={{ padding: '20px' }}>
                  <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>
                    Review & Submit
                  </h3>

                  <div style={{
                    padding: '20px',
                    border: '2px solid #1976D2',
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ marginBottom: '15px', color: '#1976D2' }}>Test Information Summary</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                      <div><strong>Equipment No.:</strong> {headerData.equipment_no}</div>
                      <div><strong>Ref. No.:</strong> {headerData.ref_no}</div>
                      <div><strong>Test Date:</strong> {headerData.test_date}</div>
                      <div><strong>Next Test Date:</strong> {headerData.next_test_date}</div>
                      <div><strong>Test Medium:</strong> {headerData.test_medium}</div>
                      <div><strong>Ambient Temp:</strong> {headerData.ambient_temp}</div>
                    </div>
                  </div>

                  <div style={{
                    padding: '20px',
                    border: '2px solid #4CAF50',
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ marginBottom: '15px', color: '#4CAF50' }}>
                      Valve Test Results ({valves.filter(v => v.serial_number).length} valves)
                    </h4>
                    {valves.filter(v => v.serial_number).map((valve, index) => (
                      <div key={index} style={{
                        marginBottom: '15px',
                        padding: '15px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '4px',
                        borderLeft: `4px solid ${valve.overall_result === 'Passed' ? '#4CAF50' : valve.overall_result === 'Failed' ? '#f44336' : '#ccc'}`
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
                          SV {index + 1}: {valve.serial_number}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                          <div><strong>Brand:</strong> {valve.brand}</div>
                          <div><strong>Model:</strong> {valve.model}</div>
                          <div><strong>Year:</strong> {valve.year_of_manufacture}</div>
                          <div><strong>Material:</strong> {valve.material_type}</div>
                          <div><strong>Inlet/Outlet:</strong> {valve.inlet_size} / {valve.outlet_size}</div>
                          <div><strong>Coefficient:</strong> {valve.coefficient_discharge}</div>
                          <div><strong>Set Pressure:</strong> {valve.set_pressure} Bar</div>
                          <div><strong>Input Pressure:</strong> {valve.input_pressure} Bar</div>
                          <div><strong>Pop Pressure:</strong> {valve.pop_pressure} Bar</div>
                          <div><strong>Reset Pressure:</strong> {valve.reset_pressure} Bar</div>
                          <div><strong>Pop Result:</strong> <span style={{ color: valve.pop_result === 'Passed' ? 'green' : 'red' }}>{valve.pop_result}</span> ({valve.pop_tolerance})</div>
                          <div><strong>Reset Result:</strong> <span style={{ color: valve.reset_result === 'Satisfactory' ? 'green' : 'red' }}>{valve.reset_result}</span> ({valve.reset_tolerance})</div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <strong>Overall Result:</strong> <span style={{
                              color: valve.overall_result === 'Passed' ? 'green' : 'red',
                              fontSize: '16px',
                              fontWeight: 'bold'
                            }}>{valve.overall_result}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Comments / Remarks</label>
                    <textarea
                      name="remarks"
                      className="form-textarea"
                      value={headerData.remarks}
                      onChange={handleHeaderChange}
                      rows="4"
                      placeholder="Enter any additional comments or remarks..."
                    ></textarea>
                  </div>

                  <div style={{
                    padding: '15px',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '4px',
                    marginTop: '20px',
                    fontSize: '14px'
                  }}>
                    <strong>⚠️ Important:</strong> By submitting this report, you certify that all test data is accurate and complete.
                    Reference Standards: ISO 4126-1 / ASME III - Allowable Tolerance Guideline
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="form-actions" style={{ borderTop: '1px solid #ddd', paddingTop: '20px', marginTop: '20px' }}>
                {currentStep > 1 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={prevStep}
                    disabled={loading}
                  >
                    ← Previous
                  </button>
                )}
                {currentStep < 3 ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={nextStep}
                    disabled={loading}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmitButtonClick}
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : '✓ Submit Report'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
      <DashboardFloatingButton />
    </>
  );
};

export default CreateReport;

