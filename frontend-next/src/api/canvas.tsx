import { backendUrl, fetchJsonData, fetchArrayBuffer } from './api';

export const getWorld = async (worldId: number): Promise<any> => {
  try {
    const worldEndpoint = `${backendUrl}/get-world?worldId=${worldId}`;
    const world = await fetchJsonData(worldEndpoint);
    return world;
  } catch (error) {
    console.error("Error getting world", error);
    return null;
  }
}

export const getCanvasColors = async (worldId: number): Promise<string[]> => {
  try {
    const canvasColorsEndpoint = `${backendUrl}/get-worlds-colors?worldId=${worldId}`;
    const canvasColors = await fetchJsonData(canvasColorsEndpoint);
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
    const canvasEndpoint = `${backendUrl}/get-world-canvas?worldId=${worldId}`;
    const canvas = await fetchArrayBuffer(canvasEndpoint);
    return canvas;
  } catch (error) {
    console.error("Error getting canvas", error);
    return new ArrayBuffer(0);
  }
}

export const getPixelInfo = async (worldId: number, position: number): Promise<string> => {
  try {
    const pixelInfoEndpoint = `${backendUrl}/get-worlds-pixel-info?worldId=${worldId}&position=${position}`;
    const pixelInfo = await fetchJsonData(pixelInfoEndpoint);
    return pixelInfo;
  } catch (error) {
    console.error("Error getting pixel info", error);
    return "";
  }
}

export const getHomeWorlds = async (): Promise<any[]> => {
  try {
    const homeWorldsEndpoint = `${backendUrl}/get-home-worlds`;
    const homeWorlds = await fetchJsonData(homeWorldsEndpoint);
    return homeWorlds;
  } catch (error) {
    console.error("Error getting home worlds", error);
    return [];
  }
}
