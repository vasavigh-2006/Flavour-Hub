import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

// Smart parser: splits TheMealDB's messy instruction text into clean steps
const parseInstructions = (raw) => {
  if (!raw || !raw.trim()) return [];

  // Helper to identify and discard useless step headers like "Step 1", "Step 2", "1." etc.
  const isStepHeader = (str) => {
    const s = str.trim().toLowerCase();
    return (
      /^(?:step\s*)?\d+[:.)]?$/.test(s) ||
      /^step\s*\d+$/i.test(s) ||
      s === 'step'
    );
  };

  // 1. Numbered steps like "1." "Step 1:" "1)"
  const numberedPattern = /(?:^|\n|\r)\s*(?:step\s*)?\d+[.):]\s*/gi;
  const hasNumberedSteps = (raw.match(numberedPattern) || []).length >= 2;
  let parsed = [];

  if (hasNumberedSteps) {
    parsed = raw
      .split(numberedPattern)
      .map(s => s.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(s => s.length > 5 && !isStepHeader(s));
  } else {
    // 2. Proper newlines
    const byNewline = raw.split(/\r?\n/).map(s => s.trim()).filter(s => s.length > 2);
    if (byNewline.length >= 2) {
      parsed = byNewline.filter(s => !isStepHeader(s));
    } else {
      // 3. Split giant paragraph on sentence endings before capital letters
      const sentences = raw
        .replace(/([.!?])\s+(?=[A-Z])/g, '$1|||')
        .split('|||')
        .map(s => s.trim())
        .filter(s => s.length > 5);

      // Merge very short sentences so steps are meaningful
      const merged = [];
      let buffer = '';
      for (const sentence of sentences) {
        if (buffer && (buffer.length + sentence.length) < 120) {
          buffer += ' ' + sentence;
        } else {
          if (buffer) merged.push(buffer);
          buffer = sentence;
        }
      }
      if (buffer) merged.push(buffer);
      parsed = merged;
    }
  }

  return parsed.filter(s => s.trim().length > 0 && !isStepHeader(s));
};

const RecipeDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isMealDBRecipe, setIsMealDBRecipe] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Reset saved status when recipe ID changes
    setIsSaved(false);
    fetchRecipe();
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && recipe) {
      // Only check saved status after recipe is loaded
      // Add small delay to ensure recipe data is fully loaded
      const timer = setTimeout(() => {
        checkIfSaved();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsSaved(false);
    }
  }, [id, isAuthenticated, recipe]);

  const checkIfSaved = async () => {
    if (!isAuthenticated) {
      setIsSaved(false);
      return;
    }
    if (!id) {
      console.warn('No recipe ID to check saved status');
      setIsSaved(false);
      return;
    }
    try {
      console.log('🔍 [Frontend] Checking saved status for recipe ID:', id);
      // Use the new endpoint to check if this specific recipe is saved
      const response = await api.get(`/recipes/${id}/saved`);
      const isSaved = response.data.isSaved || false;
      
      console.log('🔍 [Frontend] Response from server:', response.data);
      console.log('🔍 [Frontend] Final saved status:', id, '→', isSaved ? 'SAVED ✅' : 'NOT SAVED ❌');
      setIsSaved(isSaved);
    } catch (error) {
      console.error('❌ [Frontend] Error checking saved status:', error);
      console.error('❌ [Frontend] Error response:', error.response?.data);
      // If error, assume not saved
      setIsSaved(false);
    }
  };


  const fetchRecipe = async () => {
    try {
      const response = await api.get(`/recipes/${id}`);
      let recipeData = response.data.recipe;

      // Check if it's a TheMealDB recipe
      const isMealDB = recipeData.isMealDB || recipeData.mealdbId || (!recipeData.createdBy && !recipeData._id);
      setIsMealDBRecipe(isMealDB);

      // If MealDB recipe has poor/missing steps, fetch fresh full data from TheMealDB
      const poorSteps = !recipeData.steps || recipeData.steps.length === 0 ||
        (recipeData.steps.length === 1 && recipeData.steps[0].trim().length < 80);
      if (isMealDB && poorSteps && recipeData.mealdbId) {
        try {
          const freshRes = await api.get(`/external/mealdb/meals/${recipeData.mealdbId}`);
          const freshRecipe = freshRes.data.recipe;
          if (freshRecipe && freshRecipe.steps && freshRecipe.steps.length > 1) {
            recipeData = { ...recipeData, steps: freshRecipe.steps };
          }
        } catch (e) {
          console.warn('Could not refresh MealDB instructions:', e.message);
        }
      }

      setRecipe(recipeData);

      // TheMealDB recipes don't have createdBy, so skip owner check
      if (recipeData.createdBy) {
        const recipeCreatorId = recipeData.createdBy._id || recipeData.createdBy.id;
        const currentUserId = user?._id || user?.id;
        setIsOwner(user && recipeCreatorId && currentUserId && String(recipeCreatorId) === String(currentUserId));
      } else {
        setIsOwner(false);
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch recipe');
      navigate('/discover');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to like recipes');
      return;
    }
    try {
      await api.post(`/recipes/${id}/like`);
      setRecipe((prev) => ({ ...prev, likesCount: (prev.likesCount || 0) + 1 }));
      toast.success('Recipe liked!');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message;
      if (error.response?.status === 400) {
        toast.error(errorMessage || 'Cannot like this recipe');
      } else {
        toast.error(errorMessage || 'Failed to like recipe');
      }
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to save recipes');
      return;
    }
    if (!id) {
      toast.error('Invalid recipe ID');
      return;
    }
    try {
      console.log('💾 [Frontend] handleSave called for recipe:', id, 'isSaved:', isSaved);
      if (isSaved) {
        // Unsave
        console.log('💾 [Frontend] Attempting to unsave recipe:', id);
        await api.delete(`/recipes/${id}/save`);
        toast.success('Recipe unsaved');
        setIsSaved(false);
        // Refresh saved status after a delay
        setTimeout(() => {
          console.log('💾 [Frontend] Refreshing saved status after unsave');
          checkIfSaved();
        }, 500);
      } else {
        // Save
        console.log('💾 [Frontend] Attempting to save recipe:', id);
        const response = await api.post(`/recipes/${id}/save`);
        console.log('💾 [Frontend] Save response:', response);
        console.log('💾 [Frontend] Save response.data:', response.data);
        
        // Always show success message if we get a 200 response
        if (response.status === 200 || response.status === 201) {
          const message = response.data?.message || 'Recipe saved successfully!';
          console.log('💾 [Frontend] Showing success message:', message);
          toast.success(message);
          setIsSaved(true);
          
          // Refresh saved status after a delay
          setTimeout(() => {
            console.log('💾 [Frontend] Refreshing saved status after save');
            checkIfSaved();
          }, 500);
        } else {
          console.error('💾 [Frontend] Unexpected response status:', response.status);
          toast.error('Failed to save recipe - unexpected response');
        }
      }
    } catch (error) {
      console.error('❌ [Frontend] Error in handleSave:', error);
      console.error('❌ [Frontend] Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.response?.data?.message;
      if (error.response?.status === 400 && errorMessage?.includes('already saved')) {
        // Recipe is already saved, update UI
        console.log('💾 [Frontend] Recipe already saved, updating UI');
        setIsSaved(true);
        toast('Recipe is already saved', { icon: 'ℹ️' });
        checkIfSaved();
      } else if (error.response?.status === 400) {
        toast.error(errorMessage || 'Cannot save this recipe');
      } else if (error.response?.status === 404) {
        toast.error('Recipe not found');
      } else {
        toast.error(errorMessage || 'Failed to save recipe');
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to download recipes');
      return;
    }
    try {
      toast.loading('Generating PDF...', { id: 'pdf-download' });
      // Fetch the file from the backend endpoint as a blob
      const response = await api.get(`/export/recipe/${id}/pdf`, {
        responseType: 'blob',
      });
      
      // Create a temporary link element to trigger the download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${recipe?.title || 'recipe'}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully!', { id: 'pdf-download' });
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download recipe PDF', { id: 'pdf-download' });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/recipes/${id}`);
      toast.success('Recipe deleted successfully');
      navigate('/discover');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message;
      if (error.response?.status === 403) {
        toast.error('You are not authorized to delete this recipe');
      } else if (error.response?.status === 404) {
        toast.error('Recipe not found');
      } else {
        toast.error(errorMessage || 'Failed to delete recipe');
      }
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await api.post(`/recipes/${id}/comment`, { text: commentText });
      setCommentText('');
      toast.success('Comment posted!');
      fetchRecipe();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message;
      if (error.response?.status === 400) {
        toast.error(errorMessage || 'Cannot comment on this recipe');
      } else {
        toast.error(errorMessage || 'Failed to post comment');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Image */}
      {recipe.images && recipe.images[0] && (
        <div className="relative h-96 mb-8 rounded-lg overflow-hidden">
          <img
            src={recipe.images[0]}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Recipe Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">{recipe.title}</h1>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-white">
            {recipe.prepTime && <span>Prep: {recipe.prepTime} min</span>}
            {recipe.cookTime && <span>Cook: {recipe.cookTime} min</span>}
            {recipe.servings && <span>Serves: {recipe.servings}</span>}
            {recipe.cuisine && <span>{recipe.cuisine}</span>}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              disabled={isMealDBRecipe || !isAuthenticated}
              title={
                !isAuthenticated
                  ? 'Please login to like recipes'
                  : isMealDBRecipe
                  ? 'Cannot like external recipes from TheMealDB'
                  : 'Like this recipe'
              }
              className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                isMealDBRecipe || !isAuthenticated
                  ? 'bg-gray-100 dark:bg-gray-700 opacity-60 cursor-not-allowed'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>❤️</span>
              <span>{recipe.likesCount || 0}</span>
            </button>
            {isAuthenticated && (
            <button
              onClick={handleSave}
                title={isSaved ? 'Unsave this recipe' : 'Save this recipe'}
                className={`px-4 py-2 rounded-md ${
                  isSaved
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {isSaved ? '💾 Saved' : '💾 Save'}
              </button>
            )}
            {isAuthenticated && (
              <button
                onClick={handleDownloadPDF}
                title="Download recipe as PDF"
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-md flex items-center gap-1.5 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
              >
                📥 Download PDF
              </button>
            )}
            {!isAuthenticated && (
              <Link
                to="/login"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                title="Login to save recipes"
            >
                💾 Save
              </Link>
            )}
            {isOwner && (
              <>
                <Link
                  to={`/recipes/${id}/edit`}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  🗑️ Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Contributor Card */}
        {recipe.createdBy && (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
            <div className="flex items-center space-x-3">
              {recipe.createdBy.avatarUrl && (
                <img
                  src={recipe.createdBy.avatarUrl}
                  alt={recipe.createdBy.username}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {recipe.createdBy.firstName} {recipe.createdBy.lastName}
                </p>
                <p className="text-sm text-gray-600 dark:text-white">
                  @{recipe.createdBy.username}
                </p>
              </div>
            </div>
          </div>
        )}

        {recipe.description && (
          <p className="text-gray-700 dark:text-white mb-4">{recipe.description}</p>
        )}
      </div>

      {/* Ingredients */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Ingredients</h2>
        <ul className="space-y-2 list-disc list-inside">
          {recipe.ingredients && recipe.ingredients.length > 0 ? recipe.ingredients.map((ing, idx) => (
            <li key={idx} className="text-gray-900 dark:text-white">
              {ing.qty || ''} {ing.unit || ''} {ing.name || ''}
            </li>
          )) : (
            <li className="text-gray-500 dark:text-white">No ingredients listed</li>
          )}
        </ul>
      </div>

      {/* Instructions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Instructions</h2>
        </div>
        {(() => {
          let displaySteps = recipe.steps && recipe.steps.length > 0 ? recipe.steps : [];
          const singleVague = displaySteps.length === 1 && displaySteps[0].trim().length < 80;
          if ((displaySteps.length === 0 || singleVague) && recipe.description) {
            const reparsed = parseInstructions(recipe.description);
            if (reparsed.length > 1) displaySteps = reparsed;
          }

          const isLimitedInstructions = displaySteps.length === 0 ||
            (displaySteps.length === 1 && displaySteps[0].trim().length < 80);

          if (isLimitedInstructions && isMealDBRecipe) {
            return (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">📖</div>
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
                  Limited Instructions Available
                </h3>
                <p className="text-orange-700 dark:text-orange-300 mb-4 text-sm">
                  TheMealDB only provides minimal instructions for this recipe.
                  Visit the original source for the full cooking guide.
                </p>
                {recipe.mealdbId && (
                  <a
                    href={`https://www.themealdb.com/meal/${recipe.mealdbId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    🌐 View Full Recipe on TheMealDB
                  </a>
                )}
              </div>
            );
          }

          return (
            <ol className="space-y-4">
              {displaySteps.map((step, idx) => (
                <li key={idx} className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold mr-4">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-gray-900 dark:text-white">{step}</span>
                </li>
              ))}
            </ol>
          );
        })()}
      </div>

      {/* Comments */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Comments</h2>
        {isMealDBRecipe && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg mb-4">
            <p className="text-yellow-800 dark:text-yellow-200 italic">
              ⚠️ Comments are not available for external recipes from TheMealDB.
            </p>
          </div>
        )}
        {!isAuthenticated && !isMealDBRecipe && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-4">
            <p className="text-blue-800 dark:text-blue-200 mb-2">
              💬 Please <Link to="/login" className="underline font-semibold">login</Link> to comment on recipes.
            </p>
          </div>
        )}
        {isAuthenticated && !isMealDBRecipe && (
          <form onSubmit={handleComment} className="mb-6">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-4 py-2 border rounded-md mb-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400"
              rows="3"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Post Comment
            </button>
          </form>
        )}
        <div className="space-y-4">
          {recipe.comments && recipe.comments.length > 0 ? (
            recipe.comments.map((comment, idx) => comment && (
              <div key={idx} className="border-b pb-4">
                <div className="flex items-center space-x-2 mb-2">
                  {comment.userId?.avatarUrl && (
                    <img
                      src={comment.userId.avatarUrl}
                      alt={comment.userId.username}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="font-semibold text-gray-900 dark:text-white">{comment.userId?.username || 'Anonymous'}</span>
                </div>
                <p className="text-gray-900 dark:text-white">{comment.text || ''}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-white">No comments yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;

