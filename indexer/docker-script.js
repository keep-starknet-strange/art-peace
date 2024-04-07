export const config = {
  streamUrl: "http://art-peace-apibara-1:7171",
  startingBlock: 0,
  network: "starknet",
  finality: "DATA_STATUS_PENDING",
  filter: {
    events: [
      {
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: ["0x2D7B50EBF415606D77C7E7842546FC13F8ACFBFD16F7BCF2BC2D08F54114C23"],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false,
      },
    ],
  },
  sinkType: "webhook",
  sinkOptions: {
    targetUrl: "http://art-peace-backend-1:8080/consumeIndexerMsg"
  },
};

// This transform does nothing.
export default function transform(block) {
  return block;
}
