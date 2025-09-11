import { type TeacherInterface } from "../../../interfaces/Teacher";

import { api } from "../api";


export const getNameTeacher = async (username: string): Promise<TeacherInterface> => {
    //console.log("Fetching student data for:", username);
    if (!username) {
        throw new Error("Username is required");
    }
    try {
        const response = await api.get(`/teachers/${username}`);
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
        const response = await api.get(`/teachers/`)
        return response.data
    }
    catch (error) {
        console.error("Error fetching teacher data:", error);
        throw error;
    }
};

export const createTeacher = async (data: TeacherInterface): Promise<TeacherInterface> => {
    try {
        const response = await api.post(`/teachers/`, data)
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
        const response = await api.put(`/tachers/${username}`, data)
        return response.data
    }
    catch (error) {
        console.error("Error editing teacher:", error);
        throw error;
    }
}

export const deleteTeacher = async (tid: string) => {
    try {
        const response = await api.delete(`/teachers/${tid}`)
        return response
    }
    catch (error) {
        console.error("Error delete teacher:", error);
        throw error;
    }
}

export const getSubjectByTeacherID = async() => {
    try{
        const tid = localStorage.getItem("username");
        const response = await api.get(`/teachers/${tid}/subjects`);
        console.log("api subject teacher:",response);
        return response.data
    }
    catch (error) {
        console.error("Error get subject teacher:", error);
        throw error;
    }
}