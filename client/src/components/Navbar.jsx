import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'operator':
        return '/operator';
      case 'admin':
        return '/admin';
      case 'supervisor':
        return '/supervisor';
      default:
        return '/';
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to={getDashboardLink()} className="navbar-brand">
          🔧 Valve Test Suite
        </Link>
        <div className="navbar-nav">
          {user?.role === 'operator' && (
            <Link to="/operator" className="navbar-link">
              📊 Dashboard
            </Link>
          )}
          <div className="navbar-user">
            <div className="navbar-user-info">
              <div className="navbar-user-name">{user?.name}</div>
              <div className="navbar-user-role">
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} - {user?.company}
              </div>
            </div>
            <button onClick={handleLogout} className="navbar-logout">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

