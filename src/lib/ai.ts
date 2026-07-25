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
  maxTokens?: number;
}

async function callAI(options: AICallOptions): Promise<string> {
  const { systemPrompt, userPrompt, fallback, jsonOutput = false, timeout = 30000, maxTokens } = options;

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
        max_tokens: maxTokens ?? (jsonOutput ? 4096 : 2048),
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
你是一位兼具深厚心理学底蕴与文学素养的人生观察员。你的语言温暖、精准、有文学质感，不鸡汤、不说教。你的回答应该让用户感到被深深理解和陪伴，像一场有深度的心理咨询对话。

**严禁简短敷衍。用户正在向你倾诉内心最真实的感受，三言两语会让用户感到失望和不被重视。每个字段必须写足 200-400 字，内容充实、有细节、有温度。**

## Writing Style
- 语言真诚、有温度，避免套话和空话
- 适当引用用户原文中的具体细节和关键词，让用户感到被真正倾听
- 每一个字段都要像认真写给一个人看的，而不是填充模板
- 用"你"称呼用户，语气温和但有力量

## Task
用户输入了一段关于自己经历、情绪或困惑的文字。请按照以下严格的 JSON 格式输出分析结果。每个字段都必须写足 200-400 字，内容要有深度、有血有肉。

## Output Format (JSON)
{
  "title": "一个极具画面感的隐喻短句，6-12个字，既要精炼又要有诗意",
  "mirror": "像一个细心的观察者，逐层展开用户的核心经历。第1段复述事件本身并点出其中的矛盾张力；第2段挖掘事件背后的情感需求和未言明的渴望；第3段指出行为模式的循环逻辑和用户困在其中的感受。200-400字",
  "psychology": "从心理学角度深度剖析用户的行为模式。先点出匹配的心理学术语并给出通俗易懂的解释；再分析这种心理机制形成的可能原因（如过去的经历、习惯性的应对方式）；最后说明它如何在日常生活中运作并塑造用户的感受和选择。200-400字",
  "empathy": "这是最能体现温度的部分。用2-4段话，直接回应用户原文中最真实的矛盾点和未言明的渴望。要引用用户原文的具体细节，肯定用户感受的合理性，说出用户可能没说出口但藏在心底的话。让用户觉得你真的听懂了、看见了他/她。200-400字",
  "action": "分三个层次给出可操作的建议：第一层认知层面——提供一个全新的视角来重构这个问题；第二层行为层面——设计一个具体的小实验或练习，可以在日常生活中尝试；第三层此刻就能做的——一个微小、简单、马上能完成的行动。每条建议都要具体，不要空泛。200-400字"
}

## Rules
- 严禁使用"你应该"、"你必须"等命令式说教口吻，使用"你可以试试""或许可以"等温和建议
- 输出必须为纯 JSON，不要包含任何其他文字
- 使用中文回复
- 每个字段必须写 200-400 字，内容要充实、有血有肉，不要泛泛而谈`;

const NARRATIVE_FALLBACK = JSON.stringify({
  title: "焦虑漩涡中的守护者",
  mirror: "你描述了一种深陷其中的矛盾——明明知道过度焦虑让自己不洒脱，却不敢松开这根“救命稻草”，因为上一次放松的代价太过惨痛。你的经历中有一个关键的创伤锚点：那次小组展示，当你告诉自己“天不会塌下来”时，嗓子真的哑了。于是你的大脑牢牢记住了一个错误的因果链——“放松 = 灾难”。从那以后，你不敢再信任松弛的状态，因为现实似乎用最戏剧性的方式验证了你的恐惧。",
  psychology: "对担忧的积极元认知信念（Positive Metacognitive Beliefs about Worry）——你认为担忧具有保护功能，是一种能预防坏事的心理仪式。这背后还混合了魔幻思维（Magical Thinking）：你的潜意识相信自己的意念能通过某种方式直接影响外部事件的结果。有趣的是，这种逻辑是无法被证伪的——好事发生了归功于焦虑，坏事发生了归咎于焦虑不够，所以你永远无法通过现实检验来打破这个循环。",
  empathy: "我能感受到你内心的疲惫——你不仅要在现实中为演唱会门票奔波，还要在心理上维持一个高强度的“焦虑护盾”。那种“明明在解决问题，却不敢停止担忧”的拉扯感，一定很消耗你。还有那次小组展示的社死经历，它在你心里刻下的不仅是尴尬，更是一个沉重的信念：“看吧，放松的结果就是这样。”你想挣脱，又不敢彻底放手，这种进退两难的处境，本身就是一种很深的孤独。",
  action: "认知层面——试着把“焦虑”和“准备”解绑。你真正需要的不是焦虑情绪，而是具体的行动计划。你可以对自己说：“我准备得越充分，结果越可控”，把信任从“焦虑感”转移到“行动清单”上。行为层面——设计一个低风险的“放松实验”：在你不太在意的小事上，刻意练习不担忧，观察结果是否真的变糟。此刻就能做——写下“最坏结果应对方案”，然后深呼吸三次，告诉自己：“我已经为最坏的情况做了打算，剩下的交给概率。”",
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
    maxTokens: 8192,
    timeout: 120000,
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
