export const config = {
  streamUrl: Deno.env.get("APIBARA_STREAM_URL"),
  startingBlock: 1212500,
  //startingBlock: 1205100,
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
