import ChatUI from "@/components/chat-ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/chats/$chatId")({
    component: RouteComponent,
});

function RouteComponent() {
    const { chatId } = Route.useParams();
    return <ChatUI chatId={chatId} />;
}
