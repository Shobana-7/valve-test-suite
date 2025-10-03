import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { reportsAPI } from '../services/api';

const SupervisorDashboard = () => {
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
            <h1 className="dashboard-title">Supervisor Dashboard</h1>
            <p className="dashboard-subtitle">
              Review and approve test reports
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
              <Link to="/reports?status=pending" className="action-card">
                <div className="action-icon">⏳</div>
                <div className="action-title">Pending Approvals</div>
                <div className="action-description">
                  Review and approve pending reports
                </div>
              </Link>

              <Link to="/reports" className="action-card">
                <div className="action-icon">📊</div>
                <div className="action-title">All Reports</div>
                <div className="action-description">
                  View all test reports
                </div>
              </Link>

              <Link to="/reports?status=approved" className="action-card">
                <div className="action-icon">✅</div>
                <div className="action-title">Approved Reports</div>
                <div className="action-description">
                  View all approved test reports
                </div>
              </Link>

              <Link to="/reports?status=rejected" className="action-card">
                <div className="action-icon">❌</div>
                <div className="action-title">Rejected Reports</div>
                <div className="action-description">
                  View rejected test reports
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SupervisorDashboard;

