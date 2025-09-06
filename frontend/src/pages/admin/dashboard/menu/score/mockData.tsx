export const mockCourses = [
  { key: 1, code: 'CSE101', name: 'Introduction to Computer Science', category: 'รายวิชาที่เปิดสอน', students: 45, credit: 3, section: 2, department: 'สำนักวิศวกรรมศาสตร์', instructor: 'รศ. ดร. ปรีชา วิศวกร', confirmedBy: 'รศ. ดร. ปรีชา วิศวกร' },
  { key: 2, code: 'MAT201', name: 'Calculus II', category: 'รายวิชาที่เปิดสอน', students: 60, credit: 4, section: 4, department: 'สำนักวิทยาศาสตร์', instructor: 'ผศ. ดร. อมร คำนวณผล', confirmedBy: 'ผศ. ดร. อมร คำนวณผล'},
  { key: 3, code: 'ENG101', name: 'English for Science', category: 'รายวิชาที่เปิดสอน', students: 40, credit: 2, section: 2, department: 'สำนักเทคโนโลยีสังคม', instructor: 'อ. ศิริพร ภาษาไทย', confirmedBy: 'อ. ศิริพร ภาษาไทย' },
];

export const mockStudents: Record<string, any[]> = {
  'CSE101-2': [
    { key: 1, studentId: '60001', firstName: 'สมชาย', lastName: 'ใจดี', score: 100, faculty: 'วิศวกรรมศาสตร์', major: 'คอมพิวเตอร์' },
    { key: 2, studentId: '60002', firstName: 'สมหญิง', lastName: 'แสนดี', score: 99, faculty: 'วิศวกรรมศาสตร์', major: 'คอมพิวเตอร์' },
  ],
  'MAT201-4': [
    { key: 1, studentId: '60101', firstName: 'วิทยา', lastName: 'เก่งคณิต', score: 80, faculty: 'วิทยาศาสตร์', major: 'คณิตศาสตร์' },
  ],
  'ENG101-2': [
    { key: 1, studentId: '60201', firstName: 'เอกชัย', lastName: 'ภาษาอังกฤษ', score: 55, faculty: 'เทคโนโลยีสังคม', major: 'ภาษาอังกฤษ' },
  ],
};
