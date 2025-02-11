import { useEffect, useState } from "react";
import { useChatHistory } from "./use-chat-history";

interface ChatHistoryItem {
    _id: string;
    title: string; // We'll use the first message or a timestamp
    lastMessage?: string;
    updatedAt: Date;
}

export function useChatHistories() {
    const { histories, loading, error, refreshHistory } = useChatHistory();
    const [chatItems, setChatItems] = useState<ChatHistoryItem[]>([]);

    useEffect(() => {
        if (histories) {
            const items = histories.map((history) => {
                // Find the first user message to use as title
                const firstUserMessage = history.messages.find(
                    (msg) => msg.role === "input" && msg.name === "user_chat"
                );

                // Find the last message for preview
                const lastMessage =
                    history.messages[history.messages.length - 1];

                return {
                    _id: history._id,
                    title:
                        firstUserMessage?.data?.content ||
                        new Date(history.createdAt).toLocaleString(),
                    lastMessage:
                        lastMessage?.data?.message ||
                        lastMessage?.data?.content,
                    updatedAt: new Date(history.updatedAt),
                };
            });

            // Sort by most recent first
            items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
            setChatItems(items);
        }
    }, [histories]);

    return {
        chatItems,
        loading,
        error,
        refreshHistory,
    };
}
