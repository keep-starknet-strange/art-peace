import { useCallback, useState, useEffect } from "react";
import { useAccount } from '@starknet-react/core'
import { CANVAS_CONTRACT_ADDRESS } from "../components/StarknetProvider";

/*
export const [submitted, setSubmitted] = useState(false);
export const [txHash, setTxHash] = useState("");
*/

//export const placePixelCall = useCallback(
export const placePixelCall =
  async (account: any, worldId: number, position: number, colorId: number, now: number) => {
  try {
    if (!account) {
      console.error("Account not connected");
      return;
    }
    // setSubmitted(true);
    // setTxHash("");
    const calldata = [worldId, position, colorId, now];
    const result = await account.execute([
      {
        contractAddress: CANVAS_CONTRACT_ADDRESS,
        entrypoint: "place_pixel",
        calldata,
      },
    ]);
    // setTxHash(result.transaction_hash);
    console.log("Tx hash:", result.transaction_hash);
  } catch (error) {
    console.error(error);
  } finally {
    console.log("Done.");
    // setSubmitted(false);
  };
}

/*
useEffect(() => {
  console.log('Tx status:', submitted, txHash)
}, [submitted, txHash])
*/
