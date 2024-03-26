export const config = {
  streamUrl: "http://localhost:7171",
  startingBlock: 0,
  network: "starknet",
  finality: "DATA_STATUS_PENDING",
  filter: {
    events: [
      {
        fromAddress: "0x1fb3c4d5aac055c8ccd645b652c7d6d92b5828d5dd580b1dc8c5f6ee7eaf003",
        keys: ["0x31F8DAA2AC8DACD06AB968BAD8F97F98F63C30A86DBFCEBDD7625F589D4E7E6"],
        includeReverted: false,
        includeTransaction: false,
        includeReceipt: false,
      },
    ],
  },
  sinkType: "webhook",
  sinkOptions: {
    targetUrl: "http://localhost:7172/consume"
  },
};

// This transform does nothing.
export default function transform(block) {
  return block;
}
