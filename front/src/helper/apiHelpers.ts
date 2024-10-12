import axios, { AxiosResponse } from "axios";

const API_URL = import.meta.env.VITE_BASE_URL;

// Define a generic type for the expected API response
interface ApiResponse<T = any> {
  status: number;
  data: T;
  message?: string;
}

export const apiHelper = async (apiUrl: string, params: Record<string, any>, token: string | null): Promise<any> => {
  try {
    const headers: Record<string, string> = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response: AxiosResponse<ApiResponse> = await axios.post(`${API_URL}/${apiUrl}`, params, {
      headers: headers,
    });

    if (response.statusText === "OK" && response.status === 200) {
      const { status, data, message } = response.data;

      if (status === 2) {
        window.location.href = "/login";
        // localStorage.removeItem("uID");
      } else {
        return data;
      }
    } else {
      throw new Error(response.data.message || "Unknown error occurred");
    }
  } catch (error: any) {
    throw error;
  }
};
