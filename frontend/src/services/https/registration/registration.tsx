import axios from "axios";

import { apiUrl } from "../../api";

interface RegistrationStudentInterface {
    StudentID: string;
    FirstName: string;
    LastName: string;
    MajorName: string;
    FacultyName: string;
    SubjectID?: string;
}

export const getStudentBySubjectID = async (subj_id: string) => {
    try {
        const response = await axios.get(`${apiUrl}/registrations/subjects/${subj_id}`);
        console.log("api get student by subject id",response);
        return response
    }
    catch (error) {
        console.error("Error fetching get student by subject id:", error);
        throw error;
    }
}