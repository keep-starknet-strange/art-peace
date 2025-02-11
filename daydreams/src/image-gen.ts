import { StarknetChain } from "../packages/core/src/core/chains/starknet";
import chalk from "chalk";
import sharp from "sharp";

async function placePixelOnChain(
    starknet: StarknetChain,
    position: string,
    color: string,
) {
    try {
        const canvasId = "0x0";
        const positionFelt = `0x${position}`;
        const colorFelt = `0x${color}`;
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

        if (result instanceof Error) {
            throw result;
        }

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

        const prompt = "Generate a completely random image of actual cool things, it could be puss in boots drinking milk before a battle or a rabbit eating a carrot going to the moon, it could be anything, just make it random real things doing random things";

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

        const imageBuffer = Buffer.from(result.data[0].b64_json, 'base64');

        const resizedBuffer = await sharp(imageBuffer)
            .resize(64, 64)
            .toBuffer();

        const formData = new FormData();
        const imageBlob = new Blob([resizedBuffer], { type: 'image/png' });
        formData.append('image', imageBlob, 'image.png'); // Added filename

        try {
            const stencilResponse = await fetch(`http://localhost:8080/add-stencil-img`, {
                method: 'POST',
                body: formData,
                headers: {},
            });

            if (!stencilResponse.ok) {
                throw new Error(`Upload failed: ${stencilResponse.statusText}`);
            }

            const stencilData = await stencilResponse.json();
            console.log(chalk.green("\n✨ Stencil uploaded successfully!"));
            console.log("Stencil hash:", stencilData);

            await new Promise(resolve => setTimeout(resolve, 1000));

            const pixelDataResponse = await fetch(`http://localhost:8080/get-stencil-pixel-data?hash=${stencilData.result}`);
            
            if (!pixelDataResponse.ok) {
                throw new Error(`Failed to fetch pixel data: ${pixelDataResponse.statusText}`);
            }

            const responseJson = await pixelDataResponse.json();
            const pixelData = responseJson.data;
            console.log(chalk.green("\n✨ Pixel data retrieved successfully!"));
            console.log(`Width: ${pixelData.width}, Height: ${pixelData.height}`);
            console.log(`Total pixels: ${pixelData.pixelData.length}`);

            const CANVAS_WIDTH = 512;
            const CANVAS_HEIGHT = 384;
            const startX = Math.floor(CANVAS_WIDTH/2) - Math.floor(pixelData.width / 2);
            const startY = Math.floor(CANVAS_HEIGHT/2) - Math.floor(pixelData.height / 2);

            console.log(chalk.cyan("\n🔄 Starting pixel placement loop..."));

            let currentIndex = 0;
            const totalPixels = pixelData.pixelData.length;

            const interval = setInterval(async () => {
                if (currentIndex >= totalPixels) {
                    console.log(chalk.yellow("No more pixels to place. Stopping..."));
                    clearInterval(interval);
                    process.exit(0);
                    return;
                }

                const colorIndex = pixelData.pixelData[currentIndex];
                const x = currentIndex % pixelData.width;
                const y = Math.floor(currentIndex / pixelData.width);
                const absoluteX = startX + x;
                const absoluteY = startY + y;
                const position = absoluteX + (absoluteY * CANVAS_WIDTH);

                try {
                    await placePixelOnChain(
                        starknet,
                        position.toString(16),
                        colorIndex.toString(16)
                    );
                } catch (error) {
                    console.error(chalk.red("Failed to place pixel:"), error);
                    return;
                }

                currentIndex++;
                console.log(chalk.blue(`Progress: ${currentIndex}/${totalPixels} pixels`));
            }, 5000);

        } catch (error) {
            console.error(chalk.red("Failed to upload stencil:"), error);
            throw error;
        }

    } catch (error) {
        console.error(chalk.red("Error in main process:"), error);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(chalk.red("Fatal error:"), error);
    process.exit(1);
}); 