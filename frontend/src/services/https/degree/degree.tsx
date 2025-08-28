import axios from "axios";
import { type DegreeInterface } from "../../../interfaces/Degree";

import { apiUrl } from "../../api";

export const getDegreeAll = async (): Promise<DegreeInterface[]> => {
    try{
        const response = await axios.get(`${apiUrl}/degrees/`)
        console.log("api degree data:", response);

        return response.data;
    }
    catch(error){
        console.error("Error fetching degree data:", error);
        throw error;
    }
};