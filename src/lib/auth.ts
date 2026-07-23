/**
 * NextAuth 配置 — 邮箱魔法链接 + PrismaAdapter
 *
 * 原则三（权限默认拒绝）：session 策略为 jwt，每次 API 调用都通过 getServerSession 校验
 * 原则一（数据与状态必须抽象）：认证 provider 统一在此配置
 *
 * 发邮件走 Resend HTTP API（无需 nodemailer，兼容 Vercel serverless）
 */

import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/prisma";

const resendApiKey = process.env.RESEND_API_KEY || "";
const emailFrom = process.env.EMAIL_FROM || "onboarding@resend.dev";
const appName = process.env.NEXT_PUBLIC_APP_NAME || "知己";

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
      from: emailFrom,
      maxAge: 10 * 60, // 魔法链接有效期 10 分钟
      sendVerificationRequest: async ({ identifier: email, url }) => {
        // 自定义发邮件 — 直调 Resend HTTP API，不依赖 nodemailer
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: emailFrom,
            to: [email],
            subject: `登录 ${appName}`,
            html: `
              <div style="max-width:480px;margin:40px auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a14;color:#f0f0f0;border-radius:16px;padding:40px;text-align:center">
                <h1 style="font-size:24px;font-weight:700;letter-spacing:2px;color:#ffffff">「${appName}」</h1>
                <p style="font-size:14px;color:#b0b0b0;margin:20px 0">点击下方按钮登录</p>
                <a href="${url}" style="display:inline-block;padding:14px 32px;background:#5B6ABF;color:#ffffff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600">
                  登录
                </a>
                <p style="font-size:12px;color:#707070;margin-top:28px">
                  链接 10 分钟内有效。如果不是你本人操作，请忽略此邮件。
                </p>
              </div>
            `,
          }),
        });

        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Resend API error [${res.status}]: ${body}`);
        }
      },
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
