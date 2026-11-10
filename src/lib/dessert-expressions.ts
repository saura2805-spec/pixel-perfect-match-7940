import type { Emotion } from "./dessert-emotions";

// Browser-safe mood rig for the VRM model. Angles in radians, right side; left is mirrored.
// down: upper arm lowered from T-pose; forward: upper arm swung forward;
// elbow: forearm bent inward/forward; lift: forearm raised up.
export type Arm = { down: number; forward: number; elbow: number; lift: number };
export type Face = { happy: number; sad: number; relaxed: number; surprised: number; angry: number; lookUp: number; lookDown: number; aa: number; oh: number; lids: number };
export type Motion = { nod: number; sway: number; bounce: number; shake: number; speed: number };
export type RigPose = { face: Face; headPitch: number; headRoll: number; headYaw: number; spine: number; left: Arm; right: Arm; motion: Motion };

const A = (down: number, forward = 0, elbow = 0.15, lift = 0): Arm => ({ down, forward, elbow, lift });
const F = (f: Partial<Face>): Face => ({ happy: 0, sad: 0, relaxed: 0, surprised: 0, angry: 0, lookUp: 0, lookDown: 0, aa: 0, oh: 0, lids: 0, ...f });
const M = (m: Partial<Motion>): Motion => ({ nod: 0, sway: 0.03, bounce: 1, shake: 0, speed: 1, ...m });
const HANG = A(1.2);
const pose = (p: Omit<RigPose, "headYaw" | "motion"> & { headYaw?: number; motion?: Partial<Motion> }): RigPose =>
  ({ headYaw: 0, ...p, motion: M(p.motion ?? {}) });

export const RIG_POSES: Record<Emotion, RigPose> = {
  neutral: pose({ face: F({ happy: 0.15 }), headPitch: 0, headRoll: 0, spine: 0, left: HANG, right: HANG }),
  happy: pose({ face: F({ happy: 1 }), headPitch: -0.05, headRoll: 0.12, spine: -0.03, left: A(1.0, 0.2, 0.5), right: A(1.0, 0.2, 0.5), motion: { bounce: 1.6, speed: 1.4 } }),
  excited: pose({ face: F({ happy: 0.8, surprised: 0.45 }), headPitch: -0.1, headRoll: 0, spine: -0.05, left: A(1.0, 0.5, 2.2, 0.6), right: A(1.0, 0.5, 2.2, 0.6), motion: { bounce: 3, speed: 2.4 } }),
  laughing: pose({ face: F({ happy: 1, aa: 0.6, lids: 0.3 }), headPitch: -0.14, headRoll: 0.08, spine: -0.06, left: A(1.1, 0.6, 1.8), right: A(1.25, 0.2, 0.4), motion: { bounce: 2.6, shake: 0.05, speed: 3 } }),
  affectionate: pose({ face: F({ relaxed: 1 }), headPitch: 0.05, headRoll: 0.22, spine: 0.02, left: A(1.05, 0.65, 2.0), right: A(1.05, 0.65, 2.0), motion: { sway: 0.06, bounce: 0.8, speed: 0.8 } }),
  shy: pose({ face: F({ happy: 0.45, lookDown: 0.6 }), headPitch: 0.18, headRoll: 0.2, headYaw: 0.18, spine: 0.05, left: A(1.1, 0.45, 2.3), right: A(1.1, 0.45, 2.3), motion: { sway: 0.05, bounce: 0.5, speed: 0.8 } }),
  proud: pose({ face: F({ happy: 0.75, lids: 0.25 }), headPitch: -0.16, headRoll: 0, spine: -0.1, left: A(1.05, -0.3, 1.2), right: A(1.05, -0.3, 1.2), motion: { bounce: 0.8, speed: 0.9 } }),
  encouraging: pose({ face: F({ happy: 0.7 }), headPitch: -0.02, headRoll: 0.1, spine: -0.02, left: HANG, right: A(1.1, 0.5, 2.2, 0.7), motion: { nod: 0.08, bounce: 1.2, speed: 1.5 } }),
  calm: pose({ face: F({ relaxed: 0.6, lids: 0.35 }), headPitch: 0.04, headRoll: 0.08, spine: 0, left: A(1.15, 0.4, 1.5), right: A(1.15, 0.4, 1.5), motion: { sway: 0.04, bounce: 0.4, speed: 0.5 } }),
  listening: pose({ face: F({ happy: 0.35, surprised: 0.15 }), headPitch: 0.06, headRoll: 0.16, spine: 0.06, left: A(1.2, 0.1, 0.3), right: A(1.2, 0.1, 0.3), motion: { nod: 0.04, bounce: 0.8 } }),
  curious: pose({ face: F({ surprised: 0.35, happy: 0.2 }), headPitch: 0.02, headRoll: -0.26, headYaw: -0.1, spine: 0.1, left: HANG, right: A(1.15, 0.3, 0.8), motion: { bounce: 0.9, speed: 1.1 } }),
  thinking: pose({ face: F({ lookUp: 0.7, angry: 0.12 }), headPitch: -0.12, headRoll: -0.18, spine: 0, left: A(1.15, 0.55, 1.4), right: A(1.1, 1.0, 2.2), motion: { bounce: 0.6, speed: 0.7 } }),
  confused: pose({ face: F({ angry: 0.25, surprised: 0.3, oh: 0.3 }), headPitch: 0, headRoll: 0.3, spine: 0, left: HANG, right: A(1.1, 0.4, 2.4, 0.8), motion: { sway: 0.06, bounce: 0.6, speed: 0.9 } }),
  surprised: pose({ face: F({ surprised: 1, oh: 0.8 }), headPitch: -0.12, headRoll: 0, spine: -0.12, left: A(0.95, 0.5, 2.0, 0.4), right: A(0.95, 0.5, 2.0, 0.4), motion: { bounce: 1.2, speed: 1.6 } }),
  worried: pose({ face: F({ sad: 0.6, surprised: 0.3, lookDown: 0.2 }), headPitch: 0.12, headRoll: -0.08, spine: 0.08, left: A(1.1, 0.6, 2.2), right: A(1.1, 0.6, 2.2), motion: { shake: 0.015, bounce: 0.6, speed: 1.3 } }),
  sad: pose({ face: F({ sad: 1, lookDown: 0.5 }), headPitch: 0.3, headRoll: -0.1, spine: 0.14, left: A(1.35, 0.1, 0.1), right: A(1.35, 0.1, 0.1), motion: { bounce: 0.4, speed: 0.6 } }),
  exhausted: pose({ face: F({ sad: 0.35, relaxed: 0.35, lids: 0.6, aa: 0.3, lookDown: 0.4 }), headPitch: 0.22, headRoll: 0.3, spine: 0.22, left: A(1.42, 0, 0.05), right: A(1.42, 0, 0.05), motion: { sway: 0.05, bounce: 0.3, speed: 0.45 } }),
  angry: pose({ face: F({ angry: 1 }), headPitch: 0.08, headRoll: 0, spine: 0.04, left: A(1.0, -0.2, 1.3), right: A(1.0, -0.2, 1.3), motion: { shake: 0.03, bounce: 0.6, speed: 1.8 } }),
};

/** Mentor keeps the same face but calmer, smaller body motion. */
export function rigPose(emotion: Emotion, mode: "companion" | "mentor"): RigPose {
  const p = RIG_POSES[emotion] ?? RIG_POSES.neutral;
  if (mode === "companion") return p;
  return { ...p, headRoll: p.headRoll * 0.6, motion: { ...p.motion, bounce: p.motion.bounce * 0.6, shake: p.motion.shake * 0.5 } };
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
  const k = 1 - Math.exp(-5 * Math.min(Math.max(dt, 0), 0.1));
  const lerpObj = <T extends Record<string, number>>(a: T, b: T): T => {
    const o = {} as Record<string, number>;
    for (const key of Object.keys(b)) o[key] = (a[key] ?? 0) + ((b[key] ?? 0) - (a[key] ?? 0)) * k;
    return o as T;
  };
  const l = (a: number, b: number) => a + (b - a) * k;
  return {
    face: lerpObj(cur.face, target.face), motion: lerpObj(cur.motion, target.motion),
    headPitch: l(cur.headPitch, target.headPitch), headRoll: l(cur.headRoll, target.headRoll), headYaw: l(cur.headYaw, target.headYaw),
    spine: l(cur.spine, target.spine), left: lerpObj(cur.left, target.left), right: lerpObj(cur.right, target.right),
  };
}
