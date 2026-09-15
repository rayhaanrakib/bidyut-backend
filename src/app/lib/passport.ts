import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { sendEmail } from '@lib/nodemailer';
import bcrypt from 'bcrypt';
import { prisma } from '@lib/prisma';
import config from '@app/config';

passport.use(
  new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || user.isDeleted) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      if (!user.passwordHash || !user.passwordRequired) {
        return done(null, false, { message: 'This account has no password. Please log in with Google.' });
      }
      if (user.status === 'BLOCKED') return done(null, false, { message: 'Your account is blocked' });

      const passwordOk = await bcrypt.compare(password, user.passwordHash);
      if (!passwordOk) return done(null, false, { message: 'Invalid email or password' });

      return done(null, user);
    } catch (err) {
      return done(err as Error);
    }
  }),
);

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
    },
    async (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(null, false, { message: 'No email found on the Google account' });

        const existing = await prisma.user.findUnique({ where: { email } });

        if (existing) {
          if (existing.isDeleted || existing.status === 'BLOCKED') {
            return done(null, false, { message: 'This account is not allowed to log in' });
          }
          // account linking: same user, second login method — remember the google id
          if (!existing.googleId) {
            await prisma.user.update({ where: { id: existing.id }, data: { googleId: profile.id } });
          }
          return done(null, existing);
        }

        // first visit: auto-create the account (passwordless — Google is the credential)
        const user = await prisma.user.create({
          data: {
            name: profile.displayName || 'Google User',
            email,
            passwordHash: null,
            googleId: profile.id,
            authProvider: 'GOOGLE',
            emailVerified: true, // Google already verified this email
            passwordRequired: false, // passwordless — they can add one via forgot-password later
            role: 'CUSTOMER',
          },
        });

        // 🎉 welcome a BRAND-NEW Google user — linked logins (existing accounts) stay silent
        sendEmail(email, 'Welcome to BIDYUT ⚡ Your account is ready', 'welcome', {
          name: user.name,
          frontendUrl: config.server.frontendUrl,
        }).catch(() => null);

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    },
  ),
);




export default passport;