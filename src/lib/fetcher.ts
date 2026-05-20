import axiosInstance from './axios';

/**
 * Reusable typed SWR Fetcher
 * Can be called with a simple string URL (GET) or an array [url, payload] (POST)
 */
export const swrFetcher = async <T = any>(key: string | [string, any]): Promise<T> => {
  if (Array.isArray(key)) {
    const [url, data] = key;
    // Perform a POST request
    const response = await axiosInstance.post<T>(url, data);
    return response.data;
  }
  
  // Perform a standard GET request
  const response = await axiosInstance.get<T>(key);
  return response.data;
};

export default swrFetcher;
