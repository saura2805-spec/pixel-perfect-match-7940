import type { Emotion } from "./dessert-api";

export type AvatarPose = {
  smile: number; eye: number; float: number; tilt: number; blush: number;
  gaze: number; brow: number; open: number; nod: number;
};

export const AVATAR_POSES: Record<Emotion, AvatarPose> = {
  neutral: { smile: 0.2, eye: 1, float: 0.045, tilt: 0, blush: 0.35, gaze: 0, brow: 0, open: 0, nod: 0 },
  happy: { smile: 0.85, eye: 0.7, float: 0.07, tilt: 0.07, blush: 0.7, gaze: 0, brow: 0.07, open: 0, nod: 0.025 },
  excited: { smile: 1, eye: 1.2, float: 0.11, tilt: 0, blush: 0.8, gaze: 0, brow: 0.15, open: 1, nod: 0.06 },
  affectionate: { smile: 0.65, eye: 0.5, float: 0.035, tilt: 0.2, blush: 1, gaze: 0, brow: 0.03, open: 0, nod: 0 },
  sad: { smile: -0.65, eye: 0.75, float: 0.018, tilt: -0.13, blush: 0.1, gaze: -0.06, brow: -0.25, open: 0, nod: -0.08 },
  thinking: { smile: 0, eye: 0.8, float: 0.025, tilt: -0.22, blush: 0.2, gaze: 0.09, brow: 0.23, open: 0, nod: -0.025 },
  listening: { smile: 0.35, eye: 1.05, float: 0.035, tilt: 0.12, blush: 0.45, gaze: 0, brow: 0.11, open: 0, nod: 0.08 },
};

export function companionEmotion(input: string, listening: boolean, waiting: boolean, replyEmotion: Emotion): Emotion {
  if (waiting) return "thinking";
  if (listening || input.trim()) return "listening";
  return replyEmotion;
}

export function easePose(current: AvatarPose, target: AvatarPose, delta: number): AvatarPose {
  const amount = 1 - Math.exp(-6 * Math.min(delta, 0.1));
  const next = { ...current };
  for (const key of Object.keys(next) as (keyof AvatarPose)[]) {
    next[key] += (target[key] - next[key]) * amount;
  }
  return next;
}