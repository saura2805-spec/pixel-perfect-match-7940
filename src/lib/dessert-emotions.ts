export const EMOTIONS = [
  "neutral", "happy", "excited", "laughing", "affectionate", "shy", "proud", "encouraging", "calm",
  "listening", "curious", "thinking", "confused", "surprised", "worried", "sad", "exhausted", "angry",
] as const;
export type Emotion = (typeof EMOTIONS)[number];

export type MoodReading = { emotion: Emotion; intensity: number; cues: string[] };
type Lexicon = Partial<Record<Emotion, [string, number][]>>;

// Weighted cues: words/phrases (matched on word boundaries) and emoji.
const LEX: Lexicon = {
  happy: [["happy", 2], ["glad", 2], ["good day", 2], ["nice", 1], ["great", 1.5], ["good", 1], ["smile", 1.5], ["enjoyed", 2], ["fun", 1.5], ["😊", 2], ["🙂", 1]],
  excited: [["excited", 3], ["can't wait", 3], ["cant wait", 3], ["amazing", 2], ["awesome", 2], ["yay", 2.5], ["finally", 1.5], ["🎉", 2.5], ["🤩", 3]],
  laughing: [["haha", 3], ["hahaha", 3.5], ["lol", 2.5], ["lmao", 3], ["hehe", 2], ["funny", 2], ["hilarious", 3], ["joke", 1.5], ["😂", 3.5], ["🤣", 3.5]],
  affectionate: [["love you", 4], ["miss you", 3.5], ["hug", 2.5], ["cuddle", 3], ["thank you", 2], ["thanks", 1.5], ["you're the best", 3], ["sweet", 1.5], ["💜", 3], ["❤️", 3], ["🥰", 3.5]],
  shy: [["blush", 3], ["embarrassed", 3], ["shy", 3], ["aww", 2], ["cute", 2], ["compliment", 1.5], ["😳", 3], ["☺️", 2.5]],
  proud: [["proud", 3.5], ["passed", 3], ["got the job", 4], ["topped", 3], ["finished", 2], ["did it", 3], ["achieved", 3], ["well done", 2.5], ["great job", 2.5], ["scored", 2], ["🏆", 3]],
  encouraging: [["you can do", 3.5], ["keep going", 3], ["believe in you", 3.5], ["don't give up", 3.5], ["step by step", 2], ["you've got this", 3.5], ["try again", 2], ["💪", 2.5]],
  calm: [["breathe", 2.5], ["relax", 2.5], ["calm", 2.5], ["rest", 2], ["gently", 1.5], ["peaceful", 2.5], ["sleep well", 2.5], ["take it easy", 2.5], ["🌙", 2]],
  curious: [["tell me more", 3], ["curious", 2.5], ["what happened", 2.5], ["how come", 2], ["interesting", 2], ["really?", 1.5], ["guess what", 3]],
  thinking: [["let me think", 3], ["thinking", 2], ["consider", 1.5], ["maybe", 1], ["plan", 1], ["decide", 2], ["should i", 2], ["differential", 2]],
  confused: [["confused", 3], ["confusing", 3], ["don't understand", 3.5], ["not sure", 2], ["unclear", 2.5], ["hmm", 1.5], ["what do you mean", 3], ["lost", 1.5], ["🤔", 2.5]],
  surprised: [["wow", 2.5], ["whoa", 2.5], ["no way", 3], ["omg", 3], ["unbelievable", 3], ["suddenly", 1.5], ["can't believe", 3], ["😮", 3], ["😲", 3]],
  worried: [["worried", 3.5], ["anxious", 3.5], ["nervous", 3], ["scared", 3], ["stressed", 3], ["stress", 2.5], ["afraid", 3], ["panic", 3.5], ["exam tomorrow", 2.5], ["what if", 2], ["😟", 3], ["😰", 3]],
  sad: [["sad", 3.5], ["cry", 3], ["crying", 3.5], ["lonely", 3.5], ["heartbroken", 4], ["upset", 3], ["depressed", 4], ["failed", 3], ["miss", 1.5], ["lost my", 3], ["sorry to hear", 2.5], ["bad day", 3], ["😢", 3.5], ["😭", 4]],
  exhausted: [["tired", 3], ["exhausted", 4], ["sleepy", 3], ["drained", 3.5], ["worn out", 3.5], ["burnt out", 4], ["burned out", 4], ["no energy", 3.5], ["long day", 2.5], ["all night", 2], ["😴", 3], ["🥱", 3]],
  angry: [["angry", 3.5], ["furious", 4], ["annoyed", 3], ["frustrated", 3], ["frustrating", 3], ["mad at", 3], ["hate", 2.5], ["unfair", 2.5], ["😠", 3], ["😡", 3.5]],
};

// What "not X" means for each mood.
const NEGATED: Partial<Record<Emotion, Emotion>> = {
  happy: "sad", excited: "neutral", proud: "sad", calm: "worried", laughing: "neutral",
  sad: "calm", worried: "calm", angry: "calm", exhausted: "neutral", confused: "neutral",
};
const NEGATORS = /\b(not|never|no|isn't|isnt|wasn't|don't|dont|didn't|can't|cannot|hardly|barely)\s+(\w+\s+){0,2}$/i;
const BOOST = /\b(so|very|really|super|extremely|totally|incredibly|too)\s+$/i;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function score(text: string, weight: number, into: Map<Emotion, number>, cues: Map<Emotion, string[]>) {
  if (!text.trim()) return;
  const shouting = /[A-Z]{4,}/.test(text) ? 1.3 : 1;
  const bangs = Math.min(3, (text.match(/!/g) ?? []).length);
  for (const [emotion, entries] of Object.entries(LEX) as [Emotion, [string, number][]][]) {
    for (const [cue, w] of entries) {
      const re = /^\w/.test(cue) ? new RegExp(`\\b${escape(cue)}\\b`, "gi") : new RegExp(escape(cue), "g");
      for (const m of text.matchAll(re)) {
        const before = text.slice(Math.max(0, (m.index ?? 0) - 30), m.index);
        let target: Emotion = emotion; let amount = w * weight * shouting;
        if (NEGATORS.test(before)) { const flip = NEGATED[emotion]; if (!flip) continue; target = flip; amount *= 0.7; }
        if (BOOST.test(before)) amount *= 1.5;
        into.set(target, (into.get(target) ?? 0) + amount);
        if (target !== "neutral") cues.set(target, [...(cues.get(target) ?? []), m[0].toLowerCase()]);
      }
    }
  }
  if (bangs >= 2) into.set("excited", (into.get("excited") ?? 0) + bangs * 0.6 * weight);
  if (/\?\s*$/.test(text.trim())) into.set("curious", (into.get("curious") ?? 0) + 0.8 * weight);
}

/**
 * Local context reading (no AI): weighs your latest message most, Dessert's reply next,
 * and the previous mood a little, handling negation ("not happy"), intensifiers and emoji.
 */
export function readMood(input: { user?: string; reply?: string; previous?: Emotion; recent?: string[] }): MoodReading {
  const scores = new Map<Emotion, number>(); const cues = new Map<Emotion, string[]>();
  score(input.user ?? "", 1, scores, cues);
  score(input.reply ?? "", 0.6, scores, cues);
  for (const [i, line] of (input.recent ?? []).slice(-3).reverse().entries()) score(line, 0.25 / (i + 1), scores, cues);
  if (input.previous && input.previous !== "neutral" && input.previous !== "listening" && input.previous !== "thinking") {
    scores.set(input.previous, (scores.get(input.previous) ?? 0) + 0.6);
  }
  // A celebration mixed with fatigue reads as proud; sadness with fear reads as worried.
  const get = (e: Emotion) => scores.get(e) ?? 0;
  if (get("proud") > 0 && get("exhausted") > 0) scores.set("proud", get("proud") + 1);
  if (get("sad") > 0 && get("worried") > 0) scores.set("worried", get("worried") + 1);
  scores.delete("neutral");
  let best: Emotion = "neutral", top = 0;
  for (const [e, s] of scores) if (s > top) { best = e; top = s; }
  if (top < 1.4) return { emotion: "neutral", intensity: 0.5, cues: [] };
  return { emotion: best, intensity: Math.min(1, 0.45 + top / 8), cues: [...new Set(cues.get(best) ?? [])].slice(0, 3) };
}

/** Backwards-compatible single-text helper. */
export function inferEmotion(text: string): Emotion { return readMood({ user: text }).emotion; }

export const SAMPLE_MESSAGES: { label: string; user: string }[] = [
  { label: "Passed exam", user: "I finally passed my anatomy exam!! I'm so proud" },
  { label: "Long night", user: "I studied all night and I'm completely drained" },
  { label: "Not great", user: "Honestly I'm not happy with how today went" },
  { label: "Nervous", user: "What if I mess up my viva tomorrow? I'm really nervous" },
  { label: "Joke", user: "haha my friend fell asleep in the lecture 😂" },
  { label: "Lonely", user: "I feel kind of lonely tonight" },
  { label: "Confused", user: "I don't understand the Krebs cycle at all, it's so confusing" },
  { label: "Frustrated", user: "My group partner ignored my work again, so frustrating" },
  { label: "Big news", user: "OMG guess what, I got into the surgery elective!" },
  { label: "Thank you", user: "Thank you for always listening, you're the best 💜" },
  { label: "Compliment", user: "You look really cute today" },
  { label: "Wind down", user: "I'm going to relax and take it easy tonight" },
];
