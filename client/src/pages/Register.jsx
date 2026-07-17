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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setLoading(true);
    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);
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
              Create your account
            </h2>
            <p className="text-center text-premium-subtle text-sm">
              Join our culinary community today
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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

            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-premium hover:text-orange-600 transition-colors duration-300"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;

