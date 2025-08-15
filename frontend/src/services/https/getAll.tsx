import axios from "axios";
import { type StudentInterface } from "../../interfaces/Student";
import type { TeacherInterface } from "../../interfaces/Teacher";

const apiUrl = "http://localhost:8000";

export const getStudentAll = async (): Promise<StudentInterface[]> => {
    //console.log("Fetching student data for:", username);
    try{
        const response = await axios.get(`${apiUrl}/student/all`)
        console.log("api student data:", response);

        return response.data;
    }
    catch(error){
        console.error("Error fetching student data:", error);
        throw error;
    }
};

export const getTeacherAll = async (): Promise<TeacherInterface[]> => {
    //console.log("Fetching student data for:", username);
    try{
        const response = await axios.get(`${apiUrl}/teacher/all`)
        return response.data
    }
    catch(error){
        console.error("Error fetching teacher data:", error);
        throw error;
    }
};