import { useState, useSyncExternalStore } from "react";
import type { ChatMessage, Emotion, Mode } from "@/lib/dessert-api";

export type CompanionSession = { id: number; messages: ChatMessage[]; input: string; emotion: Emotion; greeted: boolean };
const initialSession: CompanionSession = { id: 1, messages: [], input: "", emotion: "neutral", greeted: false };
let session = initialSession;
const subscribers = new Set<() => void>();
function subscribe(listener: () => void) { subscribers.add(listener); return () => { subscribers.delete(listener); }; }
function notify() { subscribers.forEach((listener) => listener()); }
export function updateCompanionSession(update: Partial<CompanionSession>) { session = { ...session, ...update }; notify(); }
export function claimCompanionGreeting(id: number) {
  if (session.id !== id || session.greeted) return false;
  updateCompanionSession({ greeted: true });
  return true;
}
export function newCompanionSession() {
  session = { ...initialSession, id: session.id + 1, messages: [] }; notify();
}

// Ephemeral browser-memory session: survives mode navigation, not a full reload.
export function useChatSession(mode: Mode) {
  const companion = useSyncExternalStore(subscribe, () => session, () => initialSession);
  const [mentor, setMentor] = useState<CompanionSession>(initialSession);
  const current = mode === "companion" ? companion : mentor;
  const update = (values: Partial<CompanionSession>) => {
    if (mode === "companion") updateCompanionSession(values);
    else setMentor((previous) => ({ ...previous, ...values }));
  };
  return { session: current, update };
}