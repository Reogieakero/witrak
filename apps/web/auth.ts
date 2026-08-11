import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@fhusocom/db";
import { resolveUserAccess } from "@/lib/access";
import type { UserAccess } from "@/lib/permissions";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email, deletedAt: null },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user?.id) token.userId = user.id;

      if (trigger === "signIn" && token.userId) {
        token.access = await resolveUserAccess(token.userId);
      }

      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user = { ...(session.user ?? {}), id: token.userId };
      }
      session.access = (token.access as UserAccess | undefined) ?? null;
      return session;
    },
  },
});
