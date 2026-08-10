#!/usr/bin/env node
// tools/mcp-timesauto/server.js
//
// MCP server for operating this site. Dependency-free on purpose: the
// stdio transport is line-delimited JSON-RPC, and a tool whose whole job
// is to make deploys safer should not itself introduce a dependency tree.
//
// The deploy tool exists because this pipeline has silently broken
// production three times: a build with placeholder data, a bundle with
// localhost:5000 compiled in, and a macOS sharp binary shipped to a Linux
// box which disabled image optimisation without a single error anywhere.
// Every one of those was invisible until a person looked. The gates below
// are those three failures turned into refusals.

import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

const HOST = "root@82.180.147.1";
const CM = "/Users/vmconnect/.ssh/cm/%r@%h:%p";
const REPO = "/Users/vmconnect/TimesAuto";
const REMOTE_WEB = "/var/www/timesauto/website";
const REMOTE_GO = "/var/www/timesauto/go-backend";
const API = "https://api.timesauto.net/api/public/v1";
const SITE = "https://timesauto.net";

function sh(cmd, { cwd = REPO, timeout = 900_000 } = {}) {
  return new Promise((resolve) => {
    const p = spawn("bash", ["-lc", cmd], { cwd });
    let out = "", err = "";
    const t = setTimeout(() => p.kill("SIGKILL"), timeout);
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => {
      clearTimeout(t);
      resolve({ code, out: out.trim(), err: err.trim() });
    });
  });
}

const ssh = (remote, opts) =>
  sh(`ssh -o ControlPath=${CM} ${HOST} ${JSON.stringify(remote)}`, opts);

// ---- read-only SQL -------------------------------------------------
//
// Reject anything that is not a single read. The agent gets its own
// database role too; this is the second lock, not the only one — a regex
// is a guard against mistakes, not against a determined caller.
const WRITE_WORDS =
  /\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy|vacuum|reindex|refresh|call|do)\b/i;

function assertReadOnly(sql) {
  const trimmed = sql.trim().replace(/;+\s*$/, "");
  if (trimmed.includes(";")) throw new Error("one statement at a time");
  if (!/^(select|with|explain|show|table)\b/i.test(trimmed))
    throw new Error("only SELECT/WITH/EXPLAIN/SHOW are allowed");
  if (WRITE_WORDS.test(trimmed)) throw new Error("statement contains a write keyword");
  return trimmed;
}

// ---- tools ---------------------------------------------------------

const tools = {
  async query({ sql, limit = 200 }) {
    const stmt = assertReadOnly(sql);
    const wrapped = `SELECT * FROM (${stmt}) _q LIMIT ${Number(limit) || 200}`;
    const r = await ssh(
      `sudo -u postgres psql -d timesauto -A -F'|' --pset=footer=off -c ${JSON.stringify(wrapped)}`,
      { timeout: 120_000 },
    );
    if (r.code !== 0) throw new Error(r.err || "query failed");
    return r.out || "(no rows)";
  },

  async health() {
    const apiPaths = [
      "home/cars?type=popular&limit=1",
      "cars/tata/nexon",
      "cars/on-road-price?variant=335&state=delhi",
      "articles/categories",
      "reviews?modelId=44&limit=1",
      "fuel/metros",
      "compare/car-options",
    ];
    const pages = ["/", "/tata-cars/nexon", "/car-loan-emi-calculator", "/fuel-price", "/news/car-reviews"];
    const lines = [];

    for (const p of apiPaths) {
      const r = await sh(`curl -s -o /dev/null -w '%{http_code} %{time_starttransfer}' ${JSON.stringify(`${API}/${p}`)}`, { timeout: 60_000 });
      lines.push(`api  ${r.out.padEnd(14)} /${p}`);
    }
    for (const p of pages) {
      const r = await sh(`curl -s -o /dev/null -w '%{http_code} %{time_starttransfer}' ${JSON.stringify(SITE + p)}`, { timeout: 60_000 });
      lines.push(`page ${r.out.padEnd(14)} ${p}`);
    }
    // Image optimisation dies silently when a macOS sharp reaches the
    // Linux box: Next falls back to serving originals with no error.
    const img = await sh(
      `curl -s -o /dev/null -H 'Accept: image/webp,*/*' -w '%{content_type} %{size_download}' ` +
        `'${SITE}/_next/image?url=https%3A%2F%2Fstatic.timesauto.net%2Fuploads%2Fcar-images%2F1785497042316-af74acf1.jpg&w=640&q=75'`,
      { timeout: 60_000 },
    );
    lines.push(`img  ${img.out}${img.out.startsWith("image/webp") ? "" : "  <-- OPTIMISER NOT RUNNING"}`);

    // systemctl takes several units and prints one state per line, which
    // avoids shell variables — those get expanded locally by the wrapper
    // before they ever reach the remote host.
    const svc = await ssh(`systemctl is-active timesauto-go timesauto-web timesauto-api`);
    const states = svc.out.split("\n").map((s) => s.trim());
    lines.push(
      `svc  go=${states[0] ?? "?"} web=${states[1] ?? "?"} api=${states[2] ?? "?"}` +
        (states.every((s) => s === "active") ? "" : "  <-- A SERVICE IS DOWN"),
    );
    return lines.join("\n");
  },

  async logs({ service = "timesauto-go", lines = 50, grep = "" }) {
    if (!/^timesauto-(go|web|api|agent)$/.test(service)) throw new Error("unknown service");
    const filter = grep ? ` | grep -i ${JSON.stringify(grep)}` : "";
    const r = await ssh(`journalctl -u ${service} -n ${Number(lines) || 50} --no-pager${filter}`, { timeout: 120_000 });
    return r.out || "(no output)";
  },

  async flush_cache() {
    // A Go restart alone keeps serving the previous build's JSON until the
    // public cache expires, which reads as "the deploy did nothing".
    const r = await ssh(
      `redis-cli -n 5 --scan --pattern 'public-cache:go:*' | xargs -r redis-cli -n 5 DEL | tail -1`,
      { timeout: 120_000 },
    );
    return `flushed public cache keys: ${r.out || "0"}`;
  },

  async deploy({ target, skip_health = false }) {
    if (target !== "website" && target !== "go") throw new Error("target must be website or go");
    const log = [];
    const step = (s) => log.push(s);

    if (target === "go") {
      const build = await sh(
        `cd ${REPO}/go-backend && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o /tmp/timesauto-go ./cmd/api`,
      );
      if (build.code !== 0) throw new Error(`go build failed:\n${build.err}`);
      step("built linux/amd64");

      // Chained, not sequential: a failed build must not let the previous
      // binary in /tmp ship as if it were new.
      const push = await sh(
        `rsync -az -e "ssh -o ControlPath=${CM}" /tmp/timesauto-go ${HOST}:${REMOTE_GO}/timesauto-go.new && ` +
          `ssh -o ControlPath=${CM} ${HOST} 'cd ${REMOTE_GO} && mv timesauto-go.new timesauto-go && chmod +x timesauto-go && systemctl restart timesauto-go && sleep 3 && systemctl is-active timesauto-go'`,
      );
      if (push.code !== 0) throw new Error(`deploy failed:\n${push.err || push.out}`);
      step(`service: ${push.out.trim()}`);
      step(await tools.flush_cache());
    } else {
      // A build left running by a previous failed deploy keeps writing to
      // .next while the next one deletes it, which surfaces as rsync
      // reading files that vanish mid-transfer. Refuse rather than race.
      const running = await sh(`pgrep -f 'node_modules/.bin/next build' | wc -l | tr -d ' '`);
      if (running.out !== "0")
        throw new Error("REFUSING: a next build is already running — wait for it, or kill it before deploying again");

      const build = await sh(`cd ${REPO}/website && rm -rf .next && npm run build 2>&1 | tail -5`);
      const hasOut = await sh(`test -d ${REPO}/website/.next/standalone && echo yes || echo no`);
      if (hasOut.out !== "yes") throw new Error(`build produced no standalone output:\n${build.out}`);
      step("clean build ok");

      // --- pre-flight: the three failures that reached production ---
      const localhost = await sh(`grep -rl 'localhost:5000' ${REPO}/website/.next/static/chunks 2>/dev/null | wc -l | tr -d ' '`);
      if (localhost.out !== "0")
        throw new Error("REFUSING: localhost:5000 is compiled into the client bundle — .env.production is missing or wrong");
      step("no localhost in bundle");

      const placeholder = await sh(`grep -rlo 'brand-4-cars\\|model-1209' ${REPO}/website/.next/server/app 2>/dev/null | wc -l | tr -d ' '`);
      if (placeholder.out !== "0")
        throw new Error("REFUSING: placeholder data is prerendered into pages — the build could not reach the API");
      step("no placeholder pages");

      const apiBase = await sh(`grep -rho 'https://api\\.timesauto\\.net' ${REPO}/website/.next/static/chunks 2>/dev/null | head -1`);
      if (!apiBase.out) throw new Error("REFUSING: the production API base is not compiled into the bundle");
      step("api base baked in");

      const P = `--perms --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r`;
      // node_modules/@img and sharp are excluded so a macOS binary never
      // overwrites the Linux one installed on the server.
      const push = await sh(
        `cd ${REPO}/website && ` +
          `rsync -az --delete ${P} --exclude='node_modules/@img' --exclude='node_modules/sharp' --exclude='.env.production' -e "ssh -o ControlPath=${CM}" .next/standalone/ ${HOST}:${REMOTE_WEB}/ && ` +
          `rsync -az --delete ${P} -e "ssh -o ControlPath=${CM}" .next/static/ ${HOST}:${REMOTE_WEB}/.next/static/ && ` +
          `rsync -az --delete ${P} -e "ssh -o ControlPath=${CM}" public/ ${HOST}:${REMOTE_WEB}/public/`,
      );
      if (push.code !== 0) throw new Error(`rsync failed:\n${push.err}`);
      step("synced");

      const sharp = await ssh(`cd ${REMOTE_WEB} && node -e "require('sharp')" >/dev/null 2>&1 && echo ok || echo broken`);
      if (sharp.out.trim() !== "ok")
        throw new Error("REFUSING to restart: sharp will not load on the server — image optimisation would silently serve unoptimised originals");
      step("sharp loads on server");

      const restart = await ssh(`systemctl restart timesauto-web && sleep 5 && systemctl is-active timesauto-web`);
      step(`service: ${restart.out.trim()}`);
    }

    if (!skip_health) step("\n--- health ---\n" + (await tools.health()));
    return log.join("\n");
  },
};

const SCHEMA = [
  {
    name: "query",
    description:
      "Run a read-only SQL query against the production database. SELECT/WITH/EXPLAIN/SHOW only, one statement, auto-limited.",
    inputSchema: {
      type: "object",
      properties: { sql: { type: "string" }, limit: { type: "number" } },
      required: ["sql"],
    },
  },
  {
    name: "health",
    description:
      "Check the live site: key API endpoints, key pages, whether image optimisation is actually running, and service state.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "logs",
    description: "Tail journalctl for timesauto-go | timesauto-web | timesauto-api | timesauto-agent.",
    inputSchema: {
      type: "object",
      properties: {
        service: { type: "string" },
        lines: { type: "number" },
        grep: { type: "string" },
      },
    },
  },
  {
    name: "flush_cache",
    description:
      "Delete the Go public-cache keys in Redis. Needed after a Go deploy, which otherwise keeps serving the previous build's JSON.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "deploy",
    description:
      "Build and deploy 'website' or 'go'. The website path refuses to ship a bundle containing localhost, prerendered placeholder data, or a missing API base, and refuses to restart if sharp will not load on the server.",
    inputSchema: {
      type: "object",
      properties: { target: { type: "string", enum: ["website", "go"] }, skip_health: { type: "boolean" } },
      required: ["target"],
    },
  },
];

// ---- JSON-RPC over stdio -------------------------------------------

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

const rl = createInterface({ input: process.stdin });
rl.on("line", async (line) => {
  if (!line.trim()) return;
  let req;
  try {
    req = JSON.parse(line);
  } catch {
    return;
  }
  const reply = (result) => req.id !== undefined && send({ jsonrpc: "2.0", id: req.id, result });
  const fail = (message) =>
    req.id !== undefined && send({ jsonrpc: "2.0", id: req.id, error: { code: -32000, message } });

  try {
    if (req.method === "initialize") {
      return reply({
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "timesauto", version: "1.0.0" },
      });
    }
    if (req.method === "tools/list") return reply({ tools: SCHEMA });
    if (req.method === "tools/call") {
      const fn = tools[req.params?.name];
      if (!fn) return fail(`unknown tool: ${req.params?.name}`);
      const text = await fn(req.params.arguments ?? {});
      return reply({ content: [{ type: "text", text: String(text) }] });
    }
    if (req.method?.startsWith("notifications/")) return;
    if (req.id !== undefined) return fail(`unsupported method: ${req.method}`);
  } catch (e) {
    return fail(e?.message ?? String(e));
  }
});
