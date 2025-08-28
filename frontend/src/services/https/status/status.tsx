import axios from "axios";
import { type StatusStudentInterface } from "../../../interfaces/StatusStudent";

import { apiUrl } from "../../api";

export const getStatusStudentAll = async (): Promise<StatusStudentInterface[]> => {
    //console.log("Fetching student data for:", username);
    try{
        const response = await axios.get(`${apiUrl}/statuses`)
        console.log("api status data:", response);

        return response.data;
    }
    catch(error){
        console.error("Error fetching status data:", error);
        throw error;
    }
};