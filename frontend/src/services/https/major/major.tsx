import axios from "axios";
import { type MajorInterface } from "../../../interfaces/Major";

const apiUrl = "http://localhost:8000";

export const getMajorAll = async (): Promise<MajorInterface[]> => {
    //console.log("Fetching student data for:", username);
    try{
        const response = await axios.get(`${apiUrl}/majors/`);
        console.log("api major data:", response);

        return response.data;
    }
    catch(error){
        console.error("Error fetching major data:", error);
        throw error;
    }
};