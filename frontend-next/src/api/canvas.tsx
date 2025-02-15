import { backendUrl, fetchJsonData, fetchArrayBuffer } from './api';

export const getWorld = async (worldId: number): Promise<any> => {
  try {
    let worldEndpoint = `${backendUrl}/get-world?worldId=${worldId}`;
    let world = await fetchJsonData(worldEndpoint);
    return world;
  } catch (error) {
    console.error("Error getting world", error);
    return null;
  }
}

export const getCanvasColors = async (worldId: number): Promise<string[]> => {
  try {
    let canvasColorsEndpoint = `${backendUrl}/get-worlds-colors?worldId=${worldId}`;
    let canvasColors = await fetchJsonData(canvasColorsEndpoint);
    if (canvasColors.length === 0) {
      console.error("No colors found for world", worldId);
      return [];
    }
    return canvasColors;
  } catch (error) {
    console.error("Error getting canvas colors", error);
    return [];
  }
}

export const getCanvas = async (worldId: number): Promise<ArrayBuffer> => {
  try {
    let canvasEndpoint = `${backendUrl}/get-world-canvas?worldId=${worldId}`;
    let canvas = await fetchArrayBuffer(canvasEndpoint);
    return canvas;
  } catch (error) {
    console.error("Error getting canvas", error);
    return new ArrayBuffer(0);
  }
}

export const getPixelInfo = async (worldId: number, position: number): Promise<string> => {
  try {
    let pixelInfoEndpoint = `${backendUrl}/get-worlds-pixel-info?worldId=${worldId}&position=${position}`;
    let pixelInfo = await fetchJsonData(pixelInfoEndpoint);
    return pixelInfo;
  } catch (error) {
    console.error("Error getting pixel info", error);
    return "";
  }
}

export const getHomeWorlds = async (): Promise<any[]> => {
  try {
    let homeWorldsEndpoint = `${backendUrl}/get-home-worlds`;
    let homeWorlds = await fetchJsonData(homeWorldsEndpoint);
    return homeWorlds;
  } catch (error) {
    console.error("Error getting home worlds", error);
    return [];
  }
}
