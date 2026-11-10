import { useEffect, useRef, useState } from "react";
import { Avatar3D as Avatar } from "./Avatar3D";
import { sendChat, type ChatMessage, type Emotion, type Mode } from "@/lib/dessert-api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowUpRight, Mic, Square, MessageSquarePlus } from "lucide-react";
import { companionEmotion } from "@/lib/dessert-state";
import { claimCompanionGreeting, newCompanionSession, useChatSession } from "@/hooks/use-companion-session";
import { GREETING_TEXT } from "@/lib/dessert-greeting";
import { WorkspaceNav } from "./WorkspaceNav";
import { useDessertJournal } from "@/hooks/use-dessert-journal";
import { mentorMessage, RESPONSE_STYLES } from "@/lib/dessert-journal";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Recognition = { interimResults: boolean; lang: string; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; start: () => void; stop: () => void; abort: () => void };
type VoiceWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

const NICK = "Mango 🥭";
const copy: Record<Mode, { title: string; empty: string; hint: string; placeholder: string }> = {
  companion: { title: "Dessert", empty: `Hi ${NICK}, I'm here.`, hint: "Tell me about your day — the big things or the tiny ones.", placeholder: `Talk to Dessert…` },
  mentor: { title: "Medical Mentor", empty: `Ready when you are, ${NICK}.`, hint: "Share a case, ask for a review, or quiz yourself.", placeholder: "Ask a question…" },
};

export function ChatScreen({ mode, selectedCaseId }: { mode: Mode; selectedCaseId?: string }) {
  const journal = useDessertJournal();
  const [caseId, setCaseId] = useState(selectedCaseId ?? "none");
  const [styleId, setStyleId] = useState("quick");
  useEffect(() => { setCaseId(selectedCaseId ?? "none"); }, [selectedCaseId]);
  const { session, update } = useChatSession(mode);
  const { messages, input, emotion } = session;
  const setMessages = (messages: ChatMessage[]) => update({ messages });
  const setInput = (input: string) => update({ input });
  const setEmotion = (emotion: Emotion) => update({ emotion });
  const [greetingVisible, setGreetingVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<Recognition | null>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const [voiceOk, setVoiceOk] = useState(false);
  const c = copy[mode];

  useEffect(() => {
    if (mode !== "companion") return;
    const viewport = window.visualViewport;
    const resize = () => {
      const el = layoutRef.current;
      if (!el) return;
      const height = viewport?.height ?? window.innerHeight;
      el.style.setProperty("--dessert-viewport-height", `${height}px`);
      el.dataset["compact"] = String(window.innerWidth < 1024 && height < 500);
    };
    resize();
    viewport?.addEventListener("resize", resize);
    window.addEventListener("resize", resize);
    return () => { viewport?.removeEventListener("resize", resize); window.removeEventListener("resize", resize); };
  }, [mode]);

  useEffect(() => {
    const voiceWindow = window as VoiceWindow;
    setVoiceOk(Boolean(voiceWindow.SpeechRecognition || voiceWindow.webkitSpeechRecognition));
    return () => { const r = recRef.current; if (r) { r.onresult = null; r.onend = null; r.onerror = null; r.abort(); } };
  }, []);
  useEffect(() => {
    const thread = threadRef.current;
    thread?.scrollTo({ top: thread.scrollHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [messages, loading]);
  useEffect(() => {
    const el = composerRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 144)}px`; }
  }, [input]);
  useEffect(() => { composerRef.current?.focus({ preventScroll: true }); }, [mode]);

  const displayEmotion = companionEmotion(input, listening, loading, emotion);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    recRef.current?.stop(); setListening(false);
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next); setInput(""); setLoading(true); setError(null);
    try {
      const request = mode === "mentor" ? mentorMessage(text, styleId, journal.cases.find((c) => c.id === caseId), journal.reviews) : text;
      const { reply, emotion: e } = await sendChat(mode, request, messages);
      setMessages([...next, { id: crypto.randomUUID(), role: "assistant", content: reply, emotion: e }]);
      setEmotion(e ?? "neutral");
    } catch {
      setError("I can’t reach the local AI right now. Check that Express and Ollama are running, then try again.");
      setEmotion("sad");
    } finally { setLoading(false); composerRef.current?.focus({ preventScroll: true }); }
  }

  function toggleVoice() {
    const voiceWindow = window as VoiceWindow;
    const SR = voiceWindow.SpeechRecognition || voiceWindow.webkitSpeechRecognition;
    if (!SR) return;
    if (listening) { recRef.current?.stop(); return; }
    const r = new SR(); r.interimResults = true; r.lang = "en-US";
    r.onresult = (e) => setInput(Array.from(e.results).map((x) => x[0]?.transcript ?? "").join(" "));
    r.onend = () => setListening(false);
    r.onerror = () => { setListening(false); setError("Voice input isn’t available right now. You can still type your message."); };
    recRef.current = r;
    try { r.start(); setListening(true); setError(null); } catch { setListening(false); setError("Microphone access isn’t available. You can still type your message."); }
  }

  return (
    <div ref={layoutRef} data-mode={mode} className="dessert-layout mx-auto grid max-w-7xl gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6 lg:p-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="dessert-profile glass flex min-w-0 flex-col items-center rounded-3xl p-3 sm:p-4 lg:p-6">
        <WorkspaceNav />
        <div className="dessert-identity grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center justify-center gap-2 lg:flex lg:flex-1 lg:flex-col lg:gap-0 lg:py-6">
          <Avatar emotion={displayEmotion} mode={mode} size={260} greeting={mode === "companion" ? {
            sessionId: session.id, claim: claimCompanionGreeting,
            onStart: () => setGreetingVisible(true), onEnd: () => setGreetingVisible(false),
          } : undefined} />
          <div className="min-w-0 lg:text-center">
            <h1 className="font-display text-3xl italic lg:mt-4 lg:text-4xl">Dessert</h1>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground sm:text-sm lg:justify-center">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", error ? "bg-destructive" : "bg-online")} />
              {error ? "Connection unavailable" : loading ? "Thinking…" : listening ? "Listening…" : "Here with you"}
            </div>
            <span className="mt-3 inline-block rounded-full border border-primary/30 px-3 py-1 text-[10px] uppercase tracking-widest text-primary">{displayEmotion}</span>
            {mode === "companion" && greetingVisible && <p role="status" className="mt-3 max-w-64 text-sm leading-relaxed text-primary animate-rise">{GREETING_TEXT}</p>}
          </div>
        </div>
        <p className="hidden text-center text-xs text-muted-foreground lg:block">Local AI · just you and Dessert</p>
      </aside>

      <section className="dessert-conversation glass flex min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl">
        <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
          <h2 className="font-display text-xl">{c.title}</h2>
          <p className="text-xs text-muted-foreground">{mode === "companion" ? `Chatting with ${NICK}` : "Cases · reviews · memory"}</p>
          </div>
          {mode === "companion" && <Button variant="ghost" size="icon" title="New chat" aria-label="New chat" disabled={loading} onClick={() => {
            recRef.current?.stop(); setListening(false); setError(null); setGreetingVisible(false); newCompanionSession();
          }}><MessageSquarePlus /></Button>}
        </header>
        {mode === "mentor" && <div className="dessert-mentor-options grid shrink-0 gap-3 border-b bg-online/5 px-4 py-3 sm:grid-cols-2 sm:px-6">
          <div className="min-w-0 space-y-2"><Label htmlFor="mentor-case" className="text-xs text-muted-foreground">Discuss a saved case (optional)</Label><Select value={journal.cases.some((c) => c.id === caseId) ? caseId : "none"} onValueChange={setCaseId} disabled={loading}><SelectTrigger id="mentor-case"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">New discussion / no specific case</SelectItem>{journal.cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent></Select></div>
          <div className="min-w-0 space-y-2"><Label htmlFor="response-style" className="text-xs text-muted-foreground">Response style</Label><Select value={styleId} onValueChange={setStyleId} disabled={loading}><SelectTrigger id="response-style"><SelectValue /></SelectTrigger><SelectContent>{RESPONSE_STYLES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent></Select></div>
          {journal.error && <p role="alert" className="text-xs text-destructive sm:col-span-2">{journal.error}</p>}
        </div>}
        <div ref={threadRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6" role="log" aria-label="Conversation" aria-live="polite">
          {messages.length === 0 && !loading && (
            <div className="dessert-empty flex h-full flex-col items-center justify-center text-center animate-rise">
              <p className="font-display text-2xl italic sm:text-3xl">{c.empty}</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">{c.hint}</p>
              <div className="mt-5 flex max-w-lg flex-wrap justify-center gap-2">
                {(mode === "companion" ? ["How was your day?", "Help me focus on studying", "Let’s have a little chat"] : ["Help me build a differential diagnosis", "What important findings are missing?", "Help me review a diagnostic mistake"]).map((prompt) => <Button key={prompt} type="button" variant="outline" className="h-auto max-w-full whitespace-normal text-xs" onClick={() => { setInput(prompt); composerRef.current?.focus({ preventScroll: true }); }}>{prompt}<ArrowUpRight className="size-3 shrink-0" /></Button>)}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn("flex animate-message", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[90%] whitespace-pre-wrap break-words rounded-3xl px-4 py-3 text-[15px] leading-relaxed sm:max-w-[80%] sm:px-5",
                m.role === "user" ? "rounded-br-md bg-bubble-user text-primary-foreground" : "rounded-bl-md border bg-bubble-ai")}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-3 animate-rise"><div className="flex h-11 items-center gap-1.5 rounded-3xl rounded-bl-md border bg-bubble-ai px-5" role="status" aria-label="Dessert is thinking">
              {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 rounded-full bg-primary animate-dot" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div><span className="text-xs text-muted-foreground">Thinking…</span></div>
          )}
          {error && <p className="text-center text-sm text-destructive animate-rise">{error}</p>}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="dessert-composer m-3 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-2 rounded-2xl border bg-muted/50 p-2 transition-shadow focus-within:ring-2 focus-within:ring-ring sm:m-4">
          <textarea ref={composerRef} value={input} onChange={(e) => setInput(e.target.value)} rows={1} placeholder={c.placeholder} aria-label="Message"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
            className="max-h-36 min-h-11 min-w-0 w-full resize-none bg-transparent px-2 py-3 text-sm outline-none placeholder:text-muted-foreground sm:px-3 sm:text-[15px]" />
          <div className="flex shrink-0 items-center gap-1">
          {voiceOk && (
            <Button type="button" variant="ghost" size="icon" disabled={loading} onClick={toggleVoice} aria-label={listening ? "Stop voice input" : "Start voice input"} title={listening ? "Stop voice input" : "Start voice input"} aria-pressed={listening}
              className={cn("h-11 w-11 rounded-xl", listening ? "bg-accent text-accent-foreground" : "text-muted-foreground")}>{listening ? <Square /> : <Mic />}</Button>
          )}
          <Button type="submit" size="icon" disabled={!input.trim() || loading} aria-label="Send" title="Send message"
            className="h-11 w-11 rounded-xl hover:glow"><ArrowUp /></Button>
          </div>
        </form>
      </section>
    </div>
  );
}
