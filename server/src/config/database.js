import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import SavedRecipe from '../models/SavedRecipe.js';
import Recipe from '../models/Recipe.js';

// Ensure the SavedRecipe collection has the correct compound indexes
// (and no stray indexes that might block multiple saves per user).
const ensureSavedRecipeIndexes = async () => {
  const collection = SavedRecipe.collection;
  const allowedIndexNames = new Set([
    '_id_',
    'userId_1_recipeId_1',
    'userId_1_mealdbId_1',
  ]);

  const currentIndexes = await collection.indexes();

  // Drop any unexpected indexes that could limit saving behavior
  for (const index of currentIndexes) {
    if (!allowedIndexNames.has(index.name)) {
      await collection.dropIndex(index.name);
      logger.warn(`[SavedRecipe] Dropped unexpected index: ${index.name}`);
    }
  }

  // Drop old sparse index if it exists (will be replaced with partial index)
  try {
    await collection.dropIndex('userId_1_recipeId_1');
    logger.info('[SavedRecipe] Dropped old sparse unique index: userId_1_recipeId_1');
  } catch (error) {
    if (error.code !== 27) { // 27 = IndexNotFound
      logger.warn(`[SavedRecipe] Error dropping old index: ${error.message}`);
    }
  }

  // Drop old sparse index for mealdbId if it exists (will be replaced with partial index)
  try {
    await collection.dropIndex('userId_1_mealdbId_1');
    logger.info('[SavedRecipe] Dropped old sparse unique index: userId_1_mealdbId_1');
  } catch (error) {
    if (error.code !== 27) { // 27 = IndexNotFound
      logger.warn(`[SavedRecipe] Error dropping old mealdbId index: ${error.message}`);
    }
  }

  // Create PARTIAL unique index for recipeId - only enforces uniqueness when recipeId exists
  // This allows unlimited MealDB recipes (no recipeId) per user, while MongoDB recipes remain unique
  try {
    await collection.createIndex(
      { userId: 1, recipeId: 1 },
      {
        unique: true,
        partialFilterExpression: { recipeId: { $exists: true } },
        name: 'userId_1_recipeId_1'
      }
    );
    logger.info('[SavedRecipe] Created partial unique index: userId_1_recipeId_1 (only when recipeId exists)');
  } catch (error) {
    logger.error(`[SavedRecipe] Error creating recipeId index: ${error.message}`);
    throw error;
  }
  
  // Create PARTIAL unique index for mealdbId - only enforces uniqueness when mealdbId exists
  // This allows unlimited user-created recipes (no mealdbId) per user, while MealDB recipes remain unique
  try {
    await collection.createIndex(
      { userId: 1, mealdbId: 1 },
      {
        unique: true,
        partialFilterExpression: { mealdbId: { $exists: true } },
        name: 'userId_1_mealdbId_1'
      }
    );
    logger.info('[SavedRecipe] Created partial unique index: userId_1_mealdbId_1 (only when mealdbId exists)');
  } catch (error) {
    logger.error(`[SavedRecipe] Error creating mealdbId index: ${error.message}`);
    throw error;
  }

  logger.info('[SavedRecipe] Indexes verified');
};

// Ensure the Recipe collection has the correct partial unique index
const ensureRecipeIndexes = async () => {
  const collection = Recipe.collection;
  
  // Drop old unique index if it exists (without partial filter)
  try {
    await collection.dropIndex('createdBy_1_mealdbId_1');
    logger.info('[Recipe] Dropped old unique index: createdBy_1_mealdbId_1');
  } catch (error) {
    if (error.code !== 27) { // 27 = IndexNotFound
      logger.warn(`[Recipe] Error dropping old index: ${error.message}`);
    }
  }
  
  // Also try dropping if it was created with userId instead of createdBy
  try {
    await collection.dropIndex('userId_1_mealdbId_1');
    logger.info('[Recipe] Dropped old unique index: userId_1_mealdbId_1');
  } catch (error) {
    if (error.code !== 27) {
      logger.warn(`[Recipe] Error dropping userId index: ${error.message}`);
    }
  }

  // Create PARTIAL unique index - only enforces uniqueness when mealdbId exists
  // This allows unlimited user-created recipes (no mealdbId) per user,
  // while preventing duplicate MealDB recipes (with mealdbId) per user
  try {
    await collection.createIndex(
      { createdBy: 1, mealdbId: 1 },
      {
        unique: true,
        partialFilterExpression: { mealdbId: { $exists: true } },
        name: 'createdBy_1_mealdbId_1'
      }
    );
    logger.info('[Recipe] Created partial unique index: createdBy_1_mealdbId_1 (only when mealdbId exists)');
  } catch (error) {
    logger.error(`[Recipe] Error creating index: ${error.message}`);
    throw error;
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Validate indexes to guarantee multiple saves per user work as intended
    await ensureSavedRecipeIndexes();
    // Ensure Recipe collection has correct partial index
    await ensureRecipeIndexes();
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

