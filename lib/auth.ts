import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createContextLogger } from "./logger";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "SUPERADMIN" | "ADMIN";
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    role: "SUPERADMIN" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "SUPERADMIN" | "ADMIN";
  }
}

const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const log = createContextLogger({ action: "auth.login" });

        try {
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) {
            log.warn({ reason: "invalid_input" }, "Tentativa de login com dados inválidos");
            return null;
          }

          const { email, password } = parsed.data;

          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
          });

          if (!user) {
            log.warn({ email }, "Tentativa de login com email não cadastrado");
            return null;
          }

          const passwordMatch = await bcrypt.compare(password, user.password);
          if (!passwordMatch) {
            log.warn({ userId: user.id }, "Tentativa de login com senha incorreta");
            return null;
          }

          log.info({ userId: user.id, role: user.role }, "Login realizado com sucesso");

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role as "SUPERADMIN" | "ADMIN",
          };
        } catch (err) {
          log.error({ err }, "Erro inesperado durante autenticação");
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
};
