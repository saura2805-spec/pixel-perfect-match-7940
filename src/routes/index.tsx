import { createFileRoute } from "@tanstack/react-router";
import { ChatScreen } from "@/components/dessert/ChatScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dessert — Your Companion" },
      { name: "description", content: "A warm, private AI companion running locally." },
      { property: "og:title", content: "Dessert — Your Companion" },
      { property: "og:description", content: "A warm, private AI companion running locally." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ChatScreen mode="companion" />,
});
