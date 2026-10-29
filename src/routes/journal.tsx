import { createFileRoute } from "@tanstack/react-router";
import { JournalScreen } from "@/components/dessert/JournalScreen";
export const Route = createFileRoute("/journal")({
  head: () => ({ meta: [
    { title: "Dessert — Clinical Case Journal" },
    { name: "description", content: "Keep de-identified clinical cases, reasoning, and lessons in your local Dessert journal." },
    { property: "og:title", content: "Dessert — Clinical Case Journal" },
    { property: "og:description", content: "Revisit clinical cases and discuss your saved notes with Medical Mentor." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <JournalScreen />,
});