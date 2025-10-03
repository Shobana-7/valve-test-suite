import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import OperatorDashboard from './pages/OperatorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import CreateReport from './pages/CreateReport';
import ViewReports from './pages/ViewReports';
import ReportDetail from './pages/ReportDetail';
import UserManagement from './pages/UserManagement';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/operator" element={
            <PrivateRoute allowedRoles={['operator']}>
              <OperatorDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/admin" element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/supervisor" element={
            <PrivateRoute allowedRoles={['supervisor']}>
              <SupervisorDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/reports/new" element={
            <PrivateRoute allowedRoles={['operator']}>
              <CreateReport />
            </PrivateRoute>
          } />
          
          <Route path="/reports" element={
            <PrivateRoute allowedRoles={['operator', 'admin', 'supervisor']}>
              <ViewReports />
            </PrivateRoute>
          } />
          
          <Route path="/reports/:id" element={
            <PrivateRoute allowedRoles={['operator', 'admin', 'supervisor']}>
              <ReportDetail />
            </PrivateRoute>
          } />
          
          <Route path="/users" element={
            <PrivateRoute allowedRoles={['admin']}>
              <UserManagement />
            </PrivateRoute>
          } />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

