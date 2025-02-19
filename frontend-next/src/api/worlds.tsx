import { backendUrl, fetchJsonData } from './api';

export const getFavoriteWorlds = async (address: string, pageLength: number, page: number): Promise<any> => {
  try {
    const getFavoriteWorldsEndpoint = `${backendUrl}/get-favorite-worlds?address=${address}&pageLength=${pageLength}&page=${page}`;
    const favoriteWorlds = await fetchJsonData(getFavoriteWorldsEndpoint);
    return favoriteWorlds;
  } catch (error) {
    console.error("Error getting favorite worlds", error);
    return null;
  }
}

export const getNewWorlds = async (address: string, pageLength: number, page: number): Promise<any> => {
  try {
    const getNewWorldsEndpoint = `${backendUrl}/get-new-worlds?address=${address}&pageLength=${pageLength}&page=${page}`;
    const newWorlds = await fetchJsonData(getNewWorldsEndpoint);
    return newWorlds;
  } catch (error) {
    console.error("Error getting new worlds", error);
    return null;
  }
}

export const getTopWorlds = async (address: string, pageLength: number, page: number): Promise<any> => {
  try {
    const getTopWorldsEndpoint = `${backendUrl}/get-top-worlds?address=${address}&pageLength=${pageLength}&page=${page}`;
    const topWorlds = await fetchJsonData(getTopWorldsEndpoint);
    return topWorlds;
  } catch (error) {
    console.error("Error getting top worlds", error);
    return null;
  }
}

export const getHotWorlds = async (address: string, pageLength: number, page: number): Promise<any> => {
  try {
    const getHotWorldsEndpoint = `${backendUrl}/get-hot-worlds?address=${address}&pageLength=${pageLength}&page=${page}`;
    const hotWorlds = await fetchJsonData(getHotWorldsEndpoint);
    return hotWorlds;
  } catch (error) {
    console.error("Error getting hot worlds", error);
    return null;
  }
}

export const getWorlds = async (pageLength: number, page: number): Promise<any> => {
  try {
    const getWorldsEndpoint = `${backendUrl}/get-worlds?pageLength=${pageLength}&page=${page}`;
    const worlds = await fetchJsonData(getWorldsEndpoint);
    return worlds;
  } catch (error) {
    console.error("Error getting worlds", error);
    return null;
  }
}

export const getWorld = async (worldId: string): Promise<any> => {
  try {
    const getWorldEndpoint = `${backendUrl}/get-world?worldId=${worldId}`;
    const world = await fetchJsonData(getWorldEndpoint);
    return world;
  } catch (error) {
    console.error("Error getting world", error);
    return null;
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

export const getRoundsConfig = async (): Promise<any> => {
  try {
    const roundsConfigEndpoint = `${backendUrl}/get-rounds-config`;
    const roundsConfig = await fetchJsonData(roundsConfigEndpoint);
    return roundsConfig;
  } catch (error) {
    console.error("Error getting rounds config", error);
    return null;
  }
}
