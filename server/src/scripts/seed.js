import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Recipe from '../models/Recipe.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory (two levels up from server/src/scripts/)
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const seed = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Recipe.deleteMany({});

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      username: 'admin',
      email: 'admin@recipeapp.com',
      dob: new Date('1990-01-01'),
      passwordHash: adminPassword,
      role: 'admin',
      emailVerified: true,
      subscription: {
        planId: 'premium',
        status: 'active',
      },
    });

    // Create regular users
    const user1Password = await bcrypt.hash('user123', 12);
    const user1 = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      dob: new Date('1995-05-15'),
      passwordHash: user1Password,
      emailVerified: true,
      subscription: {
        planId: 'pro',
        status: 'active',
      },
    });

    const user2Password = await bcrypt.hash('user123', 12);
    const user2 = await User.create({
      firstName: 'Jane',
      lastName: 'Smith',
      username: 'janesmith',
      email: 'jane@example.com',
      dob: new Date('1992-08-20'),
      passwordHash: user2Password,
      emailVerified: true,
      subscription: {
        planId: 'free',
        status: 'active',
      },
    });

    // Create sample recipes
    const recipes = [
      {
        source: 'user',
        title: 'Classic Margherita Pizza',
        description: 'A traditional Italian pizza with fresh mozzarella, tomatoes, and basil.',
        ingredients: [
          { name: 'pizza dough', qty: 1, unit: 'ball' },
          { name: 'tomato sauce', qty: 0.5, unit: 'cup' },
          { name: 'mozzarella cheese', qty: 200, unit: 'g' },
          { name: 'fresh basil', qty: 10, unit: 'leaves' },
          { name: 'olive oil', qty: 2, unit: 'tbsp' },
        ],
        steps: [
          'Preheat oven to 475°F (245°C).',
          'Roll out pizza dough on a floured surface.',
          'Spread tomato sauce evenly over dough.',
          'Add mozzarella cheese slices.',
          'Bake for 10-12 minutes until crust is golden.',
          'Top with fresh basil and drizzle with olive oil.',
        ],
        tags: ['italian', 'pizza', 'vegetarian'],
        cuisine: 'Italian',
        category: 'Main Course',
        prepTime: 20,
        cookTime: 12,
        servings: 4,
        createdBy: user1._id,
        likesCount: 15,
        savesCount: 8,
        isPublic: true,
      },
      {
        source: 'user',
        title: 'Chocolate Chip Cookies',
        description: 'Soft and chewy chocolate chip cookies that are perfect for any occasion.',
        ingredients: [
          { name: 'all-purpose flour', qty: 2.25, unit: 'cups' },
          { name: 'baking soda', qty: 1, unit: 'tsp' },
          { name: 'salt', qty: 1, unit: 'tsp' },
          { name: 'butter', qty: 1, unit: 'cup' },
          { name: 'granulated sugar', qty: 0.75, unit: 'cup' },
          { name: 'brown sugar', qty: 0.75, unit: 'cup' },
          { name: 'vanilla extract', qty: 1, unit: 'tsp' },
          { name: 'eggs', qty: 2, unit: 'large' },
          { name: 'chocolate chips', qty: 2, unit: 'cups' },
        ],
        steps: [
          'Preheat oven to 375°F (190°C).',
          'Mix flour, baking soda, and salt in a bowl.',
          'Cream butter and both sugars until fluffy.',
          'Beat in vanilla and eggs.',
          'Gradually blend in flour mixture.',
          'Stir in chocolate chips.',
          'Drop rounded tablespoons onto ungreased baking sheets.',
          'Bake for 9-11 minutes until golden brown.',
        ],
        tags: ['dessert', 'cookies', 'baking'],
        cuisine: 'American',
        category: 'Dessert',
        prepTime: 15,
        cookTime: 11,
        servings: 24,
        createdBy: user2._id,
        likesCount: 23,
        savesCount: 12,
        isPublic: true,
      },
      {
        source: 'user',
        title: 'Chicken Stir Fry',
        description: 'Quick and healthy chicken stir fry with vegetables.',
        ingredients: [
          { name: 'chicken breast', qty: 500, unit: 'g' },
          { name: 'broccoli', qty: 2, unit: 'cups' },
          { name: 'carrots', qty: 2, unit: 'medium' },
          { name: 'bell peppers', qty: 2, unit: 'medium' },
          { name: 'soy sauce', qty: 3, unit: 'tbsp' },
          { name: 'ginger', qty: 1, unit: 'tbsp' },
          { name: 'garlic', qty: 3, unit: 'cloves' },
          { name: 'vegetable oil', qty: 2, unit: 'tbsp' },
        ],
        steps: [
          'Cut chicken into bite-sized pieces.',
          'Heat oil in a large wok or pan.',
          'Cook chicken until golden, about 5 minutes.',
          'Add vegetables and stir-fry for 3-4 minutes.',
          'Add ginger and garlic, cook for 1 minute.',
          'Pour in soy sauce and toss everything together.',
          'Serve hot over rice.',
        ],
        tags: ['chicken', 'stir-fry', 'asian'],
        cuisine: 'Asian',
        category: 'Main Course',
        prepTime: 15,
        cookTime: 15,
        servings: 4,
        createdBy: user1._id,
        likesCount: 18,
        savesCount: 10,
        isPublic: true,
      },
    ];

    await Recipe.insertMany(recipes);

    console.log('✅ Seed data created successfully!');
    console.log('Admin: admin@recipeapp.com / admin123');
    console.log('User 1: john@example.com / user123');
    console.log('User 2: jane@example.com / user123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seed();

