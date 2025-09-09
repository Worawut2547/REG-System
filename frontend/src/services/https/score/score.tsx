import axios from "axios";
import { type ScoreInterface } from "../../../interfaces/Score";
import { apiUrl } from "../../api";

export const getScoreByStudentID = async () => {
    try {
        const username = localStorage.getItem("username");
        const response = await axios.get(`${apiUrl}/students/${username}/scores`);
        console.log("api score student data:", response.data);
        return response.data
    }
    catch (error) {
        console.error("Error fetching scores data:", error);
        throw error;
    }
}

export const createScoreStudent = async (data: ScoreInterface[]) => {
    try {
        const response = await axios.post(`${apiUrl}/teachers/scores`,data);
        return response.status
    }
    catch (error) {
        console.error("Error create scores data:", error);
        throw error;
    }
}