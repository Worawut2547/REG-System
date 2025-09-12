// === Imports ===
import React, { useEffect, useMemo, useState, useContext } from "react";
import {
  Layout,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Table,
  Typography,
  Select,
  message,
  Modal,
  Button,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";
import {
  getSubjectCurriculumAll,
  createSubjectCurriculum,
  deleteSubjectCurriculumByPair,
} from "../../../../../services/https/SubjectCurriculum/subjectcurriculum";
import type { SubjectCurriculumInterface } from "../../../../../interfaces/SubjectCurriculum";
import { getFacultyAll } from "../../../../../services/https/faculty/faculty";
import { getSubjectAll } from "../../../../../services/https/subject/subjects";
import type { CurriculumUpdateDTO } from "../../../../../services/https/curriculum/curriculum";
import {
  getCurriculumAll,
  updateCurriculum,
  deleteCurriculum,
} from "../../../../../services/https/curriculum/curriculum";
import {
  registerBookByPath,
  getBookPreviewUrl,
} from "../../../../../services/https/book/books";

// === Constants/Env ===
const { Content } = Layout;

// === Types/Interfaces ===
interface DataType {
  key: string;
  id: string;
  name: string;
  credit: number;
  startYear: number;
  facultyId: string;
  subjectIds: string[];
  bookId?: number;
  bookPath?: string;
}
interface EditableColumnType extends ColumnType<DataType> {
  editable?: boolean;
  inputType?: "number" | "text" | "select" | "multiselect";
}
type FacultyOpt = { id: string; name: string };
type SubjectOpt = { id: string; name: string };

// === Utils/Helpers ===
// อันนี้แปลงค่าอะไรก็ได้ → string[] (กัน null/undefined)
const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];

// ดึง string ตัวแรกที่เจอจากชุดคีย์ (รองรับ API หลายรูปแบบ)
const pickString = (o: Record<string, unknown>, keys: string[], def = ""): string => {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" || typeof v === "number") return String(v);
  }
  return def;
};

// ดึง number ตัวแรกที่เจอจากชุดคีย์ (แถมแปลงจาก string ถ้าเป็นตัวเลข)
const pickNumber = (o: Record<string, unknown>, keys: string[], def = 0): number => {
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

// ดึง array จากหลายคีย์ (เผื่อ API ตั้งชื่อไม่เหมือนกัน)
const pickArray = (o: Record<string, unknown>, keys: string[]): unknown[] => {
  for (const k of keys) {
    const v = o[k];
    if (Array.isArray(v)) return v as unknown[];
  }
  return [];
};

// บังคับให้ได้ id เป็น string (รองรับรูปแบบ field หลายแบบ)
const toStringId = (x: unknown): string => {
  if (typeof x === "string" || typeof x === "number") return String(x);
  if (typeof x === "object" && x !== null) {
    const rec = x as Record<string, unknown>;
    if (typeof rec.id === "string" || typeof rec.id === "number") return String(rec.id);
    if (typeof rec.SubjectID === "string" || typeof rec.SubjectID === "number") return String(rec.SubjectID);
    if (typeof rec.subject_id === "string" || typeof rec.subject_id === "number") return String(rec.subject_id);
  }
  return "";
};

// map faculty จาก raw → ตัวเลือกใน Select
const toFacultyOpt = (raw: unknown): FacultyOpt => {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? r.FacultyID ?? r.facultyId ?? r.faculty_id ?? ""),
    name: String(r.name ?? r.FacultyName ?? r.facultyName ?? r.faculty_name ?? ""),
  };
};

// map subject จาก raw → ตัวเลือกใน Select
const toSubjectOpt = (raw: unknown): SubjectOpt => {
  const r = raw as Record<string, unknown>;
  const id = String(r.subject_id ?? r.SubjectID ?? r.subject_code ?? r.SubjectCode ?? r.id ?? "");
  const name = String(r.subject_name ?? r.SubjectName ?? r.name ?? r.title ?? r.Title ?? "");
  return { id, name };
};

// map curriculum จาก raw → แถวในตาราง
const toCurriculumRow = (raw: unknown): DataType => {
  const r = (raw ?? {}) as Record<string, unknown>;
  const subjectList = pickArray(r, ["subjectIds", "subjects"]).map(toStringId).filter(Boolean);
  const bookIdNum = pickNumber(r, ["book_id", "BookID"], 0);
  const bPath = pickString(r, ["book_path", "BookPath"], "");
  return {
    key: pickString(r, ["curriculum_id", "CurriculumID", "id"], String(Date.now())), // key แถว
    id: pickString(r, ["curriculum_id", "CurriculumID", "id"], ""),                 // pk จริง
    name: pickString(r, ["curriculum_name", "CurriculumName", "name"], ""),
    credit: pickNumber(r, ["total_credit", "TotalCredit", "credit"], 0),
    startYear: pickNumber(r, ["start_year", "StartYear", "startYear"], 0),
    facultyId: pickString(r, ["faculty_id", "FacultyID"], ""),
    subjectIds: subjectList,
    bookId: bookIdNum > 0 ? bookIdNum : undefined,
    bookPath: bPath || undefined,
  };
};

// เช็ค path แบบต่าง ๆ (เตรียมรับจาก client)
const isFileUri = (s: string): boolean => /^file:\/\/\//i.test(s);
const isWindowsAbs = (s: string): boolean => /^[A-Za-z]:\\/.test(s);

// แปลง file:///C:/... → C:\...
const fileUriToWindowsPath = (uri: string): string | null => {
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
};

// บังคับให้เหลือ path ฝั่ง server เท่านั้น
const coerceToServerPath = (input: string): string | null => {
  const s = input.trim();
  if (!s) return null;
  if (isFileUri(s)) return fileUriToWindowsPath(s);
  if (isWindowsAbs(s)) return s;
  return null;
};

// ตัด basename มาโชว์
const baseName = (p?: string): string => (p || "").replace(/\\/g, "/").split("/").pop() || "";

// === Context ===
// เก็บ options ไว้ให้ EditableCell หยิบใช้ (ไม่ต้อง drill props)
const OptionsCtx = React.createContext<{ faculties: FacultyOpt[]; subjects: SubjectOpt[] }>({
  faculties: [],
  subjects: [],
});

// === Editable Cell ===
type EditableCellProps = {
  record: DataType;
  editing: boolean;
  dataIndex: keyof DataType;
  title: React.ReactNode;
  inputType: "number" | "text" | "select" | "multiselect";
  children?: React.ReactNode;
};

// เซลล์แก้ไข: เปลี่ยน input ตามชนิดคอลัมน์
const EditableCell: React.FC<EditableCellProps> = ({ editing, dataIndex, title, inputType, children, ...restProps }) => {
  const { faculties, subjects } = useContext(OptionsCtx);
  let inputNode: React.ReactNode;
  if (inputType === "number") inputNode = <InputNumber style={{ width: "100%" }} />; // ช่องตัวเลข
  else if (inputType === "text") inputNode = <Input />; // ช่องข้อความ
  else if (inputType === "select")
    inputNode = (
      <Select
        options={faculties.map((f) => ({ label: f.name, value: f.id }))}
        showSearch
        optionFilterProp="label"
        allowClear
      />
    ); // เลือกคณะ
  else if (inputType === "multiselect")
    inputNode = (
      <Select
        mode="multiple"
        options={subjects.map((s) => ({ label: s.name, value: s.id }))}
        showSearch
        optionFilterProp="label"
        allowClear
      />
    ); // เลือกหลายวิชา
  else inputNode = <Input />;

  return (
    <td {...(restProps as React.HTMLAttributes<HTMLTableCellElement>)}>
      {editing ? (
        // rules required แบบรวบรัดพอเตือนตัวเอง
        <Form.Item name={dataIndex} style={{ margin: 0 }} rules={[{ required: true, message: `Please Input ${title}!` }]}>
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

// === Component ===
const CHANGE: React.FC = () => {
  // === State ===
  const [form] = Form.useForm();
  const [data, setData] = useState<DataType[]>([]); // แถวในตาราง
  const [faculties, setFaculties] = useState<FacultyOpt[]>([]); // ตัวเลือกคณะ
  const [subjects, setSubjects] = useState<SubjectOpt[]>([]); // ตัวเลือกวิชา
  const [loading, setLoading] = useState(false); // โหลดรวม
  const [editingKey, setEditingKey] = useState<React.Key>(""); // pk แถวที่กำลังแก้
  const [searchText, setSearchText] = useState<string>(""); // ข้อความค้นหา
  const [bookModal, setBookModal] = useState<{ open: boolean; target?: DataType; value: string; submitting?: boolean }>({
    open: false,
    value: "",
  }); // modal เปลี่ยนไฟล์ pdf

  // === Derived Maps ===
  const facultyMap = useMemo(
    () => faculties.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.name }), {} as Record<string, string>),
    [faculties]
  ); // id → ชื่อคณะ
  const subjectMap = useMemo(
    () => subjects.reduce((acc, cur) => ({ ...acc, [cur.id]: cur.name }), {} as Record<string, string>),
    [subjects]
  ); // id → ชื่อวิชา
  const isEditing = (record: DataType) => record.key === editingKey; // เช็คแถวกำลังแก้

  // === Data Loaders ===
  const loadAll = async () => {
    setLoading(true);
    try {
      // ยิงทุกอย่างคู่ขนานทีเดียว
      const [facRes, subRes, curRes, scRes] = await Promise.all([getFacultyAll(), getSubjectAll(), getCurriculumAll(), getSubjectCurriculumAll()]);
      setFaculties((Array.isArray(facRes) ? facRes : []).map(toFacultyOpt)); // เก็บ options คณะ
      setSubjects((Array.isArray(subRes) ? subRes : []).map(toSubjectOpt)); // เก็บ options วิชา

      // รวมลิงก์ หลักสูตร↔วิชา เป็น index: curriculumId → Set(subjectId)
      const idx: Record<string, Set<string>> = {};
      for (const link of (Array.isArray(scRes) ? scRes : []) as SubjectCurriculumInterface[]) {
        const rec = link as unknown as Record<string, unknown>;
        const cId = pickString(rec, ["curriculum_id", "CurriculumID", "major_id", "MajorID"], "");
        const sId = pickString(rec, ["subject_id", "SubjectID", "subject_code", "SubjectCode"], "");
        if (!cId || !sId) continue;
        if (!idx[cId]) idx[cId] = new Set<string>();
        idx[cId].add(sId);
      }

      // map หลักสูตร → แถวตาราง + ผูกรายวิชาที่เจอ
      const baseRows = (Array.isArray(curRes) ? curRes : []).map(toCurriculumRow);
      const rowsWithSubjects = baseRows.map((it) => ({ ...it, subjectIds: Array.from(idx[it.id] ?? new Set<string>()) }));
      setData(rowsWithSubjects);
    } catch {
      message.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  // === Effects ===
  useEffect(() => {
    loadAll(); // เปิดหน้าแล้วดึงข้อมูลชุดใหญ่
  }, []);

  // === Helpers (Component) ===
  const refreshSubjectsFor = async (curriculumId: string): Promise<void> => {
    // ดึงลิงก์ใหม่เฉพาะหลักสูตรนี้ (หลัง add/del)
    const allLinks = await getSubjectCurriculumAll();
    const ids = (Array.isArray(allLinks) ? allLinks : [])
      .map((x) => x as unknown as Record<string, unknown>)
      .filter((rec) => pickString(rec, ["curriculum_id", "CurriculumID", "major_id", "MajorID"], "") === curriculumId)
      .map((rec) => pickString(rec, ["subject_id", "SubjectID", "subject_code", "SubjectCode"], ""))
      .filter(Boolean);
    setData((prev) => prev.map((it) => (it.id === curriculumId ? { ...it, subjectIds: ids } : it)));
  };

  // === Handlers ===
  const edit = (record: DataType) => {
    // กดแก้ไข → อัดค่าเดิมเข้า form
    form.setFieldsValue({
      name: record.name,
      credit: record.credit,
      startYear: record.startYear,
      facultyId: record.facultyId,
      subjectIds: record.subjectIds,
    });
    setEditingKey(record.key);
  };

  const cancel = () => setEditingKey(""); // ยกเลิกแก้ไข

  const save = async (key: React.Key) => {
    try {
      // validate ก่อนยิง
      const row = (await form.validateFields()) as Partial<DataType>;
      const current = data.find((d) => d.key === key);
      if (!current) return;

      // เตรียม patch เฉพาะฟิลด์ที่เปลี่ยน (อย่าส่ง null มั่ว ๆ)
      const patch: CurriculumUpdateDTO = {
        curriculum_name: (row.name ?? current.name) || undefined,
        total_credit: row.credit ?? current.credit ?? undefined,
        start_year: row.startYear ?? current.startYear ?? undefined,
        faculty_id: (row.facultyId ?? current.facultyId) || undefined,
      };
      (Object.keys(patch) as (keyof CurriculumUpdateDTO)[]).forEach((k) => {
        if (patch[k] === undefined) delete patch[k];
      });
      if (Object.keys(patch).length > 0) await updateCurriculum(current.id, patch); // ส่งไปหลังบ้าน

      // diff รายวิชา → คิดเพิ่ม/ลบเป็นรายการ
      const nextSubjects = asStringArray(row.subjectIds ?? current.subjectIds);
      const prevSubjects = current.subjectIds ?? [];
      const toAdd = nextSubjects.filter((id) => !prevSubjects.includes(id));
      const toDel = prevSubjects.filter((id) => !nextSubjects.includes(id));

      // เพิ่มลิงก์ที่ยังไม่มี
      if (toAdd.length > 0) {
        await Promise.all(
          toAdd.map((sid) => createSubjectCurriculum({ SubjectID: String(sid), CurriculumID: String(current.id) }))
        );
      }
      // ลบลิงก์ที่ไม่ต้องการแล้ว
      if (toDel.length > 0) {
        await Promise.all(
          toDel.map((sid) => deleteSubjectCurriculumByPair({ subjectId: String(sid), curriculumId: String(current.id) }))
        );
      }

      await refreshSubjectsFor(current.id); // รีดึงเฉพาะวิชาของหลักสูตรนี้

      // อัปเดต state ฝั่งหน้าให้ตรงกับ patch
      setData((prev) =>
        prev.map((it) =>
          it.key === key
            ? {
                ...it,
                name: patch.curriculum_name ?? it.name,
                credit: (patch.total_credit as number | undefined) ?? it.credit,
                startYear: (patch.start_year as number | undefined) ?? it.startYear,
                facultyId: patch.faculty_id ?? it.facultyId,
              }
            : it
        )
      );
      setEditingKey("");
      message.success("บันทึกสำเร็จ");
    } catch {
      message.error("บันทึกไม่สำเร็จ");
    }
  };

  const handleDelete = async (key: React.Key) => {
    // ลบหลักสูตร (ทั้งแถว)
    const target = data.find((d) => d.key === key);
    if (!target) return;
    try {
      await deleteCurriculum(target.id);
      setData((prev) => prev.filter((item) => item.key !== key));
      message.success("ลบสำเร็จ");
    } catch {
      message.error("ลบไม่สำเร็จ");
    }
  };

  const openChangeBookModal = (record: DataType) => setBookModal({ open: true, target: record, value: "" }); // เปิด modal เปลี่ยนไฟล์

  const handleRegisterBook = async () => {
    // กดบันทึกไฟล์ PDF สำหรับหลักสูตรนี้
    const target = bookModal.target;
    if (!target) return;
    const raw = (bookModal.value || "").trim();
    const serverPath = coerceToServerPath(raw); // ต้องเป็น path ฝั่ง server เท่านั้น
    if (!serverPath) {
      message.warning("ต้องเป็น file:///C:/... หรือ C:\\... และลงท้าย .pdf");
      return;
    }
    if (!/\.pdf$/i.test(serverPath)) {
      message.warning("รองรับเฉพาะไฟล์ .pdf");
      return;
    }
    try {
      setBookModal((s) => ({ ...s, submitting: true }));
      await registerBookByPath(serverPath, target.id); // ส่งไปหลังบ้านลงทะเบียนไฟล์
      message.success("บันทึกเอกสารสำเร็จ");
      setBookModal({ open: false, value: "" });
      await loadAll(); // รีโหลดข้อมูลเพื่อให้ bookPath/bookId อัปเดต
    } catch {
      message.error("บันทึกเอกสารไม่สำเร็จ");
    } finally {
      setBookModal((s) => ({ ...s, submitting: false }));
    }
  };

  const filteredData = useMemo(
    () =>
      // ค้นหาจากชื่อหลักสูตร + ชื่อคณะ
      data.filter(
        (item) =>
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (facultyMap[item.facultyId] || "").toLowerCase().includes(searchText.toLowerCase())
      ),
    [data, facultyMap, searchText]
  );

  // === Table Columns ===
  const columns: EditableColumnType[] = [
    { title: "ชื่อหลักสูตร", dataIndex: "name", width: 260, editable: true }, // แก้ชื่อ
    { title: "หน่วยกิจรวม", dataIndex: "credit", width: 140, editable: true }, // แก้หน่วยกิต
    { title: "ปีที่เริ่มหลักสูตร", dataIndex: "startYear", width: 160, editable: true }, // แก้ปีเริ่ม
    {
      title: "คณะ",
      dataIndex: "facultyId",
      width: 220,
      editable: true, // เลือกคณะจาก dropdown
      render: (facultyId: string) => facultyMap[facultyId] || "-",
    },
    {
      title: "รายวิชา",
      dataIndex: "subjectIds",
      width: 320,
      editable: true, // multi-select รายวิชา
      render: (ids: string[]) => (ids || []).map((id) => subjectMap[id] || id).join(", "),
    },
    {
      title: "เล่มหลักสูตร",
      dataIndex: "bookPath",
      width: 360,
      render: (_: string | undefined, record: DataType) => {
        const previewUrl =
          typeof record.bookId === "number" && record.bookId > 0 ? getBookPreviewUrl(record.bookId) : undefined; // ลิงก์ดู pdf
        const editing = isEditing(record);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {editing ? (
              // โหมดแก้ไข → ให้กดเปลี่ยนไฟล์
              <Button size="small" onClick={() => openChangeBookModal(record)}>เปลี่ยน</Button>
            ) : (
              // โหมดดู → เปิด pdf ในแท็บใหม่
              <Button
                size="small"
                disabled={!previewUrl}
                onClick={() => previewUrl && window.open(previewUrl, "_blank", "noopener,noreferrer")}
              >
                ดูหลักสูตร
              </Button>
            )}
            <span style={{ color: "#888" }}>{baseName(record.bookPath)}</span> {/* โชว์ชื่อไฟล์ท้าย ๆ */}
          </div>
        );
      },
    },
    {
      title: "แก้ไข",
      dataIndex: "edit",
      width: 120,
      render: (_: unknown, record: DataType) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            {/* เซฟแถวนี้ */}
            <Typography.Link onClick={() => save(record.key)} style={{ marginInlineEnd: 8, fontSize: 12 }}>
              Save
            </Typography.Link>
            {/* ยกเลิกแก้ไข */}
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <a style={{ fontSize: 12 }}>Cancel</a>
            </Popconfirm>
          </span>
        ) : (
          // เข้าสู่โหมดแก้ไข
          <Typography.Link disabled={editingKey !== ""} onClick={() => edit(record)}>
            Edit
          </Typography.Link>
        );
      },
    },
    {
      title: "ลบ",
      dataIndex: "delete",
      width: 120,
      render: (_: unknown, record: DataType) => (
        // ลบทั้งแถว (ยืนยันก่อน)
        <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record.key)}>
          <a>Delete</a>
        </Popconfirm>
      ),
    },
  ];

  // === Editable Column Wiring ===
  type DataColumn = Extract<ColumnsType<DataType>[number], ColumnType<DataType>> & { editable?: boolean };
  const isDataColumn = (col: ColumnsType<DataType>[number]): col is DataColumn =>
    (col as ColumnType<DataType>).dataIndex !== undefined;

  const mergedColumns: ColumnsType<DataType> = columns.map((col) => {
    if (!isDataColumn(col) || !col.editable) return col;
    const getInputType = (dataIndex: keyof DataType) =>
      dataIndex === "credit" || dataIndex === "startYear"
        ? "number"        // ตัวเลข
        : dataIndex === "facultyId"
        ? "select"        // เลือกคณะ
        : dataIndex === "subjectIds"
        ? "multiselect"   // เลือกหลายวิชา
        : "text";         // อื่น ๆ เป็นข้อความ
    return {
      ...col,
      onCell: (record: DataType) =>
        ({
          record,
          inputType: getInputType(col.dataIndex as keyof DataType),
          dataIndex: col.dataIndex as keyof DataType,
          title: col.title as React.ReactNode,
          editing: record.key === editingKey, // ให้ cell รู้ว่าตัวเอง editable ไหม
        } as unknown as React.HTMLAttributes<HTMLTableCellElement>),
    } as ColumnType<DataType>;
  });

  // === Render ===
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: 24 }}>
        <OptionsCtx.Provider value={{ faculties, subjects }}>
          <Form form={form} component={false}>
            {/* ช่องค้นหา (ชื่อหลักสูตร/คณะ) */}
            <Input
              placeholder="ค้นหาด้วยชื่อหลักสูตร หรือ คณะ"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ marginBottom: 16, width: 420, height: 40, fontSize: 16 }}
              prefix={<SearchOutlined />}
              allowClear
            />
            <Table<DataType>
              components={{ body: { cell: EditableCell } }} // ใช้เซลล์แก้ไขเอง
              bordered
              className="custom-table-header"
              dataSource={filteredData}
              columns={mergedColumns}
              rowKey="key"
              loading={loading}
              pagination={{ onChange: () => setEditingKey("") }} // เปลี่ยนหน้าแล้วออกจากโหมดแก้
              rowClassName={(_rec, i) => (i % 2 === 0 ? "table-row-light" : "table-row-dark")}
            />
          </Form>
        </OptionsCtx.Provider>

        {/* modal เปลี่ยนไฟล์ PDF ของหลักสูตร */}
        <Modal
          open={bookModal.open}
          title={bookModal.target ? `เปลี่ยนเอกสาร: ${bookModal.target.name}` : "เปลี่ยนเอกสาร"}
          okText="บันทึก"
          cancelText="ยกเลิก"
          confirmLoading={bookModal.submitting}
          onOk={handleRegisterBook} // กดแล้วส่ง path ไปลงทะเบียน
          onCancel={() => setBookModal({ open: false, value: "" })}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Input
              placeholder="file:///C:/.../xxx.pdf หรือ C:\...\xxx.pdf"
              value={bookModal.value}
              onChange={(e) => setBookModal((s) => ({ ...s, value: e.target.value }))} // เก็บ path ชั่วคราว
            />
            <Typography.Text type="secondary">วาง path ของไฟล์ .pdf ที่อยู่บนเครื่อง Server</Typography.Text>
          </div>
        </Modal>

        <style>{`
          :root { --grid-color: #f0e9e9ff; }
          .custom-table-header .ant-table-thead > tr > th {
            border-right: 1px solid var(--grid-color) !important;
            border-bottom: 1px solid var(--grid-color) !important;
          }
          .custom-table-header .ant-table-tbody > tr > td {
            border-right: 1px solid var(--grid-color) !important;
            border-bottom: 1px solid var(--grid-color) !important;
          }
          .custom-table-header .ant-table-thead > tr > th::before {
            background: transparent !important;
            width: 0 !important;
          }
          .custom-table-header .ant-table-sticky-holder .ant-table-thead > tr > th::before {
            background: transparent !important;
            width: 0 !important;
          }
          .custom-table-header .ant-table-thead > tr > th::after { display: none !important; }
          .custom-table-header .ant-table { --ant-table-header-column-split-color: transparent; }
        `}</style>
      </Content>
    </Layout>
  );
};

// === Export ===
export default CHANGE;
