import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#004BAD] h-24 sticky top-0 z-50 rounded-full mt-6 mb-6 ml-10 mr-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/Logo.png"
              alt="M9ITUL"
              className="h-20 w-auto mt-8 object-contain"
            />
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <Link to="/profile" className="text-white">
                  Profile
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="text-white bg-[#004BAD] px-4 py-2 rounded-md ">
                    Admin
                  </Link>
                )}
                <span className="text-sm text-white hidden sm:inline">
                  {user?.name}
                </span>
                <button onClick={handleLogout} className="text-white bg-[#004BAD] px-4 py-2 rounded-md ">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-white mt-8 ">
                  Login
                </Link>
                <Link to="/register" className="text-[#004BAD] bg-white mt-8 px-4 py-2 rounded-md ">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
