import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const authOptions = {
  providers: [
    // ── Google OAuth ──────────────────────────────────────────────────────────
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // ── Email / Password ──────────────────────────────────────────────────────
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter email and password');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('No user found with this email');
        }

        if (!user.password) {
          throw new Error('This account uses Google sign-in. Please continue with Google.');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        return {
          id:    user.id,
          email: user.email,
          name:  user.name,
          role:  user.role,
          image: user.profilePicture,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/sign_in',
  },

  callbacks: {
    // ── Create / update user on Google sign-in ────────────────────────────────
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (existingUser) {
            // Link Google ID if not already stored
            if (!existingUser.googleId) {
              await prisma.user.update({
                where: { email: user.email },
                data: {
                  googleId:       user.id,
                  profilePicture: user.image ?? existingUser.profilePicture,
                },
              });
            }
            // Pass DB id back so jwt callback can use it
            user.dbId = existingUser.id;
            user.role  = existingUser.role;
          } else {
            // New user — create with Google details
            const newUser = await prisma.user.create({
              data: {
                name:           user.name  ?? 'Google User',
                email:          user.email,
                googleId:       user.id,
                profilePicture: user.image ?? null,
                role:           'user',
                phone:          null,
                password:       null,
              },
            });
            user.dbId = newUser.id;
            user.role  = newUser.role;
          }
          return true;
        } catch (error) {
          console.error('Google signIn callback error:', error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        // For Google: use dbId set in signIn callback; for Credentials: use id
        token.id   = user.dbId ?? user.id;
        token.role = user.role ?? 'user';
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id   = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
