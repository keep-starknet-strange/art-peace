import { ResearchQuantProcessor } from "../research-processor";
import { LLMClient } from "../../llm-client";
import { type Character, LogLevel } from "../../types";
import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import dotenv from "dotenv";
import path from "path";

// Load environment variables for tests
dotenv.config({
    path: path.resolve(process.cwd(), "../../.env"),
    debug: true,
});

console.log("Current working directory:", process.cwd());

// Add a check for required API keys
const hasRequiredEnvVars = () => {
    if (!process.env.OPENROUTER_API_KEY) {
        return false;
    }
    return true;
};

// Shared mock data
const mockCharacter: Character = {
    name: "Research Assistant",
    bio: "An AI research assistant focused on analyzing and summarizing complex data",
    traits: [
        {
            name: "analytical",
            description:
                "Focuses on systematic analysis of data and information",
            strength: 0.9,
            examples: ["Breaks down complex data", "Identifies patterns"],
        },
        {
            name: "detail-oriented",
            description: "Pays close attention to small details and nuances",
            strength: 0.8,
            examples: [
                "Catches minor discrepancies",
                "Thorough in examination",
            ],
        },
        {
            name: "objective",
            description: "Makes unbiased, fact-based assessments",
            strength: 0.9,
            examples: [
                "Relies on data rather than opinions",
                "Maintains neutral perspective",
            ],
        },
    ],
    voice: {
        tone: "professional",
        style: "analytical",
        vocabulary: ["data-driven", "quantitative", "empirical"],
        commonPhrases: ["Based on the analysis", "The data suggests"],
        emojis: ["📊", "📈", "🔍"],
    },
    instructions: {
        goals: ["Provide accurate analysis", "Identify key insights"],
        constraints: ["Stick to facts", "Avoid speculation"],
        topics: ["Research", "Data Analysis", "Statistics"],
        responseStyle: ["Clear", "Structured", "Evidence-based"],
        contextRules: ["Consider data quality", "Note limitations"],
    },
};

// Shared test dataset
const largeMockDataset = `
    # Economic Report 2023
    
    ## GDP Growth Analysis
    The global economy showed mixed signals in 2023. GDP growth reached 3.2% in Q1, 
    followed by 2.8% in Q2, and 2.5% in Q3. Major economies demonstrated varying 
    levels of resilience to inflationary pressures.

    ## Market Statistics
    - S&P 500: +15.2% YTD
    - NASDAQ: +22.4% YTD
    - DOW: +8.7% YTD
    
    ## Key Industry Players
    Tesla (TSLA) reported record deliveries of 1.8M vehicles in 2023.
    Apple (AAPL) reached a $3T market cap milestone.
    Microsoft (MSFT) saw cloud revenue grow by 27%.

    ## Expert Opinions
    According to Dr. Sarah Johnson, Chief Economist at Global Insights:
    "The resilience of consumer spending, despite high inflation, has been remarkable. 
    However, we need to monitor household debt levels carefully in 2024."

    Professor Michael Chen from Stanford University notes:
    "The technological transformation of traditional industries has accelerated, 
    with AI adoption rates exceeding all previous forecasts."

    ## Regional Analysis
    North America: Strong performance in technology and healthcare sectors
    Europe: Mixed results with manufacturing slowdown
    Asia: Continued growth in emerging markets, particularly in India and Vietnam

    ## Future Outlook
    Analysts predict:
    - Interest rates stabilizing by Q2 2024
    - Continued tech sector growth
    - Emerging market opportunities
    - Potential challenges in global supply chains
`.repeat(3); // Make it even larger by repeating content

describe("ResearchQuantProcessor", () => {
    const mockLLMClient = {
        complete: vi.fn().mockImplementation((prompt) => {
            return Promise.resolve({
                extractedData: {
                    facts: ["GDP growth reached 3.2% in Q1 2023"],
                    quotes: [
                        "The resilience of consumer spending has been remarkable",
                    ],
                    numericalData: ["S&P 500: +15.2% YTD"],
                    entities: ["Tesla", "Apple", "Microsoft"],
                    topics: ["Economic Growth", "Market Analysis"],
                },
                rawSummary: "Comprehensive economic analysis for 2023",
            });
        }),
        analyze: vi.fn().mockImplementation((content) => {
            return Promise.resolve({
                synthesis: {
                    overallSummary: "Comprehensive economic analysis for 2023",
                    keyInsights: [
                        {
                            insight: "Strong GDP growth in Q1 2023",
                            confidence: 0.9,
                            supportingEvidence: [
                                "GDP growth reached 3.2% in Q1",
                            ],
                        },
                    ],
                    patterns: ["Consistent growth across quarters"],
                    gaps: ["Limited data on emerging markets"],
                },
                recommendations: [
                    {
                        action: "Monitor GDP growth trends",
                        priority: "high",
                        reasoning: "Critical economic indicator",
                    },
                ],
                metadata: {
                    primaryTopics: ["Economic Growth", "Market Analysis"],
                    keyEntities: ["Tesla", "Apple", "Microsoft"],
                    dataQuality: 0.85,
                    suggestedTags: ["Economics", "Market Analysis", "2023"],
                },
                extractedData: {
                    facts: ["GDP growth reached 3.2% in Q1 2023"],
                    quotes: [
                        "The resilience of consumer spending has been remarkable",
                    ],
                    numericalData: ["S&P 500: +15.2% YTD"],
                    entities: ["Tesla", "Apple", "Microsoft"],
                    topics: ["Economic Growth", "Market Analysis"],
                },
            });
        }),
    } as unknown as LLMClient;

    it("should correctly identify content it can handle", () => {
        const processor = new ResearchQuantProcessor(
            mockLLMClient,
            mockCharacter,
            LogLevel.DEBUG,
            1000, // Content limit
            4000 // Token limit
        );

        // Should handle JSON content
        expect(processor.canHandle({ data: "test" })).toBe(true);

        // Should handle large text content - make it much larger to exceed token limit
        expect(processor.canHandle("x".repeat(10000))).toBe(true);

        // Should handle array-like content
        expect(processor.canHandle("[1,2,3]")).toBe(true);

        // Should not handle small simple strings
        expect(processor.canHandle("small text")).toBe(false);
    });

    it("should process content with proper error handling", async () => {
        const errorLLMClient = {
            complete: vi.fn().mockRejectedValue(new Error("LLM Error")),
        } as unknown as LLMClient;

        const processor = new ResearchQuantProcessor(
            errorLLMClient,
            mockCharacter,
            LogLevel.DEBUG
        );

        const result = await processor.process("Test content", "Test context", {
            availableOutputs: [],
            availableActions: [],
        });

        // Should return a fallback result with empty arrays
        expect(result.extractedData).toBeDefined();
        expect(result.extractedData.facts).toEqual([]);
        expect(result.extractedData.quotes).toEqual([]);
    });
});

// Wrap live tests in conditional
if (hasRequiredEnvVars()) {
    describe("ResearchQuantProcessor Live Tests", () => {
        beforeAll(() => {
            console.log("Starting live tests with OpenRouter API");
        });

        afterEach((test) => {
            console.log(`Completed test: `);
        });

        it("should process real content with live LLM", async () => {
            const llmClient = new LLMClient({
                model: "openrouter:google/gemini-flash-1.5-8b",
                temperature: 0.3,
                maxTokens: 8192,
                maxRetries: 2,
            });

            const processor = new ResearchQuantProcessor(
                llmClient,
                mockCharacter,
                LogLevel.DEBUG,
                1000,
                4000
            );

            try {
                const result = await processor.process(
                    largeMockDataset,
                    "Analyze this economic report and extract key insights",
                    {
                        availableOutputs: [],
                        availableActions: [],
                    }
                );

                // Test the actual structure and content of the response
                expect(result).toBeDefined();
                expect(result.metadata).toBeDefined();
                expect(result.enrichedContext).toBeDefined();
                expect(result.recommendations).toBeDefined();

                // Test the enriched context
                if (result.enrichedContext) {
                    expect(result.enrichedContext.summary).toBeTruthy();
                    if (result.enrichedContext.keyInsights) {
                        expect(
                            Array.isArray(result.enrichedContext.keyInsights)
                        ).toBe(true);
                        if (result.enrichedContext.keyInsights.length > 0) {
                            const firstInsight =
                                result.enrichedContext.keyInsights[0];
                            expect(firstInsight).toHaveProperty("insight");
                        }
                    }
                }

                // Test recommendations if they exist
                if (
                    result.recommendations &&
                    result.recommendations.length > 0
                ) {
                    const firstRecommendation = result.recommendations[0];
                    expect(firstRecommendation).toHaveProperty("action");
                }

                // Verify data extraction if available
                if (result.extractedData) {
                    // Check arrays exist
                    expect(
                        Array.isArray(result.extractedData.numericalData)
                    ).toBe(true);
                    expect(Array.isArray(result.extractedData.entities)).toBe(
                        true
                    );

                    // If we have numerical data, verify format
                    if (result.extractedData.numericalData.length > 0) {
                        expect(result.extractedData.numericalData[0]).toMatch(
                            /\d/
                        );
                    }

                    // If we have entities, verify format
                    if (result.extractedData.entities.length > 0) {
                        expect(typeof result.extractedData.entities[0]).toBe(
                            "string"
                        );
                    }
                }
            } catch (error) {
                console.error("Test failed with error:", error);
                throw error;
            }
        }, 60000);

        it("should process real financial data effectively", async () => {
            const llmClient = new LLMClient({
                model: "openrouter:google/gemini-flash-1.5-8b",
                temperature: 0.3,
                maxTokens: 8192,
            });

            const processor = new ResearchQuantProcessor(
                llmClient,
                mockCharacter,
                LogLevel.DEBUG
            );

            const financialData = `
                QUARTERLY FINANCIAL METRICS (Q4 2023)
                Revenue: $2.5B (+15% YoY)
                Operating Margin: 28.3%
                Net Income: $780M
                EPS: $1.45
                Cash Flow from Operations: $920M
                R&D Expenses: $340M
                Marketing Expenses: $180M
                
                KEY PERFORMANCE INDICATORS
                Monthly Active Users: 125M (+22% YoY)
                Customer Acquisition Cost: $28.50
                Lifetime Value: $890
                Churn Rate: 2.1%
                NPS Score: 72
                
                SEGMENT PERFORMANCE
                Enterprise: $1.2B (+25% YoY)
                Consumer: $800M (+12% YoY)
                SMB: $500M (+8% YoY)
                
                REGIONAL BREAKDOWN
                North America: 45%
                Europe: 30%
                Asia Pacific: 20%
                Rest of World: 5%
            `;

            const result = await processor.process(
                financialData,
                "Analyze this quarterly financial report and identify key trends and insights",
                {
                    availableOutputs: [],
                    availableActions: [],
                }
            );

            // Verify basic structure
            expect(result).toBeDefined();
            expect(result.extractedData).toBeDefined();

            // Verify arrays exist
            expect(Array.isArray(result.extractedData.facts)).toBe(true);
            expect(Array.isArray(result.extractedData.numericalData)).toBe(
                true
            );
            expect(Array.isArray(result.extractedData.entities)).toBe(true);
            expect(Array.isArray(result.extractedData.topics)).toBe(true);

            // Verify content if available
            if (result.extractedData.numericalData.length > 0) {
                expect(result.extractedData.numericalData[0]).toMatch(/\d/);
            }

            if (result.extractedData.entities.length > 0) {
                expect(typeof result.extractedData.entities[0]).toBe("string");
            }

            // Verify summary exists
            expect(typeof result.rawSummary).toBe("string");
            expect(result.rawSummary).toMatch(/\w+/);
        }, 60000);
    });
} else {
    describe.skip("ResearchQuantProcessor Live Tests", () => {
        it("skipped due to missing environment variables", () => {});
    });
}
