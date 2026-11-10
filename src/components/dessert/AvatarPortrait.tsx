import { useEffect, useState } from "react";
import type { Emotion, Mode } from "@/lib/dessert-api";
import { GREETING_DURATION } from "@/lib/dessert-greeting";
import idle from "@/assets/dessert-idle.webp";
import wave from "@/assets/dessert-wave.webp";

type Greeting = { sessionId: number; claim: (id: number) => boolean; onStart: () => void; onEnd: () => void };

// Polished rendered portrait of Dessert; moods are expressed with gentle CSS motion.
export function AvatarPortrait({ emotion = "neutral", mode = "companion", greeting }: { emotion?: Emotion; mode?: Mode; size?: number; greeting?: Greeting | undefined }) {
  const [waving, setWaving] = useState(false);
  const sessionId = greeting?.sessionId;
  useEffect(() => {
    if (!greeting || !greeting.claim(greeting.sessionId)) return;
    greeting.onStart(); setWaving(true);
    const timer = window.setTimeout(() => { setWaving(false); greeting.onEnd(); }, GREETING_DURATION * 1000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);
  return (
    <div className="dessert-avatar dessert-portrait relative shrink-0" data-emotion={emotion} data-mode={mode} data-greeting-active={String(waving)} data-scene-ready="true" role="img" aria-label={`Dessert, feeling ${emotion}`}>
      <div className="dessert-portrait-glow" aria-hidden="true" />
      <img src={idle} alt="" className="dessert-portrait-img" data-visible={!waving} draggable={false} />
      <img src={wave} alt="" className="dessert-portrait-img dessert-portrait-wave" data-visible={waving} draggable={false} />
    </div>
  );
}
