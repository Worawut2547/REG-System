// ====================================================================
// AddSubject.tsx — เพิ่ม/แสดงรายวิชา + แสดงช่วงเวลาเรียนจากหลังบ้านจริง
// (ปรับให้ SemesterID เป็น number ในหน้าฟอร์ม + dropdown ภาคการศึกษาใช้ ID จริง)
// ====================================================================

import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Form,
  Input,
  Select,
  Button,
  Typography,
  DatePicker,
  Space,
  Popconfirm,
  Table,
  Tag,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import { type SubjectInterface } from "../../../../../interfaces/Subjects";
import { type SubjectStudyTimeInterface } from "../../../../../interfaces/SubjectsStudyTime";
import { type TeacherInterface } from "../../../../../interfaces/Teacher";

import {
  createSubject,
  getSubjectAll,
} from "../../../../../services/https/subject/subjects";
import {
  addStudyTime,
  getStudyTimesBySubject,
} from "../../../../../services/https/subjectstudytime/subjectsstudytime";
import { getFacultyAll } from "../../../../../services/https/faculty/faculty";
import { getMajorAll } from "../../../../../services/https/major/major";
import { getTeacherAll } from "../../../../../services/https/teacher/teacher";
import { getSemestermAll as getSemesterAll } from "../../../../../services/https/semesterm/semesterm";
//เพิ่มลูกเล่นสักหน่อย
import Swal from "sweetalert2";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

/* -----------------------------------------
 * Types (ภายในไฟล์)
 * ----------------------------------------- */
type Faculty = { id: string; name: string };
type Major = { id: string; name: string; facultyId?: string };

type TeacherOpt = {
  id: string;
  firstname: string;
  lastname: string;
  majorId?: string;
};

type SemesterOpt = {
  id: number; // ⬅ ใช้ number จริง
  term: string;
  academicYear: string;
};

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

/* รองรับคีย์จาก /subjects + แปลง semester/teacher ให้ตรงชนิด */
type SubjectFromService = SubjectInterface & {
  teacher_id?: string | number;
  TeacherID?: string | number;
  teacherId?: string | number;

  semester_id?: string | number;
  SemesterID?: string | number;
  semesterId?: string | number;

  term?: string;
  academic_year?: string;
};

/* แถวในตาราง (Override ให้ SemesterID เป็น number ในหน้า Add นี้) */
type SubjectRow = Omit<SubjectInterface, "SemesterID"> & {
  SemesterID?: number;
  schedule: SubjectStudyTimeInterface[];
  formattedSchedule?: string[];
};

/* ฟอร์มในหน้านี้: Override ให้ SemesterID เป็น number */
type FormValues = Omit<SubjectInterface, "SemesterID"> & {
  SubjectID: string;
  SemesterID?: number;
  schedule: [dayjs.Dayjs, dayjs.Dayjs][];
};

/* -----------------------------------------
 * Utils
 * ----------------------------------------- */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
const toStr = (v: string | number | undefined | null): string =>
  v == null ? "" : String(v);
const toNum = (v: string | number | undefined | null): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/* ====================================================================
 * Component
 * ==================================================================== */
const ADD: React.FC = () => {
  const [form] = Form.useForm<FormValues>();

  // lists
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [teachers, setTeachers] = useState<TeacherOpt[]>([]);
  const [semesters, setSemesters] = useState<SemesterOpt[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);

  // UI state
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // search
  const [query, setQuery] = useState<string>("");

  // watches
  const selectedFacultyId = Form.useWatch("FacultyID", form);
  const selectedMajorId = Form.useWatch("MajorID", form);

  /* -----------------------------------------
   * Fetch: faculties / majors / teachers / semesters / subjects
   * ----------------------------------------- */
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
    } catch (err) {
      console.error("fetchFaculties error:", err);
      message.error("โหลดรายชื่อคณะไม่สำเร็จ");
    } finally {
      setLoadingFaculties(false);
    }
  };

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
    } catch (err) {
      console.error("fetchMajors error:", err);
      message.error("โหลดรายชื่อสาขาไม่สำเร็จ");
    } finally {
      setLoadingMajors(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const data = await getTeacherAll();
      const arr = (Array.isArray(data) ? data : []) as TeacherInterface[];
      setTeachers(
        arr.map((t) => ({
          id: toStr(t.TeacherID),
          firstname: t.FirstName ?? "",
          lastname: t.LastName ?? "",
          majorId: t.MajorID ?? "",
        }))
      );
    } catch (err) {
      console.error("fetchTeachers error:", err);
      message.error("โหลดรายชื่ออาจารย์ไม่สำเร็จ");
    } finally {
      setLoadingTeachers(false);
    }
  };

  /* ทำให้ option ภาคการศึกษา “id เป็น number และไม่ซ้ำ” */
  const fetchSemesters = async () => {
    try {
      setLoadingSemesters(true);
      const data = await getSemesterAll(); // คืน { SemesterID, Term, AcademicYear }[]
      const arr = Array.isArray(data) ? data : [];

      const mapped = arr
        .map((s) => {
          const idNum = toNum(
            (s as { SemesterID?: string | number }).SemesterID
          );
          const term = (s as { Term?: string }).Term ?? "";
          const year = (s as { AcademicYear?: string }).AcademicYear ?? "";
          return idNum !== undefined
            ? { id: idNum, term, academicYear: year }
            : undefined;
        })
        .filter((x): x is SemesterOpt => Boolean(x));

      // dedupe ตาม id
      const uniq = Array.from(new Map(mapped.map((m) => [m.id, m])).values());
      setSemesters(uniq);
    } catch (err) {
      console.error("fetchSemesters error:", err);
      message.error("โหลดภาคการศึกษาไม่สำเร็จ");
    } finally {
      setLoadingSemesters(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await getSubjectAll();
      const arr = (Array.isArray(data) ? data : []) as SubjectFromService[];

      const base: SubjectRow[] = arr.map((s) => {
        // map TeacherID
        const teacherId =
          s.TeacherID ?? s.teacher_id ?? s.teacherId ?? s.TeacherID;

        // map SemesterID -> number
        const semesterRaw =
          s.SemesterID ?? s.semester_id ?? s.semesterId ?? s.SemesterID;
        const semesterNum = toNum(semesterRaw);

        return {
          SubjectID: s.SubjectID ?? "",
          SubjectName: s.SubjectName ?? "",
          Credit: Number(s.Credit ?? 0),

          FacultyID: (s.FacultyID ?? "").toString().trim(),
          FacultyName:
            s.FacultyName && s.FacultyName.trim() !== ""
              ? s.FacultyName
              : undefined,

          MajorID: (s.MajorID ?? "").toString().trim(),
          MajorName:
            s.MajorName && s.MajorName.trim() !== "" ? s.MajorName : undefined,

          TeacherID: toStr(teacherId),

          // เก็บเป็น number ในตาราง
          SemesterID: semesterNum,

          Term: s.Term ?? s.term ?? "",
          AcademicYear: s.AcademicYear ?? s.academic_year ?? "",

          schedule: [],
          formattedSchedule: [],
        };
      });

      const withTimes = await Promise.all(
        base.map(async (row) => {
          const sid = (row.SubjectID ?? "").trim();
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
    } catch (err) {
      console.error("fetchSubjects error:", err);
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

  /* -----------------------------------------
   * Derived: filter + search
   * ----------------------------------------- */
  const filteredMajors = useMemo(() => {
    if (!selectedFacultyId) return majors;
    return majors.filter(
      (m) => !m.facultyId || m.facultyId === selectedFacultyId
    );
  }, [majors, selectedFacultyId]);

  const filteredTeachers = useMemo(() => {
    const chosenMajor = form.getFieldValue("MajorID") as string | undefined;
    const majorKey = chosenMajor ?? selectedMajorId;
    if (!majorKey) return teachers;
    return teachers.filter((t) => !t.majorId || t.majorId === majorKey);
  }, [teachers, selectedMajorId, form]);

  const tableRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter((s) => {
      const teacherLabel = (() => {
        const t = teachers.find((tt) => String(tt.id) === String(s.TeacherID));
        return t ? `${t.firstname} ${t.lastname}`.trim() : "";
      })();
      const fields = [
        s.SubjectName ?? "",
        s.SubjectID ?? "",
        s.FacultyName ?? "",
        s.MajorName ?? "",
        teacherLabel,
      ]
        .join(" ")
        .toLowerCase();
      return fields.includes(q);
    });
  }, [subjects, query, teachers]);

  /* -----------------------------------------
   * Submit
   * ----------------------------------------- */
  const onFinish = async (values: FormValues) => {
    setSubmitting(true);

    // — สร้าง payload โดยเก็บ SemesterID เป็น number —
    const payload: Omit<SubjectInterface, "SemesterID"> & {
      SemesterID?: number;
    } = {
      SubjectID: values.SubjectID,
      SubjectName: values.SubjectName,
      Credit: Number(values.Credit),
      MajorID: values.MajorID,
      FacultyID: values.FacultyID,
      TeacherID: values.TeacherID,
      SemesterID:
        typeof values.SemesterID === "number" ? values.SemesterID : undefined,
    };

    try {
      const created = await createSubject(
        payload as unknown as SubjectInterface
      );

      const subjectId =
        (created as SubjectInterface & { subject_id?: string }).subject_id ??
        created.SubjectID ??
        values.SubjectID;

      if (!subjectId) throw new Error("Missing subject_id from response");

      const ranges = values.schedule || [];
      await Promise.all(
        ranges.map((range) =>
          addStudyTime(String(subjectId), {
            start: range[0].format("YYYY-MM-DD HH:mm"),
            end: range[1].format("YYYY-MM-DD HH:mm"),
          })
        )
      );

      // ✅ เด้งป็อปอัพแจ้งสำเร็จ (ไม่บล็อกรอผู้ใช้กด — ใช้ `void` ป้องกัน warning เรื่อง Promise)
      void Swal.fire({
        icon: "success",
        title: "บันทึกรายวิชาสำเร็จ",
        text: "ระบบได้บันทึกรายวิชาและเวลาเรียนเรียบร้อยแล้ว",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#2e236c",
      });

      form.resetFields();
      form.setFieldsValue({ schedule: [] } as Partial<FormValues>);
      await fetchSubjects();
    } catch (e) {
      console.error("[SUBMIT] error:", e);

      // ❌ เด้งป็อปอัพแจ้งข้อผิดพลาด
      const errMsg = (e as Error)?.message?.trim?.() || "กรุณาลองใหม่อีกครั้ง";
      void Swal.fire({
        icon: "error",
        title: "เพิ่มรายวิชาไม่สำเร็จ",
        text: errMsg,
        confirmButtonText: "ปิด",
        confirmButtonColor: "#d33",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ====================================================================
   * Render
   * ==================================================================== */
  return (
    <Layout
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f5f5f5",
      }}
    >
      <Content
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 24,
        }}
      >
        {/* -------------------- ฟอร์ม -------------------- */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              เพิ่มรายวิชาใหม่
            </Title>
            <Text type="secondary">กรอกข้อมูลให้ครบ แล้วกด “เพิ่มรายวิชา”</Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 12,
              width: "100%",
            }}
          >
            <Form.Item
              label="รหัสวิชา"
              name="SubjectID"
              rules={[{ required: true, message: "กรุณากรอกรหัสวิชา" }]}
              style={{ width: "100%" }}
            >
              <Input
                placeholder="เช่น CS101"
                style={{ height: 44, maxWidth: 300, fontSize: 15 }}
              />
            </Form.Item>

            <Form.Item
              label="ชื่อรายวิชา"
              name="SubjectName"
              rules={[{ required: true, message: "กรุณากรอกชื่อรายวิชา" }]}
              style={{ width: "100%" }}
            >
              <Input
                placeholder="เช่น คณิตศาสตร์เบื้องต้น"
                style={{ height: 44, maxWidth: 600, fontSize: 15 }}
              />
            </Form.Item>

            <Form.Item
              label="หน่วยกิต"
              name="Credit"
              rules={[
                { required: true, message: "กรุณากรอกหน่วยกิต" },
                {
                  type: "number",
                  min: 1,
                  max: 5,
                  message: "หน่วยกิตต้องเป็นตัวเลข 1–5",
                  transform: (value) => Number(value),
                },
              ]}
              extra={
                <Typography.Text type="danger">
                  หมายเหตุ: หน่วยกิตต้องเป็นตัวเลขระหว่าง 1 ถึง 5
                </Typography.Text>
              }
              style={{ width: "100%" }}
            >
              <Input
                placeholder="เช่น 3"
                inputMode="numeric"
                style={{ height: 44, maxWidth: 300, fontSize: 15 }}
              />
            </Form.Item>

            {/* เวลาเรียน */}
            <Form.Item label="เวลาเรียน" style={{ width: "100%" }}>
              <>
                <Typography.Text type="danger">
                  หมายเหตุ: เพิ่มได้หลายช่วงเวลา
                </Typography.Text>
                <div style={{ height: 5 }} aria-hidden="true" />
                <Form.List
                  name="schedule"
                  rules={[
                    {
                      validator: async (_, names) => {
                        if (!names || names.length === 0) {
                          return Promise.reject(
                            new Error("กรุณากรอกเวลาเรียน")
                          );
                        }
                      },
                    },
                  ]}
                >
                  {(fields, { add, remove }, { errors }) => (
                    <>
                      {fields.map(({ key, name }) => (
                        <Space
                          key={key}
                          style={{ display: "flex", marginBottom: 8 }}
                          align="baseline"
                        >
                          <Form.Item
                            name={name}
                            rules={[
                              { required: true, message: "กรุณากรอกเวลาเรียน" },
                            ]}
                            style={{ width: "100%" }}
                          >
                            <DatePicker.RangePicker
                              format="YYYY-MM-DD HH:mm"
                              showTime
                              minuteStep={1}
                            />
                          </Form.Item>
                          <Popconfirm
                            title="ลบช่วงเวลานี้?"
                            onConfirm={() => remove(name)}
                          >
                            <Button type="link" danger>
                              ลบ
                            </Button>
                          </Popconfirm>
                        </Space>
                      ))}
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          block
                          icon={<PlusOutlined />}
                        >
                          เพิ่มเวลาเรียน
                        </Button>
                      </Form.Item>
                      <Form.ErrorList errors={errors} />
                    </>
                  )}
                </Form.List>
              </>
            </Form.Item>

            {/* คณะ */}
            <Form.Item
              label="คณะ (Faculty)"
              name="FacultyID"
              rules={[{ required: true, message: "กรุณาเลือกคณะ" }]}
              style={{ width: "100%" }}
            >
              <Select
                placeholder="เลือกคณะ"
                loading={loadingFaculties}
                style={{ maxWidth: 300, fontSize: 15, width: "100%" }}
                allowClear
              >
                {faculties.map((f) => (
                  <Option key={f.id} value={f.id}>
                    {f.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* สาขา */}
            <Form.Item
              label="สาขา (Major)"
              name="MajorID"
              rules={[{ required: true, message: "กรุณาเลือกสาขา" }]}
              style={{ width: "100%" }}
            >
              <Select
                placeholder="เลือกสาขา"
                loading={loadingMajors}
                style={{ maxWidth: 300, fontSize: 15, width: "100%" }}
                disabled={!selectedFacultyId}
                allowClear
              >
                {filteredMajors.map((m) => (
                  <Option key={m.id} value={m.id}>
                    {m.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* อาจารย์ */}
            <Form.Item
              label="อาจารย์ (Teacher)"
              name="TeacherID"
              rules={[{ required: true, message: "กรุณาเลือกอาจารย์" }]}
              style={{ width: "100%" }}
            >
              <Select
                placeholder="เลือกอาจารย์"
                loading={loadingTeachers}
                style={{ maxWidth: 300, fontSize: 15, width: "100%" }}
                disabled={!selectedMajorId}
                allowClear
              >
                {filteredTeachers.map((t) => (
                  <Option key={t.id} value={t.id}>
                    {`${t.firstname} ${t.lastname}`.trim()}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* ภาคการศึกษา */}
            <Form.Item
              label="ภาคการศึกษา (Semester)"
              name="SemesterID"
              rules={[{ required: true, message: "กรุณาเลือกภาคการศึกษา" }]}
              style={{ width: "100%" }}
            >
              <Select
                placeholder="เลือกภาคการศึกษา"
                loading={loadingSemesters}
                style={{ maxWidth: 300, fontSize: 15, width: "100%" }}
                allowClear
              >
                {semesters.map((s) => (
                  <Option key={s.id} value={s.id}>
                    {`${s.term}/${s.academicYear}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item style={{ marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{
                  backgroundColor: "#2e236c",
                  height: 44,
                  minWidth: 160,
                  borderRadius: 10,
                  fontWeight: 600,
                }}
              >
                เพิ่มรายวิชา
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* -------------------- ค้นหา + ตาราง -------------------- */}
        <div style={{ marginTop: 24, marginBottom: 8 }}>
          <Input.Search
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหา: ชื่อวิชา / รหัสวิชา / คณะ / สาขา / อาจารย์"
            style={{ maxWidth: 420 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <Title level={4}>รายวิชาที่เพิ่มแล้ว</Title>
          <Table
            className="custom-table-header"
            columns={[
              { title: "รหัสวิชา", dataIndex: "SubjectID", width: 120 },
              { title: "ชื่อรายวิชา", dataIndex: "SubjectName" },
              {
                title: "หน่วยกิต",
                dataIndex: "Credit",
                width: 100,
                render: (val: number | string | undefined) => (
                  <span>{Number(val ?? 0)}</span>
                ),
              },
              {
                title: "เวลาเรียน",
                dataIndex: "formattedSchedule",
                render: (formattedSchedule?: string[]) => {
                  const list = Array.isArray(formattedSchedule)
                    ? formattedSchedule
                    : [];
                  const groups = chunk<string>(list, 5);
                  if (groups.length === 0) return <span>-</span>;
                  return (
                    <>
                      {groups.map((g, gi) => (
                        <div key={gi} style={{ marginBottom: 4 }}>
                          {g.map((txt, i) => (
                            <Tag key={`${gi}-${i}`} style={{ marginBottom: 4 }}>
                              {txt}
                            </Tag>
                          ))}
                        </div>
                      ))}
                    </>
                  );
                },
              },
              {
                title: "คณะ",
                dataIndex: "FacultyName",
                render: (_: unknown, row: SubjectRow) =>
                  row.FacultyName ??
                  faculties.find((f) => f.id === row.FacultyID)?.name ??
                  "",
              },
              {
                title: "สาขา",
                dataIndex: "MajorName",
                render: (_: unknown, row: SubjectRow) =>
                  row.MajorName ??
                  majors.find((m) => m.id === row.MajorID)?.name ??
                  "",
              },
              {
                title: "อาจารย์",
                dataIndex: "TeacherID",
                render: (_: unknown, row: SubjectRow) => {
                  const t = teachers.find(
                    (tt) => String(tt.id) === String(row.TeacherID)
                  );
                  return t ? `${t.firstname} ${t.lastname}`.trim() : "-";
                },
              },
              {
                title: "เทอม",
                dataIndex: "Term",
                width: 80,
                render: (_: unknown, row: SubjectRow) => {
                  if (row.Term && row.Term !== "") return row.Term;
                  const s = semesters.find((ss) => ss.id === row.SemesterID);
                  return s?.term ?? "-";
                },
              },
              {
                title: "ปีการศึกษา",
                dataIndex: "AcademicYear",
                width: 120,
                render: (_: unknown, row: SubjectRow) => {
                  if (row.AcademicYear && row.AcademicYear !== "")
                    return row.AcademicYear;
                  const s = semesters.find((ss) => ss.id === row.SemesterID);
                  return s?.academicYear ?? "-";
                },
              },
            ]}
            dataSource={tableRows}
            rowKey="SubjectID"
            pagination={false}
            rowClassName={(_record, index) =>
              index % 2 === 0 ? "table-row-light" : "table-row-dark"
            }
          />
        </div>

        {/* C — Table styles */}
        <style>{`
          /* ใช้สีเส้นหลักให้ตรงกัน */
          :root { --grid-color: #f0e9e9ff; }

          .custom-table-header .ant-table-thead > tr > th {
            border-right: 1px solid var(--grid-color) !important;
            border-bottom: 1px solid var(--grid-color) !important;
          }
          .custom-table-header .ant-table-tbody > tr > td {
            border-right: 1px solid var(--grid-color) !important;
            border-bottom: 1px solid var(--grid-color) !important;
          }

          /* ⛔️ ปิดเส้นขาว (split line) ของหัวตาราง */
          .custom-table-header .ant-table-thead > tr > th::before {
            background: transparent !important;
            width: 0 !important;
          }
          /* กันกรณี sticky header */
          .custom-table-header .ant-table-sticky-holder .ant-table-thead > tr > th::before {
            background: transparent !important;
            width: 0 !important;
          }
          /* เผื่อบางธีมมี ::after ด้วย */
          .custom-table-header .ant-table-thead > tr > th::after {
            display: none !important;
          }

          /* วิธีทางเลือก: เปลี่ยนตัวแปรสี split line ให้โปร่งใส (AntD v5) */
          .custom-table-header .ant-table {
            --ant-table-header-column-split-color: transparent;
          }
        `}</style>
      </Content>
    </Layout>
  );
};

export default ADD;