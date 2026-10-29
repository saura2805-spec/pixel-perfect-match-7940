import { afterEach, describe, expect, it, vi } from "vitest";
import { sendChat } from "@/lib/dessert-api";

afterEach(() => vi.unstubAllGlobals());
describe("Local Dessert API contract", () => {
  it("preserves mode and sends only prior roles and content in history", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ reply: "Hello", emotion: "happy" })));
    vi.stubGlobal("fetch", fetcher);
    expect(await sendChat("mentor", "Review this", [{ id: "prior", role: "assistant", content: "Ready", emotion: "neutral" }])).toEqual({ reply: "Hello", emotion: "happy" });
    const [url, init] = fetcher.mock.calls[0] ?? [];
    expect(url).toMatch(/\/api\/chat$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ message: "Review this", mode: "mentor", history: [{ role: "assistant", content: "Ready" }] });
  });
  it("does not fabricate emotion when no real metadata is supplied", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ reply: "I love that!" }))));
    expect((await sendChat("companion", "hello", [])).emotion).toBeUndefined();
  });
  it("rejects unrecognized emotion metadata", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ reply: "Hello", emotion: "invented" }))));
    expect((await sendChat("companion", "hello", [])).emotion).toBeUndefined();
  });
});