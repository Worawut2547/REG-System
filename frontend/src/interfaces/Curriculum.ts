export interface CurriculumInterface {
    CurriculumID?: string;       // PK (string id)
    CurriculumName?: string;
    TotalCredit?: number;
    StartYear?: number;
    FacultyID?: string;
    MajorID?: string;
    BookID?: number;             // FK → BookPath.ID (int)
    Description?: string;

    // --- optional preload ---
    FacultyName?: string;
    MajorName?: string;
    BookPath?: string;           // Path ของไฟล์จริง (เช่น /static/curriculums/xxx.pdf)
}
