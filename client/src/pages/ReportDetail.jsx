import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    try {
      const response = await reportsAPI.getById(id);
      setReport(response.data.report);
    } catch (error) {
      console.error('Error loading report:', error);
      alert('Failed to load report');
      navigate('/reports');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async () => {
    try {
      await reportsAPI.updateStatus(id, {
        status: approvalAction,
        rejection_reason: approvalAction === 'rejected' ? rejectionReason : null,
      });
      setShowApprovalModal(false);
      loadReport();
      alert(`Report ${approvalAction} successfully`);
    } catch (error) {
      alert('Failed to update report status');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </>
    );
  }

  if (!report) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="alert alert-error">Report not found</div>
        </div>
      </>
    );
  }

  const canApprove = ['admin', 'supervisor'].includes(user?.role) && report.status === 'pending';

  return (
    <>
      <Navbar />
      <div className="dashboard">
        <div className="container">
          <div className="flex-between mb-2">
            <h1 className="dashboard-title">Report Details</h1>
            <button onClick={() => navigate('/reports')} className="btn btn-secondary">
              Back to Reports
            </button>
          </div>

          <div className="card">
            <div className="flex-between mb-2">
              <div>
                <h2 style={{ marginBottom: '5px' }}>{report.report_number}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Created on {new Date(report.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <span className={`badge ${report.status === 'approved' ? 'badge-success' : report.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                  {report.status.toUpperCase()}
                </span>
              </div>
            </div>

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

            {/* Equipment Information for POP Test Reports */}
            {report.report_type === 'pop_test' && (
              <>
                <h3 style={{ marginBottom: '15px' }}>Equipment Information</h3>
                <div className="form-row">
                  <div><strong>Equipment No:</strong> {report.equipment_no}</div>
                  <div><strong>Reference No:</strong> {report.ref_no}</div>
                </div>
                <div className="form-row mt-1">
                  <div><strong>Company:</strong> {report.company}</div>
                  <div><strong>Test Medium:</strong> {report.test_medium || 'N/A'}</div>
                </div>
                <div className="form-row mt-1">
                  <div><strong>Ambient Temperature:</strong> {report.ambient_temp || 'N/A'}</div>
                  <div><strong>Next Test Date:</strong> {report.next_test_date ? new Date(report.next_test_date).toLocaleDateString() : 'N/A'}</div>
                </div>

                <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Pressure Gauge Information</h3>
                <div className="form-row">
                  <div><strong>Master Pressure Gauge:</strong> {report.master_pressure_gauge || 'N/A'}</div>
                  <div><strong>Calibration Certificate:</strong> {report.calibration_cert || 'N/A'}</div>
                </div>
                <div className="form-row mt-1">
                  <div><strong>Gauge Due Date:</strong> {report.gauge_due_date ? new Date(report.gauge_due_date).toLocaleDateString() : 'N/A'}</div>
                  <div><strong>Range:</strong> {report.range || 'N/A'}</div>
                </div>
                <div className="form-row mt-1">
                  <div><strong>Make/Model:</strong> {report.make_model || 'N/A'}</div>
                  <div><strong>Calibration Company:</strong> {report.calibrate_company || 'N/A'}</div>
                </div>

                <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Valve Test Results</h3>
                {report.valves && report.valves.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>SV</th>
                          <th>Serial Number</th>
                          <th>Brand</th>
                          <th>Model</th>
                          <th>Year</th>
                          <th>Material</th>
                          <th>Inlet Size</th>
                          <th>Outlet Size</th>
                          <th>Set Pressure</th>
                          <th>Pop Pressure</th>
                          <th>Reset Pressure</th>
                          <th>Pop Result</th>
                          <th>Reset Result</th>
                          <th>Overall Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.valves.map((valve, index) => (
                          <tr key={valve.id}>
                            <td>SV {valve.valve_index}</td>
                            <td>{valve.serial_number}</td>
                            <td>{valve.brand}</td>
                            <td>{valve.model}</td>
                            <td>{valve.year_of_manufacture ? valve.year_of_manufacture.replace('-', '/') : 'N/A'}</td>
                            <td>{valve.material_type}</td>
                            <td>{valve.inlet_size}</td>
                            <td>{valve.outlet_size}</td>
                            <td>{valve.set_pressure} Bar</td>
                            <td>{valve.pop_pressure} Bar</td>
                            <td>{valve.reset_pressure} Bar</td>
                            <td>
                              <span className={`badge ${valve.pop_result === 'Passed' ? 'badge-success' : valve.pop_result === 'Failed' ? 'badge-danger' : 'badge-warning'}`}>
                                {valve.pop_result}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${valve.reset_result === 'Satisfactory' ? 'badge-success' : valve.reset_result === 'Unsatisfactory' ? 'badge-danger' : 'badge-warning'}`}>
                                {valve.reset_result}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${valve.overall_result === 'Passed' ? 'badge-success' : valve.overall_result === 'Failed' ? 'badge-danger' : 'badge-warning'}`}>
                                {valve.overall_result}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No valve test data available</p>
                )}
              </>
            )}

            {/* Legacy Report Information */}
            {report.report_type === 'legacy' && (
              <>
                <h3 style={{ marginBottom: '15px' }}>Valve Information</h3>
                <div className="form-row">
                  <div><strong>Tag Number:</strong> {report.valve_tag_number}</div>
                  <div><strong>Manufacturer:</strong> {report.valve_manufacturer}</div>
                </div>
                <div className="form-row mt-1">
                  <div><strong>Model:</strong> {report.valve_model || 'N/A'}</div>
                  <div><strong>Size:</strong> {report.valve_size || 'N/A'}</div>
                </div>
                <div className="form-row mt-1">
                  <div><strong>Type:</strong> {report.valve_type || 'N/A'}</div>
                  <div><strong>Set Pressure:</strong> {report.set_pressure} {report.set_pressure_unit}</div>
                </div>

                <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Test Information</h3>
                <div className="form-row">
                  <div><strong>Test Date:</strong> {new Date(report.test_date).toLocaleDateString()}</div>
                  <div><strong>Location:</strong> {report.test_location || 'N/A'}</div>
                </div>
                <div className="form-row mt-1">
                  <div><strong>Test Medium:</strong> {report.test_medium || 'N/A'}</div>
                  <div><strong>Temperature:</strong> {report.test_temperature ? `${report.test_temperature} ${report.test_temperature_unit}` : 'N/A'}</div>
                </div>

                <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Test Results</h3>
                <div className="form-row">
                  <div><strong>Opening Pressure:</strong> {report.opening_pressure} {report.set_pressure_unit}</div>
                  <div><strong>Closing Pressure:</strong> {report.closing_pressure} {report.set_pressure_unit}</div>
                </div>
                <div className="form-row mt-1">
                  <div><strong>Seat Tightness:</strong> {report.seat_tightness}</div>
                  <div>
                    <strong>Test Result:</strong>{' '}
                    <span className={`badge ${report.test_result === 'pass' ? 'badge-success' : report.test_result === 'fail' ? 'badge-danger' : 'badge-warning'}`}>
                      {report.test_result.toUpperCase()}
                    </span>
                  </div>
                </div>
              </>
            )}

            {report.remarks && (
              <>
                <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Remarks</h3>
                <p style={{ padding: '10px', backgroundColor: 'var(--light-bg)', borderRadius: '4px' }}>
                  {report.remarks}
                </p>
              </>
            )}

            <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Operator Information</h3>
            <div className="form-row">
              <div><strong>Operator:</strong> {report.operator_name}</div>
              <div><strong>Company:</strong> {report.company}</div>
            </div>

            {report.status === 'rejected' && report.rejection_reason && (
              <>
                <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Rejection Reason</h3>
                <div className="alert alert-error">
                  {report.rejection_reason}
                </div>
              </>
            )}

            {canApprove && (
              <div className="form-actions mt-3">
                <button
                  onClick={() => {
                    setApprovalAction('approved');
                    setShowApprovalModal(true);
                  }}
                  className="btn btn-success"
                >
                  Approve Report
                </button>
                <button
                  onClick={() => {
                    setApprovalAction('rejected');
                    setShowApprovalModal(true);
                  }}
                  className="btn btn-danger"
                >
                  Reject Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showApprovalModal && (
        <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              {approvalAction === 'approved' ? 'Approve Report' : 'Reject Report'}
            </div>
            
            {approvalAction === 'rejected' && (
              <div className="form-group">
                <label className="form-label">Rejection Reason *</label>
                <textarea
                  className="form-textarea"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="4"
                  placeholder="Enter reason for rejection..."
                  required
                ></textarea>
              </div>
            )}

            <p>
              Are you sure you want to {approvalAction === 'approved' ? 'approve' : 'reject'} this report?
            </p>

            <div className="modal-actions">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleApproval}
                className={`btn ${approvalAction === 'approved' ? 'btn-success' : 'btn-danger'}`}
                disabled={approvalAction === 'rejected' && !rejectionReason}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportDetail;

