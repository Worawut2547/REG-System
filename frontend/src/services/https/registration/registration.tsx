import { api } from "../api";

interface RegistrationStudentInterface {
    StudentID: string;
    FirstName: string;
    LastName: string;
    MajorName: string;
    FacultyName: string;
    SubjectID?: string;
}

export const getStudentBySubjectID = async (subj_id: string): Promise<RegistrationStudentInterface[]>  => {
    try {
        const response = await api.get(`/registrations/subjects/${subj_id}`);
        console.log("api get student by subject id",response.data);
        return response.data
    }
    catch (error) {
        console.error("Error fetching get student by subject id:", error);
        throw error;
    }
}