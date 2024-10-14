import axios, { AxiosResponse } from "axios";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_BASE_URL;

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
      return response.data;
    } else {
      throw new Error(response.data.message || "Unknown error occurred");
    }
  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      toast.success("Logged Out Successfully", {
        autoClose: 1000,
        hideProgressBar: true,
      });

      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } else if (error.response && error.response.status === 422) {
      toast.error(error.response.data.message, {
        autoClose: 1000,
        hideProgressBar: true,
      });
    }
    else {
      console.error("An error occurred", error);
      throw new Error(error.response?.data?.message || "Unknown error occurred");
    }
  }
};
