import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import api from '../utils/api';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key');

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [myRecipes, setMyRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [savedRecipesLoading, setSavedRecipesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-recipes'); // 'my-recipes' or 'saved'
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  const handleSubscribe = async (planId) => {
    setLoading(true);
    try {
      const response = await api.post('/webhooks/stripe/create-checkout-session', { planId });
      const { sessionId } = response.data;
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error('Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    try {
      await api.post('/webhooks/stripe/cancel');
      toast.success('Subscription will be canceled at the end of the billing period');
      // Refresh user data
      const response = await api.get('/auth/me');
      updateUser(response.data.user);
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchMyRecipes = async () => {
      try {
        setRecipesLoading(true);
        // Fetch recipes - when logged in, this includes user's own recipes
        const response = await api.get('/recipes?limit=50&sort=newest');
        // Filter to show only recipes created by current user
        const userRecipes = response.data.recipes.filter(
          recipe => recipe.createdBy && recipe.createdBy._id === user?._id
        );
        setMyRecipes(userRecipes);
      } catch (error) {
        console.error('Failed to fetch recipes:', error);
        toast.error('Failed to load your recipes');
      } finally {
        setRecipesLoading(false);
      }
    };

    const fetchSavedRecipes = async () => {
      try {
        setSavedRecipesLoading(true);
        console.log('📋 [Profile] Fetching saved recipes for user:', user?.email);
        const response = await api.get('/recipes/saved');
        console.log('📋 [Profile] Received saved recipes:', response.data.savedRecipes?.length || 0);
        console.log('📋 [Profile] Full response:', response.data);
        if (response.data.savedRecipes && response.data.savedRecipes.length > 0) {
          console.log('📋 [Profile] First saved recipe sample:', response.data.savedRecipes[0]);
          response.data.savedRecipes.forEach((recipe, index) => {
            console.log(`📋 [Profile] Recipe ${index + 1}:`, {
              _id: recipe._id,
              mealdbId: recipe.mealdbId,
              recipeId: recipe.recipeId,
              title: recipe.title,
              source: recipe.source
            });
          });
        }
        setSavedRecipes(response.data.savedRecipes || []);
      } catch (error) {
        console.error('❌ [Profile] Failed to fetch saved recipes:', error);
        console.error('❌ [Profile] Error response:', error.response?.data);
        toast.error('Failed to load saved recipes');
      } finally {
        setSavedRecipesLoading(false);
      }
    };

    if (user) {
      fetchMyRecipes();
      fetchSavedRecipes();
    }
  }, [user]);

  const handleUnsave = async (recipe) => {
    try {
      // For TheMealDB recipes, use mealdbId; for MongoDB recipes, use _id
      const id = recipe.mealdbId || recipe._id;
      if (!id) {
        console.error('🗑️ [Profile] No valid ID found for recipe:', recipe);
        toast.error('Invalid recipe ID');
        return;
      }
      console.log('🗑️ [Profile] Attempting to unsave recipe:', id, 'Recipe:', recipe);
      await api.delete(`/recipes/${id}/save`);
      toast.success('Recipe unsaved');
      // Refresh saved recipes list
      const response = await api.get('/recipes/saved');
      console.log('🗑️ [Profile] Refreshed saved recipes:', response.data.savedRecipes?.length || 0);
      setSavedRecipes(response.data.savedRecipes || []);
    } catch (error) {
      console.error('🗑️ [Profile] Error unsaving recipe:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to unsave recipe';
      toast.error(errorMessage);
    }
  };

  const handleDeleteRecipe = async (recipeId) => {
    if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/recipes/${recipeId}`);
      toast.success('Recipe deleted successfully');
      // Refresh my recipes list
      const response = await api.get('/recipes?limit=50&sort=newest');
      const userRecipes = response.data.recipes.filter(
        recipe => recipe.createdBy && recipe.createdBy._id === user?._id
      );
      setMyRecipes(userRecipes);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete recipe';
      if (error.response?.status === 403) {
        toast.error('You are not authorized to delete this recipe');
      } else if (error.response?.status === 404) {
        toast.error('Recipe not found');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setProfileData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const response = await api.put('/auth/me', {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
      });
      updateUser(response.data.user);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
      <h1 className="text-3xl font-bold mb-6 text-premium animate-fade-in">Profile</h1>

      <div className="profile-section">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-premium">Account Information</h2>
          {!isEditing && (
            <button
              onClick={handleEditProfile}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
            >
              Edit Profile
            </button>
          )}
        </div>
        
        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-premium font-medium">
                Username
              </label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-premium font-medium">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-premium font-medium">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-premium focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-premium font-medium">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-premium focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={profileLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2 text-premium-subtle">
            <p><strong className="text-premium">Username:</strong> {user?.username}</p>
            <p><strong className="text-premium">Email:</strong> {user?.email}</p>
            <p><strong className="text-premium">Name:</strong> {user?.firstName} {user?.lastName}</p>
          </div>
        )}
      </div>

      <div className="profile-section">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('my-recipes')}
              className={`px-4 py-2 font-semibold ${
                activeTab === 'my-recipes'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              My Recipes
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 font-semibold ${
                activeTab === 'saved'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Saved Recipes
            </button>
          </div>
          <Link
            to="/recipes/create"
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
          >
            + Create Recipe
          </Link>
        </div>

        {/* My Recipes Tab */}
        {activeTab === 'my-recipes' && (
          <div>
            {recipesLoading ? (
              <p className="text-gray-600 dark:text-gray-400">Loading your recipes...</p>
            ) : myRecipes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">You haven't created any recipes yet.</p>
                <Link
                  to="/recipes/create"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 inline-block"
                >
                  Create Your First Recipe
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myRecipes.map((recipe, index) => (
                  <div
                    key={recipe._id}
                    className={`glass-card-hover p-4 relative stagger-item`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <Link
                      to={`/recipes/${recipe._id}`}
                      className="block"
                    >
                    {recipe.images && recipe.images.length > 0 ? (
                      <img
                        src={recipe.images[0]}
                        alt={recipe.title}
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-200 dark:bg-gray-600 rounded mb-2 flex items-center justify-center text-4xl">
                        🍳
                      </div>
                    )}
                    <h3 className="font-semibold text-premium mb-1 truncate">{recipe.title}</h3>
                    <p className="text-sm text-premium-subtle line-clamp-2">
                      {recipe.description || 'No description'}
                    </p>
                    <div className="mt-2 flex gap-2 text-xs text-premium-subtle">
                      {recipe.prepTime && <span>⏱️ {recipe.prepTime} min</span>}
                      {recipe.servings && <span>👥 {recipe.servings} servings</span>}
                    </div>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteRecipe(recipe._id);
                      }}
                      className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 hover:scale-110 transition-all duration-300 shadow-md"
                      title="Delete recipe"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Saved Recipes Tab */}
        {activeTab === 'saved' && (
          <div>
            {savedRecipesLoading ? (
              <p className="text-gray-600 dark:text-gray-400">Loading saved recipes...</p>
            ) : savedRecipes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">You haven't saved any recipes yet.</p>
                <Link
                  to="/discover"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 inline-block"
                >
                  Discover Recipes
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedRecipes.map((recipe, index) => (
                  <div
                    key={recipe.savedRecipeId || recipe._id}
                    className={`glass-card-hover p-4 relative stagger-item`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <Link to={`/recipes/${recipe._id || recipe.mealdbId}`}>
                      {recipe.images && recipe.images.length > 0 ? (
                        <img
                          src={recipe.images[0]}
                          alt={recipe.title}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-200 dark:bg-gray-600 rounded mb-2 flex items-center justify-center text-4xl">
                          🍳
                        </div>
                      )}
                      <h3 className="font-semibold text-premium mb-1 truncate">{recipe.title}</h3>
                      <p className="text-sm text-premium-subtle line-clamp-2">
                        {recipe.description || 'No description'}
                      </p>
                      <div className="mt-2 flex gap-2 text-xs text-premium-subtle">
                        {recipe.prepTime && <span>⏱️ {recipe.prepTime} min</span>}
                        {recipe.servings && <span>👥 {recipe.servings} servings</span>}
                      </div>
                    </Link>
                    <button
                      onClick={() => handleUnsave(recipe)}
                      className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 hover:scale-110 transition-all duration-300 shadow-md"
                      title="Unsave recipe"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="profile-section">
        <h2 className="text-xl font-semibold mb-4 text-premium">Subscription</h2>
        {user?.subscription?.planId === 'free' || !user?.subscription?.planId ? (
          <div className="text-gray-900 dark:text-gray-300">
            <p className="mb-4">You are currently on the Free plan.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Pro Plan - $9.99/month</h3>
                <ul className="text-sm space-y-1 mb-4">
                  <li>✓ Advanced generator</li>
                  <li>✓ Unlimited saves</li>
                  <li>✓ PDF export</li>
                </ul>
                <button
                  onClick={() => handleSubscribe('pro')}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Subscribe to Pro
                </button>
              </div>
              <div className="border p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Premium Plan - $19.99/month</h3>
                <ul className="text-sm space-y-1 mb-4">
                  <li>✓ Everything in Pro</li>
                  <li>✓ Nutrition macros</li>
                  <li>✓ Calendar sync</li>
                  <li>✓ Priority support</li>
                </ul>
                <button
                  onClick={() => handleSubscribe('premium')}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Subscribe to Premium
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-900 dark:text-gray-300">
            <p className="mb-2">
              <strong>Current Plan:</strong> {user.subscription.planId.charAt(0).toUpperCase() + user.subscription.planId.slice(1)}
            </p>
            <p className="mb-2">
              <strong>Status:</strong> {user.subscription.status}
            </p>
            {user.subscription.currentPeriodEnd && (
              <p className="mb-4">
                <strong>Renews:</strong>{' '}
                {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
            {!user.subscription.cancelAtPeriodEnd && (
              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Cancel Subscription
              </button>
            )}
            {user.subscription.cancelAtPeriodEnd && (
              <p className="text-yellow-600">Subscription will be canceled at the end of the billing period.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;


