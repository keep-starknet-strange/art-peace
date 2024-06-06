import { backendUrl } from '../utils/Consts.js';

export const fetchWrapper = async (url, options = {}) => {
  const controller = new AbortController();
  const signal = controller.signal;
  try {
    const response = await fetch(url, {
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
  return await fetchWrapper(`${backendUrl}/get-today-start-time`);
};

export const getVotableColors = async () => {
  return await fetchWrapper(`${backendUrl}/votable-colors`);
};

export const voteColorDevnet = async (colorIdx) => {
  return await fetchWrapper(`${backendUrl}/vote-color-devnet`, {
    method: 'POST',
    body: JSON.stringify({ colorIndex: colorIdx })
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
    `${backendUrl}/get-my-nfts?address=${query.queryAddress}&pageLength=${query.pageLength}&page=${query.page}`
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
    `${backendUrl}/get-nfts?pageLength=${query.pageLength}&page=${query.page}`
  );
};

export const getFactions = async (query) => {
  return await fetchWrapper(
    `${backendUrl}/get-factions?address=${query.queryAddress}&pageLength=${query.pageLength}&page=${query.page}`
  );
};

//Top NFTs
export const getTopNftsFn = async (params) => {
  const { page, pageLength } = params;
  const url = `${backendUrl}/get-top-nfts?page=${page}&pageLength=${pageLength}`;
  return await fetchWrapper(url, { mode: 'cors' });
};
