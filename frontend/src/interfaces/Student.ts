export interface StudentInterface {
    ID?: number;
    StudentID: string;
    FirstName: string;
    LastName: string;
    CitizenID: string;

    Email?: string;
    Phone?: string;

    Gender?: string;

    DegreeID?: number;
    Degree?: string;

    CurriculumID?: string;
    CurriculumName?: string;

    FacultyID?: string;
    FacultyName?: string;

    MajorID?: string;
    MajorName?: string;

    StatusStudentID?: string;
    StatusStudent?: string;

    Address?: string;
    Nationality?: string;
    Ethnicity?: string;
    Religion?: string;
    BirthDay?: string;
    Parent?: string;

    GPAX?: number;

    RejectReason?:string;
}