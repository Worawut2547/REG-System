import axios from "axios";
import { type StudentInterface } from "../../../interfaces/Student";

const apiUrl = "http://localhost:8000";


export const getNameStudent = async (username: string) => {
    //console.log("Fetching student data for:", username);
    if (!username) {
        throw new Error("Username is required");
    }
    try {
        const response = await axios.get(`${apiUrl}/students/${username}`);
        console.log("api student profile", response)
        return response.data;
    }
    catch (error) {
        console.error("Error fetching student data:", error);
        throw error;
    }
};

export const getStudentAll = async (): Promise<StudentInterface[]> => {
    //console.log("Fetching student data for:", username);
    try {
        const response = await axios.get(`${apiUrl}/students/`)
        console.log("api student data:", response);

        return response.data;
    }
    catch (error) {
        console.error("Error fetching student data:", error);
        throw error;
    }
};

export const createStudent = async (data: StudentInterface): Promise<StudentInterface> => {
    try {
        const responce = await axios.post(`${apiUrl}/students/`, data);
        return responce.data;
    }
    catch (error) {
        console.error("Error creating student:", error);
        throw error;
    }
}

export const updateStudentProfile = async (data: StudentInterface): Promise<StudentInterface> => {
    const username = localStorage.getItem("username");
    console.log("api edit profile student:",data);
    try {
        const responce = await axios.put(`${apiUrl}/students/${username}`, data);
        return responce.data
    }
    catch (error) {
        console.error("Error edit student:", error);
        throw error;
    }
}
