import {
    type Action,
    ActionExample,
    elizaLogger,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    generateText,
    ModelClass
} from "@elizaos/core";

export default {
    name: "TWEET_MILESTONE",
    similes: ["ANNOUNCE_MILESTONE", "CELEBRATE_PIXELS", "TWEET"],
    description: "Use this action when announcing world pixel count milestones.",
    
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
        // Ensure message has content before checking
        if (!message?.content?.text) {
            elizaLogger.log("Message content is empty");
            return false;
        }

        const messageText = message.content.text.toLowerCase();
        return messageText.includes("pixels") || 
               messageText.includes("milestone") ||
               messageText.includes("world");
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting TWEET_MILESTONE handler...");

        // Validate message content
        if (!message?.content?.text) {
            elizaLogger.error("Message content is empty in handler");
            return false;
        }

        try {
            const messageText = message.content.text;
            const matches = messageText.match(/(\w+) world just reached (\d+) pixels,.*?(https:\/\/art-peace\.net\/worlds\/\d+)/i);
            
            if (!matches) {
                elizaLogger.log("No milestone pattern found in message");
                return false;
            }

            const [_, worldName, pixelsStr, worldUrl] = matches;
            const pixels = parseInt(pixelsStr);

            // Check if it's a milestone number
            const milestones = [
                1, 100, 1000, 10000, 50000, 100000, 1000000, 10000000, 100000000,
                1000000000, 10000000000, 100000000000, 1000000000000
            ];
            
            if (!milestones.includes(pixels)) {
                elizaLogger.log(`Not a milestone achievement: ${pixels}`);
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

            // Format number nicely for display
            const formatNumber = (num) => {
                if (num >= 1_000_000_000_000) {
                  return `${(num / 1_000_000_000_000).toFixed(1)}T`;
                } else if (num >= 1_000_000_000) {
                  return `${(num / 1_000_000_000).toFixed(1)}B`;
                } else if (num >= 1_000_000) {
                  return `${(num / 1_000_000).toFixed(1)}M`;
                } else if (num >= 1_000) {
                  return `${(num / 1_000).toFixed(1)}K`;
                }
                return num.toString();
            };

            // Use AI to generate congratulatory message
            const aiPrompt = `Generate a short, exciting tweet (max 280 chars) celebrating that ${worldName} world has reached ${formatNumber(pixels)} pixels! Include emojis and hashtags #ArtPeace #PixelArt. The message should be enthusiastic and focus on community growth.`;
            
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

                    elizaLogger.success(`Successfully tweeted milestone for ${worldName}!`);
                    
                    if (callback) {
                        callback({
                            text: `Milestone announced for ${worldName}!`,
                            content: {
                                success: true,
                                milestone: {
                                    worldName,
                                    pixels,
                                    platform: "twitter"
                                },
                            },
                        });
                    }

                    return true;
                }
            } catch (error) {
                elizaLogger.error("Error in TWEET_MILESTONE handler:", error);
                if (callback) {
                    callback({
                        text: `Error announcing milestone: ${error.message}`,
                        content: { error: error.message },
                    });
                }
                return false;
            }
        } catch (error) {
            elizaLogger.error("Error in TWEET_MILESTONE handler:", error);
            if (callback) {
                callback({
                    text: `Error announcing milestone: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },

    examples: [] as ActionExample[][],
} as Action;