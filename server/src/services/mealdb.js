import axios from 'axios';
import cache from '../utils/cache.js';
import logger from '../utils/logger.js';

const MEALDB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';
const CACHE_TTL = parseInt(process.env.MEALDB_TTL) || 3600;

export const getCategories = async () => {
  const cacheKey = 'mealdb:categories';
  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get(`${MEALDB_BASE_URL}/list.php?c=list`);
    const categories = response.data.meals || [];
    await cache.set(cacheKey, categories, CACHE_TTL);
    return categories;
  } catch (error) {
    logger.error('Error fetching MealDB categories', error);
    throw error;
  }
};

export const getMealById = async (mealId) => {
  const cacheKey = `mealdb:meal:${mealId}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get(`${MEALDB_BASE_URL}/lookup.php?i=${mealId}`);
    const meal = response.data.meals?.[0];
    if (meal) {
      await cache.set(cacheKey, meal, CACHE_TTL);
    }
    return meal;
  } catch (error) {
    logger.error('Error fetching MealDB meal', error);
    throw error;
  }
};

export const searchMeals = async (query) => {
  const cacheKey = `mealdb:search:${query}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get(`${MEALDB_BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
    const meals = response.data.meals || [];
    await cache.set(cacheKey, meals, CACHE_TTL);
    return meals;
  } catch (error) {
    logger.error('Error searching MealDB', error);
    throw error;
  }
};

export const searchByCategory = async (category) => {
  const cacheKey = `mealdb:category:${category}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get(`${MEALDB_BASE_URL}/filter.php?c=${encodeURIComponent(category)}`);
    const meals = response.data.meals || [];
    await cache.set(cacheKey, meals, CACHE_TTL);
    return meals;
  } catch (error) {
    logger.error('Error fetching MealDB by category', error);
    throw error;
  }
};

export const searchByCuisine = async (cuisine) => {
  const cacheKey = `mealdb:cuisine:${cuisine}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get(`${MEALDB_BASE_URL}/filter.php?a=${encodeURIComponent(cuisine)}`);
    const meals = response.data.meals || [];
    await cache.set(cacheKey, meals, CACHE_TTL);
    return meals;
  } catch (error) {
    logger.error('Error fetching MealDB by cuisine', error);
    throw error;
  }
};

// Get random meals from TheMealDB
export const getRandomMeals = async (count = 10) => {
  const cacheKey = `mealdb:random:${count}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // TheMealDB random endpoint returns 1 meal per call, so we need multiple calls
    // To avoid too many API calls, we'll fetch from popular categories instead
    const popularCategories = ['Chicken', 'Beef', 'Dessert', 'Vegetarian', 'Pasta', 'Seafood', 'Breakfast', 'Side'];
    const allMeals = [];
    
    // Fetch a few meals from each popular category
    for (const category of popularCategories.slice(0, Math.ceil(count / 5))) {
      try {
        const meals = await searchByCategory(category);
        allMeals.push(...meals.slice(0, 2)); // Take 2 from each category
        if (allMeals.length >= count) break;
      } catch (error) {
        logger.error(`Error fetching meals for category ${category}`, error);
      }
    }
    
    // Shuffle and limit
    const shuffled = allMeals.sort(() => 0.5 - Math.random());
    const result = shuffled.slice(0, count);
    
    // Cache for shorter time since it's "random"
    await cache.set(cacheKey, result, 1800); // 30 minutes
    return result;
  } catch (error) {
    logger.error('Error fetching random MealDB meals', error);
    throw error;
  }
};

// Smart instruction parser — handles TheMealDB's messy instruction formats
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

  // 1. Try splitting on numbered steps like "1." "Step 1:" "1)" at start of line or sentence
  const numberedPattern = /(?:^|\n|\r)\s*(?:step\s*)?\d+[.):]\s*/gi;
  const hasNumberedSteps = (raw.match(numberedPattern) || []).length >= 2;
  let parsed = [];

  if (hasNumberedSteps) {
    parsed = raw
      .split(numberedPattern)
      .map(s => s.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(s => s.length > 5 && !isStepHeader(s));
  } else {
    // 2. Try splitting on explicit newlines (some recipes use these properly)
    const byNewline = raw.split(/\r?\n/).map(s => s.trim()).filter(s => s.length > 2);
    if (byNewline.length >= 2) {
      parsed = byNewline.filter(s => !isStepHeader(s));
    } else {
      // 3. Fallback: split one big paragraph into sentences on '. '
      // Group short sentences together so no step is too brief
      const sentences = raw
        .replace(/([.!?])\s+(?=[A-Z])/g, '$1|||')
        .split('|||')
        .map(s => s.trim())
        .filter(s => s.length > 5);

      // Merge very short sentences (< 40 chars) with the next one
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

// Convert MealDB meal to our Recipe schema format
export const convertMealDBToRecipe = (meal) => {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      // Parse measure (e.g., "1 cup", "2 tbsp")
      const measureMatch = measure?.match(/(\d+(?:\.\d+)?)\s*(.+)/);
      const qty = measureMatch ? parseFloat(measureMatch[1]) : 1;
      const unit = measureMatch ? measureMatch[2].trim() : 'unit';
      
      ingredients.push({
        name: ingredient.trim(),
        qty,
        unit,
      });
    }
  }

  const steps = meal.strInstructions
    ? parseInstructions(meal.strInstructions)
    : [];

  return {
    source: 'mealdb',
    mealdbId: meal.idMeal,
    title: meal.strMeal,
    description: meal.strInstructions?.substring(0, 200) || '',
    ingredients,
    steps,
    tags: meal.strTags ? meal.strTags.split(',').map(t => t.trim()) : [],
    cuisine: meal.strArea || '',
    category: meal.strCategory || '',
    images: meal.strMealThumb ? [meal.strMealThumb] : [],
    isPublic: true,
  };
};

