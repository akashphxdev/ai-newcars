// src/modules/ai/providers/aiProvider.client.ts
//
// Thin HTTP client per AI provider. Only Ollama is implemented right
// now — OpenAI/Anthropic/Gemini each need their own SDK package
// installed first, so those branches throw a clear "not wired up yet"
// error instead of silently failing or half-working.

const OLLAMA_TIMEOUT_MS = 300_000; // generation can be slow on local hardware
const OLLAMA_PING_TIMEOUT_MS = 10_000; // /api/tags is just a list call — should be fast

export interface ProviderCallSettings {
  provider: number;
  baseUrl: string | null;
  apiKey: string | null;
  model: string;
}

export interface ConnectionCheckResult {
  ok: boolean;
  message: string;
}

async function callOllama(settings: ProviderCallSettings, prompt: string): Promise<string> {
  if (!settings.baseUrl) {
    throw new Error('Ollama base URL is not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const res = await fetch(`${settings.baseUrl.replace(/\/$/, '')}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
      model: settings.model,
      prompt,
      stream: false,
      format: 'json',
      options: {
        num_predict: 4096,
        num_ctx: 8192,
      },
    }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Ollama returned ${res.status}: ${text.slice(0, 300)}`);
    }

    const data = (await res.json()) as { response?: string };
    if (!data.response) {
      throw new Error('Ollama response had no "response" field');
    }
    return data.response;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Ollama did not respond within ${OLLAMA_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// A model tag like "llama3" matches an installed "llama3:latest" (or
// "llama3:8b", etc.) — Ollama always reports the full tag in /api/tags,
// but admins naturally type the short name, so compare on the part
// before ":" too rather than demanding an exact string match.
function ollamaModelMatches(installedName: string, wanted: string): boolean {
  if (installedName === wanted) return true;
  const installedBase = installedName.split(':')[0];
  const wantedBase = wanted.split(':')[0];
  return installedBase === wantedBase;
}

// Real connectivity check for Ollama — hits /api/tags (cheap, no
// generation) to confirm both "is the server reachable" and "is the
// configured model actually installed there", since a reachable-but-
// wrong-model setup is the failure mode that actually bit us (see
// aiFaqScheduler.job.ts's "model not found" 404s).
async function pingOllama(settings: ProviderCallSettings): Promise<ConnectionCheckResult> {
  if (!settings.baseUrl) {
    return { ok: false, message: 'Base URL is not set' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_PING_TIMEOUT_MS);

  try {
    const res = await fetch(`${settings.baseUrl.replace(/\/$/, '')}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, message: `Ollama returned ${res.status}: ${text.slice(0, 200)}` };
    }

    const data = (await res.json()) as { models?: { name: string }[] };
    const installed = data.models ?? [];

    if (installed.length === 0) {
      return { ok: false, message: `Reached ${settings.baseUrl}, but no models are installed there yet` };
    }

    const modelFound = installed.some((m) => ollamaModelMatches(m.name, settings.model));
    if (!modelFound) {
      const available = installed.map((m) => m.name).join(', ');
      return {
        ok: false,
        message: `Reached ${settings.baseUrl}, but model "${settings.model}" is not installed there. Available: ${available || 'none'}`,
      };
    }

    return { ok: true, message: `Reached ${settings.baseUrl} — model "${settings.model}" is installed and ready` };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, message: `Ollama did not respond within ${OLLAMA_PING_TIMEOUT_MS / 1000}s` };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Could not reach Ollama at ${settings.baseUrl}: ${message}` };
  } finally {
    clearTimeout(timeout);
  }
}

// Provider codes — see AI_PROVIDER_CODES in ../ai.constants.ts:
//   1 = Ollama (local), 2 = OpenAI, 3 = Anthropic (Claude), 4 = Google Gemini
export async function callAiProvider(settings: ProviderCallSettings, prompt: string): Promise<string> {
  switch (settings.provider) {
    case 1:
      return callOllama(settings, prompt);
    case 2:
    case 3:
    case 4:
      throw new Error('This AI provider is not wired up yet — only Ollama (local) is implemented so far.');
    default:
      throw new Error(`Unknown AI provider code: ${settings.provider}`);
  }
}

// Used by setting.service.ts's testConnection — a real reachability +
// model-availability check, not a "did they type something" check.
export async function checkAiProviderConnection(settings: ProviderCallSettings): Promise<ConnectionCheckResult> {
  switch (settings.provider) {
    case 1:
      return pingOllama(settings);
    case 2:
    case 3:
    case 4:
      return {
        ok: false,
        message: 'This AI provider is not wired up yet — only Ollama (local) can be tested so far.',
      };
    default:
      return { ok: false, message: `Unknown AI provider code: ${settings.provider}` };
  }
}