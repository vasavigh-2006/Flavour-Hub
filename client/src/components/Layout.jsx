import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import logo from '../logo.png';

const Layout = () => {
  const { user, isAuthenticated, isPremium, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen relative z-10">
      <nav className="glass-card sticky top-0 z-50 mx-4 mt-4 mb-6 shadow-xl backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link 
                to="/" 
                className="flex items-center gap-2 px-2 py-2 text-xl font-bold text-premium hover:scale-105 transition-transform duration-300"
              >
                <img
                  id="navbar-logo"
                  src={logo}
                  alt="FlavourHub Logo"
                  className="h-12 w-12 object-contain rounded-lg"
                />
                <span className="bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">
                  FlavourHub
                </span>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                <Link
                  to="/discover"
                  className="nav-link-premium"
                >
                  Discover
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/recipes/create"
                    className="nav-link-premium"
                  >
                    Create Recipe
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg text-premium hover:bg-white/20 dark:hover:bg-gray-700/20 transition-all duration-300 hover:scale-110"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              {isAuthenticated ? (
                <>
                  {isPremium && (
                    <span className="px-3 py-1 text-xs font-semibold text-amber-600 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-full shadow-md">
                      ⭐ Premium
                    </span>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="nav-link-premium"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-premium hover:bg-white/20 dark:hover:bg-gray-700/20 transition-all duration-300 hover:scale-105"
                  >
                    {user?.avatarUrl && (
                      <img
                        src={user.avatarUrl}
                        alt={user.username}
                        className="w-8 h-8 rounded-full ring-2 ring-white/50"
                      />
                    )}
                    <span className="font-medium">{user?.username}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-premium hover:bg-white/20 dark:hover:bg-gray-700/20 rounded-lg transition-all duration-300 hover:scale-105"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="nav-link-premium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn-premium text-sm"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="relative z-10">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

