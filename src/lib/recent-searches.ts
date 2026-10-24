import type { GHUser } from "@/lib/github";

export type RecentSearch = Pick<GHUser, "login" | "name" | "avatar_url">;
export const RECENT_SEARCH_KEY = "octoscope:recent-searches:v1";
export const RECENT_SEARCH_LIMIT = 5;

export function addRecentSearch(history: RecentSearch[], profile: RecentSearch): RecentSearch[] {
  const entry = { login: profile.login, name: profile.name, avatar_url: profile.avatar_url };
  return [entry, ...history.filter((item) => item.login.toLowerCase() !== profile.login.toLowerCase())].slice(0, RECENT_SEARCH_LIMIT);
}

export function readRecentSearches(storage: Pick<Storage, "getItem">): RecentSearch[] {
  try {
    const data: unknown = JSON.parse(storage.getItem(RECENT_SEARCH_KEY) ?? "[]");
    if (!Array.isArray(data)) return [];
    const items: RecentSearch[] = [];
    for (const value of data) {
      if (!value || typeof value !== "object" || typeof value.login !== "string" ||
        !/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(value.login) ||
        !(value.name === null || typeof value.name === "string") || typeof value.avatar_url !== "string") continue;
      const avatar = new URL(value.avatar_url);
      if (avatar.protocol !== "https:" || avatar.hostname !== "avatars.githubusercontent.com") continue;
      if (!items.some((item) => item.login.toLowerCase() === value.login.toLowerCase())) {
        items.push({ login: value.login, name: value.name, avatar_url: value.avatar_url });
      }
      if (items.length === RECENT_SEARCH_LIMIT) break;
    }
    return items;
  } catch { return []; }
}

export function writeRecentSearches(storage: Pick<Storage, "setItem" | "removeItem">, history: RecentSearch[]): boolean {
  try {
    if (history.length) storage.setItem(RECENT_SEARCH_KEY, JSON.stringify(history));
    else storage.removeItem(RECENT_SEARCH_KEY);
    return true;
  } catch { return false; }
}