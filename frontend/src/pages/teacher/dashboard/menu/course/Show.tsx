// ====================================================================
// SHOW.tsx — มุมมองผู้ใช้ (อ่านอย่างเดียว) ของรายการรายวิชา + เวลาเรียน
//  - ปิดการแก้ไข ลบ และการแก้ไขเวลาเรียนทั้งหมด
//  - แสดงข้อมูลอาจารย์/ภาคการศึกษา/เวลาเรียนแบบ read-only
//  - คงการค้นหา + แท็กเวลา + sticky header + scroll x
// ====================================================================

import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Input,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { SearchOutlined } from "@ant-design/icons";

import { type SubjectInterface } from "../../../../../interfaces/Subjects";
import { type SubjectStudyTimeInterface } from "../../../../../interfaces/SubjectsStudyTime";

import { getSubjectAll } from "../../../../../services/https/subject/subjects";
import { getStudyTimesBySubject } from "../../../../../services/https/subjectstudytime/subjectsstudytime";
import { getFacultyAll } from "../../../../../services/https/faculty/faculty";
import { getMajorAll } from "../../../../../services/https/major/major";

// ++ อาจารย์/ภาคการศึกษา
import { getTeacherAll } from "../../../../../services/https/teacher/teacher";
import { getSemestermAll as getSemesterAll } from "../../../../../services/https/semesterm/semesterm"; // <- แก้ path ตามโปรเจ็กต์จริง
import { type TeacherInterface } from "../../../../../interfaces/Teacher";
import { type SemestermInterface } from "../../../../../interfaces/Semesterm";

const { Content } = Layout;

/* ---------- Option types ---------- */
type Faculty = { id: string; name: string };
type Major = { id: string; name: string; facultyId?: string };

type TeacherOpt = {
  id: string;
  firstname: string;
  lastname: string;
  majorId?: string;
};
type SemesterOpt = { id: number; term: string; academicYear: string };

/* ---------- API shapes (multi-case keys) ---------- */
type FacultyAPI = {
  faculty_id?: string;
  facultyId?: string;
  FacultyID?: string;
  id?: string;
  faculty_name?: string;
  facultyName?: string;
  FacultyName?: string;
  name?: string;
};
type MajorAPI = {
  major_id?: string;
  majorId?: string;
  MajorID?: string;
  id?: string;
  major_name?: string;
  majorName?: string;
  MajorName?: string;
  name?: string;
  faculty_id?: string;
  facultyId?: string;
  FacultyID?: string;
};
type SubjectTimeAPI = {
  start?: string;
  start_time?: string;
  StartAt?: string;
  end?: string;
  end_time?: string;
  EndAt?: string;
};

// ++ ขยาย SubjectAPI ให้รองรับ teacher/semester + term/year
type SubjectAPI = {
  subject_id?: string;
  subjectId?: string;
  SubjectID?: string;
  id?: string;
  subject_name?: string;
  subjectName?: string;
  SubjectName?: string;
  name?: string;
  credit?: number | string;
  Credit?: number | string;

  major_id?: string;
  majorId?: string;
  MajorID?: string;
  major_name?: string;
  majorName?: string;
  MajorName?: string;

  faculty_id?: string;
  facultyId?: string;
  FacultyID?: string;
  faculty_name?: string;
  facultyName?: string;
  FacultyName?: string;

  teacher_id?: string | number;
  teacherId?: string | number;
  TeacherID?: string | number;

  semester_id?: string | number;
  semesterId?: string | number;
  SemesterID?: string | number;

  term?: string;
  Term?: string;
  academic_year?: string;
  AcademicYear?: string;
  academicYear?: string;

  study_times?: SubjectTimeAPI[];
  schedule?: SubjectTimeAPI[];
};

/* ---------- Row type used by Table ---------- */
interface SubjectRow extends SubjectInterface {
  schedule: SubjectStudyTimeInterface[];
  formattedSchedule?: string[];
}

/* ---------- utils ---------- */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
const toStr = (v: string | number | undefined | null): string =>
  v == null ? "" : String(v);
const toNum = (v: string | number | undefined | null): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const SHOW: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [teachers, setTeachers] = useState<TeacherOpt[]>([]);
  const [semesters, setSemesters] = useState<SemesterOpt[]>([]);

  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  const [query, setQuery] = useState<string>("");

  /* ---------- fetch faculties ---------- */
  const fetchFaculties = async () => {
    try {
      setLoadingFaculties(true);
      const data = await getFacultyAll();
      const arr = (Array.isArray(data) ? data : []) as FacultyAPI[];
      setFaculties(
        arr.map((f) => ({
          id: f.faculty_id ?? f.facultyId ?? f.FacultyID ?? f.id ?? "",
          name:
            f.faculty_name ?? f.facultyName ?? f.FacultyName ?? f.name ?? "",
        }))
      );
    } catch (e) {
      console.error("fetchFaculties error:", e);
      message.error("โหลดรายชื่อคณะไม่สำเร็จ");
    } finally {
      setLoadingFaculties(false);
    }
  };

  /* ---------- fetch majors ---------- */
  const fetchMajors = async () => {
    try {
      setLoadingMajors(true);
      const data = await getMajorAll();
      const arr = (Array.isArray(data) ? data : []) as MajorAPI[];
      setMajors(
        arr.map((m) => ({
          id: m.major_id ?? m.majorId ?? m.MajorID ?? m.id ?? "",
          name: m.major_name ?? m.majorName ?? m.MajorName ?? m.name ?? "",
          facultyId: m.faculty_id ?? m.facultyId ?? m.FacultyID ?? "",
        }))
      );
    } catch (e) {
      console.error("fetchMajors error:", e);
      message.error("โหลดรายชื่อสาขาไม่สำเร็จ");
    } finally {
      setLoadingMajors(false);
    }
  };

  // ++ fetch teachers
  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const data = await getTeacherAll();
      const arr: TeacherInterface[] = Array.isArray(data) ? data : [];
      setTeachers(
        arr.map((t) => ({
          id: toStr(t.TeacherID),
          firstname: t.FirstName ?? "",
          lastname: t.LastName ?? "",
          majorId: t.MajorID ?? "",
        }))
      );
    } catch (e) {
      console.error("fetchTeachers error:", e);
      message.error("โหลดรายชื่ออาจารย์ไม่สำเร็จ");
    } finally {
      setLoadingTeachers(false);
    }
  };

  // ++ fetch semesters (id เป็น number)
  const fetchSemesters = async () => {
    try {
      setLoadingSemesters(true);
      const data = await getSemesterAll();
      const arr: SemestermInterface[] = Array.isArray(data) ? data : [];
      const mapped = arr
        .map((s) => ({
          id:
            typeof s.SemesterID === "number"
              ? s.SemesterID
              : Number(s.SemesterID),
          term: s.Term ?? "",
          academicYear: s.AcademicYear ?? "",
        }))
        .filter((x) => Number.isFinite(x.id));
      const uniq = Array.from(new Map(mapped.map((m) => [m.id, m])).values());
      setSemesters(uniq);
    } catch (e) {
      console.error("fetchSemesters error:", e);
      message.error("โหลดภาคการศึกษาไม่สำเร็จ");
    } finally {
      setLoadingSemesters(false);
    }
  };

  /* ---------- fetch subjects + times ---------- */
  const fetchSubjects = async () => {
    try {
      const data = await getSubjectAll();
      const arr = (Array.isArray(data) ? data : []) as SubjectAPI[];

      const base: SubjectRow[] = arr.map((s) => ({
        SubjectID: s.subject_id ?? s.subjectId ?? s.SubjectID ?? s.id ?? "",
        SubjectName:
          s.subject_name ?? s.subjectName ?? s.SubjectName ?? s.name ?? "",
        Credit: Number(s.credit ?? s.Credit ?? 0),

        FacultyID: s.faculty_id ?? s.facultyId ?? s.FacultyID ?? "",
        FacultyName: s.faculty_name ?? s.facultyName ?? s.FacultyName,

        MajorID: s.major_id ?? s.majorId ?? s.MajorID ?? "",
        MajorName: s.major_name ?? s.majorName ?? s.MajorName,

        // ++ teacher, semester, term/year
        TeacherID: toStr(s.teacher_id ?? s.teacherId ?? s.TeacherID ?? ""),
        SemesterID: toNum(s.semester_id ?? s.semesterId ?? s.SemesterID),
        Term: s.term ?? s.Term ?? "",
        AcademicYear: s.academic_year ?? s.academicYear ?? s.AcademicYear ?? "",

        schedule: [],
        formattedSchedule: [],
      }));

      const withTimes: SubjectRow[] = await Promise.all(
        base.map(async (row) => {
          const sid = row.SubjectID?.trim();
          if (!sid) return row;
          try {
            const times = await getStudyTimesBySubject(sid);
            const formatted = times.map((t) => {
              const st = dayjs(t.StartAt, "YYYY-MM-DD HH:mm");
              const en = dayjs(t.EndAt, "YYYY-MM-DD HH:mm");
              return `${st.format("dddd HH:mm")} - ${en.format("dddd HH:mm")}`;
            });
            return { ...row, schedule: times, formattedSchedule: formatted };
          } catch (err) {
            console.warn("[fetchSubjects] getStudyTimesBySubject error:", err);
            return row;
          }
        })
      );

      setSubjects(withTimes);
    } catch (e) {
      console.error("fetchSubjects error:", e);
      message.error("โหลดข้อมูลรายวิชาไม่สำเร็จ");
    }
  };

  useEffect(() => {
    fetchFaculties();
    fetchMajors();
    fetchTeachers();
    fetchSemesters();
    fetchSubjects();
  }, []);

  /* ---------- search ---------- */
  const tableRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter((s) =>
      [
        s.SubjectName ?? "",
        s.SubjectID ?? "",
        s.FacultyName ?? "",
        s.MajorName ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [subjects, query]);

  /* ---------- Read-only columns ---------- */
  const columns: ColumnsType<SubjectRow> = [
    {
      title: "รหัสวิชา",
      dataIndex: "SubjectID",
      width: "10%",
    },
    {
      title: "ชื่อรายวิชา",
      dataIndex: "SubjectName",
      width: "20%",
    },
    {
      title: "หน่วยกิต",
      dataIndex: "Credit",
      width: 110,
      render: (val: number | string | undefined) => (
        <span>{Number(val ?? 0)}</span>
      ),
    },
    {
      title: "คณะ",
      dataIndex: "FacultyName",
      width: 160,
      render: (_: unknown, row: SubjectRow) =>
        row.FacultyName ??
        (faculties.find((f) => f.id === row.FacultyID)?.name || ""),
    },
    {
      title: "สาขา",
      dataIndex: "MajorName",
      width: 200,
      render: (_: unknown, row: SubjectRow) =>
        row.MajorName ?? (majors.find((m) => m.id === row.MajorID)?.name || ""),
    },
    {
      title: "อาจารย์",
      dataIndex: "TeacherID",
      width: 200,
      render: (_: unknown, row: SubjectRow) => {
        const t = teachers.find((tt) => String(tt.id) === String(row.TeacherID));
        return t ? `${t.firstname} ${t.lastname}`.trim() : "-";
      },
    },
    {
      title: "ภาคการศึกษา",
      dataIndex: "SemesterID",
      width: 200,
      render: (_: unknown, row: SubjectRow) => {
        const s = semesters.find((ss) => ss.id === (row.SemesterID as number));
        const term = row.Term || s?.term;
        const year = row.AcademicYear || s?.academicYear;
        return term && year ? `${term}/${year}` : "-";
      },
    },
    {
      title: "เวลาเรียน",
      dataIndex: "formattedSchedule",
      width: 320,
      render: (formatted?: string[]) => {
        const list = Array.isArray(formatted) ? formatted : [];
        const groups = chunk(list, 5);
        return (
          <div>
            {groups.length === 0 ? (
              <span>-</span>
            ) : (
              groups.map((g, gi) => (
                <div key={gi} style={{ marginBottom: 4 }}>
                  {g.map((txt, i) => (
                    <Tag key={`${gi}-${i}`} style={{ marginBottom: 4 }}>
                      {txt}
                    </Tag>
                  ))}
                </div>
              ))
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: 24 }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          ค้นหารายวิชา
        </Typography.Title>

        {/* Search */}
        <Input
          placeholder="ค้นหา: รหัสวิชา / ชื่อวิชา / คณะ / สาขา"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginBottom: 16, width: 420, height: 40, fontSize: 16 }}
          prefix={<SearchOutlined />}
          allowClear
        />

        {/* Table — read-only */}
        <Table<SubjectRow>
          dataSource={tableRows}
          columns={columns}
          rowKey="SubjectID"
          loading={
            loadingFaculties || loadingMajors || loadingTeachers || loadingSemesters
          }
          className="custom-table-header"
          rowClassName={(_rec, i) =>
            i % 2 === 0 ? "table-row-light" : "table-row-dark"
          }
        //   sticky
        //   scroll={{ x: "max-content" }} // หัว-ตัวเลื่อนตรงกัน
        //   tableLayout="auto" // กว้างตามเนื้อหา
        />

        {/* C — Table styles */}
        <style>{`
          /* สีเส้นกริด */
          :root { --grid-color: #f0e9e9ff; }

          .table-row-light { background-color: #ffffffff; }
          .table-row-dark  { background-color: #ffffffff; }

          .custom-table-header .ant-table-thead > tr > th {
            background: #2e236c; color: #fff; font-weight: bold; font-size: 16px;
            border-bottom: 1px solid var(--grid-color) !important;
            border-right: 1px solid var(--grid-color) !important;
          }
          .custom-table-header .ant-table-tbody > tr > td {
            border-bottom: 1px solid var(--grid-color) !important;
            border-right: 1px solid var(--grid-color) !important;
          }

          /* ปิดเส้นขาว (split line) ของหัวตาราง */
          .custom-table-header .ant-table-thead > tr > th::before {
            background: transparent !important;
            width: 0 !important;
          }
          .custom-table-header .ant-table-sticky-holder .ant-table-thead > tr > th::before {
            background: transparent !important;
            width: 0 !important;
          }
          .custom-table-header .ant-table-thead > tr > th::after {
            display: none !important;
          }

          /* AntD v5: ตัวแปรสี split line ให้โปร่งใส */
          .custom-table-header .ant-table {
            --ant-table-header-column-split-color: transparent;
          }
        `}</style>
      </Content>
    </Layout>
  );
};

export default SHOW;
