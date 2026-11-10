export const EMOTIONS = [
  "neutral", "happy", "excited", "laughing", "affectionate", "shy", "proud", "encouraging", "calm",
  "listening", "curious", "thinking", "confused", "surprised", "worried", "sad", "exhausted", "angry",
] as const;
export type Emotion = (typeof EMOTIONS)[number];

// Local word-cue fallback used only when the local AI reply carries no emotion.
const CUES: [Emotion, RegExp][] = [
  ["laughing", /\b(haha+|lol|lmao|hehe+|funny|hilarious)\b|😂|🤣/i],
  ["affectionate", /\b(love you|miss you|hug|cuddle|sweetheart|darling)\b|💜|❤️|🥰/i],
  ["exhausted", /\b(tired|exhausted|sleepy|drained|worn out|burn(ed|t)? out|no energy)\b|😴|🥱/i],
  ["sad", /\b(sad|sorry to hear|cry|crying|lonely|heartbroken|upset|depressed)\b|😢|😭/i],
  ["worried", /\b(worried|anxious|nervous|scared|stress(ed)?|afraid|panic)\b|😟|😰/i],
  ["angry", /\b(angry|furious|annoyed|frustrat(ed|ing)|mad at|hate)\b|😠|😡/i],
  ["surprised", /\b(wow|whoa|no way|really\?|omg|unbelievable)\b|😮|😲/i],
  ["proud", /\b(proud|well done|great job|you did it|achiev(ed|ement)|passed)\b|🏆/i],
  ["excited", /\b(excited|can't wait|amazing|awesome|yay)\b|!{2,}|🎉|🤩/i],
  ["encouraging", /\b(you can do|keep going|believe in you|don't give up|step by step)\b|💪/i],
  ["shy", /\b(blush|embarrass(ed|ing)|shy|aww)\b|😳|☺️/i],
  ["confused", /\b(confus(ed|ing)|not sure|don't understand|unclear|hmm+)\b|🤔/i],
  ["curious", /\b(tell me more|curious|what happened|how come|interesting)\b|\?$/i],
  ["calm", /\b(breathe|relax|calm|rest|gently|peace)\b|🌙/i],
  ["happy", /\b(happy|glad|good|nice|great|smile)\b|😊|🙂/i],
];

export function inferEmotion(text: string): Emotion {
  for (const [emotion, re] of CUES) if (re.test(text)) return emotion;
  return "neutral";
}
