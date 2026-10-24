import { describe, expect, it } from "vitest";
import { addRecentSearch, readRecentSearches, writeRecentSearches, RECENT_SEARCH_KEY } from "@/lib/recent-searches";

const profile = (login: string) => ({ login, name: login, avatar_url: "https://avatars.githubusercontent.com/u/1" });
describe("recent successful searches", () => {
  it("deduplicates usernames ignoring case and moves the newest first", () => {
    expect(addRecentSearch([profile("alice"), profile("bob")], profile("ALICE")).map((p) => p.login)).toEqual(["ALICE", "bob"]);
  });
  it("retains only the last five searches", () => {
    expect(addRecentSearch(["a", "b", "c", "d", "e"].map(profile), profile("f")).map((p) => p.login)).toEqual(["f", "a", "b", "c", "d"]);
  });
  it("stores only minimal public profile information", () => {
    const received = { ...profile("alice"), token: "must-not-be-stored" };
    const result = addRecentSearch([], received);
    expect(Object.keys(result[0] ?? {})).toEqual(["login", "name", "avatar_url"]);
  });
  it("persists and reads history after a refresh", () => {
    writeRecentSearches(localStorage, [profile("alice")]);
    expect(readRecentSearches(localStorage)).toEqual([profile("alice")]);
  });
  it("clearing removes persisted history", () => {
    writeRecentSearches(localStorage, [profile("alice")]);
    writeRecentSearches(localStorage, []);
    expect(localStorage.getItem(RECENT_SEARCH_KEY)).toBeNull();
  });
  it("handles unavailable storage safely", () => {
    expect(readRecentSearches({ getItem: () => { throw new Error("blocked"); } })).toEqual([]);
    expect(writeRecentSearches({ setItem: () => { throw new Error("blocked"); }, removeItem: () => {} }, [profile("a")])).toBe(false);
  });
  it("rejects malformed and unsafe saved entries", () => {
    expect(readRecentSearches({ getItem: () => JSON.stringify([{ ...profile("a"), avatar_url: "javascript:alert(1)" }, profile("b"), profile("B")]) })).toEqual([profile("b")]);
  });
});