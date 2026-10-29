import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Avatar } from "./Avatar";
import { sendChat, type ChatMessage, type Emotion, type Mode } from "@/lib/dessert-api";
import { cn } from "@/lib/utils";

const NICK = "Mango00";
const copy: Record<Mode, { title: string; empty: string; hint: string; placeholder: string }> = {
  companion: { title: "Dessert", empty: `Hi ${NICK}, I'm here.`, hint: "Tell me about your day — the big things or the tiny ones.", placeholder: `Talk to Dessert…` },
  mentor: { title: "Medical Mentor", empty: `Ready when you are, ${NICK}.`, hint: "Share a case, ask for a review, or quiz yourself.", placeholder: "Describe a case or ask a question…" },
};

export function ChatScreen({ mode }: { mode: Mode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emotion, setEmotion] = useState<Emotion>("neutral");
  const [listening, setListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const [voiceOk, setVoiceOk] = useState(false);
  const c = copy[mode];

  useEffect(() => { setVoiceOk(typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const displayEmotion: Emotion = listening ? "listening" : loading ? "thinking" : input ? "listening" : emotion;

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next); setInput(""); setLoading(true); setError(null);
    try {
      const { reply, emotion: e } = await sendChat(mode, text, messages);
      setMessages([...next, { id: crypto.randomUUID(), role: "assistant", content: reply, emotion: e }]);
      setEmotion(e ?? "neutral");
    } catch {
      setError("I can't reach my local brain right now. Is the backend and Ollama running?");
      setEmotion("sad");
    } finally { setLoading(false); }
  }

  function toggleVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (listening) { recRef.current?.stop(); return; }
    const r = new SR(); r.interimResults = true; r.lang = "en-US";
    r.onresult = (e: any) => setInput(Array.from(e.results).map((x: any) => x[0].transcript).join(""));
    r.onend = () => setListening(false);
    recRef.current = r; r.start(); setListening(true);
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-7xl gap-6 p-4 md:p-6 lg:grid-cols-[360px_1fr]">
      <aside className="glass flex flex-col items-center rounded-3xl p-6 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
        <nav className="flex w-full gap-1 rounded-full bg-muted/60 p-1 text-sm" aria-label="Modes">
          {([["/", "Companion"], ["/mentor", "Medical Mentor"]] as const).map(([to, label]) => (
            <Link key={to} to={to} className="flex-1 rounded-full px-3 py-2 text-center text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "bg-primary text-primary-foreground hover:text-primary-foreground glow" }} activeOptions={{ exact: true }}>{label}</Link>
          ))}
        </nav>
        <div className="flex flex-1 flex-col items-center justify-center py-6">
          <Avatar emotion={displayEmotion} size={260} />
          <h1 className="mt-4 font-display text-4xl italic">Dessert</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", error ? "bg-destructive" : "bg-online animate-halo")} />
            {error ? "Offline" : loading ? "Thinking…" : "Here with you"}
          </div>
          <span className="mt-3 rounded-full border border-primary/30 px-3 py-1 text-xs uppercase tracking-widest text-primary transition-all">{displayEmotion}</span>
        </div>
        <p className="text-center text-xs text-muted-foreground">Running locally · private to you</p>
      </aside>

      <section className="glass flex min-h-[70vh] flex-col rounded-3xl lg:h-[calc(100vh-3rem)]">
        <header className="border-b px-6 py-4">
          <h2 className="font-display text-xl">{c.title}</h2>
          <p className="text-xs text-muted-foreground">{mode === "companion" ? `Chatting with ${NICK}` : "Cases · reviews · memory"}</p>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6" aria-live="polite">
          {messages.length === 0 && !loading && (
            <div className="flex h-full flex-col items-center justify-center text-center animate-rise">
              <p className="font-display text-3xl italic">{c.empty}</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">{c.hint}</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn("flex animate-rise", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] whitespace-pre-wrap rounded-3xl px-5 py-3 text-[15px] leading-relaxed",
                m.role === "user" ? "rounded-br-md bg-bubble-user text-primary-foreground" : "rounded-bl-md border bg-bubble-ai")}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div className="flex animate-rise"><div className="flex gap-1.5 rounded-3xl rounded-bl-md border bg-bubble-ai px-5 py-4" aria-label="Dessert is typing">
              {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 rounded-full bg-primary animate-dot" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div></div>
          )}
          {error && <p className="text-center text-sm text-destructive animate-rise">{error}</p>}
          <div ref={endRef} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="m-4 flex items-end gap-2 rounded-2xl border bg-muted/50 p-2 focus-within:ring-2 focus-within:ring-ring">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={1} placeholder={c.placeholder} aria-label="Message"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 outline-none placeholder:text-muted-foreground" />
          {voiceOk && (
            <button type="button" onClick={toggleVoice} aria-label={listening ? "Stop voice input" : "Start voice input"}
              className={cn("grid h-10 w-10 place-items-center rounded-xl transition-colors", listening ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary")}>🎙</button>
          )}
          <button type="submit" disabled={!input.trim() || loading} aria-label="Send"
            className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground transition-all hover:glow disabled:opacity-40">➤</button>
        </form>
      </section>
    </div>
  );
}
