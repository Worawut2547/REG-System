import { type GenderInterface } from "../../../interfaces/Gender"


import { api } from "../api";

export const getGenderAll = async (): Promise<GenderInterface[]> => {
    try {
        const responce = await api.get(`/genders/`);
        console.log("api gender data:", responce);
        return responce.data
    }
    catch (error) {
        console.error("Error fetching gender data:", error);
        throw error;
    }
}