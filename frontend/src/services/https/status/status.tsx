import { type StatusStudentInterface } from "../../../interfaces/StatusStudent";

import { api } from "../api";

export const getStatusStudentAll = async (): Promise<StatusStudentInterface[]> => {
    //console.log("Fetching student data for:", username);
    try{
        const response = await api.get(`/statuses`)
        console.log("api status data:", response);

        return response.data;
    }
    catch(error){
        console.error("Error fetching status data:", error);
        throw error;
    }
};