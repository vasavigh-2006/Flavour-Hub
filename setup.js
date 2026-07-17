import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = `# MongoDB Connection
MONGODB_URI="mongodb://localhost:27017/recipeapp"

# JWT Secrets (generate with: openssl rand -hex 32)
JWT_ACCESS_SECRET="dev_access_secret_key_change_in_production_12345"
JWT_REFRESH_SECRET="dev_refresh_secret_key_change_in_production_12345"

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# Stripe Configuration (Test Mode - replace with your real Stripe test keys)
STRIPE_SECRET_KEY="your_stripe_secret_key_here"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret_here"

# TheMealDB Cache TTL (seconds)
MEALDB_TTL=3600

# Redis (Optional - leave empty if not using Redis)
REDIS_URL=""

# Email Configuration (for development, emails won't send without proper config)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your_email@gmail.com"
EMAIL_PASS="your_app_password"
EMAIL_FROM="noreply@recipeapp.com"

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR="./uploads"
`;

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with default configuration');
  console.log('📝 MongoDB URI set to: mongodb://localhost:27017/recipeapp');
  console.log('✅ Using your MongoDB connection: mongodb://localhost:27017/');
  console.log('⚠️  Note: Update Stripe keys and email config if needed');
} else {
  console.log('ℹ️  .env file already exists, skipping creation');
}

// Create uploads directory
const uploadsDir = path.join(__dirname, 'server', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

console.log('\n🎉 Setup complete! You can now run:');
console.log('   npm run dev');

