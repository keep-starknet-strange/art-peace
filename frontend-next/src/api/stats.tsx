import { backendUrl, fetchJsonData } from "./api";

// const leaderboardCutoff = process.env.NEXT_PUBLIC_LEADERBOARD_CUTOFF || "0";
// Make leaderboard cutoff UNIX timestamp of the start of today ( IE 00:00 UTC )
const leaderboardCutoff = process.env.NEXT_PUBLIC_LEADERBOARD_CUTOFF
    ? parseInt(process.env.NEXT_PUBLIC_LEADERBOARD_CUTOFF, 10)
    : Math.floor(Date.now() / 1000) - (new Date().getUTCHours() * 3600 + new Date().getUTCMinutes() * 60 + new Date().getUTCSeconds());

export const getLeaderboardPixels = async (pageLength: number, page: number): Promise<any> => {
  try {
    const getLeaderboardPixelsEndpoint = `${backendUrl}/leaderboard-pixels?pageLength=${pageLength}&page=${page}&timeCutoff=${leaderboardCutoff}`;
    const pixelLeaderboard = await fetchJsonData(getLeaderboardPixelsEndpoint);
    return pixelLeaderboard;
  } catch (error) {
    console.error("Error getting leaderboard pixels", error);
    return null;
  }
}

export const getLeaderboardWorlds = async (pageLength: number, page: number): Promise<any> => {
  try {
    const getLeaderboardWorldsEndpoint = `${backendUrl}/leaderboard-worlds?pageLength=${pageLength}&page=${page}&timeCutoff=${leaderboardCutoff}`;
    const worldLeaderboard = await fetchJsonData(getLeaderboardWorldsEndpoint);
    return worldLeaderboard;
  } catch (error) {
    console.error("Error getting leaderboard worlds", error);
    return null;
  }
}

export const getLeaderboardPixelsWorld = async (pageLength: number, page: number, worldId: number): Promise<any> => {
  try {
    const getLeaderboardPixelsWorldEndpoint = `${backendUrl}/leaderboard-pixels-world?pageLength=${pageLength}&page=${page}&worldId=${worldId}&timeCutoff=${leaderboardCutoff}`;
    const pixelLeaderboard = await fetchJsonData(getLeaderboardPixelsWorldEndpoint);
    return pixelLeaderboard;
  } catch (error) {
    console.error("Error getting leaderboard pixels", error);
    return null;
  }
}

export const getLeaderboardPixelsUser = async (address: string): Promise<any> => {
  try {
    const getLeaderboardPixelsUserEndpoint = `${backendUrl}/leaderboard-pixels-user?address=${address}&timeCutoff=${leaderboardCutoff}`;
    const pixelLeaderboard = await fetchJsonData(getLeaderboardPixelsUserEndpoint);
    return pixelLeaderboard;
  } catch (error) {
    console.error("Error getting leaderboard pixels", error);
    return null;
  }
}

export const getLeaderboardWorldUser = async (address: string, worldId: number): Promise<any> => {
  try {
    const getLeaderboardWorldUserEndpoint = `${backendUrl}/leaderboard-pixels-world-user?address=${address}&worldId=${worldId}&timeCutoff=${leaderboardCutoff}`;
    const worldLeaderboard = await fetchJsonData(getLeaderboardWorldUserEndpoint);
    return worldLeaderboard;
  } catch (error) {
    console.error("Error getting leaderboard worlds", error);
    return null;
  }
}

export const getUserRewards = async (address: string): Promise<any> => {
  try {
    const getUserRewardsEndpoint = `${backendUrl}/get-user-rewards?address=${address}`;
    const userRewards = await fetchJsonData(getUserRewardsEndpoint);
    return userRewards;
  } catch (error) {
    console.error("Error getting user rewards", error);
    return null;
  }
}
