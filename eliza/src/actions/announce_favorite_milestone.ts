import {
    type Action,
    ActionExample,
    Content,
    elizaLogger,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    generateText,
    ModelClass
} from "@elizaos/core";

interface StencilAchievement {
    username: string;
    favorites: number;
    stencilUrl: string;
}

export default {
    name: "TWEET_ACHIEVEMENT",
    similes: ["ANNOUNCE_ACHIEVEMENT", "CELEBRATE_MILESTONE", "TWEET"],
    description: "Use this action when announcing user achievement milestones.",
    
    validate: async (runtime: IAgentRuntime, _message: Memory): Promise<boolean> => {
        const twitterClient = runtime.clients.find(
            client => client
        );
        if (!twitterClient) {
            elizaLogger.error("Twitter client not found in validate");
            return false;
        }
        return true;
    },

    shouldHandle: async (
        runtime: IAgentRuntime,
        message: Memory,
    ): Promise<boolean> => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return messageText.includes("favorites") || 
               messageText.includes("achievement") ||
               messageText.includes("milestone");
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting TWEET_ACHIEVEMENT handler...");

        try {
            const messageText = message.content?.text || "";
            const matches = messageText.match(/(\w+) stencil just reached (\d+) favorites,.*?(https:\/\/art-peace\.net\/stencils\/\d+)/i);
            
            if (!matches) {
                elizaLogger.log("No achievement pattern found in message");
                return false;
            }

            const [_, username, favoritesStr, stencilUrl] = matches;
            const favorites = parseInt(favoritesStr);

            // Check if it's a milestone number
            const milestones = [1, 10, 100, 1000, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000];
            
            if (!milestones.includes(favorites)) {
                elizaLogger.log(`Not a milestone achievement: ${favorites}`);
                return false;
            }

            // Find Twitter client specifically
            const twitterClient = runtime.clients.find(
                client => client
            );

            elizaLogger.debug("Checking Twitter client:", {
                hasClients: !!runtime.clients,
                clientsLength: runtime.clients?.length,
                allClients: runtime.clients,
            });

            if (!twitterClient) {
                elizaLogger.error("Twitter client not found in handler");
                return false;
            }

            // Generate AI congratulatory message
            const achievement: StencilAchievement = {
                username,
                favorites,
                stencilUrl
            };

            // Use AI to generate congratulatory message
            const aiPrompt = `Generate a short, exciting tweet (max 280 chars) congratulating ${username} for reaching ${favorites} favorites on their stencil. Include emojis and hashtags #ArtPeace #PixelArt. The message should be enthusiastic and encouraging.`;
            
            const aiResponse = await generateText({
                runtime,
                context: aiPrompt,
                modelClass: ModelClass.SMALL
            });

            const tweetText = aiResponse;

            try {
                // First send the standard tweet
                const result = await twitterClient.post.sendStandardTweet(
                    twitterClient.client,
                    tweetText
                );

                if (result) {
                    // Process and cache the tweet
                    const tweet = twitterClient.post.createTweetObject(
                        result,
                        twitterClient.client,
                        twitterClient.post.twitterUsername
                    );

                    await twitterClient.post.processAndCacheTweet(
                        runtime,
                        twitterClient.client,
                        tweet,
                        message.roomId,
                        tweetText
                    );

                    elizaLogger.success(`Successfully tweeted achievement for ${username}!`);
                    
                    if (callback) {
                        callback({
                            text: `Achievement announced for ${username}!`,
                            content: {
                                success: true,
                                achievement: {
                                    username,
                                    favorites,
                                    platform: "twitter"
                                },
                            },
                        });
                    }

                    return true;
                }
            } catch (error) {
                elizaLogger.error("Error in TWEET_ACHIEVEMENT handler:", error);
                if (callback) {
                    callback({
                        text: `Error announcing achievement: ${error.message}`,
                        content: { error: error.message },
                    });
                }
                return false;
            }
        } catch (error) {
            elizaLogger.error("Error in TWEET_ACHIEVEMENT handler:", error);
            if (callback) {
                callback({
                    text: `Error announcing achievement: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Supreme stencil just reached 1000 favorites, view the stencil on art peace here https://art-peace.net/stencils/12345",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "🎉 Amazing work, Supreme! 1,000 favorites on your pixel art stencil! Your creativity shines bright! Check it out: https://art-peace.net/stencils/12345 #ArtPeace #PixelArt",
                    action: "TWEET_ACHIEVEMENT",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;