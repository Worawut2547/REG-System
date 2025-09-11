export interface RegistrationInterface {
  ID?: number;             // Primary key (auto increment)
  RegistrationID?: string; // e.g., "REG001"

  Date?: string;           // ISO string (time of registration)
  SubjectID?: string;      // FK to Subject
  SemesterID?: number;      // FK to Semester
  StudentID?: string;      // FK to Student
}
