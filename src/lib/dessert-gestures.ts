import type { Emotion, Mode } from "./dessert-api";

export type ArmPose = { shoulder: number; forward: number; elbow: number; wrist: number; palm: number; curl: number };
export type GesturePose = { left: ArmPose; right: ArmPose };
const arm = (shoulder: number, elbow: number, wrist = 0, palm = 0, curl = 0.25, forward = 0): ArmPose => ({ shoulder, elbow, wrist, palm, curl, forward });

// Signs mirror the shoulders; elbows bend outward in the character's plane.
export const GESTURE_POSES: Record<Emotion, GesturePose> = {
  neutral: { left: arm(-0.2, -0.22), right: arm(0.2, 0.22) },
  happy: { left: arm(-0.4, -0.65, -0.12, -0.2, 0.12), right: arm(0.45, 0.75, 0.12, 0.2, 0.12) },
  excited: { left: arm(-0.85, -1.35, -0.1, -0.3, 0.06), right: arm(0.85, 1.35, 0.1, 0.3, 0.06) },
  affectionate: { left: arm(0.28, -0.95, 0.2, 0.3, 0.35, -0.35), right: arm(-0.28, 0.95, -0.2, -0.3, 0.35, -0.35) },
  sad: { left: arm(0.18, -0.35, 0.1, 0.2, 0.5), right: arm(-0.18, 0.35, -0.1, -0.2, 0.5) },
  thinking: { left: arm(-0.12, -0.35), right: arm(0.3, 2.35, -0.2, -0.4, 0.6, -0.2) },
  listening: { left: arm(-0.2, -0.3), right: arm(0.5, 1.05, 0.18, 0.45, 0.12, -0.12) },
};

export function gesturePose(emotion: Emotion, mode: Mode, seconds: number, reducedMotion = false): GesturePose {
  const pose = GESTURE_POSES[emotion];
  const restraint = mode === "mentor" ? 0.55 : 1;
  const movement = reducedMotion ? 0 : Math.sin(seconds * 1.7) * 0.055 * restraint;
  const scale = (value: ArmPose, side: number): ArmPose => ({
    ...value,
    shoulder: value.shoulder * restraint + movement * side,
    forward: value.forward * restraint,
    elbow: value.elbow * restraint,
    wrist: value.wrist * restraint + movement * 0.5,
    palm: value.palm * restraint,
  });
  return { left: scale(pose.left, -1), right: scale(pose.right, 1) };
}

export function easeGesture(current: GesturePose, target: GesturePose, delta: number): GesturePose {
  const amount = 1 - Math.exp(-5 * Math.min(Math.max(delta, 0), 0.05));
  const blend = (from: ArmPose, to: ArmPose) => {
    const next = { ...from };
    for (const key of Object.keys(next) as (keyof ArmPose)[]) next[key] += (to[key] - from[key]) * amount;
    return next;
  };
  return { left: blend(current.left, target.left), right: blend(current.right, target.right) };
}