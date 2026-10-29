import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { caseSchema, mentorMessage, reviewSchema, type ClinicalCase } from "@/lib/dessert-journal";
import { useDessertJournal } from "@/hooks/use-dessert-journal";

const record: ClinicalCase = { id: "case-1", createdAt: "2026-10-29T00:00:00Z", title: "Fictional fever", history: "Five days of fever", diagnosis: "", reasoning: "More findings needed", lessons: "Avoid anchoring" };
describe("Clinical journal rules", () => {
  it("requires a title and history for a case", () => {
    expect(caseSchema.safeParse({ ...record, title: "" }).success).toBe(false);
    expect(caseSchema.safeParse({ ...record, history: "" }).success).toBe(false);
    expect(caseSchema.safeParse(record).success).toBe(true);
  });
  it("requires reviewed diagnosis, error and lesson before saving a review", () => {
    const review = { id: "review-1", createdAt: record.createdAt, caseId: record.id, initialDiagnosis: "Viral fever", revisedDiagnosis: "Undetermined", error: "Insufficient findings", lesson: "Collect history" };
    for (const key of ["initialDiagnosis", "revisedDiagnosis", "error", "lesson"]) expect(reviewSchema.safeParse({ ...review, [key]: "" }).success).toBe(false);
    expect(reviewSchema.safeParse(review).success).toBe(true);
  });
  it("sends selected case and linked lessons with the chosen response style", () => {
    const reviews = [{ id: "r", createdAt: record.createdAt, caseId: record.id, initialDiagnosis: "Viral", revisedDiagnosis: "Undetermined", error: "Anchoring", lesson: "Check discriminating findings" }, { id: "other", createdAt: record.createdAt, caseId: "other", initialDiagnosis: "Other", revisedDiagnosis: "Other", error: "Other", lesson: "Unrelated lesson" }];
    const result = mentorMessage("What next?", "clinical", record, reviews);
    expect(result).toContain("structured clinical case reasoning");
    expect(result).toContain("Five days of fever");
    expect(result).toContain("Check discriminating findings");
    expect(result).not.toContain("Unrelated lesson");
    expect(result).toContain("Current question: What next?");
    expect(mentorMessage("Hello", "quick", undefined, reviews)).not.toContain("Five days of fever");
    expect(mentorMessage("Hello", "quick", undefined, reviews)).toContain("quick-study");
  });
});
describe("Browser-local saves", () => {
  beforeEach(() => localStorage.clear());
  it("persists cases and reviews, retaining unlinked reviews when deleting a case", () => {
    const { result } = renderHook(useDessertJournal);
    act(() => { result.current.addCase(record); });
    act(() => { result.current.addReview({ id: "r", createdAt: record.createdAt, caseId: record.id, initialDiagnosis: "Viral", revisedDiagnosis: "Undetermined", error: "Anchoring", lesson: "Check findings" }); });
    expect(JSON.parse(localStorage.getItem("dessert-clinical-journal-v1") ?? "{}").cases[0].title).toBe("Fictional fever");
    act(() => { result.current.deleteCase(record.id); });
    expect(result.current.cases).toHaveLength(0);
    expect(result.current.reviews[0]?.caseId).toBe("");
  });
});