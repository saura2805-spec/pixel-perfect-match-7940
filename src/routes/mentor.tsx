import { createFileRoute } from "@tanstack/react-router";
import { ChatScreen } from "@/components/dessert/ChatScreen";

export const Route = createFileRoute("/mentor")({
  validateSearch: (search: Record<string, unknown>): { caseId?: string } => typeof search["caseId"] === "string" ? { caseId: search["caseId"] } : {},
  head: () => ({
    meta: [
      { title: "Dessert — Medical Mentor" },
      { name: "description", content: "Practice cases and reviews with Dessert's local medical mentor." },
      { property: "og:title", content: "Dessert — Medical Mentor" },
      { property: "og:description", content: "Practice cases and reviews with Dessert's local medical mentor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MentorPage,
});

function MentorPage() {
  const { caseId } = Route.useSearch();
  return <ChatScreen mode="mentor" selectedCaseId={caseId ?? "none"} />;
}
