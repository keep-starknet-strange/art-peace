import { StarknetChain } from "../packages/core/src/core/chains/starknet";
import chalk from "chalk";
import sharp from "sharp";
import { backendUrl } from "../../frontend/src/utils/Consts";

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
            .resize(64, 64)
            .toBuffer();

        // Create FormData and upload to stencil endpoint
        const formData = new FormData();
        const imageBlob = new Blob([resizedImage], { type: 'image/png' });
        formData.append('image', imageBlob, 'image.png'); // Added filename

        try {
            const stencilResponse = await fetch(`http://localhost:8080/add-stencil-img`, {
                method: 'POST',
                body: formData,
                headers: {
                    // Don't set Content-Type header - browser will set it with boundary
                },
            });

            if (!stencilResponse.ok) {
                throw new Error(`Upload failed: ${stencilResponse.statusText}`);
            }

            const stencilData = await stencilResponse.json();
            console.log(chalk.green("\n✨ Stencil uploaded successfully!"));
            console.log("Stencil hash:", stencilData);

            // Add a small delay to ensure the file is written
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Fetch pixel data using the hash
            const pixelDataResponse = await fetch(`http://localhost:8080/get-stencil-pixel-data?hash=${stencilData.result}`);
            
            if (!pixelDataResponse.ok) {
                throw new Error(`Failed to fetch pixel data: ${pixelDataResponse.statusText}`);
            }

            const responseJson = await pixelDataResponse.json();
            const pixelData = responseJson.data;  // Extract the nested data object
            console.log(chalk.green("\n✨ Pixel data retrieved successfully!"));
            console.log(`Width: ${pixelData.width}, Height: ${pixelData.height}`);
            console.log(`Total pixels: ${pixelData.pixelData.length}`);

            // Calculate starting position for centering
            const CANVAS_WIDTH = 512; // Updated to correct canvas width
            const CANVAS_HEIGHT = 384; // Added canvas height constant
            const startX = Math.floor(CANVAS_WIDTH/2) - Math.floor(pixelData.width / 2);
            const startY = Math.floor(CANVAS_HEIGHT/2) - Math.floor(pixelData.height / 2);

            // Convert pixel data to position and color pairs with centered coordinates
            const pixelsWithPosition = pixelData.pixelData.map((colorIndex: number, index: number) => {
                const x = index % pixelData.width;
                const y = Math.floor(index / pixelData.width);
                const absoluteX = startX + x;
                const absoluteY = startY + y;
                const position = absoluteX + (absoluteY * CANVAS_WIDTH);
                return {
                    position: position.toString(16),
                    color: colorIndex.toString(16)
                };
            });

            // After pixels are processed, start placing them on chain
            console.log(chalk.cyan("\n🔄 Starting pixel placement loop..."));

            // Create interval to place pixels every 5 seconds
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
            }, 5000); // 5 seconds interval

        } catch (error) {
            console.error(chalk.red("Failed to upload stencil:"), error);
            throw error;
        }

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