import { NextResponse } from "next/server";

const API_KEY = process.env.AI_API_KEY || "";
const MODEL = process.env.AI_MODEL || "deepseek-chat";

export async function GET() {
  const info = {
    MODEL,
    API_KEY_SET: !!API_KEY,
    API_KEY_PREFIX: API_KEY ? API_KEY.slice(0, 8) + "..." : "",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "",
  };

  // Try a minimal API call
  let apiTest: any = { status: "not_tested" };
  if (API_KEY) {
    try {
      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: "Say OK in 2 words" }],
          max_tokens: 100,
        }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();
      apiTest = {
        status: res.status,
        content: data.choices?.[0]?.message?.content || "(empty)",
        hasReasoning: !!data.choices?.[0]?.message?.reasoning_content,
        error: data.error?.message,
      };
    } catch (e: any) {
      apiTest = { status: "error", error: e.message };
    }
  }

  return NextResponse.json({ info, apiTest });
}
