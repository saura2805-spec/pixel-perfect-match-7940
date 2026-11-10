import type { Emotion } from "./dessert-api";

export function companionEmotion(input: string, listening: boolean, waiting: boolean, replyEmotion: Emotion): Emotion {
  if (waiting) return "thinking";
  if (listening || input.trim()) return "listening";
  return replyEmotion;
}

