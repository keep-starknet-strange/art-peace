export const config = {
  streamUrl: Deno.env.get("APIBARA_STREAM_URL"),
  startingBlock: 0,
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
        // Canvas Extra Pixels Placed Event
        fromAddress: Deno.env.get("CANVAS_FACTORY_CONTRACT_ADDRESS"),
        keys: [
          "0x01e42e4d6ca5843bfd4e86e344db6c418b295c23bed38831a7ec9b4a83148830"
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
