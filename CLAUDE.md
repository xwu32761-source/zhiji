# 知几 (Zhiji)

自我觉察与情绪追踪工具 — 帮助用户记录情绪、探索自我、生成人生使用说明书。

## Tech Stack

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 语言 | TypeScript (strict mode) |
| UI | React 18 + Tailwind CSS v3 |
| 动画 | motion v12 (`motion.div`, `useMotionValue`, `useSpring`) |
| 样式工具 | `tailwind-merge` (via `cn()`) |
| 数据库 | PostgreSQL + Prisma (ORM) |
| AI | DeepSeek API via OpenAI-compatible SDK |
| 图标 | Unicode Emoji (不依赖图标库) |

## Project Structure

```
src/
├── app/
│   ├── api/ai/          # AI API routes (narrative, chat, report, weekly)
│   │   ├── narrative/   # Tab2 叙事模式
│   │   ├── chat/        # Tab2 对话陪伴
│   │   ├── report/      # Tab4 报告生成
│   │   └── weekly/      # Tab3 周报
│   ├── api/v1/entries/  # RESTful entries endpoint
│   ├── main/            # Main app (Tab1-Tab4)
│   │   ├── Tab1.tsx     # 人格支柱 (Pillar questionnaire)
│   │   ├── Tab2.tsx     # 闪电定格 (Emotion diary entry)
│   │   ├── Tab3.tsx     # 日记本 (Diary view with weekly report)
│   │   └── Tab4.tsx     # 人生使用说明书 (Report generation)
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Landing page
│   └── globals.css
├── components/
│   ├── layout/          # BottomTabBar
│   ├── shared/          # ToastManager
│   └── ui/              # Button, Card, ProgressRing, Skeleton, stars, star-button
└── lib/
    ├── ai.ts            # AI调用封装 (DeepSeek API + mock fallback)
    ├── storage.ts       # localStorage helpers
    ├── types.ts         # 共享类型定义
    ├── questions.ts     # 支柱问题数据
    ├── pillars.ts       # 支柱定义
    └── utils.ts         # cn()工具函数
```

## Key Conventions

### 样式
- 深色星空主题：背景 `bg-[#0a0a14]`，毛玻璃 `backdrop-blur-xl bg-white/5 border border-white/[0.06]`
- 使用 `cn()` 处理 Tailwind class 合并（基于 `tailwind-merge`）
- 字体栈：`"PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif`（避免 Google Fonts 被墙）

### 数据流
- 无需后端认证：当前 MVP 纯客户端，数据存 `localStorage`
- 存储 key 统一由 `src/lib/storage.ts` 的 `KEYS` 常量定义
- Tab1 支柱答案 → `zhiji_pillar_answers_v2`
- Tab2 日记条目 → `zhiji_diary_entries`
- Tab3 从 localStorage 读取并按日期分组
- Tab4 读取 Tab1 + Tab2 数据计算进度

### 组件
- 导航栏固定在底部，4 个 tab：Tab1~Tab4
- StarBackground 固定 `fixed inset-0 -z-10`
- 动画：`animate-breathe` 呼吸效果用于关键按钮

### API (当前环境限制)
- AI 调用封装在 `src/lib/ai.ts`，`callAI()` 函数统一处理 API 调用
- 降级策略：`AI_API_KEY` 为空或 `AI_MODEL=mock` 时返回 mock 数据
- 外部 API 调用带 30s 超时，失败返回 fallback

---

# 项目开发宪法（强制执行）

你是本项目的编码执行者。在生成任何代码之前，必须严格遵循以下全局原则，违反以下任一条的代码视为无效：

## 原则一：数据与状态必须抽象（防塌方）

**禁止硬编码**：所有业务规则（会员等级、折扣逻辑、状态值）必须以枚举（Enum）或常量（Constants）定义，严禁散落在页面或接口逻辑中。

**状态机驱动**：涉及流程（订单、审核、任务）必须使用状态机模式。变更状态必须记录时间戳和操作人，不能只修改一个 status 字符串。

**数据库设计**：必须先画 ER 图。表名、字段名必须统一命名规范（如蛇形命名），必须包含 created_at 和 updated_at。

**当前项目现状**：MVP 阶段数据存 localStorage，未使用数据库。引入 DB 后需补 ER 图并遵循本条。

## 原则二：防御式编程（防崩溃）

**永不信任外部输入**：所有 API 入参必须做类型校验和范围校验。

**全局异常捕获**：所有异步操作（数据库查询、第三方 API）必须有 try-catch，并记录完整堆栈日志。

**重试与熔断**：调用外部接口（支付、短信）必须实现指数退避重试（最多 3 次），且设置超时时间。

**日志覆盖**：关键路径（注册、登录、支付、核心业务动作）必须打印结构化日志（含 request_id），以便追踪。

## 原则三：权限默认拒绝（防脱库）

**服务层校验**：不仅前端要隐藏按钮，后端接口必须在 Service 层进行角色（Role）和资源（Resource）校验。

**数据隔离**：所有查询列表接口必须隐式带上当前用户的 user_id 或 tenant_id，防止横向越权（用户 A 看用户 B 的数据）。

**敏感信息脱敏**：日志和接口返回中，密码、手机号、身份证必须脱敏（如 138****1234）。

## 原则四：架构可维护（防重构）

**分层解耦**：严格遵循 Controller → Service → Repository 三层结构。AI 生成的代码严禁在 Controller 里写业务逻辑。

**模块划分**：功能边界清晰（如 auth、user、order、payment 分目录），禁止将所有代码堆在 utils 或 common 文件夹。

**文档同步**：核心接口必须生成 OpenAPI（Swagger）注释。
