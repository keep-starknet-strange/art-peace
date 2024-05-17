import { connect } from "https://deno.land/x/redis@v0.32.3/mod.ts";
import { v4 as uuidv4 } from "https://deno.land/std/uuid/mod.ts";

const redis = await connect({ hostname: "redis", port: 6379 });

// Get Indexer ID from environment variables
const indexerId = Deno.env.get("INDEXER_ID") || "seun"; // or could be UUID generated if needed. import { v4 as uuidv4 } from "https://deno.land/std/uuid/mod.ts", uuidv4.generate()

// Store Indexer ID in Redis
if (indexerId) {
  await redis.set("indexer_id", "seun");
} else {
  console.error("INDEXER_ID not found in environment variables.");
  // redis.set("indexer_id",  Deno.env.get("HOSTNAME")); // uuidv4.generate()
}

// Fetch last processed block number and hash from Redis
async function getLastProcessedBlock() {
  try {
    const cursor = await redis.get("last_processed_block");
    if (cursor) {
      const lastProcessedBlock = JSON.parse(cursor);
      return lastProcessedBlock.blockNumber + 1;
    } else {
      return 0; // Start from block 0 if block is non-existent
    }
  } catch (error) {
    console.error("Error fetching last processed block:", error);
    return 0; // Return 0 in case of error
  }
}

// Update last processed block number and hash in Redis
async function updateLastProcessedBlock(blockNumber, blockHash) {
  try {
    await redis.set(
      "last_processed_block",
      JSON.stringify({ blockNumber, blockHash }),
    );
  } catch (error) {
    console.error("Error updating last processed block:", error);
  }
}

async function createConfig() {
  const startingBlock = await getLastProcessedBlock();

  return (config = {
    streamUrl: Deno.env.get("APIBARA_STREAM_URL"),
    startingBlock: startingBlock,
    network: "starknet",
    finality: "DATA_STATUS_PENDING",
    filter: {
      events: [
        {
          // Pixel Placed Event
          fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
          keys: [
            "0x2D7B50EBF415606D77C7E7842546FC13F8ACFBFD16F7BCF2BC2D08F54114C23",
          ],
          includeReverted: false,
          includeTransaction: false,
          includeReceipt: false,
        },
        {
          // NFT Minted Event
          fromAddress: Deno.env.get("NFT_CONTRACT_ADDRESS"),
          keys: [
            "0x30826E0CD9A517F76E857E3F3100FE5B9098E9F8216D3DB283FB4C9A641232F",
          ],
          includeReverted: false,
          includeTransaction: false,
          includeReceipt: false,
        },
        {
          // Template Added Event
          fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
          keys: [
            "0x3E18EC266FE76A2EFCE73F91228E6E04456B744FC6984C7A6374E417FB4BF59",
          ],
          includeReverted: false,
          includeTransaction: false,
          includeReceipt: false,
        },
        {
          // Vote Color Event
          fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
          keys: [
            "0x2407C82B0EFA2F6176A075BA5A939D33EEFAB39895FABCF3AC1C5E897974A40",
          ],
          includeReverted: false,
          includeTransaction: false,
          includeReceipt: false,
        },
        {
          // New Day Event
          fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
          keys: [
            "0x19CDBD24E137C00D1FEB99CC0B48B86B676F6B69C788C7F112AFEB8CD614C16",
          ],
          includeReverted: false,
          includeTransaction: false,
          includeReceipt: false,
        },
      ],
    },

    sinkType: "webhook",
    sinkOptions: {
      targetUrl: Deno.env.get("BACKEND_TARGET_URL"),
    },
  });
}

export const config = await createConfig();

// This transform update last processed block in Redis.
export default async function transform(block) {
  await updateLastProcessedBlock(block.blockNumber, block.blockHash);
  return block;
}
