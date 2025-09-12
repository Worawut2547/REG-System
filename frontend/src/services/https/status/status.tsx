import { type StatusStudentInterface } from "../../../interfaces/StatusStudent";

import { api } from "../api";

export const getStatusStudentAll = async (): Promise<StatusStudentInterface[]> => {
    try{
        const response = await api.get(`/statuses`)
        return response.data;
    }
    catch(error){
        console.error("Error fetching status data:", error);
        throw error;
    }
};