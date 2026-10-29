import { describe, expect, it } from "vitest";
import { AVATAR_POSES, companionEmotion, easePose } from "@/lib/dessert-state";

describe("Dessert companion reactions", () => {
  it("listens while the user types", () => expect(companionEmotion("hello", false, false, "happy")).toBe("listening"));
  it("listens during speech input", () => expect(companionEmotion("", true, false, "neutral")).toBe("listening"));
  it("thinks while waiting even if another message is being drafted", () => expect(companionEmotion("next", true, true, "happy")).toBe("thinking"));
  it("expresses the actual response mood after a reply", () => expect(companionEmotion("", false, false, "affectionate")).toBe("affectionate"));
  it("keeps neutral when the local API supplies no mood", () => expect(companionEmotion("", false, false, "neutral")).toBe("neutral"));
  it("has seven unique mood poses", () => {
    expect(Object.keys(AVATAR_POSES).sort()).toEqual(["affectionate", "excited", "happy", "listening", "neutral", "sad", "thinking"]);
    expect(new Set(Object.values(AVATAR_POSES).map((p) => JSON.stringify(p))).size).toBe(7);
  });
  it("transitions between poses without jumping or overshooting", () => {
    const start = AVATAR_POSES.neutral;
    const target = AVATAR_POSES.excited;
    const next = easePose(start, target, 1 / 30);
    expect(next.smile).toBeGreaterThan(start.smile);
    expect(next.smile).toBeLessThan(target.smile);
    let current = start;
    for (let i = 0; i < 60; i++) current = easePose(current, target, 1 / 30);
    expect(current.smile).toBeCloseTo(target.smile, 3);
    expect(easePose(start, target, 0)).toEqual(start);
  });
});