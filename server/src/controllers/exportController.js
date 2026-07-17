import Recipe from '../models/Recipe.js';
import { generateRecipePDF } from '../utils/pdfExport.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import mongoose from 'mongoose';
import { getMealById, convertMealDBToRecipe } from '../services/mealdb.js';

export const exportRecipePDF = async (req, res, next) => {
  try {
    let recipe;
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);

    if (isObjectId) {
      recipe = await Recipe.findById(req.params.id);
    } else {
      // Try to fetch from TheMealDB if it is an external numerical ID
      const meal = await getMealById(req.params.id);
      if (meal) {
        recipe = convertMealDBToRecipe(meal);
      }
    }

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const { filepath, filename } = await generateRecipePDF(recipe);

    res.download(filepath, filename, (err) => {
      if (err) {
        logger.error('PDF download error', err);
      } else {
        // Clean up file after download
        setTimeout(() => {
          fs.unlink(filepath, () => {});
        }, 5000);
      }
    });
  } catch (error) {
    next(error);
  }
};

export const exportGroceryListCSV = async (req, res, next) => {
  try {
    const { recipeIds } = req.body;
    
    if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
      return res.status(400).json({ error: 'recipeIds array is required' });
    }

    const recipes = await Recipe.find({ _id: { $in: recipeIds } });
    const aggregated = {};

    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        const key = ing.name.toLowerCase();
        if (aggregated[key]) {
          aggregated[key].qty += ing.qty;
        } else {
          aggregated[key] = {
            name: ing.name,
            qty: ing.qty,
            unit: ing.unit,
          };
        }
      });
    });

    const csv = [
      'Ingredient,Quantity,Unit',
      ...Object.values(aggregated).map(item => 
        `"${item.name}",${item.qty},"${item.unit}"`
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=grocery-list.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

