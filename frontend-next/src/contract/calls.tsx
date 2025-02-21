import { useCallback, useState, useEffect } from "react";
import { useAccount } from '@starknet-react/core'
import { CANVAS_CONTRACT_ADDRESS } from "../components/StarknetProvider";

/*
export const [submitted, setSubmitted] = useState(false);
export const [txHash, setTxHash] = useState("");
*/

const printCalldata = (calldata: any) => {
  let str = "";
  for (let i = 0; i < calldata.length; i++) {
    str += calldata[i].toString() + ",";
  }
  console.log(str);
}

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

export const placePixelsCall =
  async (account: any, worldId: number, pixels: any[], now: number) => {
  try {
    if (!account) {
      console.error("Account not connected");
      return;
    }
    const pixel_positions = [];
    const pixel_colors = [];
    for (let i = 0; i < pixels.length; i++) {
      pixel_positions.push(pixels[i].position);
      pixel_colors.push(pixels[i].colorId);
    }
    const calldata = [worldId, pixels.length, ...pixel_positions, pixels.length, ...pixel_colors, now];
    printCalldata(calldata);
    const result = await account.execute([
      {
        contractAddress: CANVAS_CONTRACT_ADDRESS,
        entrypoint: "place_pixels",
        calldata,
      },
    ]);
    console.log("Tx hash:", result.transaction_hash);
  } catch (error) {
    console.error(error);
  } finally {
    console.log("Done.");
  };
}

export const createCanvasCall =
  async (account: any, host: string, name: string, unique_name: string,
         width: number, height: number, pixels_per_time: number, timer: number,
         color_palette: string[], start_time: number, end_time: number) => {
  try {
    if (!account) {
      console.error("Account not connected");
      return;
    }

    const calldata = [host, name, unique_name, width, height, pixels_per_time, timer, color_palette.length, ...color_palette, start_time, end_time];
    printCalldata(calldata);
    const result = await account.execute([
      {
        contractAddress: CANVAS_CONTRACT_ADDRESS,
        entrypoint: "create_canvas",
        calldata,
      },
    ]);
    console.log("Tx hash:", result.transaction_hash);
  } catch (error) {
    console.error(error);
  } finally {
    console.log("Done.");
  }
}

export const addStencilCall =
  async (account: any, worldId: number, hash: string, width: number, height: number, position: number) => {
  try {
    if (!account) {
      console.error("Account not connected");
      return;
    }

    const calldata = [worldId, hash, width, height, position];
    printCalldata(calldata);
    const result = await account.execute([
      {
        contractAddress: CANVAS_CONTRACT_ADDRESS,
        entrypoint: "add_stencil",
        calldata,
      },
    ]);
    console.log("Tx hash:", result.transaction_hash);
  } catch (error) {
    console.error(error);
  } finally {
    console.log("Done.");
  }
}

export const favoriteStencilCall =
  async (account: any, worldId: number, stencilId: number) => {
  try {
    if (!account) {
      console.error("Account not connected");
      return;
    }

    const calldata = [worldId, stencilId];
    printCalldata(calldata);
    const result = await account.execute([
      {
        contractAddress: CANVAS_CONTRACT_ADDRESS,
        entrypoint: "favorite_stencil",
        calldata,
      },
    ]);
    console.log("Tx hash:", result.transaction_hash);
  } catch (error) {
    console.error(error);
  } finally {
    console.log("Done.");
  }
}

export const unfavoriteStencilCall =
  async (account: any, worldId: number, stencilId: number) => {
  try {
    if (!account) {
      console.error("Account not connected");
      return;
    }

    const calldata = [worldId, stencilId];
    printCalldata(calldata);
    const result = await account.execute([
      {
        contractAddress: CANVAS_CONTRACT_ADDRESS,
        entrypoint: "unfavorite_stencil",
        calldata,
      },
    ]);
    console.log("Tx hash:", result.transaction_hash);
  } catch (error) {
    console.error(error);
  } finally {
    console.log("Done.");
  }
}

/*
useEffect(() => {
  console.log('Tx status:', submitted, txHash)
}, [submitted, txHash])
*/
