export const GREETING_TEXT = "Hii Mango00! 💜 I’m happy you’re here.";
export const GREETING_DURATION = 5.2;
const smooth = (n: number) => { const v = Math.max(0, Math.min(1, n)); return v * v * (3 - 2 * v); };

// Three complete wrist waves between the arm's smooth lift and lower.
export function greetingPose(seconds: number, reducedMotion = false) {
  const active = seconds >= 0 && seconds < GREETING_DURATION;
  const warmth = active ? smooth(seconds / 0.6) * (1 - smooth((seconds - 4.3) / 0.9)) : 0;
  const lift = reducedMotion ? 0 : smooth((seconds - 0.3) / 0.8) * (1 - smooth((seconds - 3.8) / 1));
  const waveProgress = Math.max(0, Math.min(1, (seconds - 1.2) / 2.4));
  return {
    active, warmth,
    lift,
    wrist: reducedMotion || !active ? 0 : Math.sin(waveProgress * Math.PI * 6) * 0.3 * lift,
    turn: reducedMotion || !active ? 0 : -0.22 * (1 - smooth(seconds / 1.1)) * warmth,
  };
}