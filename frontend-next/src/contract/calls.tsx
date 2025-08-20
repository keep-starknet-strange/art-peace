import { useCallback, useState, useEffect } from "react";
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
  async (account: any, worldId: number, position: number, colorId: number, now: number): Promise<any> => {
  let txHash = "";
  try {
    if (!account) {
      console.error("Account not connected");
      return null;
    }
    // setSubmitted(true);
    // setTxHash("");
    const calldata = [worldId, position, colorId, now];
    const result = await account.execute([
      {
        contractAddress: CANVAS_CONTRACT_ADDRESS,
        entrypoint: "0x4cde3e7cce0b9bbcf08d8b891f1b35302858ffd1251226afe10443e3482114", // place_pixel
        calldata,
      },
    ]);
    // setTxHash(result.transaction_hash);
    console.log("Tx hash:", result.transaction_hash);
    txHash = result.transaction_hash;
  } catch (error) {
    console.error(error);
    return null;
  } finally {
    console.log("Done.");
    return txHash;
    // setSubmitted(false);
  };
}

export const placePixelsCall =
  async (account: any, worldId: number, pixels: any[], now: number): Promise<any> => {
  let txHash = "";
  try {
    if (!account) {
      console.error("Account not connected");
      return null;
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
        entrypoint: "0x349d91d0c45d220dfd1b14c43caa2f54408ef08d0e0458700fb3b15d51e0173", // place_pixels
        calldata,
      },
    ]);
    console.log("Tx hash:", result.transaction_hash);
    txHash = result.transaction_hash;
  } catch (error) {
    console.error(error);
    return null;
  } finally {
    console.log("Done.");
    return txHash;
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
        entrypoint: "0x1aabaa11b54a06844d75d9e308d96a31f8622c675bec90b7048e6fac0d13326", // create_canvas
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
        entrypoint: "0x280406faa355e710f583d01a21d3b1733f5b03e50693052a70121ecc4c86de6", // add_stencil
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
        entrypoint: "0x1ef4e50dbc45a8a37b18f14db84f51d9837fe10ff6e57b226f470c242a543e1", // favorite_stencil
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
        entrypoint: "0x2d6aee5967300c480128cada5d3d915945583f25faf54499c0ca9309aef5780", //unfavorite_stencil
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
