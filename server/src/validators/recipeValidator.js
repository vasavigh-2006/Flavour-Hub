import { body } from 'express-validator';

export const createRecipeValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('ingredients').isArray().withMessage('Ingredients must be an array'),
  body('ingredients.*.name').trim().notEmpty().withMessage('Ingredient name is required'),
  body('ingredients.*.qty').optional().custom((value) => {
    // Allow empty, null, undefined, or a valid number
    if (value === '' || value === null || value === undefined) return true;
    if (typeof value === 'number' && !isNaN(value)) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    const num = parseFloat(value);
    return !isNaN(num);
  }).withMessage('Ingredient quantity must be a number if provided'),
  body('ingredients.*.unit').optional().trim(),
  body('steps').isArray({ min: 1 }).withMessage('At least one step is required'),
  body('steps.*').trim().notEmpty().withMessage('Step cannot be empty'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('cuisine').optional().trim(),
  body('category').optional().trim(),
  body('prepTime').optional().isInt({ min: 0 }).withMessage('Prep time must be a non-negative integer'),
  body('cookTime').optional().isInt({ min: 0 }).withMessage('Cook time must be a non-negative integer'),
  body('servings').optional().isInt({ min: 1 }).withMessage('Servings must be at least 1'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
];

export const updateRecipeValidator = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim(),
  body('ingredients').optional().isArray().withMessage('Ingredients must be an array'),
  body('ingredients.*.name').optional().trim().notEmpty().withMessage('Ingredient name cannot be empty if provided'),
  body('ingredients.*.qty').optional().custom((value) => {
    // Allow empty, null, undefined, or a valid number
    if (value === '' || value === null || value === undefined) return true;
    if (typeof value === 'number' && !isNaN(value)) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    const num = parseFloat(value);
    return !isNaN(num);
  }).withMessage('Ingredient quantity must be a number if provided'),
  body('ingredients.*.unit').optional().trim(),
  body('steps').optional().isArray({ min: 1 }).withMessage('Steps must be a non-empty array'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('prepTime').optional().isInt({ min: 0 }).withMessage('Prep time must be a non-negative integer'),
  body('cookTime').optional().isInt({ min: 0 }).withMessage('Cook time must be a non-negative integer'),
  body('servings').optional().isInt({ min: 1 }).withMessage('Servings must be at least 1'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
];

export const commentValidator = [
  body('text').trim().notEmpty().withMessage('Comment text is required'),
];

