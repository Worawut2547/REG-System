import axios from "axios";
import { type CurriculumInterface } from "../../../interfaces/Curriculum";

const apiUrl = "http://localhost:8000";

export const getCurriculumAll = async (): Promise<CurriculumInterface[]> => {
    try{
        const response = await axios.get(`${apiUrl}/curriculums/`)
        
        return response.data
    }
    catch(error){
        console.error("Error fetching curriculum data:", error);
        throw error;
    }
}