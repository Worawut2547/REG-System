import axios from "axios";
import { type DegreeInterface } from "../../../interfaces/Degree";

const apiUrl = "http://localhost:8000";

export const getDegreeAll = async (): Promise<DegreeInterface[]> => {
    try{
        const response = await axios.get(`${apiUrl}/degree/all`)
        console.log("api degree data:", response);

        return response.data;
    }
    catch(error){
        console.error("Error fetching degree data:", error);
        throw error;
    }
};