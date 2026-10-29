import avatar from "@/assets/dessert-avatar.png";
import type { Emotion } from "@/lib/dessert-api";
import { cn } from "@/lib/utils";

const filters: Record<Emotion, string> = {
  neutral: "",
  happy: "brightness-110 saturate-125",
  excited: "brightness-115 saturate-150",
  affectionate: "saturate-125 hue-rotate-[-8deg]",
  sad: "saturate-50 brightness-90",
  thinking: "brightness-95",
  listening: "brightness-105",
};

export function Avatar({ emotion = "neutral", size = 280 }: { emotion?: Emotion; size?: number }) {
  return (
    <div className="relative animate-float" style={{ width: size, height: size }} role="img" aria-label={`Dessert, feeling ${emotion}`}>
      <div className={cn("absolute inset-0 rounded-full halo animate-halo blur-2xl transition-opacity duration-700", emotion === "sad" && "opacity-30")} />
      <img src={avatar} alt="" className={cn("relative h-full w-full object-contain animate-breathe transition-[filter] duration-700", filters[emotion])} />
      {emotion === "thinking" && (
        <div className="absolute right-4 top-6 flex gap-1">
          {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 rounded-full bg-accent animate-dot" style={{ animationDelay: `${i * 0.15}s` }} />)}
        </div>
      )}
      {(emotion === "affectionate" || emotion === "excited") && (
        <span className="absolute left-6 top-8 text-2xl text-primary animate-float" aria-hidden>♥</span>
      )}
      {emotion === "listening" && <span className="absolute inset-6 rounded-full border-2 border-primary/40 animate-halo" />}
    </div>
  );
}
