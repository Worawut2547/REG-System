import axios from "axios";
import { type FacultyInterface } from "../../../interfaces/Faculty";

import { apiUrl } from "../../api";

export const getFacultyAll = async (): Promise<FacultyInterface[]> => {
    //console.log("Fetching student data for:", username);
    try{
        const response = await axios.get(`${apiUrl}/faculties/`)
        console.log("api faculty data:", response);

        return response.data;
    }
    catch(error){
        console.error("Error fetching faculty data:", error);
        throw error;
    }
};