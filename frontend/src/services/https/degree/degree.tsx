import { type DegreeInterface } from "../../../interfaces/Degree";

import { api } from "../api";

export const getDegreeAll = async (): Promise<DegreeInterface[]> => {
    try{
        const response = await api.get(`/degrees/`);

        return response.data;
    }
    catch(error){
        console.error("Error fetching degree data:", error);
        throw error;
    }
};