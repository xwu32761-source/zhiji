import { NextRequest, NextResponse } from "next/server";

// Mock entry creation — will be connected to Prisma when DB is available
const entries: Record<string, any[]> = {};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { anonymousId, entryType, coreTag, intensity, source, note } = body;

    if (!anonymousId || !entryType) {
      return NextResponse.json(
        { error: "缺少必要字段" },
        { status: 400 }
      );
    }

    const entry = {
      id: crypto.randomUUID(),
      anonymousId,
      entryType,
      coreTag: coreTag || null,
      intensity: intensity || null,
      source: source || null,
      note: note || null,
      score: scoreFromTag(coreTag),
      entryDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    if (!entries[anonymousId]) entries[anonymousId] = [];
    entries[anonymousId].push(entry);

    return NextResponse.json(entry, { status: 201 });
  } catch (err: any) {
    console.error("Entry API error:", err);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const anonymousId = searchParams.get("anonymousId");
  const date = searchParams.get("date");

  if (!anonymousId) {
    return NextResponse.json({ error: "缺少 anonymousId" }, { status: 400 });
  }

  const userEntries = entries[anonymousId] || [];
  let filtered = userEntries;

  if (date) {
    filtered = userEntries.filter((e: any) =>
      e.entryDate.startsWith(date)
    );
  }

  // Return sorted by date DESC
  filtered.sort((a: any, b: any) =>
    new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
  );

  return NextResponse.json({ entries: filtered, total: filtered.length });
}

function scoreFromTag(tag?: string): number {
  const positive = ["开心", "平静", "爱", "信任", "满足", "感恩"];
  const negative = ["焦虑", "恐惧", "愤怒", "悲伤", "厌恶", "压力"];
  if (!tag) return 0;
  if (positive.some((p) => tag.includes(p))) return Math.floor(Math.random() * 3) + 2;
  if (negative.some((n) => tag.includes(n))) return -(Math.floor(Math.random() * 3) + 2);
  return 0;
}
