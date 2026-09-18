/**
 * Official Knowledge & AST Extractor for nstok Repositories.
 * Scans TypeScript (.ts, .tsx) source code and Markdown (.md) documents (PRD, SOP, ADR)
 * and generates knowledge-payload.json and graph.json for Graphify & RAG.
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_NAME = 'nstok-app-POS';
const COMMIT_HASH = process.env.GITHUB_SHA || process.env.COMMIT_HASH || 'manual-local';
const BRANCH = process.env.GITHUB_REF_NAME || process.env.BRANCH || 'main';

console.log(`🌲 [Knowledge Extractor] Memindai repositori: ${REPO_NAME} (Branch: ${BRANCH})...`);

const codeNodes = [];
const documentNodes = [];

function extractImports(code) {
  const imports = [];
  const importRegex = /import\s+(?:[\w\s{},*]+from\s+)?['"](.*?)['"]/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    if (match[1] && !imports.includes(match[1])) {
      imports.push(match[1]);
    }
  }
  return imports;
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'dist', 'graphify-out'].includes(entry.name)) {
        scanDir(fullPath);
      }
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const imports = extractImports(content);
        codeNodes.push({
          nodeId: `${REPO_NAME}::${relPath}`,
          label: entry.name,
          nodeType: 'file',
          sourcePath: relPath,
          codeContent: content.slice(0, 500) + '...',
          dependsOn: imports,
        });
      } else if (entry.name.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        documentNodes.push({
          nodeId: `${REPO_NAME}::docs::${relPath}`,
          label: entry.name,
          nodeType: 'document',
          sourcePath: relPath,
          content: content.slice(0, 1000) + '...',
        });
      }
    }
  }
}

scanDir(process.cwd());

const graphPayload = {
  repository: REPO_NAME,
  version: '3.0.0',
  extractedAt: new Date().toISOString(),
  stats: {
    totalCodeNodes: codeNodes.length,
    totalDocumentNodes: documentNodes.length,
  },
  nodes: [...codeNodes, ...documentNodes],
};

const outDir = path.join(process.cwd(), 'graphify-out');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'graph.json'), JSON.stringify(graphPayload, null, 2), 'utf8');
console.log(`✅ [Knowledge Extractor] Selesai! Disimpan ke graphify-out/graph.json (${codeNodes.length} code nodes, ${documentNodes.length} doc nodes).`);
