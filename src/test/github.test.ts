import { describe, it, expect, vi, afterEach } from "vitest";
import { classifyResponse, validateUsername, fetchProfile } from "@/lib/github";

afterEach(() => vi.unstubAllGlobals());

describe("github error classification", () => {
  it("404 means user not found", () => expect(classifyResponse(404, "50", null)?.kind).toBe("not-found"));
  it("403 with no remaining quota is a rate limit", () => expect(classifyResponse(403, "0", "1700000000")?.kind).toBe("rate-limit"));
  it("429 is a rate limit", () => expect(classifyResponse(429, null, null)?.kind).toBe("rate-limit"));
  it("403 with quota left is not a rate limit", () => expect(classifyResponse(403, "40", null)?.kind).toBe("http"));
  it("200 is fine", () => expect(classifyResponse(200, "59", null)).toBeNull());
  it("empty username is rejected", () => expect(validateUsername("   ")).not.toBeNull());
  it("valid username passes", () => expect(validateUsername(" torvalds ")).toBeNull());
});

describe("actual profile search responses", () => {
  it("only a profile endpoint 404 means not found", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 404 })));
    await expect(fetchProfile("missing", new AbortController().signal)).rejects.toMatchObject({ kind: "not-found" });
  });
  it("a repository endpoint 404 does not label a real profile not found", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ login: "alice" }))).mockResolvedValueOnce(new Response("{}", { status: 404 })));
    await expect(fetchProfile("alice", new AbortController().signal)).rejects.toMatchObject({ kind: "http" });
  });
  it("network failures are not not-found", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(fetchProfile("alice", new AbortController().signal)).rejects.toMatchObject({ kind: "network" });
  });
  it("rate limits keep their distinct state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 429 })));
    await expect(fetchProfile("alice", new AbortController().signal)).rejects.toMatchObject({ kind: "rate-limit" });
  });
});
