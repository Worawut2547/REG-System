import axios from "axios";
import { apiUrl } from "../api";

export const resetPassword = async (data: { Username: string; NewPassword: string }) => {
    console.log("api change password", data);
    try {
        const response = await axios.put(`${apiUrl}/users/reset/`, data);
        return response.data
    }
    catch (error) {
        console.error("Error reset password:", error);
        throw error;
    }
}


export const changePassword = async (data: { OldPassword: string; NewPassword: string }) => {
    const username = localStorage.getItem("username");
    try {
        const response = await axios.put(`${apiUrl}/users/${username}`, data)
        return response.data
    }
    catch (error) {
        console.error("Error change password:", error);
        throw error;
    }
}