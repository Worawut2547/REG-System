import { type StudentInterface } from "../../../interfaces/Student";

import { api } from "../api";


export const getNameStudent = async (username: string) => {
    //console.log("Fetching student data for:", username);
    if (!username) {
        throw new Error("Username is required");
    }
    try {
        const response = await api.get(`/students/${username}`);
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
        const response = await api.get(`/students/`)
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
        const response = await api.post(`/students/`, data);
        return response.data;
    }
    catch (error) {
        console.error("Error creating student:", error);
        throw error;
    }
}

export const updateStudentProfile = async (data: StudentInterface): Promise<StudentInterface> => {
    const username = localStorage.getItem("username");
    console.log("api edit profile student:", data);
    try {
        const response = await api.put(`/students/${username}`, data);
        return response.data
    }
    catch (error) {
        console.error("Error edit student:", error);
        throw error;
    }
}

export const deleteStudent = async (sid: string) => {
    try {
        const response = await api.delete(`/students/${sid}`);
        return response
    }
    catch (error) {
        console.error("Error delete student:", error);
        throw error;
    }
}