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

export function useChatHistory() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [histories, setHistories] = useState<ChatHistory[]>([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `http://localhost:8081/api/history/${generateUserId()}`
                );

                console.log(response);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setHistories(data);
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

        if (generateUserId()) {
            fetchHistory();
        }
    }, []);

    const refreshHistory = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `http://localhost:8081/api/history/${generateUserId()}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setHistories(data);
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

    const getHistory = (chatId: string) => {
        return histories.find((history) => history._id === chatId);
    };

    return {
        histories,
        loading,
        error,
        refreshHistory,
        getHistory,
    };
}
