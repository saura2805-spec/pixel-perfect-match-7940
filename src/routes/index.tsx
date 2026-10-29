import { createFileRoute } from "@tanstack/react-router";
import { ChatScreen } from "@/components/dessert/ChatScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dessert — Your Companion" },
      { name: "description", content: "A warm, private AI companion running locally." },
      { property: "og:title", content: "Dessert — Your Companion" },
      { property: "og:description", content: "A warm, private AI companion running locally." },
    ],
  }),
  component: () => <ChatScreen mode="companion" />,
});
