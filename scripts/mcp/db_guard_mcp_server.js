#!/usr/bin/env node
"use strict";

const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const BACKEND_ROOT = path.join(PROJECT_ROOT, "admin-backend");

require(path.join(BACKEND_ROOT, "node_modules", "dotenv")).config({
  path: path.join(BACKEND_ROOT, ".env"),
});

const { PrismaClient } = require(path.join(BACKEND_ROOT, "node_modules", "@prisma", "client"));

const prisma = new PrismaClient();
const MAX_LIMIT = 100;
const IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const SENSITIVE_COLUMN_RE = /(password|token|secret|credential|otp|hash|api_key|apikey|jwt)/i;

function assertIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER_RE.test(value)) {
    throw new Error(`${label} must be a safe SQL identifier.`);
  }
  return value;
}

function quoteIdent(value) {
  return `"${assertIdentifier(value, "identifier").replace(/"/g, '""')}"`;
}

function cleanRows(rows) {
  return rows.map((row) => {
    const clean = {};
    for (const [key, value] of Object.entries(row)) {
      clean[key] = typeof value === "bigint" ? value.toString() : value;
    }
    return clean;
  });
}

async function tableExists(tableName) {
  const rows = await prisma.$queryRawUnsafe(
    "select table_name from information_schema.tables where table_schema = 'public' and table_name = $1 limit 1",
    tableName,
  );
  return rows.length > 0;
}

async function getColumns(tableName) {
  const rows = await prisma.$queryRawUnsafe(
    `
      select column_name, data_type, is_nullable, column_default
      from information_schema.columns
      where table_schema = 'public' and table_name = $1
      order by ordinal_position
    `,
    tableName,
  );

  return rows.map((row) => ({
    column_name: row.column_name,
    data_type: row.data_type,
    is_nullable: row.is_nullable,
    column_default: row.column_default,
    is_sensitive: SENSITIVE_COLUMN_RE.test(row.column_name),
  }));
}

async function dbListTables(args = {}) {
  const includeCodex = args.include_codex !== false;
  const rows = await prisma.$queryRawUnsafe(`
    select table_name
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `);

  return rows
    .map((row) => row.table_name)
    .filter((tableName) => !tableName.startsWith("_"))
    .filter((tableName) => includeCodex || !tableName.startsWith("codex_"));
}

async function dbDescribeTable(args = {}) {
  const tableName = assertIdentifier(args.table, "table");
  if (!(await tableExists(tableName))) {
    throw new Error(`Table not found: ${tableName}`);
  }

  return {
    table: tableName,
    columns: await getColumns(tableName),
  };
}

async function dbSelect(args = {}) {
  const tableName = assertIdentifier(args.table, "table");
  if (!(await tableExists(tableName))) {
    throw new Error(`Table not found: ${tableName}`);
  }
  if (!Array.isArray(args.columns) || args.columns.length === 0) {
    throw new Error("columns must be a non-empty array. SELECT * is not allowed.");
  }

  const columns = await getColumns(tableName);
  const columnSet = new Set(columns.map((column) => column.column_name));
  const requestedColumns = args.columns.map((column) => assertIdentifier(column, "column"));
  const sensitiveColumns = requestedColumns.filter((column) => SENSITIVE_COLUMN_RE.test(column));
  if (sensitiveColumns.length > 0) {
    throw new Error(`Sensitive columns are blocked: ${sensitiveColumns.join(", ")}`);
  }

  for (const column of requestedColumns) {
    if (!columnSet.has(column)) {
      throw new Error(`Unknown column '${column}' on ${tableName}.`);
    }
  }

  const values = [];
  const whereParts = [];
  const where = args.where && typeof args.where === "object" && !Array.isArray(args.where) ? args.where : {};

  for (const [column, value] of Object.entries(where)) {
    const safeColumn = assertIdentifier(column, "where column");
    if (!columnSet.has(safeColumn)) {
      throw new Error(`Unknown where column '${safeColumn}' on ${tableName}.`);
    }
    if (SENSITIVE_COLUMN_RE.test(safeColumn)) {
      throw new Error(`Sensitive where column is blocked: ${safeColumn}`);
    }
    values.push(value);
    whereParts.push(`${quoteIdent(safeColumn)} = $${values.length}`);
  }

  const limit = Math.min(Math.max(Number.parseInt(args.limit ?? "50", 10) || 50, 1), MAX_LIMIT);
  let sql = `select ${requestedColumns.map(quoteIdent).join(", ")} from ${quoteIdent(tableName)}`;
  if (whereParts.length > 0) {
    sql += ` where ${whereParts.join(" and ")}`;
  }
  if (args.order_by) {
    const orderBy = assertIdentifier(args.order_by, "order_by");
    if (!columnSet.has(orderBy)) {
      throw new Error(`Unknown order_by column '${orderBy}' on ${tableName}.`);
    }
    const direction = String(args.order_direction || "asc").toLowerCase() === "desc" ? "desc" : "asc";
    sql += ` order by ${quoteIdent(orderBy)} ${direction}`;
  }
  sql += ` limit ${limit}`;

  const rows = await prisma.$queryRawUnsafe(sql, ...values);
  return {
    table: tableName,
    rows: cleanRows(rows),
  };
}

async function codexInsertPending(args = {}) {
  const tableName = assertIdentifier(args.table, "table");
  if (!tableName.startsWith("codex_")) {
    throw new Error("Only codex_* staging tables can be inserted into.");
  }
  if (!(await tableExists(tableName))) {
    throw new Error(`Table not found: ${tableName}`);
  }
  if (!args.data || typeof args.data !== "object" || Array.isArray(args.data)) {
    throw new Error("data must be an object.");
  }

  const columns = await getColumns(tableName);
  const columnSet = new Set(columns.map((column) => column.column_name));
  const data = { ...args.data };
  if (columnSet.has("proposal_status")) {
    data.proposal_status = "pending";
  }

  const keys = Object.keys(data).map((key) => assertIdentifier(key, "data column"));
  if (keys.length === 0) {
    throw new Error("data cannot be empty.");
  }

  for (const key of keys) {
    if (!columnSet.has(key)) {
      throw new Error(`Unknown insert column '${key}' on ${tableName}.`);
    }
    if (key === "id") {
      throw new Error("Manual id insert is not allowed.");
    }
  }

  const values = keys.map((key) => data[key]);
  const placeholders = keys.map((_, index) => `$${index + 1}`);
  const sql = `
    insert into ${quoteIdent(tableName)} (${keys.map(quoteIdent).join(", ")})
    values (${placeholders.join(", ")})
    returning *
  `;

  const rows = await prisma.$queryRawUnsafe(sql, ...values);
  return {
    table: tableName,
    inserted: cleanRows(rows)[0] || null,
  };
}

const tools = [
  {
    name: "db_list_tables",
    description: "List public database tables. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        include_codex: { type: "boolean", description: "Include codex_* staging tables. Defaults to true." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "db_describe_table",
    description: "Describe columns for one public table. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        table: { type: "string" },
      },
      required: ["table"],
      additionalProperties: false,
    },
  },
  {
    name: "db_select",
    description: "Select exact non-sensitive columns from one table. Read-only. No raw SQL and no SELECT *.",
    inputSchema: {
      type: "object",
      properties: {
        table: { type: "string" },
        columns: { type: "array", items: { type: "string" }, minItems: 1 },
        where: { type: "object", additionalProperties: true },
        order_by: { type: "string" },
        order_direction: { type: "string", enum: ["asc", "desc"] },
        limit: { type: "integer", minimum: 1, maximum: MAX_LIMIT },
      },
      required: ["table", "columns"],
      additionalProperties: false,
    },
  },
  {
    name: "codex_insert_pending",
    description: "Insert one pending row into a codex_* staging table only. Forces proposal_status to pending when available.",
    inputSchema: {
      type: "object",
      properties: {
        table: { type: "string" },
        data: { type: "object", additionalProperties: true },
      },
      required: ["table", "data"],
      additionalProperties: false,
    },
  },
];

async function callTool(name, args) {
  if (name === "db_list_tables") return dbListTables(args);
  if (name === "db_describe_table") return dbDescribeTable(args);
  if (name === "db_select") return dbSelect(args);
  if (name === "codex_insert_pending") return codexInsertPending(args);
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
        serverInfo: { name: "timesauto-db-readonly", version: "1.0.0" },
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

async function shutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  parseMessages();
});

process.stdin.on("end", shutdown);
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
