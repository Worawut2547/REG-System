import axios from "axios";


import { apiUrl } from "../../api";
import type { AdminInterface } from "../../../interfaces/Admin";


export const getNameAdmin = async (username: string): Promise<AdminInterface> => {
    //console.log("Fetching student data for:", username);
    if (!username){
        throw new Error("Username is required");
    }
    try {
        const response = await axios.get(`${apiUrl}/admin/${username}`);
        return response.data;
    } 
    catch (error) {
        console.error("Error fetching admin data:", error);
        throw error;
    }
};