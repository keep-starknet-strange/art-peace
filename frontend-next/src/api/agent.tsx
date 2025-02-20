export const kasarApi = process.env.NEXT_PUBLIC_KASAR_API || "https://art-peace.kasar.io/api";
export const kasarApiKey = process.env.NEXT_PUBLIC_KASAR_API_KEY || "sdklfj-32";

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

export const promptKasar = async (request: string): Promise<any> => {
  try {
    const promptEndpoint = `${kasarApi}/wallet/request`;
    const response = await fetch(promptEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": kasarApiKey,
      },
      body: JSON.stringify({ request }),
    });
    const jsonData = await response.json();
    return jsonData;
  } catch (error) {
    console.error(`Error prompting Kasar: ${error}`);
    return null;
  }
}
