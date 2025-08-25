import { type CurriculumInterface } from "../../../../../interfaces/Curriculum";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Layout,
  Form,
  Input,
  Select,
  Button,
  Typography,
  InputNumber,
  message,
  Table,
  Upload,
  Alert,
  Modal,
} from "antd";
import type { UploadProps } from "antd";

// สำหรับตารางเลือกวิชา (Subject)
import { getSubjectAll } from "../../../../../services/https/subject/subjects";
import { createSubjectCurriculum } from "../../../../../services/https/SubjectCurriculum/subjectcurriculum";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";

import { getFacultyAll } from "../../../../../services/https/faculty/faculty";
import { getMajorAll } from "../../../../../services/https/major/major";
import {
  createCurriculum,
  getCurriculumAll,
} from "../../../../../services/https/curriculum/curriculum";
import {
  uploadBook,
  deleteBook,
} from "../../../../../services/https/book/books";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

/* -----------------------------------------
 * Types — options สำหรับ select
 * ----------------------------------------- */
type Faculty = { id: string; name: string };
type Major = { id: string; name: string; facultyId?: string };

/* -----------------------------------------
 * รูปแบบ API response (รองรับหลายคีย์)
 * ----------------------------------------- */
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

  faculty_id?: string;
  facultyId?: string;
  FacultyID?: string; // << เพิ่ม
  faculty_name?: string;
  facultyName?: string;
  FacultyName?: string;

  major_id?: string;
  majorId?: string;
  MajorID?: string; // << เพิ่ม
  major_name?: string;
  majorName?: string;
  MajorName?: string;
};

type SubjectRow = {
  SubjectID: string;
  SubjectName: string;
  Credit: number;
  FacultyID?: string; // << เพิ่ม
  FacultyName?: string;
  MajorID?: string; // << เพิ่ม
  MajorName?: string;
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
type CurriculumAPI = {
  curriculum_id?: string;
  CurriculumID?: string;
  id?: string;
  curriculum_name?: string;
  CurriculumName?: string;
  name?: string;
  total_credit?: number | string;
  TotalCredit?: number | string;
  credit?: number | string;
  start_year?: number | string;
  StartYear?: number | string;
  faculty_id?: string;
  FacultyID?: string;
  faculty_name?: string;
  FacultyName?: string;
  major_id?: string;
  MajorID?: string;
  major_name?: string;
  MajorName?: string;
  book_id?: number | string;
  BookID?: number | string;
  book_path?: string;
  description?: string;
};

/* -----------------------------------------
 * Helpers
 * ----------------------------------------- */
const pickString = (
  o: Record<string, unknown>,
  keys: string[],
  def = ""
): string => {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" || typeof v === "number") return String(v);
  }
  return def;
};
const pickNumber = (
  o: Record<string, unknown>,
  keys: string[],
  def = 0
): number => {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return def;
};
const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  const digits = n >= 10 || i === 0 ? 0 : 1;
  return `${n.toFixed(digits)} ${units[i]}`;
};
const canInlinePreview = (mime?: string) =>
  !!mime && (mime.startsWith("image/") || mime === "application/pdf");

/* -----------------------------------------
 * แถวตารางหลักสูตร
 * ----------------------------------------- */
type CurriculumRow = {
  CurriculumID: string;
  CurriculumName: string;
  TotalCredit: number;
  StartYear: number;
  FacultyID: string;
  FacultyName?: string;
  MajorID?: string;
  MajorName?: string;
  BookID?: number;
  BookPath?: string;
  Description?: string;
};
const toCurriculumRow = (raw: unknown): CurriculumRow => {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    CurriculumID: pickString(r, ["curriculum_id", "CurriculumID", "id"], ""),
    CurriculumName: pickString(
      r,
      ["curriculum_name", "CurriculumName", "name"],
      ""
    ),
    TotalCredit: pickNumber(r, ["total_credit", "TotalCredit", "credit"], 0),
    StartYear: pickNumber(r, ["start_year", "StartYear"], 0),
    FacultyID: pickString(r, ["faculty_id", "FacultyID"], ""),
    FacultyName: pickString(r, ["faculty_name", "FacultyName"], ""),
    MajorID: pickString(r, ["major_id", "MajorID"], ""),
    MajorName: pickString(r, ["major_name", "MajorName"], ""),
    BookID: pickNumber(r, ["book_id", "BookID"], 0) || undefined,
    BookPath: pickString(r, ["book_path", "BookPath"], ""),
    Description: pickString(r, ["description", "Description"], ""),
  };
};

/* -----------------------------------------
 * Form values บนหน้า
 * ----------------------------------------- */
type CurriculumCreateForm = {
  CurriculumID: string;
  CurriculumName: string;
  TotalCredit: number;
  StartYear: number;
  FacultyID: string;
  MajorID?: string;
  BookID?: number;
  Description?: string;
  LocalFilePath?: string;
};

/* -----------------------------------------
 * สไตล์หน้า
 * ----------------------------------------- */
const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  background: "#f5f5f5",
};
const contentStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  padding: 24,
};
const formShell: React.CSSProperties = {
  flex: 1,
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  padding: 24,
  display: "flex",
  flexDirection: "column",
};

/* -----------------------------------------
 * Component ย่อย: เปิดไฟล์จากคอมพิวเตอร์
 * ----------------------------------------- */
const LocalFileOpener: React.FC = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [objUrl, setObjUrl] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    mime?: string;
    size?: number;
  }>({ name: "" });

  const openPicker = () => inputRef.current?.click();
  const onPick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (objUrl) URL.revokeObjectURL(objUrl);
    const url = URL.createObjectURL(file);
    setObjUrl(url);
    setFileInfo({ name: file.name, mime: file.type, size: file.size });
    setVisible(true);
  };
  const onCancel = () => setVisible(false);
  useEffect(
    () => () => {
      if (objUrl) URL.revokeObjectURL(objUrl);
    },
    [objUrl]
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        style={{ display: "none" }}
        onChange={onPick}
      />
      <Button size="small" onClick={openPicker}>
        เปิดจากคอมพิวเตอร์
      </Button>
      <Modal
        title={`พรีวิวไฟล์: ${fileInfo.name || "-"}`}
        open={visible}
        onCancel={onCancel}
        footer={
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {objUrl ? (
              <Button
                onClick={() =>
                  window.open(objUrl!, "_blank", "noopener,noreferrer")
                }
              >
                เปิดในแท็บใหม่ / ดาวน์โหลด
              </Button>
            ) : null}
            <Button type="primary" onClick={onCancel}>
              ปิด
            </Button>
          </div>
        }
        width="80vw"
        styles={{ body: { paddingTop: 8 } }}
      >
        <div style={{ marginBottom: 8, color: "#666" }}>
          ชนิดไฟล์: {fileInfo.mime || "-"} · ขนาด: {formatBytes(fileInfo.size)}
        </div>
        {!objUrl ? (
          <div>ยังไม่มีไฟล์</div>
        ) : canInlinePreview(fileInfo.mime) ? (
          fileInfo.mime?.startsWith("image/") ? (
            <img
              src={objUrl}
              alt="local preview"
              style={{
                display: "block",
                width: "100%",
                maxHeight: "75vh",
                objectFit: "contain",
              }}
            />
          ) : (
            <iframe
              src={objUrl}
              title="PDF preview"
              width="100%"
              height="75vh"
              style={{ border: "none" }}
            />
          )
        ) : (
          <Alert
            type="info"
            showIcon
            message="ไม่สามารถแสดงพรีวิวชนิดไฟล์นี้ในเบราว์เซอร์ได้"
            description="กดปุ่ม “เปิดในแท็บใหม่ / ดาวน์โหลด” เพื่อเปิดด้วยโปรแกรมที่รองรับ"
          />
        )}
      </Modal>
    </>
  );
};

/* ====================================================================
 * Page Component
 * ==================================================================== */
const Add: React.FC = () => {
  const [form] = Form.useForm<CurriculumCreateForm>();

  // ตารางเลือกวิชา (subject)
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectQuery, setSubjectQuery] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<React.Key[]>([]);

  // options
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);

  // table หลักสูตร
  const [curriculums, setCurriculums] = useState<CurriculumRow[]>([]);

  // ui state
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState<string>("");

  // เลือกไฟล์ไว้ก่อน (ยังไม่อัปโหลด)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<
    { name: string; mime?: string; size?: number } | undefined
  >(undefined);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // watch faculty to filter majors
  const selectedFacultyId = Form.useWatch("FacultyID", form);

  /* ---------- loaders ---------- */
  const fetchFaculties = async () => {
    try {
      setLoadingFaculties(true);
      const data = await getFacultyAll();
      const arr = (Array.isArray(data) ? data : []) as FacultyAPI[];
      const mapped: Faculty[] = arr.map((f) => ({
        id: f.faculty_id ?? f.facultyId ?? f.FacultyID ?? f.id ?? "",
        name: f.faculty_name ?? f.facultyName ?? f.FacultyName ?? f.name ?? "",
      }));
      setFaculties(mapped);
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
      const mapped: Major[] = arr.map((m) => ({
        id: m.major_id ?? m.majorId ?? m.MajorID ?? m.id ?? "",
        name: m.major_name ?? m.majorName ?? m.MajorName ?? m.name ?? "",
        facultyId: m.faculty_id ?? m.facultyId ?? m.FacultyID ?? "",
      }));
      setMajors(mapped);
    } catch (err) {
      console.error("fetchMajors error:", err);
      message.error("โหลดรายชื่อสาขาไม่สำเร็จ");
    } finally {
      setLoadingMajors(false);
    }
  };

  const fetchCurriculums = async () => {
    try {
      const data = await getCurriculumAll();
      const arr = (Array.isArray(data) ? data : []) as CurriculumAPI[];
      setCurriculums(arr.map((c) => toCurriculumRow(c)));
    } catch (err) {
      console.error("fetchCurriculums error:", err);
      message.error("โหลดหลักสูตรไม่สำเร็จ");
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const data = await getSubjectAll();
      const arr = (Array.isArray(data) ? data : []) as SubjectAPI[];

      const rows: SubjectRow[] = arr
        .map((s) => {
          const o = s as Record<string, unknown>;
          const facultyId = pickString(
            o,
            ["faculty_id", "facultyId", "FacultyID"],
            ""
          );
          const majorId = pickString(o, ["major_id", "majorId", "MajorID"], "");
          return {
            SubjectID: pickString(
              o,
              ["subject_id", "subjectId", "SubjectID", "id"],
              ""
            ),
            SubjectName: pickString(
              o,
              ["subject_name", "subjectName", "SubjectName", "name"],
              ""
            ),
            Credit: pickNumber(o, ["credit", "Credit"], 0),

            FacultyID: facultyId || undefined,
            FacultyName:
              pickString(
                o,
                ["faculty_name", "facultyName", "FacultyName"],
                ""
              ) || undefined,

            MajorID: majorId || undefined,
            MajorName:
              pickString(o, ["major_name", "majorName", "MajorName"], "") ||
              undefined,
          };
        })
        .filter((r) => r.SubjectID);

      setSubjects(rows);
    } catch (e) {
      console.error("fetchSubjects error:", e);
      message.error("โหลดรายวิชาไม่สำเร็จ");
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

  // cleanup object URL
  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  /* ---------- filter majors by faculty ---------- */
  const filteredMajors = useMemo(() => {
    if (!selectedFacultyId) return majors;
    return majors.filter(
      (m) => !m.facultyId || m.facultyId === selectedFacultyId
    );
  }, [majors, selectedFacultyId]);

  /* ---------- ตารางวิชา: search/columns/selection ---------- */
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

  const subjectRowSelection = {
    selectedRowKeys: selectedSubjectIds,
    onChange: (keys: React.Key[]) => setSelectedSubjectIds(keys),
    preserveSelectedRowKeys: true,
    getCheckboxProps: (record: SubjectRow) => ({ disabled: !record.SubjectID }),
  };

  /* ---------- ตารางหลักสูตร: search ---------- */
  const tableRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return curriculums;
    return curriculums.filter((c) =>
      [c.CurriculumName, c.CurriculumID, c.FacultyName ?? "", c.MajorName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [curriculums, query]);

  /* ---------- Upload: เลือกไฟล์ไว้ก่อน ---------- */
  const uploadProps: UploadProps = {
    multiple: false,
    accept: ".pdf,.doc,.docx,.png,.jpg,.jpeg",
    showUploadList: false,
    beforeUpload: (file) => {
      setSelectedFile(file);
      setUploadedPreview({ name: file.name, mime: file.type, size: file.size });
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
      const url = URL.createObjectURL(file);
      setLocalPreviewUrl(url);
      message.info("เลือกไฟล์แล้ว (ยังไม่อัปโหลดจนกว่าจะกด 'เพิ่มหลักสูตร')");
      return false;
    },
    onChange(info) {
      const f = info.file;
      if (f && f.originFileObj) {
        const of = f.originFileObj as File;
        setSelectedFile(of);
        setUploadedPreview({ name: of.name, mime: of.type, size: of.size });
        if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
        const url = URL.createObjectURL(of);
        setLocalPreviewUrl(url);
      }
    },
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setUploadedPreview(undefined);
    form.setFieldsValue({ BookID: undefined });
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
  };

  /* ---------- submit ---------- */
  const onFinish = async (values: CurriculumCreateForm) => {
    setSubmitting(true);
    let createdBookId: number | undefined;

    try {
      // (1) อัปโหลดไฟล์ถ้ามี
      if (selectedFile) {
        const bookRes = await uploadBook(selectedFile, "currBook");
        if (!bookRes?.ID || bookRes.ID <= 0)
          throw new Error(
            "อัปโหลดไฟล์ไม่สำเร็จ หรือไม่ได้รหัสไฟล์ (ID) จากเซิร์ฟเวอร์"
          );
        createdBookId = bookRes.ID;
        form.setFieldsValue({ BookID: createdBookId });
      }

      // (2) รวมคำอธิบาย + local path
      const localPathNote = values.LocalFilePath?.trim();
      const finalDescription = [
        values.Description?.trim() || "",
        localPathNote ? `[LocalPath] ${localPathNote}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      // (3) ส่งหลักสูตรขึ้น BE
      const payload: CurriculumInterface = {
        CurriculumID: values.CurriculumID,
        CurriculumName: values.CurriculumName,
        TotalCredit: Number(values.TotalCredit),
        StartYear: Number(values.StartYear),
        FacultyID: values.FacultyID,
        MajorID: values.MajorID,
        BookID:
          Number.isFinite((values.BookID ?? createdBookId) as number) &&
          Number((values.BookID ?? createdBookId) as number) > 0
            ? values.BookID ?? createdBookId
            : undefined,
        Description: finalDescription,
        FacultyName: undefined,
        MajorName: undefined,
        BookPath: undefined,
      };

      await createCurriculum(payload);
      message.success("บันทึกหลักสูตรสำเร็จ");

      // (4) ถ้าเลือกวิชาไว้ → ผูกลง subjectcurriculum ตาม CurriculumID
      const curriculumIdJustCreated = values.CurriculumID?.trim();
      if (curriculumIdJustCreated && selectedSubjectIds.length > 0) {
        try {
          const tasks = selectedSubjectIds.map((sidKey) =>
            createSubjectCurriculum({
              SubjectID: String(sidKey),
              CurriculumID: curriculumIdJustCreated,
            })
              .then(() => ({ ok: true }))
              .catch(() => ({ ok: false }))
          );

          const results = await Promise.all(tasks);
          const okCount = results.filter((r) => r.ok).length;
          const failed = results.length - okCount;

          if (okCount > 0)
            message.success(`เชื่อมวิชาเข้าหลักสูตรแล้ว ${okCount} รายการ`);
          if (failed > 0) message.error(`เพิ่มไม่สำเร็จ ${failed} รายการ`);
          setSelectedSubjectIds([]); // เคลียร์การเลือก
        } catch (e) {
          console.error("link subjects error:", e);
          message.error("เชื่อมวิชาเข้าหลักสูตรไม่สำเร็จ");
        }
      }

      // (5) เคลียร์ฟอร์ม/สถานะ และรีเฟรชตารางหลักสูตร
      form.resetFields();
      clearSelectedFile();
      await fetchCurriculums();
    } catch (err) {
      console.error("[CreateCurriculum] error:", err);
      message.error((err as Error)?.message || "เพิ่มหลักสูตรไม่สำเร็จ");

      // Rollback ไฟล์ถ้าจำเป็น
      if (createdBookId) {
        try {
          await deleteBook(createdBookId);
        } catch (delErr) {
          console.warn("Rollback deleteBook failed:", delErr);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ====================================================================
   * Render
   * ==================================================================== */
  return (
    <Layout style={pageStyle}>
      <Content style={contentStyle}>
        {/* -------------------- ฟอร์มเพิ่มหลักสูตร -------------------- */}
        <div style={formShell}>
          <div style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              เพิ่มหลักสูตรใหม่
            </Title>
            <Text type="secondary">
              กรอกข้อมูลหลักสูตรให้ครบ แล้วกด “เพิ่มหลักสูตร”
            </Text>
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
            {/* รหัสหลักสูตร */}
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

            {/* ชื่อหลักสูตร */}
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

            {/* หน่วยกิตรวม */}
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

            {/* ปีเริ่มหลักสูตร */}
            <Form.Item
              label="ปีเริ่มหลักสูตร (Start Year) "
              name="StartYear"
              rules={[
                { required: true, message: "กรุณากรอกปีเริ่มหลักสูตร" },
                { type: "number", transform: (v) => Number(v) },
              ]}
              extra={
                <Typography.Text type="danger">
                  หมายเหตุ: ต้องเป็นปี พุทธศักราช (เช่น 2560)
                </Typography.Text>
              }
              style={{ width: "100%" }}
            >
              <InputNumber
                placeholder="เช่น 2560"
                style={{ width: 200, height: 44 }}
              />
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

            {/* สาขา */}
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

            {/* -------------------- เลือกวิชาให้หลักสูตรนี้ (Optional) -------------------- */}
            <div style={{ marginTop: 24, marginBottom: 12 }}>
              <Title level={4} style={{ marginBottom: 4 }}>
                เลือกวิชาให้หลักสูตรนี้ (ไม่บังคับ)
              </Title>
              <Text type="secondary">
                เลือกวิชาได้หลายรายวิชา ระบบจะผูกกับ{" "}
                <strong>รหัสหลักสูตรที่กรอกในฟอร์มด้านบน</strong> ทันทีเมื่อกด
                “เพิ่มหลักสูตร”
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
                  onClick={() => {
                    const v = form.getFieldValue("CurriculumID");
                    if (!v) message.warning("กรุณากรอกรหัสหลักสูตรก่อน");
                    else
                      message.info(
                        "เมื่อกด 'เพิ่มหลักสูตร' ระบบจะผูกวิชาที่เลือกให้โดยอัตโนมัติ"
                      );
                  }}
                >
                  ใช้วิชาที่เลือกตอนบันทึก
                </Button>
                {/* -------------------- Table Styles -------------------- */}
                <style>
                  {`
                    .table-row-light { background-color: #dad1d1ff; }
                    .table-row-dark  { background-color: #dad1d1ff; }

                    .custom-table-header .ant-table-thead > tr > th {
                      background: #2e236c;
                      color: #fff;
                      font-weight: bold;
                      font-size: 16px;
                      border-bottom: 2px solid #ffffffff;
                      border-right: 2px solid #ffffffff;
                    }
                    .custom-table-header .ant-table-tbody > tr > td {
                      border-bottom: 2px solid #ffffffff;
                      border-right: 2px solid #ffffffff;
                    }
                    .custom-table-header .ant-table-tbody > tr > td:last-child,
                    .custom-table-header .ant-table-thead > tr > th:last-child {
                      border-right: none;
                    }
                    .custom-table-header .ant-table-tbody > tr:hover > td {
                      background-color: #dad1d1ff !important;
                      transition: background 0.2s;
                    }
                  `}
                </style>
              </div>

              <Table<SubjectRow>
                rowKey="SubjectID"
                dataSource={subjectRows}
                columns={subjectColumns}
                loading={loadingSubjects}
                rowSelection={{ type: "checkbox", ...subjectRowSelection }}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                className="custom-table-header"
                rowClassName={(_rec, i) =>
                  i % 2 === 0 ? "table-row-light" : "table-row-dark"
                }
              />
            </div>

            {/* เอกสารหลักสูตร — เลือกไฟล์ */}
            <Form.Item
              label="เอกสารหลักสูตร (เลือกไฟล์ — เปิดดูจากคอมพิวเตอร์ได้ทันที)"
              style={{ width: "100%" }}
            >
              <Upload.Dragger {...uploadProps} style={{ maxWidth: 560 }}>
                <p className="ant-upload-drag-icon">📄</p>
                <p className="ant-upload-text">
                  ลากไฟล์มาวาง หรือคลิกเพื่อเลือกไฟล์
                </p>
                <p className="ant-upload-hint">
                  รองรับ .pdf .doc .docx .png .jpg (สูงสุด 20MB)
                </p>
              </Upload.Dragger>

              {uploadedPreview && (
                <div style={{ marginTop: 12, maxWidth: 560 }}>
                  <Alert
                    showIcon
                    type="info"
                    message={
                      <span>
                        เลือกไฟล์แล้ว: <strong>{uploadedPreview.name}</strong>
                      </span>
                    }
                    description={
                      <div style={{ marginTop: 6, lineHeight: 1.7 }}>
                        <div>ชนิดไฟล์: {uploadedPreview.mime || "-"}</div>
                        <div>ขนาดไฟล์: {formatBytes(uploadedPreview.size)}</div>

                        {localPreviewUrl ? (
                          <div
                            style={{
                              marginTop: 8,
                              display: "flex",
                              gap: 8,
                              alignItems: "center",
                            }}
                          >
                            <a
                              href={localPreviewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              เปิดไฟล์จากคอมพิวเตอร์
                            </a>
                            <Button size="small" onClick={clearSelectedFile}>
                              ล้างไฟล์ที่เลือก
                            </Button>
                          </div>
                        ) : null}

                        {localPreviewUrl &&
                        canInlinePreview(uploadedPreview.mime) ? (
                          <div
                            style={{
                              marginTop: 12,
                              border: "1px solid #eee",
                              borderRadius: 8,
                              overflow: "hidden",
                            }}
                          >
                            {uploadedPreview.mime?.startsWith("image/") ? (
                              <img
                                src={localPreviewUrl}
                                alt="local preview"
                                style={{
                                  display: "block",
                                  maxWidth: "100%",
                                  maxHeight: 480,
                                  objectFit: "contain",
                                }}
                              />
                            ) : (
                              <iframe
                                src={localPreviewUrl}
                                title="PDF preview"
                                width="100%"
                                height={480}
                                style={{ border: "none" }}
                              />
                            )}
                          </div>
                        ) : null}

                        <div style={{ marginTop: 6 }}>
                          <em>
                            หมายเหตุ: ไฟล์จะถูกอัปโหลดเมื่อกด “เพิ่มหลักสูตร”
                            เท่านั้น
                          </em>
                        </div>
                      </div>
                    }
                  />
                </div>
              )}

              <Form.Item name="BookID" style={{ display: "none" }}>
                <Input type="hidden" />
              </Form.Item>
            </Form.Item>

            {/* คำอธิบาย */}
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

            {/* ตำแหน่งไฟล์บนเครื่อง (optional) */}
            <Form.Item
              label="ตำแหน่งไฟล์บนเครื่อง (optional)"
              name="LocalFilePath"
              extra="เบราว์เซอร์จะไม่รู้ path จริงบนเครื่องโดยอัตโนมัติ หากต้องการเก็บในฐานข้อมูล กรุณากรอกด้วยตัวเอง"
              style={{ width: "100%" }}
            >
              <Input
                placeholder="เช่น C:\Users\me\Documents\curriculum.pdf หรือ /Users/me/Documents/curriculum.pdf"
                style={{ maxWidth: 720 }}
              />
            </Form.Item>

            {/* ปุ่มบันทึก */}
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

        {/* -------------------- ค้นหา + ตารางหลักสูตรที่เพิ่มแล้ว -------------------- */}
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
                render: (_: unknown, row) =>
                  row.FacultyName ??
                  (faculties.find((f) => f.id === row.FacultyID)?.name || "-"),
                width: 200,
              },
              {
                title: "สาขา",
                dataIndex: "MajorName",
                render: (_: unknown, row) =>
                  row.MajorName ??
                  (majors.find((m) => m.id === row.MajorID)?.name || "-"),
                width: 200,
              },
              { title: "คำอธิบาย", dataIndex: "Description", width: 220 },
              {
                title: "เอกสาร",
                key: "local-open",
                width: 200,
                render: () => <LocalFileOpener />,
              },
            ]}
            dataSource={tableRows}
            rowKey="CurriculumID"
            pagination={false}
            rowClassName={(_record, index) =>
              index % 2 === 0 ? "table-row-light" : "table-row-dark"
            }
          />
        </div>

        {/* -------------------- Table Styles -------------------- */}
        <style>{`
          .table-row-light { background-color: #dad1d1ff; }
          .table-row-dark  { background-color: #dad1d1ff; }

          .custom-table-header .ant-table-thead > tr > th {
            background: #2e236c;
            color: #fff;
            font-weight: bold;
            font-size: 16px;
            border-bottom: 2px solid #ffffffff;
            border-right: 2px solid #ffffffff;
          }
          .custom-table-header .ant-table-tbody > tr > td {
            border-bottom: 2px solid #ffffffff;
            border-right: 2px solid #ffffffff;
          }
          .custom-table-header .ant-table-tbody > tr > td:last-child,
          .custom-table-header .ant-table-thead > tr > th:last-child {
            border-right: none;
          }
          .custom-table-header .ant-table-tbody > tr > td:hover {
            background-color: #dad1d1ff !important;
            transition: background 0.2s;
          }
        `}</style>
      </Content>
    </Layout>
  );
};

export default Add;
