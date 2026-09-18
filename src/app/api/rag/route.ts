import { NextResponse } from "next/server";
import { searchKnowledge, KNOWLEDGE_BASE } from "@/lib/rag";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  const results = query ? searchKnowledge(query) : KNOWLEDGE_BASE;

  return NextResponse.json({
    success: true,
    query,
    totalResults: results.length,
    results,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;

    const results = query ? searchKnowledge(query) : KNOWLEDGE_BASE;

    return NextResponse.json({
      success: true,
      query,
      answerSnippet: results.length > 0 ? results[0].content : "Informasi tidak ditemukan.",
      sources: results,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
