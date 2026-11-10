import { describe, expect, it } from "vitest";
import { EMOTIONS, inferEmotion } from "@/lib/dessert-emotions";
import { RIG_POSES, easeRig, rigPose, waveOverlay } from "@/lib/dessert-expressions";

describe("Dessert 3D expressions", () => {
  it("has a distinct face and body pose for all 18 moods", () => {
    expect(EMOTIONS.length).toBe(18);
    expect(Object.keys(RIG_POSES).sort()).toEqual([...EMOTIONS].sort());
    expect(new Set(Object.values(RIG_POSES).map((p) => JSON.stringify(p))).size).toBe(18);
  });
  it("shows sadness with a sad face and lowered head", () => {
    expect(RIG_POSES.sad.face.sad).toBe(1);
    expect(RIG_POSES.sad.headPitch).toBeGreaterThan(0.2);
  });
  it("droops her eyelids when exhausted", () => expect(RIG_POSES.exhausted.face.lids).toBeGreaterThan(0.5));
  it("raises a hand toward her chin when thinking", () => expect(RIG_POSES.thinking.right.elbow).toBeGreaterThan(2));
  it("calms body motion in Mentor", () => expect(rigPose("excited", "mentor").motion.bounce).toBeLessThan(RIG_POSES.excited.motion.bounce));
  it("eases without overshooting", () => {
    let p = RIG_POSES.neutral;
    p = easeRig(p, RIG_POSES.happy, 1 / 30);
    expect(p.face.happy).toBeGreaterThan(0.15); expect(p.face.happy).toBeLessThan(1);
    for (let i = 0; i < 120; i++) p = easeRig(p, RIG_POSES.happy, 1 / 30);
    expect(p.face.happy).toBeCloseTo(1, 3);
  });
  it("waves only during the greeting", () => {
    expect(waveOverlay(2, 5.2).weight).toBeGreaterThan(0.9);
    expect(waveOverlay(6, 5.2).weight).toBe(0);
  });
  it("reads mood cues from conversation when the AI gives none", () => {
    expect(inferEmotion("I'm so tired today")).toBe("exhausted");
    expect(inferEmotion("haha that's funny")).toBe("laughing");
    expect(inferEmotion("I passed my exam, you did it!")).toBe("proud");
    expect(inferEmotion("ok")).toBe("neutral");
  });
});
