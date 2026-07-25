import axios from 'axios';
import API_ENDPOINT from "../Constants/api";

interface UserPayload {
  _id?: string
  username: string;
  email_address: string;
  password: string;
}

export interface RegisteredUserData {
  _id: string;
  username: string;
  email_address: string;
}

export interface RegisteredUserResponse {
  user: RegisteredUserData;
}

export const postRegisterUser = async (user: UserPayload): Promise<RegisteredUserResponse> => {
  try {
    const response = await axios.post(API_ENDPOINT.USER_BASE_URL, user);

    return response.data as RegisteredUserResponse;

  } catch (error: any) {
    console.error("Error registering user:", error.response?.data || error);
    throw error;
  }
};

export const loginUser = async (credentials: { email_address: string; password: string }): Promise<any> => {
  try {
    const response = await axios.post(API_ENDPOINT.LOGIN, credentials, {
      withCredentials: true,
    });
    return response;
  } catch (error: any) {
    // Rethrow so the UI can show why the login failed.
    const message = error.response?.data?.error ?? 'Login failed — please try again';
    throw new Error(message);
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await axios.post(API_ENDPOINT.LOGOUT, null, {
      withCredentials: true,
    });
  } catch (error: any) {
    console.error("Error logging out user:", error.response?.data || error);
  }
};