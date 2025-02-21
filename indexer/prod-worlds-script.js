export const config = {
  streamUrl: Deno.env.get("APIBARA_STREAM_URL"),
  startingBlock: 1150000,
  network: "starknet",
  finality: "DATA_STATUS_PENDING",
  filter: {
    events: [
      {
        // Canvas Created Event
        fromAddress: Deno.env.get("CANVAS_FACTORY_CONTRACT_ADDRESS"),
        keys: [
          "0x0003fddf2e955d6c8fbd5ec6e98da32f7e9ebe7731b86b4ef7de342b165222e0"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Canvas Host Changed Event
        fromAddress: Deno.env.get("CANVAS_FACTORY_CONTRACT_ADDRESS"),
        keys: [
          "0x00569981649f1a25a7a012ccf216e9c0f807068f8ba4689ee58c2d55df22cc45"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Canvas Pixels Per Time Changed Event
        fromAddress: Deno.env.get("CANVAS_FACTORY_CONTRACT_ADDRESS"),
        keys: [
          "0x0053fef88f7744f78868b97051032869570d31ef6be6c86e2c60ca33b8d4b49d"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Canvas Time Between Pixels Changed Event
        fromAddress: Deno.env.get("CANVAS_FACTORY_CONTRACT_ADDRESS"),
        keys: [
          "0x02e1eccce24e49cc4ab3df0795f173bbe667dd4fddbc52c8af731b4e2ad78cf5"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Canvas Start Time Changed Event
        fromAddress: Deno.env.get("CANVAS_FACTORY_CONTRACT_ADDRESS"),
        keys: [
          "0x029dcf060d1b84c30a9a0c25f8c9b0bcb841557eb482d198524fef77e8879673"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Canvas End Time Changed Event
        fromAddress: Deno.env.get("CANVAS_FACTORY_CONTRACT_ADDRESS"),
        keys: [
          "0x0208008de905364fb24915201b629fe7bcbc4adeced02a2696df5e1c48758acd"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Canvas Color Added Event
        fromAddress: Deno.env.get("CANVAS_FACTORY_CONTRACT_ADDRESS"),
        keys: [
          "0x03e856f8abfe58c8841f552ce76651ebff20c1550d167b3a18b049b7552fe8a2"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Canvas Pixel Placed Event
        fromAddress: Deno.env.get("CANVAS_FACTORY_CONTRACT_ADDRESS"),
        keys: [
          "0x02adf9f56e1f4e16a3e116f34424bd26cb5fc45363498015b4c007835318f7bb"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Canvas Basic Pixel Placed Event
        fromAddress: Deno.env.get("CANVAS_FACTORY_CONTRACT_ADDRESS"),
        keys: [
          "0x03066baa9c37a42082799e6bc6426ff7d4dc8a635ed9dfc444d0d3c51e605a6b"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Canvas Host Awarded User Event
        fromAddress: Deno.env.get("CANVAS_FACTORY_CONTRACT_ADDRESS"),
        keys: [
          "0x01bf6ede8c6c232cee1830a5227fd638383f5af669701289d113492b1d41fda5"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Canvas Favorited Event
        fromAddress: Deno.env.get("CANVAS_FACTORY_CONTRACT_ADDRESS"),
        keys: [
          "0x032105bd4f21a32bc92e45a49b30eab9355f7f89619d87e9801628e3acc5b502"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Canvas Unfavorited Event
        fromAddress: Deno.env.get("CANVAS_FACTORY_CONTRACT_ADDRESS"),
        keys: [
          "0x014ee6480f95acb4b7286d3a7f95b6033299e66e502cfb4b207ccf088b5f601d"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Stencil Added Event
        fromAddress: Deno.env.get("CANVAS_FACTORY_CONTRACT_ADDRESS"),
        keys: [
          "0x03384fcf8ff5c539c31feec6626511aa15ae53dba7459fd3a3c67af615ef6b5d"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Stencil Removed Event
        fromAddress: Deno.env.get("CANVAS_FACTORY_CONTRACT_ADDRESS"),
        keys: [
          "0x023c933ed3ee3f94b5b82f8e2e570c8354e6f5036c3a079092ceeed15979e7fa"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Stencil Favorited Event
        fromAddress: Deno.env.get("CANVAS_FACTORY_CONTRACT_ADDRESS"),
        keys: [
          "0x007cb4ae927fb597834e194e2c950a2d813461c72f372f78d0610ea246f53017"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
      {
        // Stencil Unfavorited Event
        fromAddress: Deno.env.get("CANVAS_FACTORY_CONTRACT_ADDRESS"),
        keys: [
          "0x00a5477c7df6522316b652e56317e69e52429ab43a6772fb6f6c2a574f7e196f"
        ],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false
      },
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
