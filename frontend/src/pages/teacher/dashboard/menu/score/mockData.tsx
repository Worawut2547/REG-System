export type Course = {
  code: string;
  name: string;
  credit: number;
  color: string;
  year: number;
  term: number;
};

export type Student = {
  key: number;
  id: string;
  firstName: string;
  lastName: string;
  [scoreType: string]: number | string; 
};

export const courses: Course[] = [
  { code: "ENG23 3031", name: "System Analysis", credit: 3, color: "#1a1440ff", year: 2568, term: 1 },
  { code: "ENG23 3051", name: "Formal Method", credit: 3, color: "#332771ff", year: 2567, term: 2 },
];

export const mockStudents: Student[] = [
  { key: 1, id: "B6616052", firstName: "นายวรวุฒิ", lastName: "ทัศน์ทอง" },
  { key: 2, id: "B6636987", firstName: "มงกี้", lastName: "ดี ลูฟี่" },
  { key: 3, id: "B6605355", firstName: "ไก่ทอด", lastName: "สมุนไพร" },
  { key: 4, id: "B6603953", firstName: "ปีเตอร์", lastName: "พาร์คเกอร์" },
];

export const fetchStudents = async (courseCode: string): Promise<Student[]> => {
  return mockStudents;
};
