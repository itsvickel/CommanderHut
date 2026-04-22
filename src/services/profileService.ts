
import axios from 'axios';
import API_ENDPOINT from '../Constants/api';

interface ProfilePayload {
    user_id: string,
}

export const postProfile = async (
    data: ProfilePayload
): Promise<ProfilePayload | null> => {
    try {
        const response = await axios.post(API_ENDPOINT.PROFILE_BASE_URL, data);
        return response.data as ProfilePayload;
    } catch (error) {
        console.error("Error adding profile:", error);
        return null;
    }
};

export const getProfile = async (profileId: string) => {
    try {
        const response = await axios.get(API_ENDPOINT.PROFILE_BASE_URL + profileId);
        return response;
    }
    catch {
        console.error("Error getting profile");
    }
}