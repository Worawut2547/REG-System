import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Form,
  Input,
  Select,
  Button,
  Typography,
  InputNumber,
  Table,
} from "antd";
import type { TableRowSelection } from "antd/es/table/interface";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import axios from "axios";

import "./add.css";

// ----- Interfaces -----
import { type CurriculumInterface } from "../../../../../interfaces/Curriculum";

// ----- Services -----
import { getSubjectAll } from "../../../../../services/https/subject/subjects";
import { createSubjectCurriculum } from "../../../../../services/https/SubjectCurriculum/subjectcurriculum";
import { getFacultyAll } from "../../../../../services/https/faculty/faculty";
import { getMajorAll } from "../../../../../services/https/major/major";
import {
  createCurriculum,
  getCurriculumAll,
} from "../../../../../services/https/curriculum/curriculum";

// Book services (ใช้ preview URL จาก BE)
import {
  registerBookByPath,
  getBookPreviewUrl,
} from "../../../../../services/https/book/books";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// -------------------------------
// Error helper (type-safe, no any)
// -------------------------------
interface ApiErrorPayload {
  error?: string;
  message?: string;
}
function extractErrorMessage(e: unknown): string {
  if (axios.isAxiosError<ApiErrorPayload>(e)) {
    return e.response?.data?.error || e.response?.data?.message || e.message;
  }
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return "เกิดข้อผิดพลาดไม่ทราบสาเหตุ";
  }
}

/* =============================================
 * 1) Types
 * ============================================= */
type Faculty = { id: string; name: string };
type Major = { id: string; name: string; facultyId?: string };

type SubjectAPI = Record<string, unknown>;
type FacultyAPI = Record<string, unknown>;
type MajorAPI = Record<string, unknown>;

// แถวของวิชาในตาราง
type SubjectRow = {
  SubjectID: string;
  SubjectName: string;
  Credit: number;
  FacultyID?: string;
  FacultyName?: string;
  MajorID?: string;
  MajorName?: string;
};

// แถวของหลักสูตรในตาราง
type CurriculumRow = {
  CurriculumID: string;
  CurriculumName: string;
  TotalCredit: number;
  StartYear: number;
  FacultyID: string;
  FacultyName?: string;
  MajorID?: string;
  MajorName?: string;
  BookID?: number; // ใช้กับ preview URL
  BookPath?: string; // เผื่อใช้ตรวจสอบ/ดีบัก
  Description?: string;
};

// ฟอร์มสร้างหลักสูตร
type CurriculumCreateForm = {
  CurriculumID: string;
  CurriculumName: string;
  TotalCredit: number;
  StartYear: number;
  FacultyID: string;
  MajorID?: string;
  Description?: string;
  BookPath?: string; // ผู้ใช้วาง path เอง (file:///C:/... หรือ C:\...\..\.pdf)
};

/* =============================================
 * 2) Path helpers (file:///C:/... -> C:\...)
 * ============================================= */
const isFileUri = (s: string): boolean => /^file:\/\/\//i.test(s);
const isWindowsAbs = (s: string): boolean => /^[A-Za-z]:\\/.test(s);

function fileUriToWindowsPath(uri: string): string | null {
  try {
    const u = new URL(uri);
    if (u.protocol !== "file:") return null;
    let p = decodeURIComponent(u.pathname || "");
    if (p.startsWith("/")) p = p.slice(1);
    p = p.replace(/\//g, "\\");
    if (!isWindowsAbs(p)) return null;
    return p;
  } catch {
    return null;
  }
}

function coerceToServerPath(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (isFileUri(s)) return fileUriToWindowsPath(s);
  if (isWindowsAbs(s)) return s;
  return null;
}

/* =============================================
 * 3) Normalizers (เบา ๆ)
 * ============================================= */
function pickString(
  o: Record<string, unknown>,
  keys: string[],
  def = ""
): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" || typeof v === "number") return String(v);
  }
  return def;
}
function pickNumber(
  o: Record<string, unknown>,
  keys: string[],
  def = 0
): number {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return def;
}

const normalizeFaculty = (f: FacultyAPI): Faculty => ({
  id: pickString(f, ["faculty_id", "facultyId", "FacultyID", "id"]),
  name: pickString(f, ["faculty_name", "facultyName", "FacultyName", "name"]),
});

const normalizeMajor = (m: MajorAPI): Major => ({
  id: pickString(m, ["major_id", "majorId", "MajorID", "id"]),
  name: pickString(m, ["major_name", "majorName", "MajorName", "name"]),
  facultyId: pickString(m, ["faculty_id", "facultyId", "FacultyID"], ""),
});

const normalizeSubject = (s: SubjectAPI): SubjectRow | null => {
  const o = s as Record<string, unknown>;
  const SubjectID = pickString(o, [
    "subject_id",
    "subjectId",
    "SubjectID",
    "id",
  ]);
  if (!SubjectID) return null;
  return {
    SubjectID,
    SubjectName: pickString(o, [
      "subject_name",
      "subjectName",
      "SubjectName",
      "name",
    ]),
    Credit: pickNumber(o, ["credit", "Credit"], 0),
    FacultyID:
      pickString(o, ["faculty_id", "facultyId", "FacultyID"], "") || undefined,
    FacultyName:
      pickString(o, ["faculty_name", "facultyName", "FacultyName"], "") ||
      undefined,
    MajorID: pickString(o, ["major_id", "majorId", "MajorID"], "") || undefined,
    MajorName:
      pickString(o, ["major_name", "majorName", "MajorName"], "") || undefined,
  };
};

/* =============================================
 * 4) Main Component
 * ============================================= */
const Add: React.FC = () => {
  const [form] = Form.useForm<CurriculumCreateForm>();

  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);

  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [query, setQuery] = useState("");
  const [subjectQuery, setSubjectQuery] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<React.Key[]>([]);

  const selectedFacultyId = Form.useWatch("FacultyID", form);

  // ---- Loaders
  const fetchFaculties = async () => {
    try {
      setLoadingFaculties(true);
      const data = await getFacultyAll();
      const arr = (Array.isArray(data) ? data : []) as FacultyAPI[];
      setFaculties(arr.map(normalizeFaculty));
    } catch (e) {
      // เงียบ ๆ ก็ได้ หรือจะแจ้งเตือนเป็น toast
      console.error("load faculties error:", extractErrorMessage(e));
    } finally {
      setLoadingFaculties(false);
    }
  };

  const fetchMajors = async () => {
    try {
      setLoadingMajors(true);
      const data = await getMajorAll();
      const arr = (Array.isArray(data) ? data : []) as MajorAPI[];
      setMajors(arr.map(normalizeMajor));
    } catch (e) {
      console.error("load majors error:", extractErrorMessage(e));
    } finally {
      setLoadingMajors(false);
    }
  };

  const fetchCurriculums = async () => {
    try {
      const data = await getCurriculumAll(); // -> CurriculumInterface[]

      const rows: CurriculumRow[] = data.map((r) => ({
        // ↓ ใส่ fallback ให้ฟิลด์ที่ต้องเป็น string
        CurriculumID: r.CurriculumID ?? "",
        CurriculumName: r.CurriculumName ?? "",
        // ↓ แปลง number ให้แน่นอน
        TotalCredit:
          typeof r.TotalCredit === "number"
            ? r.TotalCredit
            : Number(r.TotalCredit ?? 0),
        StartYear:
          typeof r.StartYear === "number"
            ? r.StartYear
            : Number(r.StartYear ?? 0),
        FacultyID: r.FacultyID ?? "",

        // ↓ ฟิลด์ที่เป็น optional ให้ใช้ undefined เมื่อว่าง
        FacultyName: r.FacultyName || undefined,
        MajorID: r.MajorID || undefined,
        MajorName: r.MajorName || undefined,

        // ↓ BookID ต้องเป็น number จริง ๆ เท่านั้น
        BookID: typeof r.BookID === "number" ? r.BookID : undefined,
        BookPath: r.BookPath || undefined,
        Description: r.Description || undefined,
      }));

      setCurriculums(rows);
    } catch (e) {
      console.error("load curriculums error:", extractErrorMessage(e));
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const data = await getSubjectAll();
      const arr = (Array.isArray(data) ? data : []) as SubjectAPI[];
      const rows = arr
        .map(normalizeSubject)
        .filter((r): r is SubjectRow => !!r);
      setSubjects(rows);
    } catch (e) {
      console.error("load subjects error:", extractErrorMessage(e));
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
    fetchMajors();
    fetchCurriculums();
    fetchSubjects();
  }, []);

  // ---- Derived
  const filteredMajors = useMemo(() => {
    if (!selectedFacultyId) return majors;
    return majors.filter(
      (m) => !m.facultyId || m.facultyId === selectedFacultyId
    );
  }, [majors, selectedFacultyId]);

  const subjectRows = useMemo(() => {
    const q = subjectQuery.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter((s) =>
      [s.SubjectID, s.SubjectName, s.FacultyName ?? "", s.MajorName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [subjects, subjectQuery]);

  const curriculumRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return curriculums;
    return curriculums.filter((c) =>
      [c.CurriculumName, c.CurriculumID, c.FacultyName ?? "", c.MajorName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [curriculums, query]);

  // ---- Subjects table
  const subjectColumns: ColumnsType<SubjectRow> = [
    { title: "รหัสวิชา", dataIndex: "SubjectID", width: 160 },
    { title: "ชื่อรายวิชา", dataIndex: "SubjectName" },
    {
      title: "หน่วยกิต",
      dataIndex: "Credit",
      width: 100,
      render: (v: number) => <span>{Number(v ?? 0)}</span>,
    },
    {
      title: "คณะ",
      dataIndex: "FacultyName",
      width: 200,
      render: (_: unknown, row) =>
        row.FacultyName ??
        (faculties.find((f) => f.id === row.FacultyID)?.name || "-"),
    },
    {
      title: "สาขา",
      dataIndex: "MajorName",
      width: 200,
      render: (_: unknown, row) =>
        row.MajorName ??
        (majors.find((m) => m.id === row.MajorID)?.name || "-"),
    },
  ];

  const subjectRowSelection: TableRowSelection<SubjectRow> = {
    selectedRowKeys: selectedSubjectIds,
    onChange: (keys) => setSelectedSubjectIds(keys),
    preserveSelectedRowKeys: true,
    hideSelectAll: true,
    getCheckboxProps: (record) => ({ disabled: !record.SubjectID }),
  };

  // ---- Submit
  const onFinish = async (values: CurriculumCreateForm) => {
    setSubmitting(true);
    try {
      const payload: CurriculumInterface = {
        CurriculumID: values.CurriculumID,
        CurriculumName: values.CurriculumName,
        TotalCredit: Number(values.TotalCredit),
        StartYear: Number(values.StartYear),
        FacultyID: values.FacultyID,
        MajorID: values.MajorID,
        Description: (values.Description || "").trim(),
      };

      // 1) สร้างหลักสูตร
      await createCurriculum(payload);

      // 2) ลงทะเบียน path ถ้ามี
      const rawPath = (values.BookPath || "").trim();
      if (rawPath) {
        const serverPath = coerceToServerPath(rawPath);
        if (!serverPath) {
          await Swal.fire({
            icon: "warning",
            title: "รูปแบบไฟล์ไม่ถูกต้อง",
            text: "ต้องเป็น file:///C:/... หรือ C:\\... ลงท้าย .pdf",
          });
        } else if (!/\.pdf$/i.test(serverPath)) {
          await Swal.fire({ icon: "warning", title: "รองรับเฉพาะไฟล์ .pdf" });
        } else {
          try {
            await registerBookByPath(serverPath, values.CurriculumID.trim());
            await Swal.fire({
              toast: true,
              position: "top-end",
              icon: "success",
              title: "บันทึกเอกสารหลักสูตร (path) สำเร็จ",
              showConfirmButton: false,
              timer: 1400,
              timerProgressBar: true,
            });
          } catch (e) {
            await Swal.fire({
              icon: "error",
              title: "บันทึก path เอกสารไม่สำเร็จ",
              text: extractErrorMessage(e),
            });
          }
        }
      }

      // 3) ผูกวิชา (ถ้ามี)
      const curId = values.CurriculumID?.trim();
      if (curId && selectedSubjectIds.length > 0) {
        const tasks = selectedSubjectIds.map((sidKey) =>
          createSubjectCurriculum({
            SubjectID: String(sidKey),
            CurriculumID: curId,
          })
            .then(() => ({ ok: true }))
            .catch(() => ({ ok: false }))
        );
        const results = await Promise.all(tasks);
        const okCount = results.filter((r) => r.ok).length;
        const failCount = results.length - okCount;

        if (okCount > 0 || failCount > 0) {
          await Swal.fire({
            icon: failCount > 0 ? "warning" : "success",
            title: "เชื่อมวิชาเข้าหลักสูตร",
            html: `<div style="text-align:left;line-height:1.6"><div><b>สำเร็จ:</b> ${okCount}</div><div><b>ล้มเหลว:</b> ${failCount}</div></div>`,
            confirmButtonText: "ตกลง",
          });
        }

        setSelectedSubjectIds([]);
      }

      // 4) สรุปสำเร็จ + refresh
      form.resetFields();
      await fetchCurriculums();
      await Swal.fire({
        icon: "success",
        title: "บันทึกหลักสูตรสำเร็จ",
        html: `<div style="text-align:left;line-height:1.6"><div><b>รหัสหลักสูตร:</b> ${values.CurriculumID}</div><div><b>ชื่อหลักสูตร:</b> ${values.CurriculumName}</div></div>`,
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
        backdrop: true,
      });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "เพิ่มหลักสูตรไม่สำเร็จ",
        text: extractErrorMessage(err),
        confirmButtonText: "ปิด",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Render
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
        {/* A — ฟอร์มเพิ่มหลักสูตร */}
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
              เพิ่มหลักสูตรใหม่
            </Title>
          </div>

          <Form<CurriculumCreateForm>
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
              label="รหัสหลักสูตร (Curriculum ID)"
              name="CurriculumID"
              rules={[{ required: true, message: "กรุณากรอกรหัสหลักสูตร" }]}
              style={{ width: "100%" }}
            >
              <Input
                placeholder="เช่น CURR-2025-CS"
                style={{ height: 44, maxWidth: 320 }}
              />
            </Form.Item>

            <Form.Item
              label="ชื่อหลักสูตร (Curriculum Name)"
              name="CurriculumName"
              rules={[{ required: true, message: "กรุณากรอกชื่อหลักสูตร" }]}
              style={{ width: "100%" }}
            >
              <Input
                placeholder="เช่น Bachelor of Computer Science"
                style={{ height: 44, maxWidth: 600 }}
              />
            </Form.Item>

            <Form.Item
              label="หน่วยกิตรวม (Total Credit)"
              name="TotalCredit"
              rules={[
                { required: true, message: "กรุณากรอกหน่วยกิตรวม" },
                {
                  type: "number",
                  min: 1,
                  max: 300,
                  transform: (v) => Number(v),
                  message: "กรอก 1–300",
                },
              ]}
              style={{ width: "100%" }}
            >
              <InputNumber
                placeholder="เช่น 120"
                style={{ width: 200, height: 44 }}
              />
            </Form.Item>

            <Form.Item
              label="ปีเริ่มหลักสูตร (Start Year)"
              name="StartYear"
              rules={[
                { required: true, message: "กรุณากรอกปีเริ่มหลักสูตร" },
                { type: "number", transform: (v) => Number(v) },
              ]}
              extra={
                <Typography.Text type="danger">
                  หมายเหตุ: ต้องเป็นปี พ.ศ. (เช่น 2560)
                </Typography.Text>
              }
              style={{ width: "100%" }}
            >
              <InputNumber
                placeholder="เช่น 2560"
                style={{ width: 200, height: 44 }}
              />
            </Form.Item>

            <Form.Item
              label="คณะ (Faculty)"
              name="FacultyID"
              rules={[{ required: true, message: "กรุณาเลือกคณะ" }]}
              style={{ width: "100%" }}
            >
              <Select
                placeholder="เลือกคณะ"
                loading={loadingFaculties}
                style={{ maxWidth: 320 }}
                allowClear
              >
                {faculties.map((f) => (
                  <Option key={f.id} value={f.id}>
                    {f.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="สาขา (Major)"
              name="MajorID"
              style={{ width: "100%" }}
            >
              <Select
                placeholder="เลือกสาขา (ถ้ามี)"
                loading={loadingMajors}
                style={{ maxWidth: 320 }}
                allowClear
                disabled={!selectedFacultyId}
              >
                {filteredMajors.map((m) => (
                  <Option key={m.id} value={m.id}>
                    {m.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="เอกสารหลักสูตร"
              name="BookPath"
              tooltip="แนะนำวางรูปแบบ file:///C:/... หรือ C:\\... ลงท้าย .pdf"
              rules={[
                {
                  validator: async (_, v?: string) => {
                    if (!v) return Promise.resolve();
                    const s = v.trim();
                    const okUri = isFileUri(s) && /\.pdf$/i.test(s);
                    const okWin = isWindowsAbs(s) && /\.pdf$/i.test(s);
                    if (okUri || okWin) return Promise.resolve();
                    return Promise.reject(
                      "กรุณาวางเป็น file:///C:/.../xxx.pdf หรือ C:\\...\\xxx.pdf (ต้องลงท้าย .pdf)"
                    );
                  },
                },
              ]}
              style={{ width: "100%" }}
            >
              <Input
                placeholder="file:///C:/REG-System/frontend/src/pages/admin/dashboard/menu/curriculum/Book/banana.pdf"
                allowClear
                style={{ maxWidth: 720, height: 44 }}
              />
            </Form.Item>
            <Text type="secondary">
              วาง <strong>ไฟล์ลิงก์</strong> เช่น{" "}
              <code>
                file:///C:/REG-System/frontend/src/pages/admin/dashboard/menu/curriculum/Book/banana.pdf
              </code>{" "}
              หรือวาง <strong>Windows path</strong> เช่น{" "}
              <code>C:\REG-System\...\banana.pdf</code>
            </Text>

            <Form.Item
              label="คำอธิบาย (Description)"
              name="Description"
              style={{ width: "100%" }}
            >
              <Input.TextArea
                rows={4}
                placeholder="รายละเอียดอื่น ๆ ของหลักสูตร"
                style={{ maxWidth: 720 }}
              />
            </Form.Item>

            <div style={{ marginTop: 8, marginBottom: 12, width: "100%" }}>
              <Title level={4} style={{ marginBottom: 4 }}>
                เลือกวิชาให้หลักสูตรนี้ (ไม่บังคับ)
              </Title>
              <Text type="secondary">
                เลือกวิชาได้หลายรายวิชา ระบบจะผูกกับ{" "}
                <strong>รหัสหลักสูตรที่กรอก</strong> เมื่อกด “เพิ่มหลักสูตร”
              </Text>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  marginTop: 12,
                  marginBottom: 8,
                }}
              >
                <Input
                  placeholder="ค้นหา: รหัส/ชื่อวิชา/คณะ/สาขา"
                  prefix={<SearchOutlined />}
                  allowClear
                  value={subjectQuery}
                  onChange={(e) => setSubjectQuery(e.target.value)}
                  style={{ width: 420 }}
                />
                <Button
                  icon={<PlusOutlined />}
                  onClick={async () => {
                    const v = form.getFieldValue("CurriculumID");
                    if (!v) {
                      await Swal.fire({
                        icon: "info",
                        title: "กรุณากรอกรหัสหลักสูตรก่อน",
                      });
                    } else {
                      await Swal.fire({
                        toast: true,
                        position: "top-end",
                        icon: "info",
                        title:
                          "เมื่อกด 'เพิ่มหลักสูตร' ระบบจะผูกวิชาที่เลือกให้",
                        showConfirmButton: false,
                        timer: 1600,
                        timerProgressBar: true,
                      });
                    }
                  }}
                >
                  ใช้วิชาที่เลือกตอนบันทึก
                </Button>
              </div>

              <Table<SubjectRow>
                rowKey={(row) => row.SubjectID}
                dataSource={subjectRows}
                columns={subjectColumns}
                loading={loadingSubjects}
                rowSelection={subjectRowSelection}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total, range) =>
                    `${range[0]}–${range[1]} จาก ${total} รายการ`,
                }}
                className="custom-table-header subject-table"
                rowClassName={(_, i) =>
                  i % 2 === 0 ? "table-row-light" : "table-row-dark"
                }
              />
            </div>

            <Form.Item style={{ marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{
                  backgroundColor: "#2e236c",
                  height: 44,
                  minWidth: 180,
                  borderRadius: 10,
                  fontWeight: 600,
                }}
              >
                เพิ่มหลักสูตร
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* B — ค้นหา + ตารางหลักสูตร */}
        <div style={{ marginTop: 24, marginBottom: 8 }}>
          <Input
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหา: ชื่อหลักสูตร / รหัสหลักสูตร / คณะ / สาขา"
            style={{ maxWidth: 460 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <Title level={4}>หลักสูตรที่เพิ่มแล้ว</Title>
          <Table<CurriculumRow>
            className="custom-table-header"
            columns={[
              { title: "รหัสหลักสูตร", dataIndex: "CurriculumID", width: 160 },
              { title: "ชื่อหลักสูตร", dataIndex: "CurriculumName" },
              { title: "หน่วยกิตรวม", dataIndex: "TotalCredit", width: 120 },
              { title: "ปีเริ่ม", dataIndex: "StartYear", width: 100 },
              {
                title: "คณะ",
                dataIndex: "FacultyName",
                width: 200,
                render: (_: unknown, row) =>
                  row.FacultyName ??
                  (faculties.find((f) => f.id === row.FacultyID)?.name || "-"),
              },
              {
                title: "สาขา",
                dataIndex: "MajorName",
                width: 200,
                render: (_: unknown, row) =>
                  row.MajorName ??
                  (majors.find((m) => m.id === row.MajorID)?.name || "-"),
              },
              { title: "คำอธิบาย", dataIndex: "Description", width: 220 },
              {
                title: "เอกสาร",
                key: "doc",
                width: 220,
                render: (_: unknown, row) => {
                  const previewUrl =
                    typeof row.BookID === "number" && row.BookID > 0
                      ? getBookPreviewUrl(row.BookID)
                      : undefined;

                  // ✅ ตามที่คุณกำหนดไว้เป๊ะ ๆ
                  return (
                    <Button
                      size="small"
                      disabled={!previewUrl}
                      onClick={() =>
                        previewUrl &&
                        window.open(previewUrl, "_blank", "noopener,noreferrer")
                      }
                    >
                      ดูเล่มหลักสูตร
                    </Button>
                  );
                },
              },
            ]}
            dataSource={curriculumRows}
            rowKey="CurriculumID"
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

export default Add;
