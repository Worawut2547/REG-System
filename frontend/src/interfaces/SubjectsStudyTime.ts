export interface SubjectStudyTimeInterface {
    ID?: number;          // Primary Key (auto increment)
    SubjectID?: string;   // FK ไปยังรายวิชา
    
    StartAt?: string;     // เวลาเริ่มเรียน (ISO string หรือ "YYYY-MM-DD HH:mm:ss")
    EndAt?: string;       // เวลาจบเรียน
}
