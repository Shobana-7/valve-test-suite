import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { reportsAPI } from '../services/api';

const OperatorDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await reportsAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
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

  return (
    <>
      <Navbar />
      <div className="dashboard">
        <div className="container">
          <div className="dashboard-header">
            <h1 className="dashboard-title">Operator Dashboard</h1>
            <p className="dashboard-subtitle">
              Manage your valve test reports and view statistics
            </p>
          </div>

          <div className="stats-grid">
            <div className="stat-card info">
              <div className="stat-label">Total Reports</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-label">Pending Approval</div>
              <div className="stat-value">{stats.pending}</div>
            </div>
            <div className="stat-card success">
              <div className="stat-label">Approved</div>
              <div className="stat-value">{stats.approved}</div>
            </div>
            <div className="stat-card danger">
              <div className="stat-label">Rejected</div>
              <div className="stat-value">{stats.rejected}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">Quick Actions</div>
            <div className="actions-grid">
              <Link to="/reports/new" className="action-card">
                <div className="action-icon">📝</div>
                <div className="action-title">New POP Test Report</div>
                <div className="action-description">
                  Create a new pressure safety valve test report
                </div>
              </Link>

              <Link to="/reports" className="action-card">
                <div className="action-icon">📊</div>
                <div className="action-title">View Reports</div>
                <div className="action-description">
                  View and manage your test reports
                </div>
              </Link>

              <Link to="/reports?status=pending" className="action-card">
                <div className="action-icon">⏳</div>
                <div className="action-title">Pending Reports</div>
                <div className="action-description">
                  View reports awaiting approval
                </div>
              </Link>

              <Link to="/reports?status=approved" className="action-card">
                <div className="action-icon">✅</div>
                <div className="action-title">Approved Reports</div>
                <div className="action-description">
                  View approved test reports
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OperatorDashboard;

