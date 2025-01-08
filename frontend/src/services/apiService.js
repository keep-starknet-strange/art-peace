import { backendUrl } from '../utils/Consts.js';

export const fetchWrapper = async (url, options = {}) => {
  const controller = new AbortController();
  const signal = controller.signal;
  try {
    const response = await fetch(`${backendUrl}/${url}`, {
      mode: 'cors',
      signal,
      ...options
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`);
    }
    return await response.json();
  } catch (err) {
    console.log(`Error while fetching ${url}:`, err);
    throw err; // Re-throw the error for further handling if needed
  } finally {
    controller.abort(); // Ensure the request is aborted after completion or error
  }
};

export const getTodaysStartTime = async () => {
  return await fetchWrapper('get-today-start-time');
};

export const getVotableColors = async () => {
  return await fetchWrapper('votable-colors');
};

export const voteColorDevnet = async (colorIdx) => {
  return await fetchWrapper('vote-color-devnet', {
    method: 'POST',
    body: JSON.stringify({ colorIndex: colorIdx })
  });
};

export const addFactionTemplateDevnet = async (metadata) => {
  return await fetchWrapper('add-faction-template-devnet', {
    method: 'POST',
    body: JSON.stringify(metadata)
  });
};

//NFTS API
/**
 * Fetches NFTs for a given address with pagination.
 *
 * @param {Object} query - The query parameters for fetching NFTs.
 * @param {string} query.queryAddress - The address to fetch NFTs for.
 * @param {number} query.pageLength - The number of NFTs to fetch per page.
 * @param {number} query.page - The page number to fetch.
 * @returns {Promise<Object>} The response from the fetch call.
 */
export const getMyNftsFn = async (query) => {
  return await fetchWrapper(
    `get-my-nfts?address=${query.queryAddress}&pageLength=${query.pageLength}&page=${query.page}`
  );
};

/**
 * Fetches NFTs with pagination.
 *
 * @param {Object} query - The query parameters for fetching NFTs.
 * @param {number} query.pageLength - The number of NFTs to fetch per page.
 * @param {number} query.page - The page number to fetch.
 * @returns {Promise<Object>} The response from the fetch call.
 */
export const getNftsFn = async (query) => {
  return await fetchWrapper(
    `get-nfts?pageLength=${query.pageLength}&page=${query.page}`
  );
};

export const getFactions = async (query) => {
  return await fetchWrapper(
    `get-factions?address=${query.queryAddress}&pageLength=${query.pageLength}&page=${query.page}`
  );
};

export const getChainFactions = async (query) => {
  return await fetchWrapper(`get-chain-factions?address=${query.queryAddress}`);
};

export const getNewNftsFn = async (params) => {
  const { page, pageLength, queryAddress } = params;
  return await fetchWrapper(
    `get-new-nfts?address=${queryAddress}&page=${page}&pageLength=${pageLength}`
  );
};

export const getTopNftsFn = async (params) => {
  const { page, pageLength, queryAddress } = params;
  return await fetchWrapper(
    `get-top-nfts?address=${queryAddress}&page=${page}&pageLength=${pageLength}`
  );
};

export const getHotNftsFn = async (params) => {
  const { page, pageLength, queryAddress } = params;
  return await fetchWrapper(
    `get-hot-nfts?address=${queryAddress}&page=${page}&pageLength=${pageLength}`
  );
};

export const getChainFactionMembers = async (query) => {
  return await fetchWrapper(
    `get-chain-faction-members?factionId=${query.factionId}&page=${query.page}&pageLength=${query.pageLength}`
  );
};

export const getFactionMembers = async (query) => {
  return await fetchWrapper(
    `get-faction-members?factionId=${query.factionId}&page=${query.page}&pageLength=${query.pageLength}`
  );
};

export const getWorldsFn = async (query) => {
  return await fetchWrapper(
    `get-worlds?pageLength=${query.pageLength}&page=${query.page}`
  );
};

export const getNewWorldsFn = async (params) => {
  const { page, pageLength, queryAddress } = params;
  return await fetchWrapper(
    `get-new-worlds?address=${queryAddress}&page=${page}&pageLength=${pageLength}`
  );
};

export const getTopWorldsFn = async (params) => {
  const { page, pageLength, queryAddress } = params;
  return await fetchWrapper(
    `get-top-worlds?address=${queryAddress}&page=${page}&pageLength=${pageLength}`
  );
};

export const getHotWorldsFn = async (params) => {
  const { page, pageLength, queryAddress } = params;
  return await fetchWrapper(
    `get-hot-worlds?address=${queryAddress}&page=${page}&pageLength=${pageLength}`
  );
};

export const getFavoriteWorldsFn = async (query) => {
  return await fetchWrapper(
    `get-favorite-worlds?address=${query.queryAddress}&pageLength=${query.pageLength}&page=${query.page}`
  );
};

export const getFavoriteStencilsFn = async (query) => {
  return await fetchWrapper(
    `get-favorite-stencils?address=${query.queryAddress}&pageLength=${query.pageLength}&page=${query.page}&worldId=${query.worldId}`
  );
};

export const getStencilsFn = async (query) => {
  return await fetchWrapper(
    `get-stencils?pageLength=${query.pageLength}&page=${query.page}&worldId=${query.worldId}`
  );
};

export const getNewStencilsFn = async (params) => {
  const { page, pageLength, queryAddress } = params;
  return await fetchWrapper(
    `get-new-stencils?address=${queryAddress}&page=${page}&pageLength=${pageLength}&worldId=${params.worldId}`
  );
};

export const getTopStencilsFn = async (params) => {
  const { page, pageLength, queryAddress } = params;
  return await fetchWrapper(
    `get-top-stencils?address=${queryAddress}&page=${page}&pageLength=${pageLength}&worldId=${params.worldId}`
  );
};

export const getHotStencilsFn = async (params) => {
  const { page, pageLength, queryAddress } = params;
  return await fetchWrapper(
    `get-hot-stencils?address=${queryAddress}&page=${page}&pageLength=${pageLength}&worldId=${params.worldId}`
  );
};

export const getLikedNftsFn = async (params) => {
  const { page, pageLength, queryAddress } = params;
  return await fetchWrapper(
    `get-liked-nfts?address=${queryAddress}&page=${page}&pageLength=${pageLength}`
  );
};
