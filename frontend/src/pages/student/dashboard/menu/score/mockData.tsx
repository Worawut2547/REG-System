// src/pages/dashboard/menu/studentScore/mockData.tsx

export type Score = {
  evaluation: string;
  total: number | string;
  point: number | string;
  cal: number | string;
  net: number | string;
};

export type CourseData = {
  course: string;
  scores: Score[];
  summary: { total: number; net: number };
};

export type BackendData = Record<string, CourseData[]>;

const mockData: BackendData = {
  "2567-1": [
    {
      course: "ENG23 3001: COMPUTER NETWORK",
      scores: [
        { evaluation: "Lab", total: 10, point: 10, cal: "10 X 1->(10%)", net: 10 },
        { evaluation: "Midterm", total: 30, point: 27, cal: "27 X 1->(30%)", net: 27 },
      ],
      summary: { total: 40, net: 37 },
    },
    {
      course: "ENG23 4010: MACHINE LEARNING",
      scores: [
        { evaluation: "Project", total: 20, point: 18, cal: "18 X 1->(20%)", net: 18 },
        { evaluation: "Final", total: 30, point: 27, cal: "27 X 1->(30%)", net: 27 },
      ],
      summary: { total: 50, net: 45 },
    },
  ],
  "2567-2": [
    {
      course: "ENG23 3010: SOFTWARE ENGINEERING",
      scores: [
        { evaluation: "Assignment", total: 15, point: 14, cal: "14 X 1->(15%)", net: 14 },
        { evaluation: "Final", total: 35, point: 32, cal: "32 X 1->(35%)", net: 32 },
      ],
      summary: { total: 50, net: 46 },
    },
  ],
  "2567-3": [
    {
      course: "ENG23 3020: OPERATING SYSTEM",
      scores: [
        { evaluation: "Quiz", total: 10, point: 9, cal: "9 X 1->(10%)", net: 9 },
        { evaluation: "Midterm", total: 25, point: 23, cal: "23 X 1->(25%)", net: 23 },
      ],
      summary: { total: 35, net: 32 },
    },
  ],
  "2568-1": [
    {
      course: "ENG23 4001: ARTIFICIAL INTELLIGENCE",
      scores: [
        { evaluation: "Assignment", total: 10, point: 9, cal: "9 X 1->(10%)", net: 9 },
        { evaluation: "Midterm", total: 25, point: 23, cal: "23 X 1->(25%)", net: 23 },
      ],
      summary: { total: 35, net: 32 },
    },
  ],
};

export default mockData;
