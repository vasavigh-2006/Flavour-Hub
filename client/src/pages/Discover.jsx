import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Discover = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    q: '',
    category: '',
    cuisine: '',
    page: 1,
  });
  const [pagination, setPagination] = useState(null);

  // Common cuisines from TheMealDB with food images
  const cuisines = [
    { name: 'American', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop' },
    { name: 'British', image: 'https://images.unsplash.com/photo-1556910103-2c727e94c371?w=400&h=400&fit=crop' },
    { name: 'Canadian', image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=400&fit=crop' },
    { name: 'Chinese', image: 'https://images.unsplash.com/photo-1563379091339-03246963d4c9?w=400&h=400&fit=crop' },
    { name: 'Croatian', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop' },
    { name: 'Dutch', image: 'https://images.unsplash.com/photo-1556910103-2c727e94c371?w=400&h=400&fit=crop' },
    { name: 'Egyptian', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop' },
    { name: 'Filipino', image: 'https://images.unsplash.com/photo-1563379091339-03246963d4c9?w=400&h=400&fit=crop' },
    { name: 'French', image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=400&fit=crop' },
    { name: 'Greek', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop' },
    { name: 'Indian', image: 'https://images.unsplash.com/photo-1563379091339-03246963d4c9?w=400&h=400&fit=crop' },
    { name: 'Irish', image: 'https://images.unsplash.com/photo-1556910103-2c727e94c371?w=400&h=400&fit=crop' },
    { name: 'Italian', image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=400&fit=crop' },
    { name: 'Jamaican', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop' },
    { name: 'Japanese', image: 'https://images.unsplash.com/photo-1563379091339-03246963d4c9?w=400&h=400&fit=crop' },
    { name: 'Kenyan', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop' },
    { name: 'Malaysian', image: 'https://images.unsplash.com/photo-1563379091339-03246963d4c9?w=400&h=400&fit=crop' },
    { name: 'Mexican', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop' },
    { name: 'Moroccan', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop' },
    { name: 'Polish', image: 'https://images.unsplash.com/photo-1556910103-2c727e94c371?w=400&h=400&fit=crop' },
    { name: 'Portuguese', image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=400&fit=crop' },
    { name: 'Russian', image: 'https://images.unsplash.com/photo-1556910103-2c727e94c371?w=400&h=400&fit=crop' },
    { name: 'Spanish', image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=400&fit=crop' },
    { name: 'Thai', image: 'https://images.unsplash.com/photo-1563379091339-03246963d4c9?w=400&h=400&fit=crop' },
    { name: 'Tunisian', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop' },
    { name: 'Turkish', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop' },
    { name: 'Vietnamese', image: 'https://images.unsplash.com/photo-1563379091339-03246963d4c9?w=400&h=400&fit=crop' },
  ];

  useEffect(() => {
    fetchCategories();
    fetchRecipes();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/external/mealdb/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.q) params.append('q', filters.q);
      if (filters.category) params.append('category', filters.category);
      if (filters.cuisine) params.append('cuisine', filters.cuisine);
      params.append('page', filters.page);
      params.append('limit', '20');

      const response = await api.get(`/recipes?${params}`);
      console.log('Recipes response:', response.data);
      const recipesList = response.data.recipes || [];
      console.log('Recipes list:', recipesList, 'Count:', recipesList.length);
      setRecipes(recipesList);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch recipes';
      toast.error(errorMessage);
      setRecipes([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Discover Recipes</h1>

      {/* Search Bar */}
      <div className="glass-card p-4 mb-6">
        <input
          type="text"
          placeholder="Search recipes by name, ingredients, or description (e.g., pasta, chicken, dessert)..."
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 1 })}
          className="input-premium w-full"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              fetchRecipes();
            }
          }}
        />
        {filters.q && (
          <p className="mt-2 text-sm text-gray-600 dark:text-white">
            Searching for: <span className="font-semibold">{filters.q}</span>
          </p>
        )}
        {(filters.category || filters.cuisine || filters.q) && (
          <button
            onClick={() => setFilters({ q: '', category: '', cuisine: '', page: 1 })}
            className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Categories Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-premium dark:text-white">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.strCategory}
              onClick={() => setFilters({ ...filters, category: cat.strCategory, cuisine: '', page: 1 })}
              className={`group relative glass-card-hover overflow-hidden ${
                filters.category === cat.strCategory
                  ? 'ring-2 ring-orange-500 bg-orange-50/50 dark:bg-orange-900/30'
                  : ''
              }`}
            >
              <div className="aspect-square relative">
                <img
                  src={`https://www.themealdb.com/images/category/${cat.strCategory}.png`}
                  alt={cat.strCategory}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300/cccccc/666666?text=' + cat.strCategory;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm text-center text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">
                  {cat.strCategory}
                </h3>
              </div>
              {filters.category === cat.strCategory && (
                <div className="absolute top-2 right-2 bg-primary-600 text-white rounded-full p-1.5 text-xs">
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Cuisines Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-premium dark:text-white">Explore by Cuisine</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {cuisines.map((cuisine) => (
            <button
              key={cuisine.name}
              onClick={() => setFilters({ ...filters, cuisine: cuisine.name, category: '', page: 1 })}
              className={`group relative glass-card-hover overflow-hidden ${
                filters.cuisine === cuisine.name
                  ? 'ring-2 ring-orange-500 bg-orange-50/50 dark:bg-orange-900/30'
                  : ''
              }`}
            >
              <div className="aspect-square relative">
                <img
                  src={cuisine.image}
                  alt={cuisine.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop&q=80`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm text-center text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">
                  {cuisine.name}
                </h3>
              </div>
              {filters.cuisine === cuisine.name && (
                <div className="absolute top-2 right-2 bg-primary-600 text-white rounded-full p-1.5 text-xs">
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters */}
      {(filters.category || filters.cuisine) && (
        <div className="mb-6 flex flex-wrap gap-2">
          {filters.category && (
            <span className="px-4 py-2 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-white rounded-full text-sm font-medium flex items-center gap-2">
              Category: {filters.category}
              <button
                onClick={() => setFilters({ ...filters, category: '', page: 1 })}
                className="hover:text-primary-600 dark:hover:text-primary-300"
              >
                ×
              </button>
            </span>
          )}
          {filters.cuisine && (
            <span className="px-4 py-2 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-white rounded-full text-sm font-medium flex items-center gap-2">
              Cuisine: {filters.cuisine}
              <button
                onClick={() => setFilters({ ...filters, cuisine: '', page: 1 })}
                className="hover:text-primary-600 dark:hover:text-primary-300"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* Recipes Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 text-premium-subtle dark:text-white">No recipes found</div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recipes.map((recipe, index) => (
              <Link
                key={recipe._id || recipe.mealdbId}
                to={`/recipes/${recipe._id || recipe.mealdbId}`}
                className={`recipe-card group stagger-item`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="w-full h-48 bg-gradient-to-br from-orange-200 to-amber-300 flex items-center justify-center overflow-hidden">
                  {recipe.images && recipe.images[0] ? (
                    <img
                      src={recipe.images[0]}
                      alt={recipe.title}
                      className="recipe-card-image"
                    />
                  ) : recipe.image ? (
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="recipe-card-image"
                    />
                  ) : (
                    <div className="text-6xl">🍳</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 text-premium dark:text-white line-clamp-1">{recipe.title}</h3>
                  <p className="text-sm text-premium-subtle dark:text-white line-clamp-2">
                    {recipe.description || 'Delicious recipe waiting for you!'}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-premium-subtle dark:text-white">
                      {recipe.createdBy?.username || 'TheMealDB'}
                    </span>
                    <span className="text-orange-600 dark:text-orange-400 font-medium">
                      ❤️ {recipe.likesCount || 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-4 py-2 border rounded-md disabled:opacity-50 text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-900 dark:text-white">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= pagination.pages}
                className="px-4 py-2 border rounded-md disabled:opacity-50 text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Discover;

