import { useEffect, useState } from "react";
import type { Emotion, Mode } from "@/lib/dessert-api";
import { GREETING_DURATION } from "@/lib/dessert-greeting";
import neutral from "@/assets/dessert-face-neutral.webp";
import happy from "@/assets/dessert-face-happy.webp";
import excited from "@/assets/dessert-face-excited.webp";
import affectionate from "@/assets/dessert-face-affectionate.webp";
import sad from "@/assets/dessert-face-sad.webp";
import thinking from "@/assets/dessert-face-thinking.webp";
import listening from "@/assets/dessert-face-listening.webp";
import wave from "@/assets/dessert-face-wave.webp";
import waveClip from "@/assets/dessert-wave.mp4.asset.json";
import { useRef } from "react";

type Greeting = { sessionId: number; claim: (id: number) => boolean; onStart: () => void; onEnd: () => void };
const FACES: Record<Emotion | "wave", string> = { neutral, happy, excited, affectionate, sad, thinking, listening, wave };

// Half-body portraits, one expression per mood, cross-faded so changes feel smooth.
export function AvatarPortrait({ emotion = "neutral", mode = "companion", greeting }: { emotion?: Emotion; mode?: Mode; size?: number; greeting?: Greeting | undefined }) {
  const [waving, setWaving] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const sessionId = greeting?.sessionId;
  useEffect(() => {
    if (!greeting || !greeting.claim(greeting.sessionId)) return;
    greeting.onStart(); setWaving(true);
    const v = video.current;
    if (v && !reduced) { v.currentTime = 0; void v.play().catch(() => {}); }
    const timer = window.setTimeout(() => { setWaving(false); greeting.onEnd(); }, GREETING_DURATION * 1000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);
  const playingClip = waving && !reduced;
  const shown = waving ? "wave" : emotion;
  return (
    <div className="dessert-avatar dessert-portrait relative shrink-0" data-emotion={shown} data-mode={mode} data-greeting-active={String(waving)} data-scene-ready="true" role="img" aria-label={`Dessert, feeling ${emotion}`}>
      <div className="dessert-portrait-glow" aria-hidden="true" />
      <div className="dessert-portrait-body">
        {(Object.keys(FACES) as (keyof typeof FACES)[]).map((key) => (
          <img key={key} src={FACES[key]} alt="" className="dessert-portrait-img" data-visible={key === shown && !(key === "wave" && playingClip)} draggable={false} />
        ))}
        <video ref={video} src={waveClip.url} muted playsInline preload="auto" aria-hidden="true" className="dessert-portrait-img dessert-portrait-video" data-visible={playingClip} />
      </div>
    </div>
  );
}
