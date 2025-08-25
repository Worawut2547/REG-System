
export interface SubjectInterface {
    ID?: number;                // Primary Key
    SubjectID?: string;         // รหัสวิชา เช่น "CS101"
    SubjectName?: string;       // ชื่อวิชา เช่น "Computer Programming"
    Credit?: number;            // หน่วยกิต
    
    MajorID?: string;           // รหัสสาขาวิชา
    MajorName?: string;         // ชื่อสาขา

    FacultyID?: string;           // รหัสสาขาวิชา
    FacultyName?: string;         // ชื่อสาขา

}
