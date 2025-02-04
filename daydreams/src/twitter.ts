import { Orchestrator } from "../packages/core/src/core/orchestrator";
import { HandlerRole } from "../packages/core/src/core/types";
import { TwitterClient } from "../packages/core/src/core/io/twitter";
import { ConversationManager } from "../packages/core/src/core/conversation-manager";
import { ChromaVectorDB } from "../packages/core/src/core/vector-db";
import { MessageProcessor } from "../packages/core/src/core/processors/message-processor";
import { LLMClient } from "../packages/core/src/core/llm-client";
import { env } from "../packages/core/src/core/env";
import { LogLevel } from "../packages/core/src/core/types";
import chalk from "chalk";
import { defaultCharacter } from "../packages/core/src/core/characters/character";
import { z } from "zod";
import { MongoDb } from "../packages/core/src/core/db/mongo-db";
import { SchedulerService } from "../packages/core/src/core/schedule-service";
import { MasterProcessor } from "../packages/core/src/core/processors/master-processor";
import { Logger } from "../packages/core/src/core/logger";
import { makeFlowLifecycle } from "../packages/core/src/core/life-cycle";
import express from "express";
import cors from "cors";
import backend_config from "../../configs/backend.config.json";

function formatNumber(num: number): string {
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
}

async function main() {
    const loglevel = LogLevel.DEBUG;

    // Initialize core dependencies
    const vectorDb = new ChromaVectorDB("twitter_agent", {
        chromaUrl: "http://localhost:8000",
        logLevel: loglevel,
    });

    // Clear previous session data
    await vectorDb.purge();

    // Initialize room manager
    const conversationManager = new ConversationManager(vectorDb);

    // Initialize LLM client
    const llmClient = new LLMClient({
        model: "openai/gpt-4-turbo-preview",
        temperature: 0.7,
        maxTokens: 4096
    });

    // Initialize master processor
    const masterProcessor = new MasterProcessor(
        llmClient,
        defaultCharacter,
        loglevel
    );

    // Add message processor to master processor
    masterProcessor.addProcessor([
        new MessageProcessor(llmClient, defaultCharacter, loglevel),
    ]);

    // Initialize MongoDB for scheduled tasks
    const kvDb = new MongoDb(
        "mongodb://localhost:27017",
        "myApp",
        "scheduled_tasks"
    );

    // Connect to MongoDB
    await kvDb.connect(); 
    console.log(chalk.green("✅ Scheduled task database connected"));

    // Delete previous data for testing
    await kvDb.deleteAll();

    // Initialize core system
    const orchestrator = new Orchestrator(
        masterProcessor,
        makeFlowLifecycle(kvDb, conversationManager),
        {
            level: loglevel,
            enableColors: true,
            enableTimestamp: true,
        }
    );

    // Initialize scheduler service
    const scheduler = new SchedulerService(
        {
            logger: new Logger({
                level: loglevel,
                enableColors: true,
                enableTimestamp: true,
            }),
            orchestratorDb: kvDb,
            conversationManager: conversationManager,
            vectorDb: vectorDb,
        },
        orchestrator,
        1000
    );

    // Start scheduler service
    scheduler.start();

    // Set up Twitter client with credentials
    const twitter = new TwitterClient(
        {
            username: env.TWITTER_USERNAME,
            password: env.TWITTER_PASSWORD,
            email: env.TWITTER_EMAIL,
        },
        loglevel
    );

    // Register milestone tweet handler
    orchestrator.registerIOHandler({
        name: "milestone_tweet",
        role: HandlerRole.OUTPUT,
        execute: async (data: unknown) => {
            console.log(chalk.blue("📨 Processing milestone tweet request:", JSON.stringify(data, null, 2)));
            
            const milestoneData = data as { data: { worldName: string; pixels: number } };
            const { worldName, pixels } = milestoneData.data;
            
            const milestones = [
                1, 100, 1000, 10000, 50000, 100000, 1000000, 10000000, 100000000,
                1000000000, 10000000000, 100000000000, 1000000000000
            ];

            // Check if current pixel count is a milestone
            if (!milestones.includes(pixels)) {
                console.log(chalk.yellow("⚠️ Skipping tweet - not a milestone number:", pixels));
                return;
            }

            console.log(chalk.green("✅ Valid milestone detected:", pixels));

            // Generate tweet content using LLM
            const prompt = `Generate a short, exciting tweet (max 280 chars) celebrating that ${worldName} world has reached ${formatNumber(pixels)} pixels! Include the world URL https://artpeace.net/worlds/${worldName} in a sentence so that people can check it out. Include emojis and hashtags #ArtPeace #PixelArt. The message should be enthusiastic and focus on community growth.`;
            
            console.log(chalk.blue("🤖 Generating tweet content..."));
            const response = await llmClient.complete(prompt);

            if (!response || !response.text) {
                console.error(chalk.red("❌ Failed to generate tweet content"));
                throw new Error("Failed to generate tweet content");
            }

            console.log(chalk.green("📝 Generated tweet:", response.text));

            // Post the tweet
            try {
                console.log(chalk.blue("🐦 Posting to Twitter..."));
                const tweetResult = await twitter.createTweetOutput().handler({
                    content: response.text,
                });
                console.log(chalk.green("✅ Tweet posted successfully:", tweetResult));
                return tweetResult;
            } catch (error) {
                console.error(chalk.red("❌ Failed to post tweet:", error));
                throw error;
            }
        },
        outputSchema: z
            .object({
                data: z.object({
                    worldName: z.string(),
                    pixels: z.number(),
                })
            })
            .describe(
                "Data for posting a milestone tweet about world pixel count achievements"
            ),
    });

    console.log(chalk.cyan("🤖 ArtPeace Twitter Bot is now running..."));
    console.log(chalk.cyan("Monitoring for world milestones..."));

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
        console.log(chalk.yellow("\n\nShutting down..."));

        // Clean up resources
        orchestrator.removeIOHandler("milestone_tweet");
        await kvDb.close();

        console.log(chalk.green("✅ Shutdown complete"));
        process.exit(0);
    });

    // Create Express app for REST API
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Add REST endpoint for world milestone updates
    app.post("/api/milestone", async (req, res) => {
        try {
            const { worldName, pixels } = req.body;

            if (!worldName || typeof worldName !== "string" || !pixels || typeof pixels !== "number") {
                return res.status(400).json({ error: "Invalid request body. Expected { worldName: string, pixels: number }" });
            }

            const milestones = [
                1, 100, 1000, 10000, 50000, 100000, 1000000, 10000000, 100000000,
                1000000000, 10000000000, 100000000000, 1000000000000
            ];

            // Check if current pixel count is a milestone
            if (!milestones.includes(pixels)) {
                return res.status(400).json({ 
                    success: false,
                    message: `${pixels} is not a valid milestone number. Valid milestones are: ${milestones.join(', ')}`,
                    posted: false
                });
            }

            // Generate a unique content ID using timestamp and world name
            const contentId = `milestone_${worldName}_${pixels}_${Date.now()}`;

            // Use the orchestrator to handle the milestone tweet
            await orchestrator.dispatchToOutput("milestone_tweet", {
                data: {
                    worldName,
                    pixels,
                },
                contentId,
                userId: "system",
                platformId: "twitter",
                threadId: contentId
            });

            res.json({ 
                success: true, 
                message: "Milestone tweet processed successfully",
                posted: true,
                contentId
            });
        } catch (error) {
            console.error("Error processing milestone:", error);
            res.status(500).json({
                error: "Failed to process milestone",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    // Start the Express server
    const API_PORT = 8082;
    app.listen(API_PORT, () => {
        console.log(
            chalk.cyan(
                `[API] Twitter milestone API listening on ${backend_config.milestone_bot}`
            )
        );
    });
}

// Run the bot
if (require.main === module) {
    main().catch((error) => {
        console.error(chalk.red("Fatal error:"), error);
        process.exit(1);
    });
}