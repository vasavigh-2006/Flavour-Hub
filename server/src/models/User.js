import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const refreshTokenSchema = new mongoose.Schema({
  tokenId: { type: String, required: true },
  issuedAt: { type: Date, default: Date.now },
  deviceInfo: String,
  revoked: { type: Boolean, default: false },
});

const subscriptionSchema = new mongoose.Schema({
  stripeCustomerId: String,
  planId: { type: String, enum: ['free', 'pro', 'premium'], default: 'free' },
  status: { type: String, enum: ['active', 'canceled', 'past_due', 'trialing'], default: 'active' },
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  dob: { type: Date, required: true },
  passwordHash: { type: String, required: true },
  avatarUrl: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  subscription: { type: subscriptionSchema, default: () => ({}) },
  refreshTokens: [refreshTokenSchema],
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.addRefreshToken = function(tokenId, deviceInfo) {
  this.refreshTokens.push({ tokenId, deviceInfo });
  if (this.refreshTokens.length > 10) {
    this.refreshTokens.shift(); // Keep only last 10 tokens
  }
  return this.save();
};

userSchema.methods.revokeRefreshToken = function(tokenId) {
  const token = this.refreshTokens.find(t => t.tokenId === tokenId);
  if (token) {
    token.revoked = true;
    return this.save();
  }
  return Promise.resolve();
};

userSchema.methods.revokeAllRefreshTokens = function() {
  this.refreshTokens.forEach(token => {
    token.revoked = true;
  });
  return this.save();
};

const User = mongoose.model('User', userSchema);

export default User;

