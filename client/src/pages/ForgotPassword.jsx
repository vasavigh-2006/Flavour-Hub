import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../logo.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const { forgotPassword } = useAuth();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await forgotPassword(email);
    setLoading(false);
    if (result.success) {
      setSubmitted(true);
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
              Reset Password
            </h2>
            <p className="text-center text-premium-subtle text-sm">
              We'll help you get back to your recipes
            </p>
          </div>

          {!submitted ? (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-premium-subtle mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-premium"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-premium w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </button>
              </div>

              <div className="text-center">
                <Link
                  to="/login"
                  className="font-medium text-premium hover:text-orange-600 transition-colors duration-300"
                >
                  Back to login
                </Link>
              </div>
            </form>
          ) : (
            <div className="mt-8 text-center space-y-6">
              <div className="rounded-lg bg-orange-50/50 dark:bg-orange-950/20 p-4 border border-orange-500/10">
                <p className="text-premium text-sm leading-relaxed font-semibold">
                  If that email is registered, a password reset link has been generated!
                </p>
                <p className="text-premium-subtle text-xs mt-3 leading-relaxed">
                  Since email services are in development mode, please verify your reset link in the **Render backend logs** to complete the reset.
                </p>
              </div>
              <Link
                to="/login"
                className="btn-premium inline-block w-full text-center"
              >
                Return to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
