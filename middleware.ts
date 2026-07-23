/**
 * 路由守卫中间件
 *
 * 原则三（权限默认拒绝）：所有路由默认保护，显式白名单放行
 */

import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/login",
  },
});

export const config = {
  matcher: [
    // 保护所有 /main 下的路由
    "/main/:path*",
  ],
};
