import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
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

export default passport;