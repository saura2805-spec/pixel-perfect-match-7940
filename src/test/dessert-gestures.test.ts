import { describe, expect, it } from "vitest";
import { GESTURE_POSES, armJointRotation, easeGesture, gesturePose } from "@/lib/dessert-gestures";

describe("Dessert hands in both modes", () => {
  it("bends elbows and fingers forward in every mood and both modes", () => {
    for (const mode of ["companion", "mentor"] as const) for (const mood of Object.keys(GESTURE_POSES) as (keyof typeof GESTURE_POSES)[]) {
      const pose = gesturePose(mood, mode, 2);
      for (const side of [-1, 1] as const) {
        const joint = armJointRotation(side === -1 ? pose.left : pose.right, side);
        expect(joint.elbowForward).toBeLessThanOrEqual(0);
        expect(joint.elbowForward).toBeGreaterThanOrEqual(-1.7);
        expect(joint.curl).toBeLessThanOrEqual(0);
        expect(joint.elbowSide * side).toBeGreaterThanOrEqual(0);
      }
    }
  });
  it("mirrors the sideways hinge without reversing forward flex", () => {
    const left = armJointRotation(GESTURE_POSES.excited.right, -1);
    const right = armJointRotation(GESTURE_POSES.excited.right, 1);
    expect(left.elbowForward).toEqual(right.elbowForward);
    expect(left.elbowSide).toEqual(-right.elbowSide);
    expect(right.elbowSide).toBeGreaterThan(0);
  });
  it("gives both modes articulated poses for all seven moods", () => {
    for (const mode of ["companion", "mentor"] as const) {
      const poses = Object.keys(GESTURE_POSES).map((mood) => gesturePose(mood as keyof typeof GESTURE_POSES, mode, 0));
      expect(poses).toHaveLength(7);
      expect(new Set(poses.map((pose) => JSON.stringify(pose))).size).toBe(7);
      for (const pose of poses) expect(Object.values(pose).every((hand) => Number.isFinite(hand.elbow) && hand.curl >= 0)).toBe(true);
    }
  });
  it("keeps Mentor gestures more restrained than Companion", () => {
    const companion = gesturePose("excited", "companion", 0);
    const mentor = gesturePose("excited", "mentor", 0);
    expect(Math.abs(mentor.right.shoulder)).toBeLessThan(Math.abs(companion.right.shoulder));
    expect(Math.abs(mentor.left.elbow)).toBeLessThan(Math.abs(companion.left.elbow));
  });
  it("holds a still hand pose with reduced motion in both modes", () => {
    for (const mode of ["companion", "mentor"] as const) {
      expect(gesturePose("listening", mode, 1, true)).toEqual(gesturePose("listening", mode, 9, true));
      expect(gesturePose("listening", mode, 1)).not.toEqual(gesturePose("listening", mode, 9));
    }
  });
  it("smoothly eases joint angles and finger curl without overshooting", () => {
    const start = GESTURE_POSES.neutral;
    const target = GESTURE_POSES.thinking;
    const next = easeGesture(start, target, 1 / 30);
    expect(next.right.elbow).toBeGreaterThan(start.right.elbow);
    expect(next.right.elbow).toBeLessThan(target.right.elbow);
    expect(next.right.curl).toBeGreaterThan(start.right.curl);
    expect(easeGesture(start, target, 0)).toEqual(start);
    expect(easeGesture(start, target, 20)).toEqual(easeGesture(start, target, 0.05));
  });
});