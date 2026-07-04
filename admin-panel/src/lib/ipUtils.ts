// src/lib/ipUtils.ts

const IPV4_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function isValidIpv4(candidate: string): boolean {
  const match = IPV4_REGEX.exec(candidate);
  if (!match) return false;
  return match.slice(1, 5).every((octet) => {
    const n = Number(octet);
    return n >= 0 && n <= 255;
  });
}

export function formatIpv4(ip: string | null | undefined): string {
  if (!ip) return "—";

  let candidate = ip.trim();

  if (candidate.toLowerCase().startsWith("::ffff:")) {
    candidate = candidate.slice(7);
  }
  if (candidate === "::1") {
    candidate = "127.0.0.1";
  }

  return isValidIpv4(candidate) ? candidate : "—";
}