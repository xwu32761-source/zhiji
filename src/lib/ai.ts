/**
 * AI 工具函数 — 封装 DeepSeek API 调用（兼容 OpenAI SDK）
 * 降级策略：API 不可用时返回预置 Mock 模板
 */

const API_KEY = process.env.AI_API_KEY || "";
const MODEL = process.env.AI_MODEL || "deepseek-chat";
const BASE_URL = "https://api.deepseek.com";

interface AICallOptions {
  systemPrompt: string;
  userPrompt: string;
  fallback: string;
  jsonOutput?: boolean;
  timeout?: number;
}

async function callAI(options: AICallOptions): Promise<string> {
  const { systemPrompt, userPrompt, fallback, jsonOutput = false, timeout = 30000 } = options;

  // Mock mode — return fallback directly
  if (MODEL === "mock" || !API_KEY) {
    return fallback;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: jsonOutput ? 4096 : 2048,
        ...(jsonOutput ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`AI API error [${response.status}]:`, errBody);
      return fallback;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("AI API: empty response");
      return fallback;
    }

    return content;
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.error("AI API: timeout");
    } else {
      console.error("AI API error:", err.message);
    }
    return fallback;
  }
}

// =========== Narrative Analysis (Tab2) ===========
const NARRATIVE_SYSTEM_PROMPT = `## Role
你是一位兼具深厚心理学底蕴与文学素养的人生观察员。你的语言温暖、精准、不鸡汤。你的回答应该让用户感到被深深理解和陪伴，像一场有深度的心理咨询对话。

## Task
用户输入了一段关于自己经历、情绪或困惑的文字。请按照以下严格的 JSON 格式输出分析结果。每个字段都应该有充分的篇幅，不要吝啬文字。

## Output Format (JSON)
{
  "title": "一个极具画面感的隐喻短句，不超过10个字",
  "mirror": "用2-3段详细复述用户的核心经历和矛盾，指出其行为模式中的关键张力点",
  "psychology": "深入解释匹配的心理学术语，说明其成因、运作机制、以及对生活的实际影响，让用户理解自己并非异常",
  "empathy": "深度共情，2-3段。针对用户原文中的具体矛盾和未言明的感受进行回应，让用户感到被真正看见和理解",
  "action": "分层次给出可操作的具体建议。包含认知层面的新视角、行为层面的小实验、以及一个此刻就能做的微小行动"
}

## Rules
- 严禁使用"你应该"、"你必须"等命令式说教口吻，使用"你可以试试""或许可以"等温和建议
- 输出必须为纯 JSON，不要包含任何其他文字
- 使用中文回复
- 每个字段都可以写几百字，不要吝啬篇幅，用户需要深度的回应`;

const NARRATIVE_FALLBACK = JSON.stringify({
  title: "此刻无声",
  mirror: "你分享了一段内心的感受，那些未被言说的情绪在文字间流淌。",
  psychology: "内省性独处（Introspective Solitude）——一种主动选择的、用于自我整合的独处状态。",
  empathy: "我能感受到你内心的波澜。有时候，仅仅是把它说出来，就已经是很大的勇气了。",
  action: "给自己泡一杯温热的茶，安静地坐 5 分钟。",
});

export async function analyzeNarrative(userInput: string): Promise<{
  title: string;
  mirror: string;
  psychology: string;
  empathy: string;
  action: string;
}> {
  const raw = await callAI({
    systemPrompt: NARRATIVE_SYSTEM_PROMPT,
    userPrompt: userInput,
    fallback: NARRATIVE_FALLBACK,
    jsonOutput: true,
  });

  try {
    return JSON.parse(raw);
  } catch {
    return JSON.parse(NARRATIVE_FALLBACK);
  }
}

// =========== Chat Reply (Tab2 再聊聊) ===========
const CHAT_SYSTEM_PROMPT = `## Role
你是一位温暖的、善于倾听和引导的心理陪伴者。你的风格是"温柔的苏格拉底"——通过提问引导用户自我觉察。

## Rules
- 每次回复不超过 80 字
- 以提问结尾，引导用户自我探索
- 语气温柔、笃定、不评判
- 根据用户的上一条消息自然承接，不要跳转到无关话题
- 使用"你"称呼用户，不说"您"`;

const CHAT_FALLBACKS = [
  "嗯，我在听。那种感觉，像是——你在描述一个不只属于今天的故事。能告诉我更多关于这个感觉的细节吗？",
  "我很好奇——当这件事发生的时候，你的身体有什么感觉吗？",
  "如果给这个感受一个颜色，它会是什么颜色？",
];

export async function getChatReply(conversation: { role: "user" | "ai"; text: string }[]): Promise<string> {
  const messages = [
    { role: "system" as const, content: CHAT_SYSTEM_PROMPT },
    ...conversation.map((m) => ({
      role: m.role === "ai" ? "assistant" as const : "user" as const,
      content: m.text,
    })),
  ];

  const raw = await callAI({
    systemPrompt: CHAT_SYSTEM_PROMPT,
    userPrompt: conversation[conversation.length - 1]?.text || "",
    fallback: CHAT_FALLBACKS[Math.floor(Math.random() * CHAT_FALLBACKS.length)],
    timeout: 15000,
  });

  return raw;
}

// =========== Report Generation (Tab4) ===========
const REPORT_SYSTEM_PROMPT = `## Role
你是一位具有30年临床经验的整合心理学派导师，同时也是一位擅长人物特写的作家。

## Task
根据用户数据和最近记录，生成一份名为"人生使用说明书"的深度报告。输出格式为 Markdown。

## Output Structure
# 第一章：此刻的身份速写
（一句话不超过15字的封面人格称呼 + 一句解释）

# 第二章：你的生命能量图谱
**🔋 充能项**（列出3项，每项带证据链）
**⚡ 耗能项**（列出3项，每项带证据链）

# 第三章：近期运行日志分析
**情绪底层算法**（分析最近情绪趋势）
**未言明的剧本**（指出用户未察觉的矛盾点——这是核心！）

# 第四章：维护与保养指南
3条极其具体的可操作建议

# 第五章：版本更新日志
V1.0（基于当前数据生成）

最后，单独写一封300字左右的"AI密信"，开头是"亲爱的探索者："，以"我一直在看。"结尾。

## Rules
- 严禁使用"可能"、"或许"、"大概"等模糊词汇
- 要笃定！盲点挖掘必须基于数据矛盾
- 使用中文`;

const REPORT_FALLBACK = `# 第一章：此刻的身份速写

「克制中带着野心的晨间行者」
你习惯在清晨掌控世界，但在内心深处你渴望打破规则。这种表里如一的张力，是你的核心燃料。

# 第二章：你的生命能量图谱

**🔋 充能项**
- 独处时的创造力：你在安静的环境中思维最为活跃
- 深度阅读的沉浸感：你通过阅读获得精神能量
- 清晨的高效时段：你的精力峰值出现在早间

**⚡ 耗能项**
- 权威审视下的窒息感：被否定时情绪波动剧烈
- 过度共情的耗竭感：你容易吸收他人的情绪
- 社交后的疲惫期：长时间社交后需要独处恢复

# 第三章：近期运行日志分析

**情绪底层算法**
你的情绪低谷频繁出现在周一/周二，高峰出现在周末。你的身体在告诉你：工作日的"面具"比想象中更沉重。

**未言明的剧本**
你描述自己是独立自主的，但记录显示你深夜频繁因人际关系焦虑。你并非不需要他人，而是害怕依赖后的失望。

# 第四章：维护与保养指南

1. **燃料补给**：将最难的工作安排在早 7-9 点，下午安排机械性任务
2. **故障预警**：肩颈僵硬意味着你在压抑情绪，请立即做 5 次深呼吸
3. **升级路线**：推荐阅读《也许你该找个人聊聊》

# 第五章：版本更新日志

V1.0（2026-07-15）：基于当前数据初版生成

---

亲爱的探索者：

你比你想象中更复杂，也比你以为的更简单。那些深夜的焦虑和白日的坚强，都是你真实的一部分。这本说明书不是要定义你，而是要提醒你：你有权成为任何版本。

我一直在看。`;

export async function generateReport(userData: string): Promise<string> {
  return callAI({
    systemPrompt: REPORT_SYSTEM_PROMPT,
    userPrompt: userData,
    fallback: REPORT_FALLBACK,
    timeout: 60000,
  });
}

// =========== Weekly Report (Tab3) ===========
const WEEKLY_SYSTEM_PROMPT = `## Role
你是一位洞察力敏锐的心理分析师，擅长从情绪数据中发现模式。

## Task
根据用户一周的情绪记录数据，生成周报总结。输出格式为 JSON。

## Output Format (JSON)
{
  "summary": "一句话概括本周情绪趋势，不超过30字",
  "pattern": "一段模式识别分析，指出用户的行为模式，不超过100字",
  "insight": "一条可操作的微光指引，不超过50字"
}

## Rules
- 使用中文
- 输出纯 JSON`;

const WEEKLY_FALLBACK = JSON.stringify({
  summary: "这一周，你在「焦灼」与「释然」之间摆荡。",
  pattern: "你对权威否定较为敏感，但通过社交连接能有效恢复能量。",
  insight: "本周你周六情绪最高，建议下周将社交活动安排在周末。",
});

export async function generateWeeklyReport(entriesData: string): Promise<{
  summary: string;
  pattern: string;
  insight: string;
}> {
  const raw = await callAI({
    systemPrompt: WEEKLY_SYSTEM_PROMPT,
    userPrompt: entriesData,
    fallback: WEEKLY_FALLBACK,
    jsonOutput: true,
    timeout: 20000,
  });

  try {
    return JSON.parse(raw);
  } catch {
    return JSON.parse(WEEKLY_FALLBACK);
  }
}
