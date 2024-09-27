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
        keys: [
          "0x00df776faf675d0c64b0f2ec596411cf1509d3966baba3478c84771ddbac1784"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Color Added Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x0004a301e4d01f413a1d4d0460c4ba976e23392f49126d90f5bd45de7dd7dbeb"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Pixel Placed Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x2D7B50EBF415606D77C7E7842546FC13F8ACFBFD16F7BCF2BC2D08F54114C23"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Basic Pixel Placed Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x03089ae3085e1c52442bb171f26f92624095d32dc8a9c57c8fb09130d32daed8"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Faction Pixels Placed Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x02838056c6784086957f2252d4a36a24d554ea2db7e09d2806cc69751d81f0a2"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Chain Faction Pixels Placed Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x02e4d1feaacd0627a6c7d5002564bdb4ca4877d47f00cad4714201194690a7a9"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Extra Pixels Placed Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x000e8f5c4e6f651bf4c7b093805f85c9b8ec2ec428210f90a4c9c135c347f48c"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Daily Quest Claimed Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x02025eddbc0f68a923d76519fb336e0fe1e0d6b9053ab3a504251bbd44201b10"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Main Quest Claimed Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x0121172d5bc3847c8c39069075125e53d3225741d190df6d52194cb5dd5d2049"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Vote Color Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x2407C82B0EFA2F6176A075BA5A939D33EEFAB39895FABCF3AC1C5E897974A40"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Votable Color Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x0115b3bc605487276e022f4bec68b316e7a6b3615fb01afee58241fd1d40e3e5"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Faction Created Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x00f3878d4c85ed94271bb611f83d47ea473bae501ffed34cd21b73206149f692"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Faction Leader Changed Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x00aa4bacdfcf2717835a46fbd64f7d39bfdf2b4404bc5af8e5660415d1dc2848"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Faction Joined Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x01e3fbdf8156ad0dde21e886d61a16d85c9ef54451eb6e253f3f427de32a47ac"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Faction Left Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x014ef8cc25c96157e2a00e9ceaa7c014a162d11d58a98871087ec488a67d7925"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Chain Faction Created Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x020c994ab49a8316bcc78b06d4ff9929d83b2995af33f480b93e972cedb0c926"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Chain Faction Joined Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x02947960ff713d9b594a3b718b90a45360e46d1bbacef94b727bb0d461d04207"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // NFT Minted Event
        fromAddress: Deno.env.get("NFT_CONTRACT_ADDRESS"),
        keys: [
          "0x30826E0CD9A517F76E857E3F3100FE5B9098E9F8216D3DB283FB4C9A641232F"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // NFT Liked Event
        fromAddress: Deno.env.get("NFT_CONTRACT_ADDRESS"),
        keys: [
          "0x028d7ee09447088eecdd12a86c9467a5e9ad18f819a20f9adcf6e34e0bd51453"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // NFT Unliked Event
        fromAddress: Deno.env.get("NFT_CONTRACT_ADDRESS"),
        keys: [
          "0x03b57514b19693484c35249c6e8b15bfe6e476205720680c2ff9f02faaf94941"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // User Name Claimed Event
        fromAddress: Deno.env.get("USERNAME_STORE_ADDRESS"),
        keys: [
          "0x019be6537c04b790ae4e3a06d6e777ec8b2e9950a01d76eed8a2a28941cc511c"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // User Name Changed Event
        fromAddress: Deno.env.get("USERNAME_STORE_ADDRESS"),
        keys: [
          "0x03c44b98666b0a27eadcdf5dc42449af5f907b19523858368c4ffbc7a2625dab"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // NFT Transfer Event
        fromAddress: Deno.env.get("NFT_CONTRACT_ADDRESS"),
        keys: [
          "0x0099cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Faction Template Added Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x026ab80224b4bc3543bf20cd8b66304b3591c05eac775d823e1970514881757f"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Faction Template Removed Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x029a976c0074fc910f3a6a58f1351c48dab7b1c539f54ed930616292c806283f"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Chain Faction Template Added Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x00476f35ea27024c89c1fc05dfad873e9e93419e452ee781e8207e435289a39b"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Chain Faction Template Removed Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x0126718de7cb8b83dfa258eb095bc0ec7a3ef5a2258ebd1ed349551764856c6b"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Host Awarded Pixels Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x03cab98018a5e38e0cf717d8bed481983eb400f6a1d9ccd34f87050c0f36a32a"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      }
    ]
  },
  sinkType: "webhook",
  sinkOptions: {
    targetUrl: Deno.env.get("CONSUMER_TARGET_URL")
  }
};

export default function transform(block) {
  return block;
}
