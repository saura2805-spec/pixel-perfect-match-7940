import { describe, expect, it } from "vitest";
import { greetingPose, GREETING_DURATION } from "@/lib/dessert-greeting";
import { claimCompanionGreeting, newCompanionSession, updateCompanionSession } from "@/hooks/use-companion-session";

describe("Companion welcome", () => {
  it("claims the greeting once despite re-renders or navigating back", () => {
    updateCompanionSession({ id: 10, greeted: false });
    expect(claimCompanionGreeting(10)).toBe(true);
    expect(claimCompanionGreeting(10)).toBe(false);
    expect(claimCompanionGreeting(10)).toBe(false);
  });
  it("replays for an explicit new chat only", () => {
    updateCompanionSession({ id: 20, greeted: true });
    newCompanionSession();
    expect(claimCompanionGreeting(20)).toBe(false);
    expect(claimCompanionGreeting(21)).toBe(true);
    expect(claimCompanionGreeting(21)).toBe(false);
  });
  it("performs three complete wrist waves", () => {
    for (let i = 0; i < 3; i++) {
      const start = 1.2 + i * 0.8;
      expect(greetingPose(start + 0.2).wrist).toBeCloseTo(0.3, 3);
      expect(greetingPose(start + 0.6).wrist).toBeCloseTo(-0.3, 3);
    }
  });
  it("lowers the arm and returns to idle after the greeting", () => {
    expect(greetingPose(0).lift).toBe(0);
    expect(greetingPose(2).lift).toBe(1);
    expect(greetingPose(GREETING_DURATION)).toMatchObject({ active: false, warmth: 0, lift: 0, wrist: 0, turn: 0 });
  });
  it("omits wave and turning movement with reduced motion", () => {
    expect(greetingPose(2, true)).toMatchObject({ active: true, lift: 0, wrist: 0, turn: 0 });
  });
});