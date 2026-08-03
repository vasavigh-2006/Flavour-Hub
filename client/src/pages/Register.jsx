import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../logo.png';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    dob: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);
    setLoading(false);
    if (result.success) {
      navigate('/login?registered=true');
    } else {
      setError(result.error || 'Registration failed. Please check your inputs.');
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
              Create your account
            </h2>
            <p className="text-center text-premium-subtle text-sm">
              Join our culinary community today
            </p>
          </div>
          {(
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-premium-subtle mb-2">First Name</label>
                    <input
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="input-premium"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-premium-subtle mb-2">Last Name</label>
                    <input
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="input-premium"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-premium-subtle mb-2">Username</label>
                  <input
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="input-premium"
                    placeholder="johndoe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-premium-subtle mb-2">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="input-premium"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-premium-subtle mb-2">Date of Birth</label>
                  <input
                    name="dob"
                    type="date"
                    required
                    value={formData.dob}
                    onChange={handleChange}
                    className="input-premium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-premium-subtle mb-2">Password</label>
                  <input
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="input-premium"
                    placeholder="Create a password"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Must be at least 8 chars with 1 uppercase, 1 lowercase, and 1 number (e.g. Password123).
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-premium-subtle mb-2">Confirm Password</label>
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input-premium"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-premium w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating account...' : 'Sign up'}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                <span className="text-xs text-gray-400 dark:text-gray-500">OR</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>

              {/* Google Sign Up */}
              <a
                href={`${import.meta.env.VITE_API_URL}/auth/google`}
                className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </a>

              <div className="text-center">
                <Link
                  to="/login"
                  className="font-medium text-premium hover:text-orange-600 transition-colors duration-300"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;

