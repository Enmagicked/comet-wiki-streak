// Wikimedia OAuth 2.0 endpoints (meta.wikimedia.org covers all wikis).
export const WM = {
  authorize: "https://meta.wikimedia.org/w/rest.php/oauth2/authorize",
  token: "https://meta.wikimedia.org/w/rest.php/oauth2/access_token",
  profile: "https://meta.wikimedia.org/w/rest.php/oauth2/resource/profile",
};

export type WikiProfile = {
  sub: number | string;       // numeric user id
  username: string;
  editcount?: number;
  registered?: string;        // e.g. "2015-03-21T08:00:00Z" or "20150321080000"
  confirmed_email?: boolean;
  blocked?: boolean;
  groups?: string[];
  rights?: string[];
  email?: string;
};

export function redirectUri(origin: string) {
  return `${origin}/api/auth/wikipedia/callback`;
}

// Wikimedia sometimes returns registered as a MediaWiki timestamp (YYYYMMDDHHMMSS).
export function parseWikiDate(v?: string): string | null {
  if (!v) return null;
  if (/^\d{14}$/.test(v)) {
    const y = v.slice(0, 4), mo = v.slice(4, 6), d = v.slice(6, 8),
      h = v.slice(8, 10), mi = v.slice(10, 12), s = v.slice(12, 14);
    return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
  }
  const t = new Date(v);
  return isNaN(t.getTime()) ? null : t.toISOString();
}
