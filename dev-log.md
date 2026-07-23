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
