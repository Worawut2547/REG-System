import { api } from "../api";
import type { GradeStudentInterface } from "../../../interfaces/Grade";

export const getGradeStudent = async () => {
    try {
        const username = localStorage.getItem("username")
        const response = await api.get(`/students/${username}/grades`);
        return response.data
    }
    catch (error) {
        console.error("Error fetching grade data:", error);
        throw error;
    }
}

export const createGradeStudent = async (data: GradeStudentInterface[]) => {
    try {
        console.log("add grades student",data)
        const response = await api.post(`/teachers/grades`,data);
        return response.data
    }
    catch (error) {
        console.error("Error create grade data:", error);
        throw error;
    }
}