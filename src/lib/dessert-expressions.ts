import type { Emotion } from "./dessert-api";

// Browser-safe mood rig for the VRM Dessert model: facial expression weights plus
// bone angles (radians). Arm values are for the right side; the left is mirrored.
export type Arm = { down: number; forward: number; elbow: number; twist: number };
export type RigPose = {
  face: { happy: number; sad: number; relaxed: number; surprised: number; angry: number; lookUp: number; lookDown: number; aa: number; lids: number };
  headPitch: number; headRoll: number; spine: number;
  left: Arm; right: Arm;
  bob: number; speed: number;
};

const arm = (down: number, forward = 0, elbow = 0.15, twist = 0): Arm => ({ down, forward, elbow, twist });
const face = (f: Partial<RigPose["face"]>): RigPose["face"] => ({ happy: 0, sad: 0, relaxed: 0, surprised: 0, angry: 0, lookUp: 0, lookDown: 0, aa: 0, lids: 0, ...f });

export const RIG_POSES: Record<Emotion, RigPose> = {
  neutral: { face: face({ happy: 0.15 }), headPitch: 0, headRoll: 0, spine: 0, left: arm(1.2), right: arm(1.2), bob: 1, speed: 1 },
  happy: { face: face({ happy: 1 }), headPitch: -0.05, headRoll: 0.12, spine: -0.03, left: arm(1.0, 0.2, 0.5), right: arm(1.0, 0.2, 0.5), bob: 1.6, speed: 1.4 },
  excited: { face: face({ happy: 0.8, surprised: 0.45 }), headPitch: -0.1, headRoll: 0, spine: -0.05, left: arm(0.55, 0.5, 1.9), right: arm(0.55, 0.5, 1.9), bob: 2.4, speed: 2.2 },
  affectionate: { face: face({ relaxed: 1 }), headPitch: 0.05, headRoll: 0.22, spine: 0.02, left: arm(1.15, 0.75, 1.35, 0.3), right: arm(1.15, 0.75, 1.35, 0.3), bob: 0.8, speed: 0.8 },
  sad: { face: face({ sad: 1, lookDown: 0.5 }), headPitch: 0.3, headRoll: -0.1, spine: 0.14, left: arm(1.35, 0.1, 0.1), right: arm(1.35, 0.1, 0.1), bob: 0.4, speed: 0.6 },
  exhausted: { face: face({ sad: 0.35, relaxed: 0.35, lids: 0.6, aa: 0.3, lookDown: 0.4 }), headPitch: 0.22, headRoll: 0.3, spine: 0.22, left: arm(1.42, 0, 0.05), right: arm(1.42, 0, 0.05), bob: 0.3, speed: 0.45 },
  thinking: { face: face({ lookUp: 0.7, angry: 0.12 }), headPitch: -0.12, headRoll: -0.18, spine: 0, left: arm(1.15, 0.55, 1.4, 0.2), right: arm(0.95, 0.85, 2.35, 0.4), bob: 0.6, speed: 0.7 },
  listening: { face: face({ happy: 0.35, surprised: 0.15 }), headPitch: 0.06, headRoll: 0.16, spine: 0.06, left: arm(1.2, 0.1, 0.3), right: arm(1.2, 0.1, 0.3), bob: 0.8, speed: 1 },
};

/** Mentor keeps the same face but calmer, smaller body motion. */
export function rigPose(emotion: Emotion, mode: "companion" | "mentor"): RigPose {
  const p = RIG_POSES[emotion];
  if (mode === "companion") return p;
  return { ...p, headRoll: p.headRoll * 0.6, bob: p.bob * 0.6 };
}

const smooth = (n: number) => { const v = Math.max(0, Math.min(1, n)); return v * v * (3 - 2 * v); };

/** Right-arm wave overlay for the greeting; weight 0..1, wave oscillation in radians. */
export function waveOverlay(seconds: number, duration: number) {
  if (seconds < 0 || seconds >= duration) return { weight: 0, wave: 0 };
  const weight = smooth(seconds / 0.7) * (1 - smooth((seconds - (duration - 1.1)) / 1));
  const wave = Math.sin(Math.max(0, seconds - 0.8) * Math.PI * 2 * 1.4) * 0.35 * weight;
  return { weight, wave };
}

export function easeRig(cur: RigPose, target: RigPose, dt: number): RigPose {
  const k = 1 - Math.exp(-5 * Math.min(dt, 0.1));
  const l = (a: number, b: number) => a + (b - a) * k;
  const la = (a: Arm, b: Arm): Arm => ({ down: l(a.down, b.down), forward: l(a.forward, b.forward), elbow: l(a.elbow, b.elbow), twist: l(a.twist, b.twist) });
  const f = {} as RigPose["face"];
  for (const key of Object.keys(target.face) as (keyof RigPose["face"])[]) f[key] = l(cur.face[key], target.face[key]);
  return { face: f, headPitch: l(cur.headPitch, target.headPitch), headRoll: l(cur.headRoll, target.headRoll), spine: l(cur.spine, target.spine), left: la(cur.left, target.left), right: la(cur.right, target.right), bob: l(cur.bob, target.bob), speed: l(cur.speed, target.speed) };
}
