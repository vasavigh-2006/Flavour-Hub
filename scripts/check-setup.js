import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Checking setup...\n');

// Check .env file
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('   Run: npm run setup');
  process.exit(1);
}
console.log('✅ .env file exists');

// Check MongoDB connection
const envContent = fs.readFileSync(envPath, 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI="([^"]+)"/);
const mongoUri = mongoMatch ? mongoMatch[1] : 'mongodb://localhost:27017/recipeapp';

console.log(`📊 Testing MongoDB connection: ${mongoUri}`);

try {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
  console.log('✅ MongoDB connection successful!');
  await mongoose.connection.close();
} catch (error) {
  console.log('❌ MongoDB connection failed!');
  console.log('   Make sure MongoDB is running:');
  console.log('   - Windows: Check MongoDB service');
  console.log('   - Mac: brew services start mongodb-community');
  console.log('   - Linux: sudo systemctl start mongod');
  console.log(`   Error: ${error.message}`);
  process.exit(1);
}

// Check uploads directory
const uploadsDir = path.join(__dirname, 'server', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
} else {
  console.log('✅ Uploads directory exists');
}

console.log('\n🎉 All checks passed! You can run: npm run dev');

