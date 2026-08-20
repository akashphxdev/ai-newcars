// src/core/utils/adScript.util.ts
//
// Turning an ad network's pasted snippet into something we can store.
//
// Networks hand out a block of HTML, not a URL. We keep the parts rather
// than the markup for two reasons. The first is mechanical: React's
// dangerouslySetInnerHTML does not execute <script> tags, so the browser
// has to build the element itself and needs the pieces separately. The
// second is that a stored blob of HTML cannot be checked, while a stored
// host can — see assertAllowedHost.

export interface ParsedAdScript {
  src: string;
  // data-cfasync, type, id — whatever the network asked for, minus src.
  // Event handler attributes are dropped; see ATTR_NAME.
  attrs: Record<string, string>;
}

// One <script src>, and the attributes on it. Deliberately not a general
// HTML parser: a snippet that is anything more than this is one we do not
// understand well enough to run.
const SCRIPT_TAG = /<script\b([^>]*)>\s*<\/script>|<script\b([^>]*)\/>/i;
const ATTR = /([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)')/g;

// No inline handlers, and nothing that lets the tag reach outside the
// document in ways a plain ad script has no reason to.
const ATTR_NAME = /^(?!on)[A-Za-z_:][-A-Za-z0-9_:.]*$/;
const DROPPED_ATTRS = new Set(['src', 'integrity', 'nonce']);

export class AdScriptError extends Error {}

export function parseAdScriptSnippet(snippet: string): ParsedAdScript {
  const tag = SCRIPT_TAG.exec(snippet);
  if (!tag) {
    throw new AdScriptError(
      'No <script src="…"> found. Paste the snippet exactly as the network gave it — an inline script with no src is not supported.',
    );
  }

  const attrs: Record<string, string> = {};
  let src = '';

  for (const match of (tag[1] ?? tag[2] ?? '').matchAll(ATTR)) {
    const name = match[1].toLowerCase();
    const value = match[3] ?? match[4] ?? '';
    if (name === 'src') {
      src = value.trim();
    } else if (ATTR_NAME.test(name) && !DROPPED_ATTRS.has(name)) {
      attrs[name] = value;
    }
  }

  if (!src) {
    throw new AdScriptError('The <script> tag has no src attribute.');
  }

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    throw new AdScriptError(`"${src}" is not a valid absolute URL.`);
  }
  // A snippet served over http would downgrade the whole page.
  if (url.protocol !== 'https:') {
    throw new AdScriptError('The script src must be https.');
  }

  return { src: url.toString(), attrs };
}

// The one control that still applies once a script runs in the main
// document: it cannot stop a network misbehaving, but it does mean an
// admin account cannot point a live page at an arbitrary host, and that
// adding a new network is a deliberate config change rather than a form
// submission.
export function assertAllowedHost(src: string, allowedHosts: string[]): void {
  if (allowedHosts.length === 0) {
    throw new AdScriptError(
      'No ad script hosts are configured. Set AD_SCRIPT_HOSTS before adding a script campaign.',
    );
  }

  const host = new URL(src).hostname.toLowerCase();
  // A leading dot means "this domain and its subdomains"; anything else
  // has to match exactly, so "evil-adsboosters.xyz" cannot pass as
  // "adsboosters.xyz".
  const allowed = allowedHosts.some((entry) => {
    const rule = entry.trim().toLowerCase();
    if (!rule) return false;
    return rule.startsWith('.') ? host === rule.slice(1) || host.endsWith(rule) : host === rule;
  });

  if (!allowed) {
    throw new AdScriptError(
      `"${host}" is not an approved ad script host. Approved hosts are set in AD_SCRIPT_HOSTS.`,
    );
  }
}
