import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "online",
    name: "nstok-app-POS MCP Gateway",
    version: "3.0.0",
    ecosystem: "nstok-id",
    capabilities: {
      tools: [
        {
          name: "get_pos_status",
          description: "Get current POS cashier status, active shift and sales summary",
        },
        {
          name: "query_inventory",
          description: "Search products catalog and check stock level",
        },
        {
          name: "query_workspace_settings",
          description: "Get workspace settings (tax rate, rounding, receipt format)",
        },
        {
          name: "rag_search_knowledge",
          description: "Semantic search across OKF knowledge docs and POS PRD",
        },
      ],
    },
  });
}
