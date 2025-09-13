import { api } from "../api"; // ใช้ instance เดิม ยิง BE ทุกตัว

export interface SubjectCurriculumInterface {
  SubjectID: string;
  CurriculumID: string; // ถ้าใช้ major ให้เปลี่ยนชื่อเป็น MajorID และแก้ payload/params ด้านล่าง
  // โครงสร้างฝั่ง UI เก็บแบบ PascalCase — เดี๋ยวค่อย map เป็น snake ตอนยิง
}

export interface CreateSubjectCurriculumDTO {
  SubjectID: string;
  CurriculumID: string; // ถ้าใช้ major ให้ใช้ MajorID แทน
  // ฟอร์มฝั่งหน้า: ส่งแค่คีย์หลักพอ ที่เหลือ BE จัดการความถูกต้อง
}

type CreateSCResponseV2 = { data: SubjectCurriculumInterface; created: boolean };
type CreateSCUnified = { data: SubjectCurriculumInterface; created: boolean };

// type-guard: เช็คว่าตอบแบบ v2 ไหม (มี data + created)
function isV2(body: unknown): body is CreateSCResponseV2 {
  return (
    typeof body === "object" &&
    body !== null &&
    "data" in body &&
    "created" in body
  );
}

/** GET /subject-curriculums/ */
// ดึง mapping วิชา และ หลักสูตร ทั้งหมด เอาไป build index ฝั่ง UI
export const getSubjectCurriculumAll = async (): Promise<
  SubjectCurriculumInterface[]
> => {
  const res = await api.get<SubjectCurriculumInterface[]>(
    `/subject-curriculums/`
  ); 
  return res.data; // ส่งดิบ ๆ ให้คนเรียกไป normalize เองถ้าจำเป็น
};

/** POST /subject-curriculums/ */
// สร้างความสัมพันธ์ 1 รายการ — map เป็น snake แล้วค่อยยิง
export const createSubjectCurriculum = async (
  data: CreateSubjectCurriculumDTO
): Promise<CreateSCUnified> => {
  const payload = {
    subject_id: data.SubjectID,          // ตรงนี้แปลงคีย์ให้ BE อ่านออก
    curriculum_id: data.CurriculumID,    // ถ้าใช้ major: major_id: data.MajorID
  } as const;

  const res = await api.post<CreateSCResponseV2 | SubjectCurriculumInterface>(
    `/subject-curriculums/`,
    payload
  ); // BE อาจตอบ 2 รูปแบบ
  const body = res.data;

  if (isV2(body)) return { data: body.data, created: body.created }; // โหมด v2: มี created flag ให้ใช้เลย
  // ถ้า BE ส่ง object เดี่ยวกลับมา
  return { data: body as SubjectCurriculumInterface, created: true }; // สมมติว่าเพิ่งสร้างใหม่
};


// ลบด้วยคู่ composite key ผ่าน query params ให้หลังบ้านรู้ว่าจะลบแถวไหน
export const deleteSubjectCurriculumByPair = async (args: {
  curriculumId: string; 
  subjectId: string;
}): Promise<void> => {
  await api.delete(`/subject-curriculums/`, {
    params: {
      curriculum_id: args.curriculumId, 
      subject_id: args.subjectId,
    },

  }); // ถ้า 204/200 ก็จบ ไม่ต้อง map อะไรต่อ
};

