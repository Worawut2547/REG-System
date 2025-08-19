import axios from "axios";
import { type GenderInterface } from "../../../interfaces/Gender"


const apiUrl = "http://localhost:8000";

export const getGenderAll = async (): Promise<GenderInterface[]> => {
    try {
        const responce = await axios.get(`${apiUrl}/genders`);
        console.log("api gender data:", responce);
        return responce.data
    }
    catch (error) {
        console.error("Error fetching gender data:", error);
        throw error;
    }
}