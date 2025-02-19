import { backendUrl, fetchJsonData } from "./api";

export const getLeaderboardPixels = async (pageLength: number, page: number): Promise<any> => {
  try {
    const getLeaderboardPixelsEndpoint = `${backendUrl}/leaderboard-pixels?pageLength=${pageLength}&page=${page}`;
    const pixelLeaderboard = await fetchJsonData(getLeaderboardPixelsEndpoint);
    return pixelLeaderboard;
  } catch (error) {
    console.error("Error getting leaderboard pixels", error);
    return null;
  }
}

export const getLeaderboardWorlds = async (pageLength: number, page: number): Promise<any> => {
  try {
    const getLeaderboardWorldsEndpoint = `${backendUrl}/leaderboard-worlds?pageLength=${pageLength}&page=${page}`;
    const worldLeaderboard = await fetchJsonData(getLeaderboardWorldsEndpoint);
    return worldLeaderboard;
  } catch (error) {
    console.error("Error getting leaderboard worlds", error);
    return null;
  }
}

export const getLeaderboardPixelsWorld = async (pageLength: number, page: number, worldId: number): Promise<any> => {
  try {
    const getLeaderboardPixelsWorldEndpoint = `${backendUrl}/leaderboard-pixels-world?pageLength=${pageLength}&page=${page}&worldId=${worldId}`;
    const pixelLeaderboard = await fetchJsonData(getLeaderboardPixelsWorldEndpoint);
    return pixelLeaderboard;
  } catch (error) {
    console.error("Error getting leaderboard pixels", error);
    return null;
  }
}

export const getLeaderboardPixelsUser = async (address: string): Promise<any> => {
  try {
    const getLeaderboardPixelsUserEndpoint = `${backendUrl}/leaderboard-pixels-user?address=${address}`;
    const pixelLeaderboard = await fetchJsonData(getLeaderboardPixelsUserEndpoint);
    return pixelLeaderboard;
  } catch (error) {
    console.error("Error getting leaderboard pixels", error);
    return null;
  }
}

export const getLeaderboardWorldUser = async (address: string, worldId: number): Promise<any> => {
  try {
    const getLeaderboardWorldUserEndpoint = `${backendUrl}/leaderboard-pixels-world-user?address=${address}&worldId=${worldId}`;
    const worldLeaderboard = await fetchJsonData(getLeaderboardWorldUserEndpoint);
    return worldLeaderboard;
  } catch (error) {
    console.error("Error getting leaderboard worlds", error);
    return null;
  }
}
