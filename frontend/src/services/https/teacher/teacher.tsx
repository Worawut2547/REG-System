import axios from "axios";
import { type TeacherInterface } from "../../../interfaces/Teacher";

const apiUrl = "http://localhost:8000";


export const getNameTeacher = async (username: string) => {
    //console.log("Fetching student data for:", username);
    if (!username){
        throw new Error("Username is required");
    }
    try {
        const response = await axios.get(`${apiUrl}/teachers/${username}`);
        return response.data;
    } 
    catch (error) {
        console.error("Error fetching teacher data:", error);
        throw error;
    }
};

export const getTeacherAll = async (): Promise<TeacherInterface[]> => {
    //console.log("Fetching student data for:", username);
    try{
        const response = await axios.get(`${apiUrl}/teachers/`)
        return response.data
    }
    catch(error){
        console.error("Error fetching teacher data:", error);
        throw error;
    }
};

export const createTeacher = async (data: TeacherInterface): Promise<TeacherInterface> => {
    try {
        const responce = await axios.post(`${apiUrl}/teachers/`, data)
        return responce.data
    }
    catch (error) {
        console.error("Error creating teacher:", error);
        throw error;
    }
}