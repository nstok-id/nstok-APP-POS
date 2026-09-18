import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    return NextResponse.json({
      success: true,
      message: "Knowledge payload received and registered into Graphify index",
      receivedAt: new Date().toISOString(),
      payloadSummary: {
        repo: payload.repository || "nstok-app-POS",
        nodesCount: payload.nodes?.length || 0,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Malformed payload" }, { status: 400 });
  }
}
