import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number }, // Optional
  unit: { type: String }, // Optional
}, { _id: false });

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const nutritionSchema = new mongoose.Schema({
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  fiber: Number,
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  source: { type: String, enum: ['user', 'mealdb'], required: true },
  mealdbId: { type: String, sparse: true }, // For TheMealDB recipes
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  ingredients: [ingredientSchema],
  steps: [{ type: String, required: true }],
  tags: [{ type: String, trim: true }],
  cuisine: { type: String, trim: true },
  category: { type: String, trim: true },
  prepTime: { type: Number, default: 0 }, // in minutes
  cookTime: { type: Number, default: 0 }, // in minutes
  servings: { type: Number, default: 1 },
  images: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', sparse: true },
  likesCount: { type: Number, default: 0 },
  savesCount: { type: Number, default: 0 },
  comments: [commentSchema],
  nutrition: nutritionSchema,
  isPublic: { type: Boolean, default: true },
}, {
  timestamps: true,
});

recipeSchema.index({ title: 'text', description: 'text', tags: 'text' });
recipeSchema.index({ category: 1, cuisine: 1, prepTime: 1, cookTime: 1 });
recipeSchema.index({ likesCount: -1, savesCount: -1 });

// PARTIAL unique index: Only enforces uniqueness when mealdbId exists
// This allows unlimited user-created recipes (no mealdbId) per user,
// while preventing duplicate MealDB recipes (with mealdbId) per user
recipeSchema.index(
  { createdBy: 1, mealdbId: 1 },
  {
    unique: true,
    partialFilterExpression: { mealdbId: { $exists: true } },
    name: 'createdBy_1_mealdbId_1'
  }
);

const Recipe = mongoose.model('Recipe', recipeSchema);

export default Recipe;

