import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const EditRecipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    try {
      const response = await api.get(`/recipes/${id}`);
      setFormData(response.data.recipe);
    } catch (error) {
      toast.error('Failed to fetch recipe');
      navigate('/discover');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const submitData = new FormData();
    submitData.append('title', formData.title);
    if (formData.description) submitData.append('description', formData.description);
    // Clean up ingredients - only include qty/unit if they have values
    const cleanedIngredients = (formData.ingredients || []).map(ing => {
      const cleaned = { name: ing.name };
      if (ing.qty && ing.qty !== '') {
        cleaned.qty = typeof ing.qty === 'number' ? ing.qty : parseFloat(ing.qty) || 1;
      }
      if (ing.unit && ing.unit.trim() !== '') {
        cleaned.unit = ing.unit.trim();
      }
      return cleaned;
    });
    submitData.append('ingredients', JSON.stringify(cleanedIngredients));
    submitData.append('steps', JSON.stringify(formData.steps || []));
    if (formData.tags) submitData.append('tags', JSON.stringify(formData.tags));
    if (formData.cuisine) submitData.append('cuisine', formData.cuisine);
    if (formData.category) submitData.append('category', formData.category);
    if (formData.prepTime) submitData.append('prepTime', formData.prepTime);
    if (formData.cookTime) submitData.append('cookTime', formData.cookTime);
    if (formData.servings) submitData.append('servings', formData.servings);
    if (formData.images) submitData.append('images', JSON.stringify(formData.images));
    submitData.append('isPublic', formData.isPublic !== undefined ? formData.isPublic : true);

    try {
      await api.put(`/recipes/${id}`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Recipe updated successfully!');
      navigate(`/recipes/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update recipe');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Recipe</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <label className="block text-sm font-medium mb-2">Title *</label>
          <input
            type="text"
            name="title"
            required
            value={formData.title || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows="4"
            className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium">Ingredients *</label>
            <button
              type="button"
              onClick={addIngredient}
              className="px-3 py-1 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700"
            >
              Add Ingredient
            </button>
          </div>
          {(formData.ingredients || []).map((ing, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                type="number"
                placeholder="Qty (optional)"
                value={ing.qty || ''}
                onChange={(e) => handleIngredientChange(idx, 'qty', e.target.value ? parseFloat(e.target.value) : '')}
                className="w-24 px-2 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
              />
              <input
                type="text"
                placeholder="Unit (optional)"
                value={ing.unit || ''}
                onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                className="w-28 px-2 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
              />
              <input
                type="text"
                placeholder="Ingredient name *"
                value={ing.name || ''}
                onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                className="flex-1 px-2 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => removeIngredient(idx)}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium">Steps *</label>
            <button
              type="button"
              onClick={addStep}
              className="px-3 py-1 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700"
            >
              Add Step
            </button>
          </div>
          {(formData.steps || []).map((step, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center">
                {idx + 1}
              </span>
              <textarea
                value={step || ''}
                onChange={(e) => handleStepChange(idx, e.target.value)}
                className="flex-1 px-2 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
                rows="2"
                required
              />
              <button
                type="button"
                onClick={() => removeStep(idx)}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <label className="block text-sm font-medium mb-2">Prep Time (min)</label>
            <input
              type="number"
              name="prepTime"
              value={formData.prepTime || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <label className="block text-sm font-medium mb-2">Cook Time (min)</label>
            <input
              type="number"
              name="cookTime"
              value={formData.cookTime || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <label className="block text-sm font-medium mb-2">Servings</label>
            <input
              type="number"
              name="servings"
              value={formData.servings || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/recipes/${id}`)}
            className="px-6 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditRecipe;

