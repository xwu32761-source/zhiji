# 开发日志

记录开发过程中遇到的问题、根因和解决方案。

---

## 2026-07-21 UI 主题改造问题

### 1. Landing 页文字居左

- **问题**：Landing 页引导文字显示为左对齐，预期居中。
- **根因**：外层 div 虽加了 `text-center`，但段落未显式继承，部分场景下 CSS 优先级导致未生效。
- **解决**：给每个 `<p>` 元素显式添加 `text-center` class。

### 2. Tab1 星星背景不显示

- **问题**：进入 Tab1 后背景为纯深色，星空特效不可见。
- **根因**：`cn()` 工具函数使用简单的 `filter(Boolean).join(" ")`，未经过 `tailwind-merge`。`StarsBackground` 组件默认 class 包含 `relative`，外部使用时传入 `fixed`（或 `absolute`），两者同类名冲突。浏览器按 CSS 源顺序择优，`relative` 胜出 → 容器高度为父级 100%（父级高度由内容撑起），`overflow: hidden` 将渐变背景和星星全部裁掉。
- **解决**：安装 `tailwind-merge`，重写 `cn()` 使用 `twMerge()` 自动解决冲突 class（`fixed` 优先于 `relative`）。

### 3. StarsBackground 星星密度过低

- **问题**：即便星星渲染成功，星点过少（~32 颗可见），远看像没有。
- **根因**：`generateStars` 在 4000×4000 范围内散布 1000/400/200 个点，viewport 内可见比例仅约 2%。
- **解决**：散布范围缩至 0-2000，三层星点数量提升至 3000/800/400。

### 4. next/font/google 构建失败

- **问题**：`npx next build` 卡死，最终超时失败。
- **根因**：引入 `Inter` 字体（`next/font/google`），构建时需从 Google Fonts 下载字体文件。Google 在国内被墙，请求 `fonts.gstatic.com` 超时/断连。
- **解决**：移除 `next/font/google` 依赖，改用系统字体堆栈（`PingFang SC`, `Noto Sans SC`, `Microsoft YaHei` 等），通过 `tracking-wide` 字距和字体权重控制实现高级感。

### 5. BottomTabBar 白底不匹配深色主题

- **问题**：底部导航栏为白色背景，与深色星空主题不协调。
- **根因**：`bg-white`、`text-text-secondary` 等来自旧主题的 class 未随 UI 改造更新。
- **解决**：改为 `bg-[#0a0a14]/80 backdrop-blur-xl` 半透明深色毛玻璃效果，文字改为 `text-white/50` / `text-white`。

### 6. Tab1 文字和图标颜色过淡

- **问题**：卡片文字、状态提示、选项按钮等颜色太淡，视觉上不够突出。
- **根因**：`text-white/50`、`text-white/60` 透明度太高，在深色背景下对比度不足。
- **解决**：统一提升透明度层级：`/50` → `/70`，`/60` → `/80`；主标题增加 `tracking-wider`，卡片名称改为 `font-semibold tracking-wide` 增强视觉层级。

---

## 2026-07-22 用户认证 + 服务端数据存储

### 1. Vercel 部署后邮件发送失败（createTransport 不是函数）

- **问题**：点击发送登录邮件后页面提示发送失败，Vercel 日志报 `(0 , n.createTransport) 不是一个函数`。
- **根因**：next-auth v4 的 EmailProvider 默认使用 nodemailer 发 SMTP 邮件。nodemailer 在 Vercel serverless 运行时中不可用。
- **解决**：移除 SMTP 配置，改为自定义 `sendVerificationRequest` 直调 Resend HTTP API（`POST https://api.resend.com/emails`），不依赖 nodemailer。

### 2. NEXTAUTH_URL 配置错误导致登录链接 404

- **问题**：用户收到魔法链接邮件，点击链接显示 404 页面。
- **根因**：Vercel 环境变量 `NEXTAUTH_URL` 设置为旧域名 `zhiji.vercel.app`，但实际部署域名为 `zhiji-bxmn.vercel.app`，邮件中的链接指向了错误的域名。
- **解决**：将 `NEXTAUTH_URL` 更新为正确的 Vercel 域名。

## 2026-07-24 数据流 + UI 交互修复

### 1. 支柱进度始终显示 0%（API 空数据覆盖本地数据）

- **问题**：答完 3 个支柱各 3 题后，Tab1 进度圈显示 0/12，Tab4 支柱进度显示 0/3。
- **根因**：`PUT /api/v1/pillars` 的 Prisma upsert `create` 分支漏了 `pillarData`，新用户首次保存时 `pillarData` 为 `null`/`{}`。Tab1 和 Tab4 的 `apiFetchPillars()` 检测到 `pillarData: {}`（空对象，JS 真值）后覆盖了 localStorage 中的真实数据。
- **解决**：① `create` 分支补上 `pillarData` 字段；② Tab1 和 Tab4 加载 API 数据时增加 `Object.keys().length > 0` 守卫，只有 API 返回有效数据时才覆盖本地数据。

### 2. Tab4 页面渲染闪跳

- **问题**：Tab4 页面显示 1 秒后自动跳到"你的专属说明书正在沉睡"空状态。
- **根因**：组件初始状态 `state = "insufficient"`，async useEffect 中的数据加载函数是异步的，首次渲染时数据还未就绪，状态错误。
- **解决**：增加 `dataLoaded` 标志，数据加载完成前只渲染空白占位 div，阻止错误状态闪现。

### 3. 答完 3 题后无法继续答题

- **问题**：每个支柱答完 3 题后直接跳到回顾页，跳过了选择页，无法选择继续答题。
- **根因**：`PASSING_QS = 3` 导致 `isDone = true`，`handleSubmit` 直接 `setPhase("reviewing")`，跳过了 `"choosing"` 阶段。同时 phase 初始化时 `answeredCount >= PASSING_QS` 也直接进入 `"reviewing"`。
- **解决**：① `handleSubmit` 无论是否 `isDone` 都进入 `"choosing"` 阶段；② phase 初始化改为 `answeredCount === 0 ? "answering" : "reviewing"`，已有答案的支柱先进回顾页；③ 回顾页的"继续答题"按钮直接进入 `"answering"` 阶段（答题页），选择页只在提交后出现。

### 4. 叙事模式未存入时光日记

- **问题**：叙事疗愈生成报告后点击"存入今日日记"，日记中看不到任何记录。
- **根因**：`handleSaveAndReturn` 只显示 Toast 并重置状态，没有将叙事结果保存为日记条目。
- **解决**：在 `handleSaveAndReturn` 中调用 `saveEntry()`，将叙事分析结果（标题、镜文、完整报告 JSON）作为 `entryType: "narrative"` 的日记条目保存。

### 5. Tab3 时光日记中叙事条目无详情查看

- **问题**：叙事条目在日记中只显示为普通标签，无法查看完整报告。
- **根因**：`DayGroupItem` 接口缺少 `entryType` 和 `aiHook` 字段，数据在 `groupEntriesByDate` 中丢失。
- **解决**：① `DayGroupItem` 增加 `entryType` 和 `aiHook`；② 叙事条目显示紫色 `📖 标题` 标签；③ 点击弹出完整报告弹窗，展示四层分析内容。

### 6. 叙事模式 AI 回答太简短

- **问题**：叙事模式输出的分析只有一句话一段，缺乏共鸣和深度。
- **根因**：`NARRATIVE_SYSTEM_PROMPT` 中每个字段都有硬性字数限制（≤80字、≤100字、≤30字），`max_tokens = 4096` 也不足以支撑长输出。
- **解决**：① 移除字数限制，改为明确的"200-400字"目标；② `max_tokens` 从 4096 提升到 8192；③ 超时从 30s 延长到 120s。

---

## 2026-07-25 叙事 API 故障 + Prompt 深度优化

### 1. 叙事模式无论输入什么，都输出固定 fallback 内容

- **问题**：输入任何文字，叙事分析都返回"焦虑漩涡中的守护者"（fallback）。
- **根因**：DeepSeek API 模型名已变更，`deepseek-chat` 不再受支持。API 返回 400 错误（`invalid_request_error`），`callAI` 触发 fallback 路径。支持的模型名为 `deepseek-v4-pro` 或 `deepseek-v4-flash`。
- **解决**：`.env` 中 `AI_MODEL=deepseek-chat` 改为 `AI_MODEL=deepseek-v4-flash`。

### 2. 叙事分析依旧不够长

- **问题**：即使 prompt 要求 200-400字/字段，输出仍然偏短。
- **根因**：逐字段设字数下限过于机械，模型倾向于产出刚好达标的最短内容。
- **解决**：移除 per-field "200-400字" 硬约束，改为整篇目标 500-2000 字，根据用户输入深度自然调节。同时强化了每个字段的写作指引（逐层展开、引用原文、分三层建议等），让模型有更丰富的内容框架可循。

### 3. DeepSeek 模型升级导致 API 全部走 fallback

- **问题**：叙事模式始终输出固定的"焦虑漩涡中的守护者"（fallback），无论输入什么。
- **根因**：① DeepSeek 淘汰了 `deepseek-chat` 模型，新模型名为 `deepseek-v4-pro` / `deepseek-v4-flash`，旧名返回 400 错误；② V4 是推理模型（reasoning model），先输出 `reasoning_content`（思考过程）再输出 `content`（回答），`max_tokens` 不足时 `content` 为空；③ `response_format: { type: "json_object" }` 与推理模型不兼容，不应传入。
- **解决**：① `.env` 中 `AI_MODEL=deepseek-chat` → `AI_MODEL=deepseek-v4-flash`；② `callAI` 检测 `deepseek-v4-` 前缀的模型时跳过 `response_format`，并提高默认 `max_tokens` 至 16384；③ `analyzeNarrative` 改为从回复中用正则提取 JSON（推理模型可能在 JSON 前后输出多余文字）；④ 增加 `content` 为空时回退到 `reasoning_content` 的逻辑。

---

## 2026-07-26 修复流程自省与标准化

### 1. 叙事条目显示异常（多轮修复）

- **问题**：叙事条目行显示"📖 标题 + mirror全文"，点击不弹窗。
- **首轮修复**：隐藏 note 文字（`Tab3.tsx` 单行改动）—— 无效，因为根因是 API 数据通路。
- **根因**：① `api-client.ts` 的 `createEntry` 和 `ApiEntry` 没有 `aiHook` 字段；② `POST /api/v1/entries` 不接受也不保存 `aiHook`；③ Tab3 的 `useEffect` 用 API 数据（缺 aiHook）完全覆盖了本地数据（有 aiHook）；④ `isNarrative` 判断失效。
- **漏掉原因**：直接改渲染层，没有追溯完整的保存→传输→加载数据链。
- **最终解决**：4 个文件联动修改（API 路由 + api-client + Tab2 + Tab3），并加入存量数据合并逻辑。

### 2. 自我诊断：重复失败模式

回顾近期 bug 修复，发现三个系统性模式：

| 模式 | 表现 | 示例 |
|------|------|------|
| 治标不治本 | 看见症状直接改表现层，不追数据源头 | 叙事条目：改 JSX 隐藏文字而不是追 aiHook 为什么丢了 |
| 单层排查 | 找到一个原因就动手，不全面排查所有可能层 | DeepSeek：改 prompt→改参数→改模型名→改部署，逐层试 |
| 不改验证 | 只跑 `npm run build`，不走真实用户流程验证 | 两个 bug 都是"类型检查通过"但功能还是坏的 |

### 3. 改进措施

**三段式 Bug 修复流程（强制执行）：**

**阶段一：追根溯源** — 动代码前，完整追踪数据链，每个环节记录实际值和预期值：
```
源 → 存 → 读 → 转换 → 渲染
```

**阶段二：分层排查** — 列出所有可能层，逐层判断：
```
UI层 → 数据层 → 存储层 → 外部依赖层 → 部署层
```

**阶段三：改后验证** — 必须走真实用户流程确认修复生效，不能只靠 `npm run build`。

已创建 memory 文件固化此流程到每次会话。

---

## 2026-07-26 时光日记数据不稳定 + 叙事条目重复

### 1. 时光日记页条目显示不全（切 tab 后恢复）

- **问题**：保存闪电定格或叙事条目后切到 Tab3，条目不全（有时只显示最新一条、有时只显示旧的），再切走切回（组件 remount）后恢复正常。
- **首轮修复**：改 API merge 为"本地为主、API 补充"——无效，问题依旧。
- **根因**：`saveEntry` 是 async 但未被 `await`，且 `apiFetchEntries()` 的 GET 响应在 Tab3 的 `init()` async 闭包中触发 `setEntries(merged)`，覆盖了 `setEntries(local)` 的结果。两条数据通路（localStorage ↔ API）存在 race condition，React 18 的 async 闭包使 `local` 变量在不同时序下不可靠。
- **最终解决**：Tab3 `init()` 改为纯 localStorage 驱动——`setEntries(loadEntries())`，彻底移除 API merge。`saveEntry` 已改为先 `saveEntryLocal`（同步）再 `apiCreateEntry`（异步），localStorage 始终是最完整的数据源。

### 2. 叙事条目重复显示（📖 标题 + 全文），之前修复过的 bug 复发

- **问题**：叙事条目行显示"📖 标题 + mirror全文"，点击不弹窗。和 `2026-07-26` 第一节记录的叙事条目 bug 相同症状。
- **根因**：
  - API route 存储 `entryDate: new Date(now.getFullYear(), now.getMonth(), now.getDate())`，此 Date 通过 `NextResponse.json()` 序列化为 UTC ISO 字符串（北京时间 +8 区 → 倒退一天）。如北京 7/26 → `"2026-07-25T16:00:00.000Z"`。
  - 本地存储 `entryDate` 为 `todayStr()` → `"2026-07-26"`。
  - Tab3 的 API merge 用 `entryDate.slice(0, 10)` 作为匹配 key，本地和 API 的 key 因日期格式不同**永远不相等**。
  - 这导致两个隐藏 bug 从未被发现：
    1. aiHook 补充环节从未真正匹配到任何条目（但本地已有 aiHook，所以表面正常）
    2. **"补充 API-only 条目"将每个叙事条目错误追加为重复副本**——API 副本的 `aiHook` 为 `null`（旧数据），`isNarrative` 判断失败，`note`（mirror 全文）暴露在外
- **为何复发**：dev-log 记录的"最终解决"中的"存量数据合并逻辑"依赖日期格式匹配去重，但匹配从一开始就因日期格式不匹配而不工作。重复条目一直存在，只是未被注意到。
- **漏掉原因**：修复时只验证了"本地条目有 aiHook"和"API 条目有 aiHook"，没有验证**匹配 key 是否真正相等**。没有检查 API 与本地 `entryDate` 的格式化差异。
- **最终解决**：移除 Tab3 所有 API merge 逻辑，localStorage 为唯一数据源（`setEntries(loadEntries())`）。`saveEntryLocal` 始终在 `apiCreateEntry` 之前同步运行，本地数据始终完整。

---

## 2026-07-30 叙事模式固定 fallback + 邮箱→用户名密码登录

### 1. 叙事模式无论输入什么，都输出固定 fallback 内容（"深夜独处的思考时刻"）

- **问题**：叙事模式输入任何文字，返回标题为"深夜独处的思考时刻"的固定内容。
- **根因**：不是 DeepSeek 模型名问题。`EMAIL_LOGIN_DISABLED=true` 时，middleware 放行 `/main` 页面访问但不创建 session。API 路由（`/api/ai/narrative`）调用 `getServerSession(authOptions)` 返回 null，返回 401。Tab2 的 `handleNarrativeSubmit` 中 `catch` 捕获 401，设置硬编码 fallback `{ title: "深夜独处的思考时刻", ... }`。
- **解决**：创建 `src/lib/session.ts` 统一认证函数 `requireSession()`，在 4 个 AI 路由（narrative、chat、report、weekly）中用 `requireSession()` 替代直接 `getServerSession`。匿名回退逻辑仅在 `EMAIL_LOGIN_DISABLED` 期间有效。

### 2. 邮箱登录→用户名+密码登录重构

- **移除**：EmailProvider（Resend 发魔法链接）、verify-request 页面、EMAIL_LOGIN_DISABLED、ConsentBanner
- **新增**：CredentialsProvider（用户名+密码）、注册 API（`/api/auth/register`）、tab 切换登录/注册页
- **Schema**：User 模型加 `username`（unique）和 `passwordHash` 字段
- **隐私确认**：从登录后 ConsentBanner 移到注册表单内勾选

---

### 3. 自我复盘：本次修复违背了哪条原则

| 原则 | 违背表现 |
|------|----------|
| 追数据链 | 第一次修"数据不全"时，只看了 merge 逻辑，没去检查 `apiFetchEntries` 返回的 `entryDate` 实际格式和 local 是否一致 |
| 改后验证 | 上次改完只跑了 `npx tsc` 和检查了 UI 渲染，没用真实网络请求验证 merge 后的数组内容 |
| 一层层排查 | 一直在 JSX 渲染层和 React state 层打转，没有去查 API 序列化后的实际 JSON 结构 |
