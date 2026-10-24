export type GHUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
};

export type GHRepo = {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  fork: boolean;
};

export type FetchErrorKind = "not-found" | "rate-limit" | "network" | "http" | "invalid";

export class GitHubError extends Error {
  constructor(
    public kind: FetchErrorKind,
    message: string,
    public resetAt?: Date,
  ) {
    super(message);
  }
}

const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function validateUsername(raw: string): string | null {
  const v = raw.trim().replace(/^@/, "");
  if (!v) return "Please enter a GitHub username.";
  if (!USERNAME_RE.test(v)) return "That doesn't look like a valid GitHub username.";
  return null;
}

export function classifyResponse(status: number, remaining: string | null, reset: string | null): GitHubError | null {
  if (status >= 200 && status < 300) return null;
  if (status === 404) return new GitHubError("not-found", "GitHub user not found.");
  if (status === 429 || (status === 403 && remaining === "0")) {
    const resetAt = reset ? new Date(Number(reset) * 1000) : undefined;
    return new GitHubError("rate-limit", "GitHub has temporarily limited requests from your network.", resetAt);
  }
  if (status === 403) return new GitHubError("http", "GitHub refused this request (403).");
  return new GitHubError("http", `GitHub responded with an unexpected error (${status}).`);
}

async function get<T>(url: string, signal: AbortSignal, profileEndpoint = false): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { signal, headers: { Accept: "application/vnd.github+json" } });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new GitHubError("network", "Couldn't reach GitHub. Check your connection and try again.");
  }
  const err = classifyResponse(res.status, res.headers.get("x-ratelimit-remaining"), res.headers.get("x-ratelimit-reset"));
  if (err?.kind === "not-found" && !profileEndpoint) throw new GitHubError("http", "GitHub couldn't load this profile's repositories. Please retry.");
  if (err) throw err;
  try {
    return (await res.json()) as T;
  } catch {
    throw new GitHubError("invalid", "GitHub returned a response we couldn't read.");
  }
}

export async function fetchProfile(username: string, signal: AbortSignal) {
  const u = encodeURIComponent(username.trim().replace(/^@/, ""));
  const user = await get<GHUser>(`https://api.github.com/users/${u}`, signal, true);
  const repos = await get<GHRepo[]>(`https://api.github.com/users/${u}/repos?sort=updated&per_page=100`, signal);
  return { user, repos };
}

export function languageBreakdown(repos: GHRepo[]) {
  const counts = new Map<string, number>();
  for (const r of repos) if (r.language) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([lang, n]) => ({ lang, n, pct: total ? Math.round((n / total) * 100) : 0 }));
}
