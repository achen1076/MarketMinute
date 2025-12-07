import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth-utils";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/signin",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("MISSING_CREDENTIALS");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { accounts: true },
        });

        if (!user) {
          throw new Error("ACCOUNT_NOT_FOUND");
        }

        // Check if user signed up with Google
        const hasGoogleAccount = user.accounts.some(
          (account) => account.provider === "google"
        );

        if (hasGoogleAccount) {
          throw new Error("GOOGLE_ACCOUNT_REQUIRED");
        }

        // Check if user has password (credentials auth)
        if (!user.password) {
          throw new Error("NO_PASSWORD_SET");
        }

        // Verify password
        const isValid = await verifyPassword(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          throw new Error("INCORRECT_PASSWORD");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, credentials }) {
      try {
        // For OAuth providers (Google), check if email already exists with credentials
        if (account?.provider === "google" && user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: true },
          });

          // If user exists with credentials (password), link the Google account
          if (existingUser && existingUser.password) {
            // User signed up with email/password, now linking Google
            // NextAuth's adapter will automatically link the account
            console.log(
              `Linking Google account to existing user: ${user.email}`
            );
          }
        }

        // Credentials signin - errors are thrown from authorize
        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async session({ session, user, token }) {
      if (session?.user) {
        // For database sessions (OAuth)
        if (user) {
          session.user.id = user.id;
        }
        // For JWT sessions (Credentials)
        else if (token?.sub) {
          session.user.id = token.sub;
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt", // Use JWT for credentials, works with database for OAuth
  },
  debug: process.env.NODE_ENV === "development",
});
