export const config = {
  streamUrl: Deno.env.get("APIBARA_STREAM_URL"),
  startingBlock: 650_000,
  network: "starknet",
  finality: "DATA_STATUS_PENDING",
  filter: {
    events: [
      {
        // Pixel Placed Event
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: [
          "0x2D7B50EBF415606D77C7E7842546FC13F8ACFBFD16F7BCF2BC2D08F54114C23"
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
