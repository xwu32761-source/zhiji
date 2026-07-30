# 客户端 localStorage 清理机制 实施计划

## Context

Phase 3（数据安全）第四项。当前 Tab4 底部已有一个简单的"🗑️ 清除本地数据"按钮（`Tab4.tsx:580-586`），内联执行 `localStorage.removeItem()` 并刷新。需要标准化为可复用的清理机制：确认流程 + 反馈提示 + 统一工具函数。

---

## 实施步骤

### Step 1: `src/lib/storage.ts` — 新增 `clearLocalData()` 函数

将目前 Tab4 内联的逻辑抽象为可复用函数：

```typescript
/** 清除所有本地缓存数据 */
export function clearLocalData(): string[] {
  const removed: string[] = [];
  // 清除 KEYS 中定义的全部数据
  for (const k of Object.values(KEYS)) {
    try { localStorage.removeItem(k); removed.push(k); } catch {}
  }
  // 清除额外的旧版 key
  try { localStorage.removeItem("zhiji_pillar_answers_v2"); removed.push("zhiji_pillar_answers_v2"); } catch {}
  return removed;
}
```

### Step 2: `src/app/main/Tab4.tsx` — 替换内联实现

#### 2a. 新增导入
```typescript
import { clearLocalData } from "@/lib/storage";
import { useToast } from "@/components/shared/ToastManager";
```

#### 2b. 新增状态
```typescript
const [showClearConfirm, setShowClearConfirm] = useState(false);
```

#### 2c. 新增 `handleClearData` 函数
```typescript
const handleClearData = () => {
  clearLocalData();
  setShowClearConfirm(false);
  showToast("本地数据已清除", "info");
};
```

等待 toast 显示后再 reload：
```typescript
const handleClearData = () => {
  clearLocalData();
  setShowClearConfirm(false);
  showToast("本地数据已清除", "info");
  // 延迟 reload 让用户看到 toast
  setTimeout(() => window.location.reload(), 800);
};
```

#### 2d. 替换内联按钮
"🗑️ 清除本地数据" 按钮改为打开确认弹窗：
- 点击 → `setShowClearConfirm(true)`
- 确认弹窗提示："将清除全部本地缓存数据（问卷答案、日记、报告等）。建议先导出数据。"
- 两个按钮："取消"+"确认清除"

#### 2e. 清除确认弹窗 UI
仿照账号注销确认弹窗风格，放在数据管理区域：
```tsx
{showClearConfirm && (
  <div className="mt-4 max-w-xs mx-auto bg-white/5 border border-white/[0.06] rounded-xl p-4 text-center animate-[fadeIn_0.2s_ease-out]">
    <p className="text-sm text-white/90 mb-1 font-medium">⚠️ 清除本地数据</p>
    <p className="text-xs text-white/50 mb-4 leading-relaxed">
      将清除全部本地缓存数据（问卷答案、日记、报告等），此操作不可撤销。建议先导出数据。
    </p>
    <div className="flex gap-2 justify-center">
      <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 rounded-lg text-xs text-white/60 bg-white/10 hover:bg-white/20 transition-colors">取消</button>
      <button onClick={handleClearData} className="px-4 py-2 rounded-lg text-xs text-white bg-secondary/70 hover:bg-secondary/90 transition-colors">确认清除</button>
    </div>
  </div>
)}
```

---

## 涉及文件

| 操作 | 文件 |
|------|------|
| 修改 | `src/lib/storage.ts` — 新增 `clearLocalData()` |
| 修改 | `src/app/main/Tab4.tsx` — 替换为带确认和 toast 的清理流程 |

---

## 验证方法

1. **TypeScript**: `npx tsc --noEmit` 无错误
2. **点击清除**: 弹出确认弹窗，文字完整
3. **取消**: 弹窗关闭，数据不受影响
4. **确认清除**: localStorage 中 `zhiji_*` 全部 key 被删除，toast 提示"本地数据已清除"，页面自动刷新
