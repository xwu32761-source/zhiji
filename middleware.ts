/**
 * 路由守卫中间件
 *
 * 原则三（权限默认拒绝）：所有路由默认保护，显式白名单放行
 *
 * 邮箱登录关闭期间（NEXT_PUBLIC_EMAIL_LOGIN_DISABLED=true），关闭拦截，
 * 用户无需登录即可使用（数据仅存 localStorage）。
 */

import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized: ({ token }) => {
      // 邮箱登录关闭期间，不拦截任何请求
      if (process.env.NEXT_PUBLIC_EMAIL_LOGIN_DISABLED === "true") {
        return true;
      }
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    // 保护所有 /main 下的路由
    "/main/:path*",
  ],
};
