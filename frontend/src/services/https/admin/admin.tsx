import { api } from "../api";
import type { AdminInterface } from "../../../interfaces/Admin";


export const getNameAdmin = async (username: string): Promise<AdminInterface> => {
    //console.log("Fetching student data for:", username);
    if (!username){
        throw new Error("Username is required");
    }
    try {
        const response = await api.get(`/admin/${username}`);
        return response.data;
    } 
    catch (error) {
        console.error("Error fetching admin data:", error);
        throw error;
    }
};