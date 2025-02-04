import { useEffect, useState } from "react";
import { generateUserId } from "./use-daydreams";

interface ChatMessage {
    role: string;
    name: string;
    data: {
        content?: string;
        message?: string;
        userId?: string;
    };
    timestamp: Date;
}

interface ChatHistory {
    _id: string;
    messages: ChatMessage[];
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export function useSingleChatHistory({
    chatId,
    userId,
}: {
    chatId: string;
    userId: string;
}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<ChatHistory | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `http://localhost:8081/api/history/${userId}/${chatId}`
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                console.log(data);
                setHistory(data);
                setError(null);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to fetch chat history"
                );
                console.error("Error fetching chat history:", err);
            } finally {
                setLoading(false);
            }
        };

        if (userId && chatId) {
            fetchHistory();
        }
    }, [userId, chatId]);

    const refreshHistory = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `http://localhost:8081/api/history/${userId}/${chatId}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setHistory(data);
            setError(null);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to fetch chat history"
            );
            console.error("Error fetching chat history:", err);
        } finally {
            setLoading(false);
        }
    };

    return {
        history,
        loading,
        error,
        refreshHistory,
    };
}
