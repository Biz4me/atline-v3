import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { AtlineUser } from '@atline/types';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          // Authentification via Payload CMS
          const res = await fetch(`${process.env.PAYLOAD_API_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const data = await res.json();
          const user: AtlineUser = data.user;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as import('@atline/types').UserRole,
            hasLicence: user.hasLicence,
            hasCoach: user.hasCoach,
            mlmLevel: user.mlmLevel,
            directCount: user.directCount,
            referralCode: user.referralCode,
            inviteToken: user.inviteToken,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as AtlineUser).role;
        token.hasLicence = (user as AtlineUser).hasLicence;
        token.hasCoach = (user as AtlineUser).hasCoach;
        token.mlmLevel = (user as AtlineUser).mlmLevel;
        token.directCount = (user as AtlineUser).directCount;
        token.referralCode = (user as AtlineUser).referralCode;
        token.inviteToken = (user as AtlineUser).inviteToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as import('@atline/types').UserRole;
      session.user.hasLicence = token.hasLicence as boolean;
      session.user.hasCoach = token.hasCoach as boolean;
      session.user.mlmLevel = token.mlmLevel as number;
      session.user.directCount = token.directCount as number;
      session.user.referralCode = token.referralCode as string;
      session.user.inviteToken = token.inviteToken as string;
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 jours
});
