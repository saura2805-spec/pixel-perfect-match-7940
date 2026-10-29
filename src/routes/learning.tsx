import { createFileRoute } from "@tanstack/react-router";
import { JournalScreen } from "@/components/dessert/JournalScreen";
export const Route = createFileRoute("/learning")({
  head: () => ({ meta: [
    { title: "Dessert — Learning History" },
    { name: "description", content: "Record reviewed diagnoses, missed clues, and lessons for future clinical cases." },
    { property: "og:title", content: "Dessert — Learning History" },
    { property: "og:description", content: "Reflect on your clinical reasoning with locally saved learning reviews." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <JournalScreen learning />,
});