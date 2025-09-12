import { type ScoreInterface } from "../../../interfaces/Score";
import { api } from "../api";

export const getScoreByStudentID = async () => {
    try {
        const username = localStorage.getItem("username");
        const response = await api.get(`/students/${username}/scores`);
        return response.data
    }
    catch (error) {
        console.error("Error fetching scores data:", error);
        throw error;
    }
}

export const createScoreStudent = async (data: ScoreInterface[]) => {
    try {
        const response = await api.post(`/teachers/scores`,data);
        return response.status
    }
    catch (error) {
        console.error("Error create scores data:", error);
        throw error;
    }
}