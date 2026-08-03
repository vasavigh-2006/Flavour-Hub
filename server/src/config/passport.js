import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email from Google'), null);

        // Check if user already exists
        let user = await User.findOne({ email });

        if (!user) {
          // Create new user from Google profile
          const firstName = profile.name?.givenName || profile.displayName || 'User';
          const lastName = profile.name?.familyName || '';
          const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 1000);
          
          user = await User.create({
            firstName,
            lastName,
            username,
            email,
            passwordHash: 'GOOGLE_OAUTH_NO_PASSWORD',
            dob: new Date('2000-01-01'),
            avatarUrl: profile.photos?.[0]?.value || '',
            emailVerified: true,
            googleId: profile.id,
          });
        } else if (!user.googleId) {
          // Link Google to existing account
          user.googleId = profile.id;
          user.emailVerified = true;
          if (!user.avatarUrl && profile.photos?.[0]?.value) {
            user.avatarUrl = profile.photos[0].value;
          }
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;
