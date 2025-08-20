import axios from "axios";


const apiUrl = "http://localhost:8000";


export const getNameAdmin = async (username: string) => {
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