import axios from "axios";
import { type StudentInterface } from "../../interfaces/Student";

const apiUrl = "http://localhost:8000";

export const createStudent = async(data: StudentInterface): Promise<StudentInterface> => {
    try{
        const responce = await axios.post(`${apiUrl}/student/create`, data);
        return responce.data;
    }
    catch(error){
        console.error("Error creating student:", error);
        throw error;
    }
}