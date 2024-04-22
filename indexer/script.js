export const config = {
  streamUrl: Deno.env.get("APIBARA_STREAM_URL"),
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
      {
        fromAddress: Deno.env.get("NFT_CONTRACT_ADDRESS"),
        keys: ["0x30826E0CD9A517F76E857E3F3100FE5B9098E9F8216D3DB283FB4C9A641232F"],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false,
      },
      {
        fromAddress: Deno.env.get("ART_PEACE_CONTRACT_ADDRESS"),
        keys: ["0x3E18EC266FE76A2EFCE73F91228E6E04456B744FC6984C7A6374E417FB4BF59"],
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

// This transform does nothing.
export default function transform(block) {
  return block;
}
