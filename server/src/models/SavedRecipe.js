import mongoose from 'mongoose';

const savedRecipeSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true,
  },
  // For MongoDB recipes
  recipeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Recipe', 
    sparse: true,
  },
  // For TheMealDB recipes
  mealdbId: { 
    type: String, 
    sparse: true,
  },
  // Recipe snapshot for quick display (avoids joins)
  title: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  cuisine: { type: String },
  category: { type: String },
  prepTime: { type: Number },
  cookTime: { type: Number },
  servings: { type: Number },
  source: { 
    type: String, 
    enum: ['user', 'mealdb'], 
    required: true,
  },
}, {
  timestamps: true,
});

// Compound indexes to prevent duplicate saves
// Use PARTIAL unique indexes - only enforce uniqueness when the field exists
// This allows unlimited saves of different recipes per user

// For user-created recipes (from Recipe collection)
// Only enforces uniqueness when recipeId exists
savedRecipeSchema.index(
  { userId: 1, recipeId: 1 },
  {
    unique: true,
    partialFilterExpression: { recipeId: { $exists: true } },
    name: 'userId_1_recipeId_1'
  }
);

// For MealDB recipes
// Only enforces uniqueness when mealdbId exists
savedRecipeSchema.index(
  { userId: 1, mealdbId: 1 },
  {
    unique: true,
    partialFilterExpression: { mealdbId: { $exists: true } },
    name: 'userId_1_mealdbId_1'
  }
);

const SavedRecipe = mongoose.model('SavedRecipe', savedRecipeSchema);

export default SavedRecipe;

