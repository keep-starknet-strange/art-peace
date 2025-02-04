import { StarknetChain } from "../packages/core/src/core/chains/starknet";
import chalk from "chalk";
import sharp from "sharp";

async function placePixelOnChain(
    starknet: StarknetChain,
    position: string,
    color: string,
) {
    try {
        // Convert parameters to the format expected by the contract
        const canvasId = "0x0";
        const positionFelt = `0x${position}`; // Ensure hex format
        const colorFelt = `0x${color}`; // Ensure hex format
        const timestamp = Math.floor(Date.now() / 1000);

        console.log(chalk.cyan("Attempting to place pixel with:"));
        console.log("Position:", positionFelt);
        console.log("Color:", colorFelt);
        console.log("Timestamp:", timestamp);

        const result = await starknet.write({
            contractAddress: "0x03ce937f91fa0c88a4023f582c729935a5366385091166a763e53281e45ac410",
            entrypoint: "place_pixel",
            calldata: [canvasId, positionFelt, colorFelt, timestamp]
        });

        // Check if result is an Error
        if (result instanceof Error) {
            throw result;
        }

        // The transaction receipt will have status and other details
        console.log(chalk.green(`✨ Pixel placed successfully at position ${position}`));
        console.log(chalk.blue(`Transaction hash: ${result.transaction_hash}`));

        return result;
    } catch (error) {
        console.error(chalk.red("Error placing pixel:"), error);
        if (error instanceof Error) {
            console.error(chalk.red("Error details:"), error.message);
        }
        throw error;
    }
}

async function main() {
    // Initialize Starknet chain
    const starknet = new StarknetChain(
        {
            rpcUrl: process.env.STARKNET_RPC_URL ?? "",
            address: process.env.STARKNET_ADDRESS ?? "",
            privateKey: process.env.STARKNET_PRIVATE_KEY ?? "",
        },
    );

    try {
        console.log(chalk.cyan("\n🎯 Generating random image..."));

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("OpenAI API key not found");
        }

        const prompt = "Generate a completely random 256x256 pixel image with random colors and patterns. The image should be abstract and non-representational.";

        const response = await fetch(
            "https://api.openai.com/v1/images/generations",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "dall-e-3",
                    prompt: prompt,
                    n: 1,
                    size: "1024x1024",
                    response_format: "b64_json",
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.error?.message ||
                `HTTP error! status: ${response.status}`
            );
        }

        const result = await response.json();
        console.log(chalk.green("\n✨ Image generated successfully!"));

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(result.data[0].b64_json, 'base64');

        // Process with Sharp
        const resizedImage = await sharp(imageBuffer)
            .resize(256, 256)
            .raw()
            .toBuffer({ resolveWithObject: true });

        // Convert buffer to pixels array
        const pixels: { r: number; g: number; b: number }[] = [];
        for (let i = 0; i < resizedImage.data.length; i += 3) {
            pixels.push({
                r: resizedImage.data[i],
                g: resizedImage.data[i + 1],
                b: resizedImage.data[i + 2]
            });
        }
        console.log(`Total Pixels: ${pixels.length}`);

        // Define color palette
        const color_palette = [
            0x000000, 0xFFFFFF, 0xFF0000, 0x00FF00, 0x0000FF,
            0xFFFF00, 0xFF00FF, 0x00FFFF, 0x880000, 0x008800,
            0x000088, 0x888800
        ];

        // Function to calculate color distance
        const colorDistance = (color1: { r: number, g: number, b: number }, color2: number) => {
            const r2 = (color2 >> 16) & 0xFF;
            const g2 = (color2 >> 8) & 0xFF;
            const b2 = color2 & 0xFF;

            return Math.sqrt(
                Math.pow(color1.r - r2, 2) +
                Math.pow(color1.g - g2, 2) +
                Math.pow(color1.b - b2, 2)
            );
        };

        // Find closest palette color for each pixel and store position
        const pixelsWithPosition = pixels.map((pixel, index) => {
            const closestColor = color_palette.reduce((prev, curr) => {
                const prevDistance = colorDistance(pixel, prev);
                const currDistance = colorDistance(pixel, curr);
                return currDistance < prevDistance ? curr : prev;
            });

            // Get the index of the closest color in the palette instead of the color itself
            const colorIndex = color_palette.indexOf(closestColor);

            return {
                position: index.toString(16),
                color: colorIndex.toString(16)
            };
        });

        // After pixels are processed, start placing them on chain
        console.log(chalk.cyan("\n🔄 Starting pixel placement loop..."));

        // Create interval to place pixels every 30 seconds
        const interval = setInterval(async () => {
            if (pixelsWithPosition.length === 0) {
                console.log(chalk.yellow("No more pixels to place. Stopping..."));
                clearInterval(interval);
                process.exit(0);
                return;
            }

            const pixel = pixelsWithPosition.shift();

            try {
                await placePixelOnChain(
                    starknet,
                    pixel?.position ?? '',
                    pixel?.color ?? '',
                );
            } catch (error) {
                console.error(chalk.red("Failed to place pixel:"), error);
                // Add failed pixel back to the queue
                pixelsWithPosition.push(pixel as { position: string; color: string });
            }

            console.log(chalk.blue(`Remaining pixels: ${pixelsWithPosition.length}`));
        }, 30000); // 30 seconds interval

    } catch (error) {
        console.error(chalk.red("Error in main process:"), error);
        process.exit(1);
    }
}

// Run the example
main().catch((error) => {
    console.error(chalk.red("Fatal error:"), error);
    process.exit(1);
}); 