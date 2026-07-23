/**
 * NextAuth 配置 — 邮箱魔法链接 + PrismaAdapter
 *
 * 原则三（权限默认拒绝）：session 策略为 jwt，每次 API 调用都通过 getServerSession 校验
 * 原则一（数据与状态必须抽象）：认证 provider 统一在此配置
 */

import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/prisma";

// Resend 发邮件需要的配置
const emailServer = {
  host: process.env.EMAIL_SERVER_HOST || "smtp.resend.com",
  port: Number(process.env.EMAIL_SERVER_PORT) || 465,
  auth: {
    user: process.env.EMAIL_SERVER_USER || "resend",
    pass: process.env.RESEND_API_KEY,
  },
};

const emailFrom = process.env.EMAIL_FROM || "noreply@zhiji.app";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },
  pages: {
    signIn: "/auth/login",
    verifyRequest: "/auth/verify-request",
    error: "/auth/login",
  },
  providers: [
    EmailProvider({
      server: emailServer,
      from: emailFrom,
      maxAge: 10 * 60, // 魔法链接有效期 10 分钟
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id: string }).id = token.id as string;
      }
      return session;
    },
  },
};
