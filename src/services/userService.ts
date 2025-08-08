import axios from 'axios';
import API_ENDPOINT from "../Constants/api";

interface UserPayload {
    username: string;
    email_address: string;
    password: string;
  }

export const postRegisterUser = async (user: UserPayload): Promise<any> => {
  try {
    const response = await axios.post(API_ENDPOINT.USER_BASE_URL, user);
    return response.data;
  } catch (error: any) {
    console.error("Error registering user:", error.response?.data || error);
    return null;
  }
};

export const loginUser = async (credentials: { email_address: string; password: string }): Promise<any> => {
  try {
    const response = await axios.post(API_ENDPOINT.LOGIN, credentials, {
      withCredentials: true,
    });
    return response;
  } catch (error: any) {
    console.error("Error logging in user:", error.response?.data || error);
    return null;
  }
};

export const logoutUser = async (): Promise<any> => {
  try {
    const response = await axios.post(API_ENDPOINT.LOGOUT, {}, {
      withCredentials: true,
    });
    return response;
  } catch (error: any) {
    console.error("Error logging out user:", error.response?.data || error);
    return null;
  }
};