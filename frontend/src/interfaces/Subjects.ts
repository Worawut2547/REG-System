// interfaces/Subjects.ts
export interface SubjectInterface {
  ID?: number;
  SubjectID?: string;
  SubjectName?: string;
  Credit?: number;

  MajorID?: string;
  MajorName?: string;

  FacultyID?: string;
  FacultyName?: string;

  TeacherID?: string;

  // ⬇️ เปลี่ยนเป็น number ให้ตรงกับ Go ที่เป็น int
  SemesterID?: number;

  Term?: string;
  AcademicYear?: string;
}
