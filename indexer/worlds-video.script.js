// startingBlock: 1250396,
export const config = {
  streamUrl: Deno.env.get("APIBARA_STREAM_URL"),
  startingBlock: 1169505,
  network: "starknet",
  finality: "DATA_STATUS_PENDING",
  filter: {
    events: [
      {
        // Pixel Placed Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x02adf9f56e1f4e16a3e116f34424bd26cb5fc45363498015b4c007835318f7bb"
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
