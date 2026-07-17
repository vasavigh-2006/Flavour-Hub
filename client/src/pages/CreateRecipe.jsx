import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CreateRecipe = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: [{ name: '', qty: '', unit: '' }],
    steps: [''],
    tags: [],
    cuisine: '',
    category: '',
    prepTime: '',
    cookTime: '',
    servings: '',
    isPublic: true,
  });
  const [imageUrls, setImageUrls] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/external/mealdb/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleIngredientChange = (idx, field, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[idx][field] = value;
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { name: '', qty: '', unit: '' }],
    });
  };

  const removeIngredient = (idx) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== idx),
    });
  };

  const handleStepChange = (idx, value) => {
    const newSteps = [...formData.steps];
    newSteps[idx] = value;
    setFormData({ ...formData, steps: newSteps });
  };

  const addStep = () => {
    setFormData({ ...formData, steps: [...formData.steps, ''] });
  };

  const removeStep = (idx) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== idx),
    });
  };

  const handleAddImageUrl = () => {
    const url = newImageUrl.trim();
    if (url && !imageUrls.includes(url)) {
      // Basic URL validation
      try {
        new URL(url);
        setImageUrls([...imageUrls, url]);
        setNewImageUrl('');
      } catch (e) {
        toast.error('Please enter a valid URL');
      }
    } else if (imageUrls.includes(url)) {
      toast.error('This image URL is already added');
    }
  };

  const handleRemoveImageUrl = (index) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const submitData = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === 'ingredients') {
        // Clean up ingredients - only include qty/unit if they have values
        const cleanedIngredients = formData.ingredients.map(ing => {
          const cleaned = { name: ing.name };
          if (ing.qty && ing.qty !== '') {
            cleaned.qty = typeof ing.qty === 'number' ? ing.qty : parseFloat(ing.qty) || 1;
          }
          if (ing.unit && ing.unit.trim() !== '') {
            cleaned.unit = ing.unit.trim();
          }
          return cleaned;
        });
        submitData.append(key, JSON.stringify(cleanedIngredients));
      } else if (key === 'steps' || key === 'tags') {
        submitData.append(key, JSON.stringify(formData[key]));
      } else if (key === 'cuisine' || key === 'category') {
        // Only append if not empty (optional fields)
        if (formData[key] && formData[key].trim()) {
          submitData.append(key, formData[key].trim());
        }
      } else if (key === 'prepTime' || key === 'cookTime' || key === 'servings') {
        // Only append if not empty
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      } else if (key === 'isPublic') {
        // Convert boolean to string for FormData
        submitData.append(key, formData[key] ? 'true' : 'false');
      } else {
        submitData.append(key, formData[key]);
      }
    });

    // Add image URLs as JSON array
    if (imageUrls.length > 0) {
      submitData.append('images', JSON.stringify(imageUrls));
    }

    // Validate required fields before submitting
    if (!formData.title || !formData.title.trim()) {
      toast.error('Recipe title is required');
      setLoading(false);
      return;
    }

    if (!formData.ingredients || formData.ingredients.length === 0 || 
        formData.ingredients.every(ing => !ing.name || !ing.name.trim())) {
      toast.error('At least one ingredient is required');
      setLoading(false);
      return;
    }

    if (!formData.steps || formData.steps.length === 0 || 
        formData.steps.every(step => !step || !step.trim())) {
      toast.error('At least one step is required');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/recipes', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.status === 201) {
        toast.success('Recipe created successfully!');
        navigate('/discover');
      } else {
        toast.error('Unexpected response from server');
      }
    } catch (error) {
      console.error('Recipe creation error:', error.response?.data || error.message);
      
      // Handle validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map(err => err.msg || err.message).join(', ');
        toast.error(`Validation error: ${errorMessages}`);
      } else if (error.response?.data?.details) {
        toast.error(`Error: ${error.response.data.details}`);
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.response?.status === 401) {
        toast.error('Please login to create recipes');
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('You are not authorized to create recipes');
      } else {
        toast.error(error.message || 'Failed to create recipe. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-sans">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-900 dark:text-white font-sans">Create Recipe</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <label className="block text-sm font-bold mb-2 text-gray-900 dark:text-white font-sans">Title *</label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-900 font-sans font-semibold"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <label className="block text-sm font-bold mb-2 text-gray-900 dark:text-white font-sans">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-900 font-sans font-semibold"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-bold text-gray-900 dark:text-white font-sans">Ingredients *</label>
            <button
              type="button"
              onClick={addIngredient}
              className="px-3 py-1 bg-primary-600 text-white rounded-md text-sm font-sans font-semibold"
            >
              Add Ingredient
            </button>
          </div>
          {formData.ingredients.map((ing, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                type="number"
                placeholder="Qty (optional)"
                value={ing.qty || ''}
                onChange={(e) => handleIngredientChange(idx, 'qty', e.target.value ? parseFloat(e.target.value) : '')}
                className="w-24 px-2 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 font-sans font-semibold"
              />
              <input
                type="text"
                placeholder="Unit (optional)"
                value={ing.unit || ''}
                onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                className="w-28 px-2 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 font-sans font-semibold"
              />
              <input
                type="text"
                placeholder="Ingredient name *"
                value={ing.name}
                onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                className="flex-1 px-2 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 font-sans font-semibold"
                required
              />
              <button
                type="button"
                onClick={() => removeIngredient(idx)}
                className="px-3 py-2 bg-red-600 text-white rounded-md font-sans font-semibold"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-bold text-gray-900 dark:text-white font-sans">Steps *</label>
            <button
              type="button"
              onClick={addStep}
              className="px-3 py-1 bg-primary-600 text-white rounded-md text-sm font-sans font-semibold"
            >
              Add Step
            </button>
          </div>
          {formData.steps.map((step, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-sans font-bold">
                {idx + 1}
              </span>
              <textarea
                value={step}
                onChange={(e) => handleStepChange(idx, e.target.value)}
                className="flex-1 px-2 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-900 font-sans font-semibold"
                rows="2"
                required
              />
              <button
                type="button"
                onClick={() => removeStep(idx)}
                className="px-3 py-2 bg-red-600 text-white rounded-md font-sans font-semibold"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <label className="block text-sm font-bold mb-2 text-gray-900 dark:text-white font-sans">
              Category <span className="text-gray-500 dark:text-white text-xs font-normal opacity-75">(optional)</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-900 font-sans font-semibold"
            >
              <option value="" className="dark:text-white">Select a category (optional)</option>
              {categories.map((cat) => (
                <option key={cat.strCategory} value={cat.strCategory} className="dark:text-white">
                  {cat.strCategory}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <label className="block text-sm font-bold mb-2 text-gray-900 dark:text-white font-sans">
              Cuisine <span className="text-gray-500 dark:text-white text-xs font-normal opacity-75">(optional)</span>
            </label>
            <input
              type="text"
              name="cuisine"
              value={formData.cuisine}
              onChange={handleChange}
              placeholder="e.g., Italian, Mexican, Indian..."
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 font-sans font-semibold"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <label className="block text-sm font-bold mb-2 text-gray-900 dark:text-white font-sans">Prep Time (min)</label>
            <input
              type="number"
              name="prepTime"
              value={formData.prepTime}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-900 font-sans font-semibold"
            />
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <label className="block text-sm font-bold mb-2 text-gray-900 dark:text-white font-sans">Cook Time (min)</label>
            <input
              type="number"
              name="cookTime"
              value={formData.cookTime}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-900 font-sans font-semibold"
            />
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <label className="block text-sm font-bold mb-2 text-gray-900 dark:text-white font-sans">Servings</label>
            <input
              type="number"
              name="servings"
              value={formData.servings}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-900 font-sans font-semibold"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <label className="block text-sm font-bold mb-2 text-gray-900 dark:text-white font-sans">Images</label>
          <div className="flex gap-2 mb-4">
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddImageUrl();
                }
              }}
              placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
              className="flex-1 px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400 font-sans font-semibold"
            />
            <button
              type="button"
              onClick={handleAddImageUrl}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-sans font-semibold"
            >
              Add URL
            </button>
          </div>
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img 
                    src={url} 
                    alt={`Preview ${idx + 1}`} 
                    className="w-full h-32 object-cover rounded"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EInvalid Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImageUrl(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/discover')}
            className="px-6 py-2 border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 font-sans font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 font-sans font-bold"
          >
            {loading ? 'Creating...' : 'Create Recipe'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRecipe;


