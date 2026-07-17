import { getCategories as fetchCategories, getMealById, searchMeals, searchByCategory, searchByCuisine, convertMealDBToRecipe } from '../services/mealdb.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await fetchCategories();
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

export const getMeal = async (req, res, next) => {
  try {
    const meal = await getMealById(req.params.id);
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    const recipe = convertMealDBToRecipe(meal);
    res.json({ recipe });
  } catch (error) {
    next(error);
  }
};

export const search = async (req, res, next) => {
  try {
    const { q, category, cuisine } = req.query;
    let meals = [];

    if (q) {
      meals = await searchMeals(q);
    } else if (category) {
      meals = await searchByCategory(category);
    } else if (cuisine) {
      meals = await searchByCuisine(cuisine);
    } else {
      return res.status(400).json({ error: 'Query parameter (q, category, or cuisine) is required' });
    }

    const recipes = meals.map(convertMealDBToRecipe);
    res.json({ recipes });
  } catch (error) {
    next(error);
  }
};

