// Frontend client for the local Express + Ollama backend.
// INTEGRATION: set VITE_DESSERT_API_URL (default http://localhost:3001).
// Expected: POST {base}/api/chat  body {message, mode, history}  -> {reply, emotion?}
export type Mode = "companion" | "mentor";
export type Emotion = "happy" | "sad" | "affectionate" | "thinking" | "excited" | "neutral" | "listening";
export type ChatMessage = { id: string; role: "user" | "assistant"; content: string; emotion?: Emotion | undefined };

const BASE = (import.meta.env["VITE_DESSERT_API_URL"] as string | undefined) ?? "http://localhost:3001";
const EMOTIONS: Emotion[] = ["happy", "sad", "affectionate", "thinking", "excited", "neutral", "listening"];

export async function sendChat(mode: Mode, message: string, history: ChatMessage[]) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, mode, history: history.map(({ role, content }) => ({ role, content })) }),
  });
  if (!res.ok) throw new Error(`Backend responded ${res.status}`);
  const data = await res.json();
  const reply: string = data.reply ?? data.message ?? data.response ?? "";
  // Only use emotion if the backend actually provides it.
  const emotion = EMOTIONS.includes(data.emotion) ? (data.emotion as Emotion) : undefined;
  return { reply, emotion };
}
