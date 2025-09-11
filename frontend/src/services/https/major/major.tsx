import { type MajorInterface } from "../../../interfaces/Major";

import { api } from "../api";

export const getMajorAll = async (): Promise<MajorInterface[]> => {
    //console.log("Fetching student data for:", username);
    try{
        const response = await api.get(`/majors/`);

        return response.data;
    }
    catch(error){
        console.error("Error fetching major data:", error);
        throw error;
    }
};