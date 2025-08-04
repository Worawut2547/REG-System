import axios from "axios";

const apiUrl = "http://localhost:8080";

const GetStudents = async () => {
    try {
        const response = await axios.get(`${apiUrl}/students/`);
        return response.data;
    } catch (error) {
        console.error("Error fetching student data:", error);
        throw error;
    }
};

export default  GetStudents ;