import axios from "axios";
import { type TeacherInterface } from "../../../interfaces/Teacher";

import { apiUrl } from "../../api";


export const getNameTeacher = async (username: string) => {
    //console.log("Fetching student data for:", username);
    if (!username) {
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
    try {
        const response = await axios.get(`${apiUrl}/teachers/`)
        return response.data
    }
    catch (error) {
        console.error("Error fetching teacher data:", error);
        throw error;
    }
};

export const createTeacher = async (data: TeacherInterface): Promise<TeacherInterface> => {
    try {
        const response = await axios.post(`${apiUrl}/teachers/`, data)
        return response.data
    }
    catch (error) {
        console.error("Error creating teacher:", error);
        throw error;
    }
}

export const updateTeacherProfile = async (data: TeacherInterface): Promise<TeacherInterface> => {
    const username = localStorage.getItem("username");
    console.log("api edit profile teacher:", data);
    try {
        const response = await axios.put(`${apiUrl}/teachers/${username}`, data)
        return response.data
    }
    catch (error) {
        console.error("Error editing teacher:", error);
        throw error;
    }
}

export const deleteTeacher = async (tid: string) => {
    try {
        const response = await axios.delete(`${apiUrl}/teachers/${tid}`)
        return response
    }
    catch (error) {
        console.error("Error delete student:", error);
        throw error;
    }
}