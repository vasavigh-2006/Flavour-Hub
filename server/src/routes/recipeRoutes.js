import express from 'express';
import {
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  likeRecipe,
  saveRecipe,
  unsaveRecipe,
  getSavedRecipes,
  checkIfRecipeSaved,
  commentRecipe,
} from '../controllers/recipeController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { parseFormData } from '../middleware/parseFormData.js';
import {
  createRecipeValidator,
  updateRecipeValidator,
  commentValidator,
} from '../validators/recipeValidator.js';

const router = express.Router();

router.get('/', getRecipes);
router.get('/saved', authenticate, getSavedRecipes);
router.get('/:id/saved', authenticate, checkIfRecipeSaved);
router.get('/:id', getRecipe);
router.post('/', authenticate, upload.array('images', 5), parseFormData, createRecipeValidator, createRecipe);
router.put('/:id', authenticate, upload.array('images', 5), parseFormData, updateRecipeValidator, updateRecipe);
router.delete('/:id', authenticate, deleteRecipe);
router.post('/:id/like', authenticate, likeRecipe);
router.post('/:id/save', authenticate, saveRecipe);
router.delete('/:id/save', authenticate, unsaveRecipe);
router.post('/:id/comment', authenticate, commentValidator, commentRecipe);

export default router;

