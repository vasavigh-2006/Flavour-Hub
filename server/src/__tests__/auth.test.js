import request from 'supertest';
import app from '../server.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

describe('Auth Routes', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    }
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          username: 'testuser',
          email: 'test@example.com',
          dob: '1990-01-01',
          password: 'Test1234',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
    });

    it('should fail with invalid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: '',
          lastName: 'User',
          username: 'test',
          email: 'invalid-email',
          dob: '1990-01-01',
          password: '123',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // First register
      await request(app).post('/api/auth/register').send({
        firstName: 'Test',
        lastName: 'User',
        username: 'loginuser',
        email: 'login@example.com',
        dob: '1990-01-01',
        password: 'Test1234',
      });

      // Then verify email (simplified for test)
      const user = await User.findOne({ email: 'login@example.com' });
      user.emailVerified = true;
      await user.save();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Test1234',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });
  });
});

