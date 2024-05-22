export const config = {
  streamUrl: Deno.env.get("APIBARA_STREAM_URL"),
  startingBlock: 0,
  network: "starknet",
  finality: "DATA_STATUS_PENDING",
  filter: {
    events: [
      {
        // New Day Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: ["0x00df776faf675d0c64b0f2ec596411cf1509d3966baba3478c84771ddbac1784"],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false,
      },
      {
        // Pixel Placed Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: ["0x2D7B50EBF415606D77C7E7842546FC13F8ACFBFD16F7BCF2BC2D08F54114C23"],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false,
      },
      {
        // Basic Pixel Placed Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: ["0x03089ae3085e1c52442bb171f26f92624095d32dc8a9c57c8fb09130d32daed8"],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false,
      },
      {
        // Member Pixels Placed Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: ["0x0165248ea72ba05120b18ec02e729e1f03a465f728283e6bb805bb284086c859"],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false,
      },
      {
        // Extra Pixels Placed Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: ["0x000e8f5c4e6f651bf4c7b093805f85c9b8ec2ec428210f90a4c9c135c347f48c"],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false,
      },
      {
        // Daily Quest Claimed Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: ["0x02025eddbc0f68a923d76519fb336e0fe1e0d6b9053ab3a504251bbd44201b10"],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false,
      },
      {
        // Main Quest Claimed Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: ["0x0121172d5bc3847c8c39069075125e53d3225741d190df6d52194cb5dd5d2049"],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false,
      },
      {
        // Vote Color Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: ["0x2407C82B0EFA2F6176A075BA5A939D33EEFAB39895FABCF3AC1C5E897974A40"],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false,
      },
      {
        // Faction Created Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: ["0x00f3878d4c85ed94271bb611f83d47ea473bae501ffed34cd21b73206149f692"],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false,
      },
      {
        // Member Replaced Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: ["0x01f8936599822d668e09401ffcef1989aca342fb1f003f9b3b1fd1cbf605ed6b"],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false,
      },
      {
        // NFT Minted Event
        fromAddress: Deno.env.get("NFT_CONTRACT_ADDRESS"),
        keys: ["0x30826E0CD9A517F76E857E3F3100FE5B9098E9F8216D3DB283FB4C9A641232F"],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false,
      },
      {
        // User Name Claimed Event
        fromAddress: Deno.env.get("USERNAME_STORE_ADDRESS"),
        keys: ["0x019be6537c04b790ae4e3a06d6e777ec8b2e9950a01d76eed8a2a28941cc511c"],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false,
      },
      {
        // User Name Changed Event
        fromAddress: Deno.env.get("USERNAME_STORE_ADDRESS"),
        keys: ["0x03c44b98666b0a27eadcdf5dc42449af5f907b19523858368c4ffbc7a2625dab"],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false,
      },
      {
        // Template Added Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: ["0x3E18EC266FE76A2EFCE73F91228E6E04456B744FC6984C7A6374E417FB4BF59"],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false,
      },
      {
        // NFT Transfer Event
        fromAddress: Deno.env.get("NFT_CONTRACT_ADDRESS"),
        keys: ["0x0099cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9"],
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

export default function transform(block) {
  return block;
}
