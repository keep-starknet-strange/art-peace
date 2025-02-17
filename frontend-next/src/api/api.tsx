export const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export const fetchJsonData = async (endpoint: string): Promise<any> => {
  try {
    const response = await fetch(endpoint);
    const jsonData = await response.json();
    const data = jsonData.data;
    return data;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}: ${error}`);
    return null;
  }
}

export const fetchArrayBuffer = async (endpoint: string): Promise<any> => {
  try {
    const response = await fetch(endpoint);
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}: ${error}`);
    return null;
  }
}
