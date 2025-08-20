export interface CurriculumInterface {
    ID?: number,
    CurriculumID?: string,
    CurriculumName?: string,
    TotalCredit?: number,
    StartYear?: number,

    FacultyID?: string;
    FacultyName?: string;

    MajorID?: string;
    MajorName?: string;

    BookID?: number;
    Book?: string;

    Description?: string;
}