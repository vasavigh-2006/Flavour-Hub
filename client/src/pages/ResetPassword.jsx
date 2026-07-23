import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../logo.png';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      alert('Reset token is missing from the URL.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await resetPassword(token, password);
    setLoading(false);

    if (result.success) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      {/* Home button */}
      <Link
        to="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-md hover:scale-105 transition-all duration-300 text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        🏠 Home
      </Link>
      {/* Dark mode toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-md hover:scale-110 transition-all duration-300 text-xl"
        title="Toggle dark mode"
      >
        {darkMode ? '☀️' : '🌙'}
      </button>

      <div className="max-w-md w-full space-y-8 animate-fade-in">
        <div className="glass-card p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <img
              src={logo}
              alt="FlavourHub Logo"
              className="h-16 w-16 object-contain rounded-xl shadow-md ring-2 ring-orange-500/10 mb-4"
            />
            <h2 className="text-center text-3xl font-extrabold text-premium mb-2">
              New Password
            </h2>
            <p className="text-center text-premium-subtle text-sm">
              Please enter your new password below
            </p>
          </div>

          {!token ? (
            <div className="rounded-lg bg-red-50/50 dark:bg-red-950/20 p-4 border border-red-500/10 text-center">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                Invalid or missing password reset token.
              </p>
              <p className="text-premium-subtle text-xs mt-2">
                Please request a new password reset link from the login page.
              </p>
              <Link
                to="/forgot-password"
                className="btn-premium inline-block w-full text-center mt-4"
              >
                Go to Reset Request
              </Link>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-premium-subtle mb-2">
                    New Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-premium"
                    placeholder="Min 8 chars, 1 upper, 1 lower, 1 num"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-premium-subtle mb-2">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-premium"
                    placeholder="Confirm your new password"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-premium w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating password...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
