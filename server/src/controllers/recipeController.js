import Recipe from '../models/Recipe.js';
import SavedRecipe from '../models/SavedRecipe.js';
import { validationResult } from 'express-validator';
import logger from '../utils/logger.js';
import { searchByCategory, searchByCuisine, convertMealDBToRecipe, getMealById, getRandomMeals } from '../services/mealdb.js';

export const getRecipes = async (req, res, next) => {
  try {
    const {
      q,
      category,
      cuisine,
      diet,
      page = 1,
      limit = 20,
      sort = 'createdAt',
    } = req.query;

    const query = {};

    // Text search - search in title, description, and ingredients
    if (q) {
      const searchRegex = new RegExp(q, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } },
        { 'ingredients.name': searchRegex },
      ];
    }

    // Filters
    if (category) query.category = new RegExp(category, 'i');
    if (cuisine) query.cuisine = new RegExp(cuisine, 'i');
    if (diet) query.tags = { $in: [new RegExp(diet, 'i')] };

    // Public recipes or user's own recipes
    if (!req.user) {
      query.isPublic = true;
    } else {
      // For authenticated users, show public recipes or their own recipes
      const visibilityQuery = {
        $or: [
          { isPublic: true },
          { createdBy: req.user._id },
        ],
      };
      
      if (q) {
        // If searching, combine search conditions with visibility using $and
        query.$and = [
          { $or: query.$or },
          visibilityQuery,
        ];
        delete query.$or; // Remove the old $or since we're using $and now
      } else {
        // No search, just use visibility query
        Object.assign(query, visibilityQuery);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    
    if (sort === 'popularity') {
      sortOptions.likesCount = -1;
      sortOptions.savesCount = -1;
    } else if (sort === 'newest') {
      sortOptions.createdAt = -1;
    } else {
      sortOptions[sort] = -1;
    }

    const userRecipes = await Recipe.find(query)
      .populate('createdBy', 'username firstName lastName avatarUrl')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Fetch TheMealDB recipes
    let mealdbRecipes = [];
    
    if (q) {
      // Search TheMealDB when search query is provided
      try {
        const { searchMeals } = await import('../services/mealdb.js');
        const meals = await searchMeals(q);
        if (meals && Array.isArray(meals)) {
          mealdbRecipes = meals
            .filter(meal => meal && meal.idMeal)
            .map(convertMealDBToRecipe)
            .filter(recipe => {
              // Filter by search term in title, description, or ingredients
              const searchLower = q.toLowerCase();
              return (
                recipe.title?.toLowerCase().includes(searchLower) ||
                recipe.description?.toLowerCase().includes(searchLower) ||
                recipe.ingredients?.some(ing => 
                  ing.name?.toLowerCase().includes(searchLower)
                )
              );
            });
          // Limit TheMealDB search results
          mealdbRecipes = mealdbRecipes.slice(0, 20);
        }
        logger.info(`[Recipe Search] Found ${mealdbRecipes.length} TheMealDB recipes for query: ${q}`);
      } catch (error) {
        logger.error('Error searching MealDB recipes', error);
      }
    } else if (category && !q) {
      // Fetch from TheMealDB if category filter is used (not text search)
      try {
        const meals = await searchByCategory(category);
        mealdbRecipes = meals.map(convertMealDBToRecipe);
        // Limit TheMealDB results
        mealdbRecipes = mealdbRecipes.slice(0, 10);
      } catch (error) {
        logger.error('Error fetching MealDB recipes by category', error);
      }
    } else if (cuisine && !q) {
      // Fetch from TheMealDB if cuisine filter is used (not text search)
      try {
        const meals = await searchByCuisine(cuisine);
        mealdbRecipes = meals.map(convertMealDBToRecipe);
        // Limit TheMealDB results
        mealdbRecipes = mealdbRecipes.slice(0, 10);
      } catch (error) {
        logger.error('Error fetching MealDB recipes by cuisine', error);
      }
    } else if (!q && !category && !cuisine) {
      // No filters applied - fetch random meals from TheMealDB
      try {
        const meals = await getRandomMeals(15); // Get 15 random meals
        mealdbRecipes = meals.map(convertMealDBToRecipe);
      } catch (error) {
        logger.error('Error fetching random MealDB recipes', error);
      }
    }

    // Combine user recipes and TheMealDB recipes
    const allRecipes = [
      ...userRecipes.map(r => r.toObject()),
      ...mealdbRecipes,
    ];

    const total = allRecipes.length;

    res.json({
      recipes: allRecipes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRecipe = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if it's a valid MongoDB ObjectId (24 hex characters)
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let recipe;
    
    if (isMongoId) {
      // Try to find in database
      recipe = await Recipe.findById(id)
      .populate('createdBy', 'username firstName lastName avatarUrl')
      .populate('comments.userId', 'username firstName lastName avatarUrl');

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Check access
    if (!recipe.isPublic && (!req.user || recipe.createdBy._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ error: 'Access denied' });
      }
    } else {
      // It's a TheMealDB ID, fetch from TheMealDB API
      try {
        const meal = await getMealById(id);
        if (!meal) {
          return res.status(404).json({ error: 'Recipe not found' });
        }
        recipe = convertMealDBToRecipe(meal);
        // Add a flag to indicate it's from TheMealDB
        recipe.isMealDB = true;
      } catch (error) {
        logger.error('Error fetching MealDB recipe', error);
        return res.status(404).json({ error: 'Recipe not found' });
      }
    }

    res.json({ recipe });
  } catch (error) {
    next(error);
  }
};

export const createRecipe = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      ingredients: ingredientsRaw,
      steps: stepsRaw,
      tags: tagsRaw,
      cuisine,
      category,
      prepTime,
      cookTime,
      servings,
      images,
      nutrition,
      isPublic,
    } = req.body;

    // Parse JSON strings if needed (from FormData)
    let ingredients = ingredientsRaw;
    let steps = stepsRaw;
    let tags = tagsRaw;
    
    if (typeof ingredientsRaw === 'string') {
      try {
        ingredients = JSON.parse(ingredientsRaw);
      } catch (e) {
        ingredients = [];
      }
    }
    if (typeof stepsRaw === 'string') {
      try {
        steps = JSON.parse(stepsRaw);
      } catch (e) {
        steps = [];
      }
    }
    if (typeof tagsRaw === 'string') {
      try {
        tags = JSON.parse(tagsRaw);
      } catch (e) {
        tags = [];
      }
    }

    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls.push(...req.files.map(f => `/uploads/${f.filename}`));
    }
    if (images && Array.isArray(images)) {
      imageUrls.push(...images);
    } else if (typeof images === 'string') {
      try {
        const parsedImages = JSON.parse(images);
        if (Array.isArray(parsedImages)) {
          imageUrls.push(...parsedImages);
        }
      } catch (e) {
        // Ignore parse error
      }
    }

    logger.info(`[Create Recipe] Creating recipe: ${title} by user ${req.user._id}`);

    const recipe = await Recipe.create({
      source: 'user',
      title,
      description,
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      steps: Array.isArray(steps) ? steps : [],
      tags: Array.isArray(tags) ? tags : [],
      cuisine: cuisine && cuisine.trim() ? cuisine.trim() : undefined,
      category: category && category.trim() ? category.trim() : undefined,
      prepTime: parseInt(prepTime) || 0,
      cookTime: parseInt(cookTime) || 0,
      servings: parseInt(servings) || 1,
      images: imageUrls,
      createdBy: req.user._id,
      nutrition,
      isPublic: isPublic !== undefined ? isPublic : true,
    });

    logger.info(`[Create Recipe] Recipe created successfully: ${recipe._id}`);

    const populated = await Recipe.findById(recipe._id)
      .populate('createdBy', 'username firstName lastName avatarUrl');

    res.status(201).json({ recipe: populated });
  } catch (error) {
    logger.error('[Create Recipe] Error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map(e => e.message);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors.join(', ')
      });
    }
    next(error);
  }
};

export const updateRecipe = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Check ownership or admin
    if (recipe.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this recipe' });
    }

    const {
      title,
      description,
      ingredients: ingredientsRaw,
      steps: stepsRaw,
      tags: tagsRaw,
      cuisine,
      category,
      prepTime,
      cookTime,
      servings,
      images: imagesRaw,
      nutrition,
      isPublic,
    } = req.body;

    // Parse JSON strings if needed (from FormData)
    let ingredients = ingredientsRaw;
    let steps = stepsRaw;
    let tags = tagsRaw;
    let images = imagesRaw;
    
    if (ingredientsRaw && typeof ingredientsRaw === 'string') {
      try {
        ingredients = JSON.parse(ingredientsRaw);
      } catch (e) {
        ingredients = ingredientsRaw;
      }
    }
    if (stepsRaw && typeof stepsRaw === 'string') {
      try {
        steps = JSON.parse(stepsRaw);
      } catch (e) {
        steps = stepsRaw;
      }
    }
    if (tagsRaw && typeof tagsRaw === 'string') {
      try {
        tags = JSON.parse(tagsRaw);
      } catch (e) {
        tags = tagsRaw;
      }
    }
    if (imagesRaw && typeof imagesRaw === 'string') {
      try {
        images = JSON.parse(imagesRaw);
      } catch (e) {
        images = imagesRaw;
      }
    }

    if (title) recipe.title = title;
    if (description !== undefined) recipe.description = description;
    if (ingredients) recipe.ingredients = Array.isArray(ingredients) ? ingredients : [];
    if (steps) recipe.steps = Array.isArray(steps) ? steps : [];
    if (tags) recipe.tags = Array.isArray(tags) ? tags : [];
    if (cuisine !== undefined) recipe.cuisine = cuisine;
    if (category !== undefined) recipe.category = category;
    if (prepTime !== undefined) recipe.prepTime = parseInt(prepTime);
    if (cookTime !== undefined) recipe.cookTime = parseInt(cookTime);
    if (servings !== undefined) recipe.servings = parseInt(servings);
    if (images) {
      const imageArray = Array.isArray(images) ? images : [];
      recipe.images = imageArray;
    }
    if (nutrition) recipe.nutrition = nutrition;
    if (isPublic !== undefined) recipe.isPublic = isPublic;

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => `/uploads/${f.filename}`);
      recipe.images = [...(recipe.images || []), ...newImages];
    }

    await recipe.save();

    const populated = await Recipe.findById(recipe._id)
      .populate('createdBy', 'username firstName lastName avatarUrl');

    res.json({ recipe: populated });
  } catch (error) {
    next(error);
  }
};

export const deleteRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    if (recipe.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this recipe' });
    }

    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const likeRecipe = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if it's a valid MongoDB ObjectId
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    
    if (!isMongoId) {
      // This is a TheMealDB recipe - can't like external recipes
      return res.status(400).json({ 
        error: 'Cannot like external recipes from TheMealDB. Only user-created recipes can be liked.' 
      });
    }

    const recipe = await Recipe.findById(id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // In a real app, you'd track which users liked which recipes
    // For simplicity, we'll just increment
    recipe.likesCount = (recipe.likesCount || 0) + 1;
    await recipe.save();

    res.json({ likesCount: recipe.likesCount });
  } catch (error) {
    next(error);
  }
};

export const saveRecipe = async (req, res, next) => {
  try {
    // Normalize the ID - trim whitespace and ensure it's a string
    const id = String(req.params.id || '').trim();
    const userId = req.user._id;
    
    if (!id) {
      logger.error('[Save Recipe] No recipe ID provided');
      return res.status(400).json({ error: 'Recipe ID is required' });
    }
    
    logger.info(`[Save Recipe] Attempting to save recipe: id="${id}" (type: ${typeof id}), userId=${userId}`);
    
    // Check if it's a valid MongoDB ObjectId
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let recipe;
    let savedRecipeData = {
      userId,
      source: 'user',
    };
    let isMealDBRecipe = false;

    if (isMongoId) {
      // MongoDB recipe
      logger.info(`[Save Recipe] MongoDB recipe detected: ${id}`);
      recipe = await Recipe.findById(id);
    if (!recipe) {
        logger.warn(`[Save Recipe] MongoDB recipe not found: ${id}`);
      return res.status(404).json({ error: 'Recipe not found' });
    }

      // No duplicate check - let upsert handle it automatically
      logger.info(`[Save Recipe] Preparing to save MongoDB recipe: recipeId=${id}`);
      savedRecipeData.recipeId = id;
      savedRecipeData.title = recipe.title;
      savedRecipeData.description = recipe.description;
      savedRecipeData.image = recipe.images?.[0];
      savedRecipeData.cuisine = recipe.cuisine;
      savedRecipeData.category = recipe.category;
      savedRecipeData.prepTime = recipe.prepTime;
      savedRecipeData.cookTime = recipe.cookTime;
      savedRecipeData.servings = recipe.servings;

      // Increment saves count
    recipe.savesCount = (recipe.savesCount || 0) + 1;
    await recipe.save();
    } else {
      // TheMealDB recipe
      isMealDBRecipe = true;
      logger.info(`[Save Recipe] TheMealDB recipe detected: ${id}`);
      try {
        const meal = await getMealById(id);
        if (!meal) {
          logger.warn(`[Save Recipe] TheMealDB recipe not found: ${id}`);
          return res.status(404).json({ error: 'Recipe not found' });
        }

        logger.info(`[Save Recipe] TheMealDB recipe found: ${meal.strMeal}`);

        // Normalize mealdbId as string - no duplicate check here, let upsert handle it
        const mealdbIdString = String(id).trim();
        logger.info(`[Save Recipe] Preparing to save TheMealDB recipe: mealdbId="${mealdbIdString}"`);

        savedRecipeData.mealdbId = mealdbIdString; // Store as string
        savedRecipeData.source = 'mealdb';
        savedRecipeData.title = meal.strMeal;
        savedRecipeData.description = meal.strInstructions?.substring(0, 200) || '';
        savedRecipeData.image = meal.strMealThumb || '';
        savedRecipeData.cuisine = meal.strArea || '';
        savedRecipeData.category = meal.strCategory || '';
        
        logger.info(`[Save Recipe] TheMealDB data prepared: title=${savedRecipeData.title}`);
      } catch (error) {
        logger.error('[Save Recipe] Error fetching MealDB recipe for save', error);
        return res.status(404).json({ error: 'Recipe not found' });
      }
    }

    // Validate required fields before saving
    if (!savedRecipeData.title) {
      logger.error('[Save Recipe] Missing title in savedRecipeData:', savedRecipeData);
      return res.status(400).json({ error: 'Recipe title is required' });
    }

    // Simple approach: Check if exists, if yes return "already saved", if no create new
    logger.info(`[Save Recipe] Saving recipe with data:`, JSON.stringify(savedRecipeData, null, 2));
    const mealdbIdString = savedRecipeData.mealdbId ? String(savedRecipeData.mealdbId).trim() : undefined;
    
    // Build query to check if recipe already exists for this user
    let checkQuery;
    if (savedRecipeData.recipeId) {
      // MongoDB recipe
      checkQuery = { userId: savedRecipeData.userId, recipeId: savedRecipeData.recipeId };
    } else if (mealdbIdString) {
      // TheMealDB recipe - check both string and numeric (legacy)
      checkQuery = { 
        userId: savedRecipeData.userId, 
        $or: [{ mealdbId: mealdbIdString }, { mealdbId: Number(mealdbIdString) }] 
      };
    } else {
      return res.status(400).json({ error: 'Invalid recipe identifier' });
    }

    try {
      // Step 0: For MealDB recipes, normalize any existing numeric mealdbId to string first
      // (The partial unique index now handles recipeId properly, so no cleanup needed)
      if (mealdbIdString) {
        const numericMatches = await SavedRecipe.find({
          userId: savedRecipeData.userId,
          mealdbId: Number(mealdbIdString)
        });
        if (numericMatches.length > 0) {
          logger.info(`[Save Recipe] Found ${numericMatches.length} recipe(s) with numeric mealdbId, normalizing to string`);
          // Keep the first one, normalize it, delete the rest
          const keeper = numericMatches[0];
          // Update: normalize mealdbId to string and unset recipeId if it's null
          const updateData = { mealdbId: mealdbIdString };
          if (keeper.recipeId === null) {
            updateData.$unset = { recipeId: "" };
          }
          await SavedRecipe.updateOne({ _id: keeper._id }, updateData);
          // Reload to get updated document
          const updatedKeeper = await SavedRecipe.findById(keeper._id);
          if (numericMatches.length > 1) {
            const toDelete = numericMatches.slice(1).map(r => r._id);
            await SavedRecipe.deleteMany({ _id: { $in: toDelete } });
          }
          // Return the normalized existing recipe
          logger.info(`[Save Recipe] Recipe already saved (normalized): _id=${updatedKeeper._id}, title="${updatedKeeper.title}"`);
          return res.json({
            message: 'Recipe already saved',
            savedRecipe: {
              _id: updatedKeeper._id,
              recipeId: updatedKeeper.recipeId,
              mealdbId: updatedKeeper.mealdbId,
              title: updatedKeeper.title,
              source: updatedKeeper.source,
            }
          });
        }
      }

      // Step 1: Check if recipe already exists
      const existing = await SavedRecipe.findOne(checkQuery);
      if (existing) {
        logger.info(`[Save Recipe] Recipe already saved: _id=${existing._id}, title="${existing.title}"`);
        return res.json({
          message: 'Recipe already saved',
          savedRecipe: {
            _id: existing._id,
            recipeId: existing.recipeId,
            mealdbId: existing.mealdbId,
            title: existing.title,
            source: existing.source,
          }
        });
      }

      // Step 2: Recipe doesn't exist, create new one
      // For MealDB recipes, explicitly omit recipeId (don't set it to null/undefined)
      // to ensure sparse index works correctly - MongoDB sparse indexes treat null differently than undefined
      // Use explicit field assignment to ensure recipeId is truly omitted for MealDB recipes
      let savedRecipe;
      if (isMealDBRecipe || mealdbIdString) {
        // MealDB recipe - build object without recipeId field at all
        const mealDBData = {
          userId: savedRecipeData.userId,
          mealdbId: mealdbIdString,
          source: savedRecipeData.source,
          title: savedRecipeData.title,
          description: savedRecipeData.description,
          image: savedRecipeData.image,
          cuisine: savedRecipeData.cuisine,
          category: savedRecipeData.category,
          prepTime: savedRecipeData.prepTime,
          cookTime: savedRecipeData.cookTime,
          servings: savedRecipeData.servings,
        };
        // Remove any undefined/null values to ensure clean document
        Object.keys(mealDBData).forEach(key => {
          if (mealDBData[key] === undefined || mealDBData[key] === null) {
            delete mealDBData[key];
          }
        });
        logger.info(`[Save Recipe] Creating MealDB recipe (recipeId field completely omitted):`, JSON.stringify(mealDBData, null, 2));
        // Use collection.insertOne directly to bypass Mongoose defaults that might add recipeId: null
        const insertResult = await SavedRecipe.collection.insertOne(mealDBData);
        savedRecipe = await SavedRecipe.findById(insertResult.insertedId);
        
        // Verify recipeId is not null - if it is, fix it immediately
        if (savedRecipe.recipeId === null) {
          logger.error(`[Save Recipe] CRITICAL: recipeId was set to null despite being omitted! Fixing...`);
          await SavedRecipe.collection.updateOne(
            { _id: savedRecipe._id },
            { $unset: { recipeId: "" } }
          );
          savedRecipe = await SavedRecipe.findById(savedRecipe._id);
          logger.info(`[Save Recipe] Fixed: recipeId removed from document`);
        }
        
        logger.info(`[Save Recipe] MealDB recipe created: _id=${savedRecipe._id}, recipeId=${savedRecipe.recipeId === null ? 'NULL (BAD!)' : savedRecipe.recipeId === undefined ? 'undefined (GOOD!)' : savedRecipe.recipeId}`);
      } else {
        // MongoDB recipe - build object without mealdbId field
        const mongoData = {
          userId: savedRecipeData.userId,
          recipeId: savedRecipeData.recipeId,
          source: savedRecipeData.source,
          title: savedRecipeData.title,
          description: savedRecipeData.description,
          image: savedRecipeData.image,
          cuisine: savedRecipeData.cuisine,
          category: savedRecipeData.category,
          prepTime: savedRecipeData.prepTime,
          cookTime: savedRecipeData.cookTime,
          servings: savedRecipeData.servings,
        };
        // Remove any undefined/null values
        Object.keys(mongoData).forEach(key => {
          if (mongoData[key] === undefined || mongoData[key] === null) {
            delete mongoData[key];
          }
        });
        logger.info(`[Save Recipe] Creating MongoDB recipe:`, JSON.stringify(mongoData, null, 2));
        savedRecipe = await SavedRecipe.create(mongoData);
      }

      logger.info(`[Save Recipe] Recipe saved successfully: _id=${savedRecipe._id}, title="${savedRecipe.title}", mealdbId=${savedRecipe.mealdbId || 'N/A'}, recipeId=${savedRecipe.recipeId || 'N/A'}`);

      return res.json({ 
        message: 'Recipe saved successfully',
        savedRecipe: {
          _id: savedRecipe._id,
          recipeId: savedRecipe.recipeId,
          mealdbId: savedRecipe.mealdbId,
          title: savedRecipe.title,
          source: savedRecipe.source,
        }
      });
    } catch (createError) {
      logger.error('[Save Recipe] Error saving recipe:', createError);
      logger.error('[Save Recipe] Error details:', createError.message);
      logger.error('[Save Recipe] Error code:', createError.code);
      logger.error('[Save Recipe] Error keyPattern:', createError.keyPattern);
      logger.error('[Save Recipe] Error keyValue:', createError.keyValue);
      
      // If duplicate key error (race condition - recipe was saved between check and create)
      if (createError.code === 11000) {
        logger.warn('[Save Recipe] Duplicate key error - checking if recipe exists');
        logger.warn(`[Save Recipe] Duplicate on index: ${JSON.stringify(createError.keyPattern)}, value: ${JSON.stringify(createError.keyValue)}`);
        
        // Try the check query again
        const existing = await SavedRecipe.findOne(checkQuery);
        if (existing) {
          logger.info(`[Save Recipe] Found existing recipe after duplicate error: _id=${existing._id}, title="${existing.title}"`);
          return res.json({
            message: 'Recipe already saved',
            savedRecipe: {
              _id: existing._id,
              recipeId: existing.recipeId,
              mealdbId: existing.mealdbId,
              title: existing.title,
              source: existing.source,
            }
          });
        }
        
        // If not found but duplicate key error, there might be a numeric/string mismatch
        // Try to find with the opposite type
        if (mealdbIdString) {
          const altQuery = { 
            userId: savedRecipeData.userId, 
            mealdbId: Number(mealdbIdString) 
          };
          const altExisting = await SavedRecipe.findOne(altQuery);
          if (altExisting) {
            logger.info(`[Save Recipe] Found existing recipe with numeric mealdbId: _id=${altExisting._id}, title="${altExisting.title}"`);
            // Normalize it to string
            altExisting.mealdbId = mealdbIdString;
            await altExisting.save();
            return res.json({
              message: 'Recipe already saved',
              savedRecipe: {
                _id: altExisting._id,
                recipeId: altExisting.recipeId,
                mealdbId: altExisting.mealdbId,
                title: altExisting.title,
                source: altExisting.source,
              }
            });
          }
        }
        
        logger.error('[Save Recipe] Duplicate key error but recipe not found - this indicates a database index issue');
        return res.status(500).json({ 
          error: 'Failed to save recipe. Please try again.',
          details: 'Database constraint error - please contact support'
        });
      }

      if (createError.name === 'ValidationError') {
        logger.error('[Save Recipe] Validation error:', createError.errors);
        const validationMessages = Object.values(createError.errors).map(e => e.message).join(', ');
        return res.status(400).json({ 
          error: 'Validation error', 
          details: validationMessages
        });
      }

      logger.error('[Save Recipe] Unexpected error during save:', {
        name: createError.name,
        message: createError.message,
        code: createError.code,
      });
      
      return res.status(500).json({ 
        error: 'Failed to save recipe',
        details: createError.message || 'An unexpected error occurred'
      });
    }
  } catch (error) {
    logger.error('[Save Recipe] Outer catch - Error saving recipe:', error);
    logger.error('[Save Recipe] Error name:', error.name);
    logger.error('[Save Recipe] Error message:', error.message);
    
    return res.status(500).json({ 
      error: 'Failed to save recipe',
      details: error.message || 'An unexpected error occurred. Please try again.'
    });
  }
};

export const unsaveRecipe = async (req, res, next) => {
  try {
    // Normalize the ID - trim whitespace and ensure it's a string (same as saveRecipe)
    const id = String(req.params.id || '').trim();
    const userId = req.user._id;
    
    if (!id) {
      logger.error('[Unsave Recipe] No recipe ID provided');
      return res.status(400).json({ error: 'Recipe ID is required' });
    }
    
    // Check if it's a valid MongoDB ObjectId
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let query;
    if (isMongoId) {
      query = { userId, recipeId: id };
    } else {
      // TheMealDB recipe - check both string and numeric (legacy)
      const mealdbIdString = String(id).trim();
      query = { 
        userId, 
        $or: [{ mealdbId: mealdbIdString }, { mealdbId: Number(mealdbIdString) }] 
      };
    }

    const savedRecipe = await SavedRecipe.findOneAndDelete(query);
    
    if (!savedRecipe) {
      return res.status(404).json({ error: 'Saved recipe not found' });
    }

    // Decrement saves count for MongoDB recipes
    if (isMongoId) {
      const recipe = await Recipe.findById(id);
      if (recipe) {
        recipe.savesCount = Math.max(0, (recipe.savesCount || 0) - 1);
        await recipe.save();
      }
    }

    res.json({ message: 'Recipe unsaved successfully' });
  } catch (error) {
    next(error);
  }
};

// Check if a specific recipe is saved
export const checkIfRecipeSaved = async (req, res, next) => {
  try {
    // Normalize the ID - trim whitespace and ensure it's a string (same as saveRecipe)
    const id = String(req.params.id || '').trim();
    const userId = req.user._id;
    
    if (!id) {
      logger.error('[Check If Saved] No recipe ID provided');
      return res.status(400).json({ error: 'Recipe ID is required' });
    }
    
    // Check if it's a valid MongoDB ObjectId
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    
    logger.info(`[Check If Saved] Checking: id="${id}" (type: ${typeof id}), userId=${userId}, isMongoId=${isMongoId}`);
    
    let savedRecipe;
    let query;
    if (isMongoId) {
      // MongoDB recipe - check by recipeId
      query = { userId, recipeId: id };
      savedRecipe = await SavedRecipe.findOne(query);
      logger.info(`[Check If Saved] MongoDB query: ${JSON.stringify(query)}, found=${!!savedRecipe}`);
    } else {
      // TheMealDB recipe - check by mealdbId (check both string and numeric for legacy)
      const mealdbIdString = String(id).trim();
      query = { 
        userId, 
        $or: [{ mealdbId: mealdbIdString }, { mealdbId: Number(mealdbIdString) }] 
      };
      savedRecipe = await SavedRecipe.findOne(query);
      logger.info(`[Check If Saved] TheMealDB query: ${JSON.stringify(query)}, found=${!!savedRecipe}`);
      if (savedRecipe) {
        logger.info(`[Check If Saved] Found saved recipe: _id=${savedRecipe._id}, mealdbId="${savedRecipe.mealdbId}", title="${savedRecipe.title}"`);
      }
    }
    
    const isSaved = !!savedRecipe;
    logger.info(`[Check If Saved] Final result: isSaved=${isSaved} for recipe ${id}`);
    
    res.json({ isSaved });
  } catch (error) {
    logger.error('Error checking if recipe is saved:', error);
    next(error);
  }
};

export const getSavedRecipes = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    logger.info(`[Get Saved Recipes] Fetching saved recipes for userId: ${userId}`);
    
    const savedRecipes = await SavedRecipe.find({ userId })
      .sort({ createdAt: -1 })
      .limit(1000); // Limit to 1000 most recent (increased from 100)

    logger.info(`[Get Saved Recipes] Found ${savedRecipes.length} saved recipes in database`);

    // Fetch full recipe details for MongoDB recipes
    const recipeIds = savedRecipes
      .filter(sr => sr.recipeId)
      .map(sr => sr.recipeId);
    
    const recipes = await Recipe.find({ _id: { $in: recipeIds } })
      .populate('createdBy', 'username firstName lastName avatarUrl');

    // Create a map for quick lookup
    const recipeMap = new Map();
    recipes.forEach(r => recipeMap.set(r._id.toString(), r.toObject()));

    // Combine saved recipes with full recipe data
    const result = savedRecipes.map(savedRecipe => {
      if (savedRecipe.recipeId) {
        // MongoDB recipe - use full recipe data
        const fullRecipe = recipeMap.get(savedRecipe.recipeId.toString());
        if (fullRecipe) {
          logger.info(`[Get Saved Recipes] MongoDB recipe: ${fullRecipe.title}`);
          return {
            ...fullRecipe,
            savedAt: savedRecipe.createdAt,
            savedRecipeId: savedRecipe._id,
          };
        }
      }
      
      // TheMealDB recipe - use snapshot data
      logger.info(`[Get Saved Recipes] TheMealDB recipe: ${savedRecipe.title}, mealdbId: ${savedRecipe.mealdbId}`);
      return {
        _id: savedRecipe.mealdbId || savedRecipe._id.toString(), // Use mealdbId as _id for frontend
        mealdbId: savedRecipe.mealdbId, // This is the key field for matching
        recipeId: undefined, // Explicitly undefined for TheMealDB recipes
        title: savedRecipe.title || 'Untitled Recipe',
        description: savedRecipe.description || '',
        images: savedRecipe.image ? [savedRecipe.image] : [],
        cuisine: savedRecipe.cuisine || '',
        category: savedRecipe.category || '',
        prepTime: savedRecipe.prepTime,
        cookTime: savedRecipe.cookTime,
        servings: savedRecipe.servings,
        source: savedRecipe.source || 'mealdb',
        savedAt: savedRecipe.createdAt,
        savedRecipeId: savedRecipe._id, // The SavedRecipe document ID
      };
    });

    const mealdbCount = result.filter(r => r.mealdbId).length;
    const mongoCount = result.filter(r => r.recipeId).length;
    logger.info(`[Get Saved Recipes] Returning ${result.length} recipes (${mealdbCount} TheMealDB, ${mongoCount} MongoDB)`);

    res.json({ savedRecipes: result, count: result.length });
  } catch (error) {
    logger.error('[Get Saved Recipes] Error:', error);
    next(error);
  }
};

export const commentRecipe = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    
    // Check if it's a valid MongoDB ObjectId
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
    
    if (!isMongoId) {
      // This is a TheMealDB recipe - can't comment on external recipes
      return res.status(400).json({ 
        error: 'Cannot comment on external recipes from TheMealDB. Only user-created recipes can be commented on.' 
      });
    }

    const recipe = await Recipe.findById(id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    recipe.comments.push({
      userId: req.user._id,
      text: req.body.text,
    });

    await recipe.save();

    const populated = await Recipe.findById(recipe._id)
      .populate('comments.userId', 'username firstName lastName avatarUrl');

    res.json({ comment: populated.comments[populated.comments.length - 1] });
  } catch (error) {
    next(error);
  }
};

