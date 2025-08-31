// src/services/https/SubjectCurriculum/subjectcurriculum.ts
import axios from "axios";
import { apiUrl } from "../../api";

export interface SubjectCurriculumInterface {
  SubjectID: string;
  CurriculumID: string; // ⬅️ ถ้าใช้ major ให้เปลี่ยนชื่อเป็น MajorID และแก้ payload/params ด้านล่าง
}

export interface CreateSubjectCurriculumDTO {
  SubjectID: string;
  CurriculumID: string; // ⬅️ ถ้าใช้ major ให้ใช้ MajorID แทน
}

type CreateSCResponseV2 = { data: SubjectCurriculumInterface; created: boolean };
type CreateSCUnified = { data: SubjectCurriculumInterface; created: boolean };

function isV2(body: unknown): body is CreateSCResponseV2 {
  return (
    typeof body === "object" &&
    body !== null &&
    "data" in body &&
    "created" in body
  );
}

/** GET /subject-curriculums/ */
export const getSubjectCurriculumAll = async (): Promise<
  SubjectCurriculumInterface[]
> => {
  const res = await axios.get<SubjectCurriculumInterface[]>(
    `${apiUrl}/subject-curriculums/`
  );
  return res.data;
};

/** POST /subject-curriculums/ */
export const createSubjectCurriculum = async (
  data: CreateSubjectCurriculumDTO
): Promise<CreateSCUnified> => {
  const payload = {
    subject_id: data.SubjectID,
    curriculum_id: data.CurriculumID, // ⬅️ ถ้าใช้ major: major_id: data.MajorID
  } as const;

  const res = await axios.post<CreateSCResponseV2 | SubjectCurriculumInterface>(
    `${apiUrl}/subject-curriculums/`,
    payload
  );
  const body = res.data;

  if (isV2(body)) return { data: body.data, created: body.created };
  // ถ้า BE ส่ง object เดี่ยวกลับมา
  return { data: body as SubjectCurriculumInterface, created: true };
};

/** DELETE /subject-curriculums?curriculum_id=...&subject_id=... */
export const deleteSubjectCurriculumByPair = async (args: {
  curriculumId: string; // ⬅️ ถ้าใช้ major: majorId
  subjectId: string;
}): Promise<void> => {
  await axios.delete(`${apiUrl}/subject-curriculums`, {
    params: {
      curriculum_id: args.curriculumId, // ⬅️ ถ้าใช้ major: major_id: args.majorId
      subject_id: args.subjectId,
    },
  });
};
