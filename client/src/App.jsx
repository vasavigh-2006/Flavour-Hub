import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import FoodBackground from './components/FoodBackground';
import Layout from './components/Layout';
import Home from './pages/Home';
import Discover from './pages/Discover';
import RecipeDetail from './pages/RecipeDetail';
import CreateRecipe from './pages/CreateRecipe';
import EditRecipe from './pages/EditRecipe';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
        <Router>
          {/* Global Food Background - Visible on ALL pages */}
          <FoodBackground />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="discover" element={<Discover />} />
              <Route path="recipes/:id" element={<RecipeDetail />} />
              <Route
                path="recipes/create"
                element={
                  <ProtectedRoute>
                    <CreateRecipe />
                  </ProtectedRoute>
                }
              />
              <Route
                path="recipes/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditRecipe />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
          <Toaster position="top-right" />
        </Router>
    </AuthProvider>
  );
}

export default App;


