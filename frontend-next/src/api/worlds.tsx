import { backendUrl, fetchJsonData } from './api';

export const getFavoriteWorlds = async (address: string, pageLength: number, page: number): Promise<any> => {
  try {
    let getFavoriteWorldsEndpoint = `${backendUrl}/get-favorite-worlds?address=${address}&pageLength=${pageLength}&page=${page}`;
    let favoriteWorlds = await fetchJsonData(getFavoriteWorldsEndpoint);
    return favoriteWorlds;
  } catch (error) {
    console.error("Error getting favorite worlds", error);
    return null;
  }
}

export const getNewWorlds = async (address: string, pageLength: number, page: number): Promise<any> => {
  try {
    let getNewWorldsEndpoint = `${backendUrl}/get-new-worlds?address=${address}&pageLength=${pageLength}&page=${page}`;
    let newWorlds = await fetchJsonData(getNewWorldsEndpoint);
    return newWorlds;
  } catch (error) {
    console.error("Error getting new worlds", error);
    return null;
  }
}

export const getTopWorlds = async (address: string, pageLength: number, page: number): Promise<any> => {
  try {
    let getTopWorldsEndpoint = `${backendUrl}/get-top-worlds?address=${address}&pageLength=${pageLength}&page=${page}`;
    let topWorlds = await fetchJsonData(getTopWorldsEndpoint);
    return topWorlds;
  } catch (error) {
    console.error("Error getting top worlds", error);
    return null;
  }
}

export const getHotWorlds = async (address: string, pageLength: number, page: number): Promise<any> => {
  try {
    let getHotWorldsEndpoint = `${backendUrl}/get-hot-worlds?address=${address}&pageLength=${pageLength}&page=${page}`;
    let hotWorlds = await fetchJsonData(getHotWorldsEndpoint);
    return hotWorlds;
  } catch (error) {
    console.error("Error getting hot worlds", error);
    return null;
  }
}

export const getWorlds = async (pageLength: number, page: number, worldId: any = null): Promise<any> => {
  try {
    let getWorldsEndpoint = `${backendUrl}/get-worlds?pageLength=${pageLength}&page=${page}`;
    let worlds = await fetchJsonData(getWorldsEndpoint);
    return worlds;
  } catch (error) {
    console.error("Error getting worlds", error);
    return null;
  }
}

export const getWorld = async (worldId: string): Promise<any> => {
  try {
    let getWorldEndpoint = `${backendUrl}/get-world?worldId=${worldId}`;
    let world = await fetchJsonData(getWorldEndpoint);
    return world;
  } catch (error) {
    console.error("Error getting world", error);
    return null;
  }
}
