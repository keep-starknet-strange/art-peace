export const config = {
  streamUrl: Deno.env.get("APIBARA_STREAM_URL"),
  startingBlock: 0,
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
      {
        // NFT Transfer Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x0099cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9",
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
};

//This transformation filters events from the NFT Transfer event
export default function transform({ events }) {
  return events.flatMap(({ event }) => {
    // Check if event is a NFT Transfer event and a new mint
    if (isNFTTransferEvent(event) && isANewMint(event)) {
      const [, , to, token_id] = event.topics;

      return {
        insert: {
          token_id,
          minter: to,
          owner: to,
        },
      };
      // Check if event is a NFT Transfer event and not a new mint
    } else if (isNFTTransferEvent(event) && !isANewMint(event)) {
      const [_, , to, token_id] = event.topics;

      // Update the new owner
      return {
        entity: {
          token_id,
        },
        update: {
          owner: to,
        },
      };
    } else {
      return [];
    }
  });
}

// Check is the event signature matches the NFT Mint signature
const isNFTTransferEvent = (event) => {
  return (
    event.topics[0] ===
    "0x0099cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9"
  );
};

//Check if the value of 'from' in the event is set to zero
const isANewMint = (event) => {
  return event.topics[1].toString() === "0";
};
