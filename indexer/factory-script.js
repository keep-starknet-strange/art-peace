export const config = {
  streamUrl: Deno.env.get("APIBARA_STREAM_URL"),
  startingBlock: 0,
  network: "starknet",
  finality: "DATA_STATUS_PENDING",
  filter: {
    events: [
      {
        // World Created
        fromAddress: Deno.env.get("CANVAS_FACTORY_CONTRACT_ADDRESS"),
        keys: [
          "0x0003fddf2e955d6c8fbd5ec6e98da32f7e9ebe7731b86b4ef7de342b165222e0"
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

/*
indexer-1   | 2024-11-19T11:35:45.123996Z  INFO handle block batch block=7 status=accepted
indexer-1   | Filtering deployed contracts on block [Object: null prototype] {
indexer-1   |   status: "BLOCK_STATUS_ACCEPTED_ON_L2",
indexer-1   |   events: [
indexer-1   |     [Object: null prototype] {
indexer-1   |       event: [Object: null prototype] {
indexer-1   |         fromAddress: "0x057b0244418376c2a57fe39deb720832ec5a1793d770cc6749656a90068c9ffa",
indexer-1   |         keys: [
indexer-1   |           "0x0003fddf2e955d6c8fbd5ec6e98da32f7e9ebe7731b86b4ef7de342b165222e0",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000000"
indexer-1   |         ],
indexer-1   |         data: [
indexer-1   |           "0x0003ac421f75aa919e51682ad5d7704b782876f4811a0e39062230fa6056a83f",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000001",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000001",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000001",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000001",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000001",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000001",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000001",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000001",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000001"
indexer-1   |         ],
indexer-1   |         index: "1"
indexer-1   |       }
indexer-1   |     }
indexer-1   |   ]
indexer-1   | }
indexer-1   | Storing deployed contracts on block [Object: null prototype] {
indexer-1   |   status: "BLOCK_STATUS_ACCEPTED_ON_L2",
indexer-1   |   events: [
indexer-1   |     [Object: null prototype] {
indexer-1   |       event: [Object: null prototype] {
indexer-1   |         fromAddress: "0x057b0244418376c2a57fe39deb720832ec5a1793d770cc6749656a90068c9ffa",
indexer-1   |         keys: [
indexer-1   |           "0x0003fddf2e955d6c8fbd5ec6e98da32f7e9ebe7731b86b4ef7de342b165222e0",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000000"
indexer-1   |         ],
indexer-1   |         data: [
indexer-1   |           "0x0003ac421f75aa919e51682ad5d7704b782876f4811a0e39062230fa6056a83f",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000001",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000001",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000001",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000001",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000001",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000001",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000001",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000001",
indexer-1   |           "0x0000000000000000000000000000000000000000000000000000000000000001"
indexer-1   |         ],
indexer-1   |         index: "1"
indexer-1   |       }
indexer-1   |     }
indexer-1   |   ]
indexer-1   | }
*/

function filterDeployedContracts(block) {
  console.log("Filtering deployed contracts on block", block);
  return [];
}

function deployedContractsInfo(block) {
  console.log("Storing deployed contracts on block", block);
  return {};
}

export function factory(block) {
  const filter = {
    header: { weak: true },
    // Build event filters based on the events in the current block.
    events: filterDeployedContracts(block),
  };
  // Store deployed contracts in the integration.
  const data = deployedContractsInfo(block);

  return {
    filter,
    data,
  };
}

export default function transform(block) {
  return block;
}
