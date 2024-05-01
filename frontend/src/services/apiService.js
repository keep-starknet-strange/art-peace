import backendConfig from '../configs/backend.config.json';
export const backendUrlBase =
  'http://' + backendConfig.host + ':' + backendConfig.port;

const fetchWrapper = async (url, options = {}) => {
  const controller = new AbortController();
  const signal = controller.signal;
  try {
    const response = await fetch(`${backendUrlBase}/${url}`, {
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
