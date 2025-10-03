import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DashboardFloatingButton from '../components/DashboardFloatingButton';
import { reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ViewReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    loadReports();
  }, [searchParams]);

  const loadReports = async () => {
    try {
      const params = {};
      const status = searchParams.get('status');
      if (status) params.status = status;

      const response = await reportsAPI.getAll(params);
      setReports(response.data.reports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      await reportsAPI.delete(id);
      loadReports();
    } catch (error) {
      alert('Failed to delete report');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
    };
    return `badge ${badges[status] || 'badge-secondary'}`;
  };

  const getResultBadge = (result) => {
    const badges = {
      pass: 'badge-success',
      fail: 'badge-danger',
      conditional: 'badge-warning',
    };
    return `badge ${badges[result] || 'badge-secondary'}`;
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

  return (
    <>
      <Navbar />
      <div className="dashboard">
        <div className="container">
          {user?.role === 'operator' && (
            <div className="breadcrumb mb-2">
              <Link to="/operator" className="breadcrumb-link">
                📊 Dashboard
              </Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">Test Reports</span>
            </div>
          )}

          <div className="flex-between mb-2">
            <h1 className="dashboard-title">Test Reports</h1>
            {user?.role === 'operator' && (
              <Link to="/reports/new" className="btn btn-primary">
                + New Report
              </Link>
            )}
          </div>

          <div className="card">
            {reports.length === 0 ? (
              <div className="text-center" style={{ padding: '40px' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No reports found</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Report #</th>
                      <th>Equipment No</th>
                      <th>Reference No</th>
                      <th>Test Date</th>
                      <th>Operator</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td>{report.report_number}</td>
                        <td>
                          {report.report_type === 'pop_test' ? (
                            report.equipment_no || 'N/A'
                          ) : (
                            report.valve_tag_number || 'N/A'
                          )}
                        </td>
                        <td>
                          {report.report_type === 'pop_test' ? (
                            report.ref_no || 'N/A'
                          ) : (
                            report.valve_manufacturer || 'N/A'
                          )}
                        </td>
                        <td>{new Date(report.test_date).toLocaleDateString()}</td>
                        <td>{report.operator_name}</td>
                        <td>
                          <span className={`badge ${report.report_type === 'pop_test' ? 'badge-primary' : 'badge-secondary'}`}>
                            {report.report_type === 'pop_test' ? 'POP Test' : 'Legacy'}
                          </span>
                        </td>
                        <td>
                          <span className={getStatusBadge(report.status)}>
                            {report.status}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <Link
                              to={`/reports/${report.id}`}
                              className="btn btn-primary"
                            >
                              View
                            </Link>
                            {user?.role === 'operator' && report.status === 'pending' && (
                              <button
                                onClick={() => handleDelete(report.id)}
                                className="btn btn-danger"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <DashboardFloatingButton />
    </>
  );
};

export default ViewReports;

