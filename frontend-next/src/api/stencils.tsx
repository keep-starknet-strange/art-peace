import { backendUrl, fetchJsonData, postJsonData } from './api';

export const getFavoriteStencils = async (address: string, pageLength: number, page: number, worldId: any = null): Promise<any> => {
  try {
    let getFavoriteStencilsEndpoint = "";
    if (worldId === null || worldId === undefined) {
      getFavoriteStencilsEndpoint = `${backendUrl}/get-favorite-stencils?address=${address}&pageLength=${pageLength}&page=${page}`;
    } else {
      getFavoriteStencilsEndpoint = `${backendUrl}/get-favorite-stencils?address=${address}&pageLength=${pageLength}&page=${page}&worldId=${worldId}`;
    }
    const favoriteStencils = await fetchJsonData(getFavoriteStencilsEndpoint);
    return favoriteStencils;
  } catch (error) {
    console.error("Error getting favorite stencils", error);
    return null;
  }
}

export const getNewStencils = async (address: string, pageLength: number, page: number, worldId: any = null): Promise<any> => {
  try {
    let getNewStencilsEndpoint = "";
    if (worldId === null || worldId === undefined) {
      getNewStencilsEndpoint = `${backendUrl}/get-new-stencils?address=${address}&pageLength=${pageLength}&page=${page}`;
    } else {
      getNewStencilsEndpoint = `${backendUrl}/get-new-stencils?address=${address}&pageLength=${pageLength}&page=${page}&worldId=${worldId}`;
    }
    const newStencils = await fetchJsonData(getNewStencilsEndpoint);
    return newStencils;
  } catch (error) {
    console.error("Error getting new stencils", error);
    return null;
  }
}

export const getTopStencils = async (address: string, pageLength: number, page: number, worldId: any = null): Promise<any> => {
  try {
    let getTopStencilsEndpoint = "";
    if (worldId === null || worldId === undefined) {
      getTopStencilsEndpoint = `${backendUrl}/get-top-stencils?address=${address}&pageLength=${pageLength}&page=${page}`;
    } else {
      getTopStencilsEndpoint = `${backendUrl}/get-top-stencils?address=${address}&pageLength=${pageLength}&page=${page}&worldId=${worldId}`;
    }
    const topStencils = await fetchJsonData(getTopStencilsEndpoint);
    return topStencils;
  } catch (error) {
    console.error("Error getting top stencils", error);
    return null;
  }
}

export const getHotStencils = async (address: string, pageLength: number, page: number, worldId: any = null): Promise<any> => {
  try {
    let getHotStencilsEndpoint = "";
    if (worldId === null || worldId === undefined) {
      getHotStencilsEndpoint = `${backendUrl}/get-hot-stencils?address=${address}&pageLength=${pageLength}&page=${page}`;
    } else {
      getHotStencilsEndpoint = `${backendUrl}/get-hot-stencils?address=${address}&pageLength=${pageLength}&page=${page}&worldId=${worldId}`;
    }
    const hotStencils = await fetchJsonData(getHotStencilsEndpoint);
    return hotStencils;
  } catch (error) {
    console.error("Error getting hot stencils", error);
    return null;
  }
}

export const getStencils = async (pageLength: number, page: number, worldId: any = null): Promise<any> => {
  try {
    let getStencilsEndpoint = "";
    if (worldId === null || worldId === undefined) {
      getStencilsEndpoint = `${backendUrl}/get-stencils?pageLength=${pageLength}&page=${page}`;
    } else {
      getStencilsEndpoint = `${backendUrl}/get-stencils?pageLength=${pageLength}&page=${page}&worldId=${worldId}`;
    }
    const stencils = await fetchJsonData(getStencilsEndpoint);
    return stencils;
  } catch (error) {
    console.error("Error getting stencils", error);
    return null;
  }
}

export const getStencil = async (stencilId: string): Promise<any> => {
  try {
    const getStencilEndpoint = `${backendUrl}/get-stencil?stencilId=${stencilId}`;
    const stencil = await fetchJsonData(getStencilEndpoint);
    return stencil;
  } catch (error) {
    console.error("Error getting stencil", error);
    return null;
  }
}

export const addStencilData = async (worldId: number, width: number, height: number, image: string): Promise<any> => {
  try {
    const addStencilDataEndpoint = `${backendUrl}/add-stencil-data`;
    const result = await postJsonData(addStencilDataEndpoint, {
      worldId: worldId.toString(),
      width: width.toString(),
      height: height.toString(),
      image
    });
    return result;
  } catch (error) {
    console.error("Error adding stencil data", error);
    return null;
  }
}

export const getStencilPixelData = async (hash: string, worldId: number): Promise<any> => {
  try {
    const getStencilPixelDataEndpoint = `${backendUrl}/get-stencil-pixel-data?hash=${hash}&worldId=${worldId}`;
    const pixelData = await fetchJsonData(getStencilPixelDataEndpoint);
    return pixelData;
  } catch (error) {
    console.error("Error getting stencil pixel data", error);
    return null;
  }
}
