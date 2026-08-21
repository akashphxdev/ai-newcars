#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const MEMORY_DIR = path.join(PROJECT_ROOT, "scripts", "memory");
const MEMORY_FILE = path.join(MEMORY_DIR, "memory.jsonl");
const MAX_CONTENT_CHARS = 2000;
const MAX_RESULTS = 20;

const SECRET_RE =
  /(api[_-]?key|token|secret|password|credential|database_url|postgres:\/\/|mysql:\/\/|mongodb(\+srv)?:\/\/|jwt|bearer\s+[a-z0-9._-]+)/i;

function ensureStore() {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
  if (!fs.existsSync(MEMORY_FILE)) {
    fs.writeFileSync(MEMORY_FILE, "", "utf8");
  }
}

function readMemories() {
  ensureStore();
  return fs
    .readFileSync(MEMORY_FILE, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function appendMemory(memory) {
  ensureStore();
  fs.appendFileSync(MEMORY_FILE, `${JSON.stringify(memory)}\n`, "utf8");
}

function assertText(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function validateContent(content) {
  if (content.length > MAX_CONTENT_CHARS) {
    throw new Error(`content must be ${MAX_CONTENT_CHARS} characters or fewer.`);
  }
  if (SECRET_RE.test(content)) {
    throw new Error("Memory rejected because it looks like it contains a secret or credential.");
  }
}

function normalizeImportance(value) {
  const parsed = Number.parseInt(value ?? "5", 10);
  if (!Number.isFinite(parsed)) return 5;
  return Math.min(Math.max(parsed, 1), 10);
}

async function memorySave(args = {}) {
  const content = assertText(args.content, "content");
  validateContent(content);

  const memory = {
    id: crypto.randomUUID(),
    type: typeof args.type === "string" && args.type.trim() ? args.type.trim() : "fact",
    key: typeof args.key === "string" && args.key.trim() ? args.key.trim() : null,
    content,
    importance: normalizeImportance(args.importance),
    metadata: args.metadata && typeof args.metadata === "object" && !Array.isArray(args.metadata) ? args.metadata : {},
    created_at: new Date().toISOString(),
  };

  appendMemory(memory);
  return { saved: memory };
}

async function memorySearch(args = {}) {
  const query = assertText(args.query, "query").toLowerCase();
  const limit = Math.min(Math.max(Number.parseInt(args.limit ?? "10", 10) || 10, 1), MAX_RESULTS);
  const terms = query.split(/\s+/).filter(Boolean);

  const matches = readMemories()
    .map((memory) => {
      const haystack = `${memory.type || ""} ${memory.key || ""} ${memory.content || ""}`.toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { memory, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (b.memory.importance || 0) - (a.memory.importance || 0))
    .slice(0, limit)
    .map((item) => item.memory);

  return { query: args.query, memories: matches };
}

async function memoryList(args = {}) {
  const limit = Math.min(Math.max(Number.parseInt(args.limit ?? "10", 10) || 10, 1), MAX_RESULTS);
  const type = typeof args.type === "string" && args.type.trim() ? args.type.trim() : null;
  const memories = readMemories()
    .filter((memory) => !type || memory.type === type)
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, limit);

  return { memories };
}

const tools = [
  {
    name: "memory_save",
    description: "Save one non-secret long-term memory for future Codex sessions.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string" },
        type: { type: "string", description: "Example: preference, instruction, project_context, fact." },
        key: { type: "string" },
        importance: { type: "integer", minimum: 1, maximum: 10 },
        metadata: { type: "object", additionalProperties: true },
      },
      required: ["content"],
      additionalProperties: false,
    },
  },
  {
    name: "memory_search",
    description: "Search saved long-term memories by keyword.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "integer", minimum: 1, maximum: MAX_RESULTS },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "memory_list",
    description: "List recent saved memories, optionally filtered by type.",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string" },
        limit: { type: "integer", minimum: 1, maximum: MAX_RESULTS },
      },
      additionalProperties: false,
    },
  },
];

async function callTool(name, args) {
  if (name === "memory_save") return memorySave(args);
  if (name === "memory_search") return memorySearch(args);
  if (name === "memory_list") return memoryList(args);
  throw new Error(`Unknown tool: ${name}`);
}

function sendMessage(message) {
  const body = Buffer.from(JSON.stringify(message), "utf8");
  process.stdout.write(`Content-Length: ${body.length}\r\n\r\n`);
  process.stdout.write(body);
}

function sendResult(id, result) {
  sendMessage({ jsonrpc: "2.0", id, result });
}

function sendError(id, error) {
  sendMessage({
    jsonrpc: "2.0",
    id,
    error: {
      code: -32000,
      message: error instanceof Error ? error.message : String(error),
    },
  });
}

async function handleMessage(message) {
  if (!message || typeof message !== "object" || message.id === undefined) return;

  try {
    if (message.method === "initialize") {
      sendResult(message.id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "timesauto-memory", version: "1.0.0" },
      });
      return;
    }

    if (message.method === "tools/list") {
      sendResult(message.id, { tools });
      return;
    }

    if (message.method === "tools/call") {
      const params = message.params || {};
      const result = await callTool(params.name, params.arguments || {});
      sendResult(message.id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      });
      return;
    }

    sendError(message.id, new Error(`Unsupported method: ${message.method}`));
  } catch (error) {
    sendError(message.id, error);
  }
}

let buffer = Buffer.alloc(0);

function parseMessages() {
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;

    const header = buffer.slice(0, headerEnd).toString("utf8");
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) {
      buffer = buffer.slice(headerEnd + 4);
      continue;
    }

    const length = Number.parseInt(match[1], 10);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + length;
    if (buffer.length < bodyEnd) return;

    const rawBody = buffer.slice(bodyStart, bodyEnd).toString("utf8");
    buffer = buffer.slice(bodyEnd);

    try {
      void handleMessage(JSON.parse(rawBody));
    } catch (error) {
      sendError(null, error);
    }
  }
}

process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  parseMessages();
});

process.stdin.on("end", () => process.exit(0));
