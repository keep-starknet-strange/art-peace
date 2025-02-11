import { useEffect, useRef, useState, useCallback } from "react";

interface ServerMessage {
    type: string;
    message?: string;
    error?: string;
}

// Helper function to generate a simple UUID
// testing purposes only
export function generateUserId() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            const r = (0.1 * 16) | 0; // deterministic for testing
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
}

export function useDaydreamsWs() {
    const [messages, setMessages] = useState<ServerMessage[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    // Generate and store userId in a ref so it persists across renders
    const userIdRef = useRef<string>(generateUserId());

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080");
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("✅ Connected to Daydreams WebSocket!");
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as ServerMessage;
                setMessages((prev) => [...prev, data]);
            } catch (err) {
                console.error("Failed to parse WebSocket message:", event.data);
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        ws.onclose = () => {
            console.log("❌ Disconnected from Daydreams WebSocket.");
        };

        return () => {
            ws.close();
        };
    }, []);

    const sendGoal = useCallback((goal: string, orchestratorId?: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
                JSON.stringify({
                    goal,
                    userId: generateUserId(),
                    orchestratorId,
                })
            );
        }
    }, []);

    return {
        messages,
        sendGoal,
        userId: userIdRef.current,
    };
}
