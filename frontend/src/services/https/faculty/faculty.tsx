import { type FacultyInterface } from "../../../interfaces/Faculty";

import { api } from "../api";

export const getFacultyAll = async (): Promise<FacultyInterface[]> => {
    try{
        const response = await api.get(`/faculties/`)

        return response.data;
    }
    catch(error){
        console.error("Error fetching faculty data:", error);
        throw error;
    }
};