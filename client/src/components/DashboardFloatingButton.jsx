import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardFloatingButton = () => {
  const { user } = useAuth();

  // Only show for operators
  if (user?.role !== 'operator') {
    return null;
  }

  return (
    <Link to="/operator" className="floating-dashboard-btn" title="Go to Dashboard">
      📊
    </Link>
  );
};

export default DashboardFloatingButton;
