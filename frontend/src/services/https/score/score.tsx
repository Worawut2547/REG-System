// // frontend/src/services/http/score/score.tsx
// import axios from "axios";
// import { apiUrl } from "../../api";
// import type { Score } from "../../../interfaces/Score";

// // ---------------------- Types ----------------------
// export type ScoreGrouped = {
//   StudentID: string;
//   SubjectID: string;
//   SubjectName: string;
//   Credit: number;
//   Total: number;
//   [key: string]: string | number; // dynamic property สำหรับแต่ละ List
// };

// // ---------------------- API Calls ----------------------

// // ดึงคะแนนทั้งหมด
// export const getAllScores = async (): Promise<Score[]> => {
//   try {
//     const res = await axios.get<Score[]>(apiUrl);
//     return res.data;
//   } catch (err) {
//     console.error("Error fetching all scores:", err);
//     throw err;
//   }
// };

// // ดึงคะแนนตาม studentID
// export const getScoresByStudentID = async (studentID: string): Promise<Score[]> => {
//   try {
//     const res = await axios.get<Score[]>(`${apiUrl}/student/${studentID}`);
//     return res.data;
//   } catch (err) {
//     console.error(`Error fetching scores for student ${studentID}:`, err);
//     throw err;
//   }
// };

// // สร้าง/เพิ่มคะแนน
// export const createScores = async (scores: Score[]): Promise<Score[]> => {
//   try {
//     const res = await axios.post<Score[]>(apiUrl, scores);
//     return res.data;
//   } catch (err) {
//     console.error("Error creating scores:", err);
//     throw err;
//   }
// };

// // อัปเดตคะแนน
// export const updateScore = async (score: Score): Promise<void> => {
//   try {
//     await axios.put(apiUrl, score);
//   } catch (err) {
//     console.error("Error updating score:", err);
//     throw err;
//   }
// };

// // ลบคะแนน
// export const deleteScore = async (id: number): Promise<void> => {
//   try {
//     await axios.delete(`${apiUrl}/${id}`);
//   } catch (err) {
//     console.error(`Error deleting score with id ${id}:`, err);
//     throw err;
//   }
// };

// // ---------------------- Helper Function ----------------------

// // แปลง list ของ Score เป็น grouped object สำหรับ table
// export const groupScoresByList = (scores: Score[]): ScoreGrouped[] => {
//   const map: { [key: string]: ScoreGrouped } = {};

//   scores.forEach((s) => {
//     // key แยกทั้ง Student และ Subject เพื่อไม่ให้ overwrite
//     const key = `${s.StudentID}-${s.SubjectID}`;
//     if (!map[key]) {
//       map[key] = {
//         StudentID: s.StudentID,
//         SubjectID: s.SubjectID,
//         SubjectName: s.SubjectName,
//         Credit: s.Credit,
//         Total: s.Score_Total,
//       };
//     }
//     // dynamic property สำหรับแต่ละ List
//     map[key][s.List] = s.Score;
//   });

//   return Object.values(map);
// };
