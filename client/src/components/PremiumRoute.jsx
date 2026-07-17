import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const PremiumRoute = ({ children }) => {
  const { isAuthenticated, isPremium, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    toast.error('Please login to access premium features');
    return <Navigate to="/login" replace />;
  }

  if (!isPremium) {
    toast.error('Premium subscription required');
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export default PremiumRoute;


