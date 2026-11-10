import { describe, expect, it } from "vitest";
import { companionEmotion } from "@/lib/dessert-state";

describe("Dessert companion reactions", () => {
  it("listens while the user types", () => expect(companionEmotion("hello", false, false, "happy")).toBe("listening"));
  it("listens during speech input", () => expect(companionEmotion("", true, false, "neutral")).toBe("listening"));
  it("thinks while waiting even if another message is being drafted", () => expect(companionEmotion("next", true, true, "happy")).toBe("thinking"));
  it("expresses the actual response mood after a reply", () => expect(companionEmotion("", false, false, "affectionate")).toBe("affectionate"));
  it("keeps neutral when the local API supplies no mood", () => expect(companionEmotion("", false, false, "neutral")).toBe("neutral"));
});
