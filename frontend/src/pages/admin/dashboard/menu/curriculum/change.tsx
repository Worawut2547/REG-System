// ====================================================================
// CHANGE.tsx — จัดการหลักสูตร + วิชา + ไฟล์เอกสาร (Book)
// ====================================================================

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

const { Content } = Layout;

// ====================== 1) แบบข้อมูลที่ใช้บนตาราง (Frontend) ======================
interface DataType {
  key: string;
  id: string; // curriculum_id
  name: string; // curriculum_name
  credit: number; // total_credit
  startYear: number; // start_year
  facultyId: string; // faculty_id
  subjectIds: string[]; // วิชาของหลักสูตร

  // ฟิลด์สำหรับไฟล์หลักสูตร
  bookId?: number; // curriculum_books.id (ถ้ามี)
  bookPath?: string; // path ที่เก็บไว้ (เผื่อแสดงชื่อไฟล์)
}

// ====== ใช้กำหนดชนิดคอลัมน์ editable ของ AntD Table ======
interface EditableColumnType extends ColumnType<DataType> {
  editable?: boolean;
  inputType?: "number" | "text" | "select" | "multiselect";
}

// ====================== 2) Services (เรียก API) ======================
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

// ✅ หนังสือ (ใช้ชุดเดียวกับหน้า Add)
import {
  registerBookByPath,
  getBookPreviewUrl,
} from "../../../../../services/https/book/books";

// ====================== 3) Helpers / normalizers ======================
type FacultyOpt = { id: string; name: string };
type SubjectOpt = { id: string; name: string };

const toFacultyOpt = (raw: unknown): FacultyOpt => {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? r.FacultyID ?? r.facultyId ?? r.faculty_id ?? ""),
    name: String(
      r.name ?? r.FacultyName ?? r.facultyName ?? r.faculty_name ?? ""
    ),
  };
};

const toSubjectOpt = (raw: unknown): SubjectOpt => {
  const r = raw as Record<string, unknown>;
  const id = String(
    r.subject_id ?? r.SubjectID ?? r.subject_code ?? r.SubjectCode ?? r.id ?? ""
  );
  const name = String(
    r.subject_name ?? r.SubjectName ?? r.name ?? r.title ?? r.Title ?? ""
  );
  return { id, name };
};

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];

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

const pickArray = (o: Record<string, unknown>, keys: string[]): unknown[] => {
  for (const k of keys) {
    const v = o[k];
    if (Array.isArray(v)) return v as unknown[];
  }
  return [];
};

const toStringId = (x: unknown): string => {
  if (typeof x === "string" || typeof x === "number") return String(x);
  if (typeof x === "object" && x !== null) {
    const rec = x as Record<string, unknown>;
    if (typeof rec.id === "string" || typeof rec.id === "number")
      return String(rec.id);
    if (typeof rec.SubjectID === "string" || typeof rec.SubjectID === "number")
      return String(rec.SubjectID);
    if (
      typeof rec.subject_id === "string" ||
      typeof rec.subject_id === "number"
    )
      return String(rec.subject_id);
  }
  return "";
};

// แปลง curriculum จาก BE → row ของตาราง (รองรับ book_id/book_path)
const toCurriculumRow = (raw: unknown): DataType => {
  const r = (raw ?? {}) as Record<string, unknown>;
  const subjectList = pickArray(r, ["subjectIds", "subjects"])
    .map(toStringId)
    .filter(Boolean);

  const bookIdNum = pickNumber(r, ["book_id", "BookID"], 0);
  const bPath = pickString(r, ["book_path", "BookPath"], "");

  return {
    key: pickString(
      r,
      ["curriculum_id", "CurriculumID", "id"],
      String(Date.now())
    ),
    id: pickString(r, ["curriculum_id", "CurriculumID", "id"], ""),
    name: pickString(r, ["curriculum_name", "CurriculumName", "name"], ""),
    credit: pickNumber(r, ["total_credit", "TotalCredit", "credit"], 0),
    startYear: pickNumber(r, ["start_year", "StartYear", "startYear"], 0),
    facultyId: pickString(r, ["faculty_id", "FacultyID"], ""),
    subjectIds: subjectList,
    bookId: bookIdNum > 0 ? bookIdNum : undefined,
    bookPath: bPath || undefined,
  };
};

// ===== path helpers (เหมือนหน้า Add) =====
const isFileUri = (s: string): boolean => /^file:\/\/\//i.test(s);
const isWindowsAbs = (s: string): boolean => /^[A-Za-z]:\\/.test(s);
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
const coerceToServerPath = (input: string): string | null => {
  const s = input.trim();
  if (!s) return null;
  if (isFileUri(s)) return fileUriToWindowsPath(s);
  if (isWindowsAbs(s)) return s;
  return null;
};
const baseName = (p?: string): string =>
  (p || "").replace(/\\/g, "/").split("/").pop() || "";

// ====================== 4) Context สำหรับ options ของ Select ======================
const OptionsCtx = React.createContext<{
  faculties: FacultyOpt[];
  subjects: SubjectOpt[];
}>({
  faculties: [],
  subjects: [],
});

// ====================== 5) Editable Cell ======================
type EditableCellProps = {
  record: DataType;
  editing: boolean;
  dataIndex: keyof DataType;
  title: React.ReactNode;
  inputType: "number" | "text" | "select" | "multiselect";
  children?: React.ReactNode;
};

const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  title,
  inputType,
  children,
  ...restProps
}) => {
  const { faculties, subjects } = useContext(OptionsCtx);

  let inputNode: React.ReactNode;
  if (inputType === "number")
    inputNode = <InputNumber style={{ width: "100%" }} />;
  else if (inputType === "text") inputNode = <Input />;
  else if (inputType === "select")
    inputNode = (
      <Select
        options={faculties.map((f) => ({ label: f.name, value: f.id }))}
        showSearch
        optionFilterProp="label"
        allowClear
      />
    );
  else if (inputType === "multiselect")
    inputNode = (
      <Select
        mode="multiple"
        options={subjects.map((s) => ({ label: s.name, value: s.id }))}
        showSearch
        optionFilterProp="label"
        allowClear
      />
    );
  else inputNode = <Input />;

  return (
    <td {...(restProps as React.HTMLAttributes<HTMLTableCellElement>)}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[{ required: true, message: `Please Input ${title}!` }]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

// ====================== 6) Component หลัก ======================
const CHANGE: React.FC = () => {
  const [form] = Form.useForm();

  // ------- data & options state -------
  const [data, setData] = useState<DataType[]>([]);
  const [faculties, setFaculties] = useState<FacultyOpt[]>([]);
  const [subjects, setSubjects] = useState<SubjectOpt[]>([]);

  // ------- ui state -------
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<React.Key>("");
  const [searchText, setSearchText] = useState<string>("");

  // modal เปลี่ยนไฟล์
  const [bookModal, setBookModal] = useState<{
    open: boolean;
    target?: DataType;
    value: string;
    submitting?: boolean;
  }>({ open: false, value: "" });

  // map สำหรับแปลง id → ชื่อเวลา render
  const facultyMap = useMemo(
    () =>
      faculties.reduce(
        (acc, cur) => ({ ...acc, [cur.id]: cur.name }),
        {} as Record<string, string>
      ),
    [faculties]
  );
  const subjectMap = useMemo(
    () =>
      subjects.reduce(
        (acc, cur) => ({ ...acc, [cur.id]: cur.name }),
        {} as Record<string, string>
      ),
    [subjects]
  );

  const isEditing = (record: DataType) => record.key === editingKey;

  // ------- โหลดข้อมูลจริงทั้งหมด -------
  const loadAll = async () => {
    setLoading(true);
    try {
      const [facRes, subRes, curRes, scRes] = await Promise.all([
        getFacultyAll(),
        getSubjectAll(),
        getCurriculumAll(),
        getSubjectCurriculumAll(),
      ]);

      setFaculties((Array.isArray(facRes) ? facRes : []).map(toFacultyOpt));
      setSubjects((Array.isArray(subRes) ? subRes : []).map(toSubjectOpt));

      // index: curriculumId -> Set(subjectId)
      const idx: Record<string, Set<string>> = {};
      for (const link of (Array.isArray(scRes)
        ? scRes
        : []) as SubjectCurriculumInterface[]) {
        const rec = link as unknown as Record<string, unknown>;
        const cId = pickString(
          rec,
          ["curriculum_id", "CurriculumID", "major_id", "MajorID"],
          ""
        );
        const sId = pickString(
          rec,
          ["subject_id", "SubjectID", "subject_code", "SubjectCode"],
          ""
        );
        if (!cId || !sId) continue;
        if (!idx[cId]) idx[cId] = new Set<string>();
        idx[cId].add(sId);
      }

      const baseRows = (Array.isArray(curRes) ? curRes : []).map(
        toCurriculumRow
      );
      const rowsWithSubjects = baseRows.map((it) => ({
        ...it,
        subjectIds: Array.from(idx[it.id] ?? new Set<string>()),
      }));

      setData(rowsWithSubjects);
    } catch (err) {
      console.error(err);
      message.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ------- วางฟังก์ชันรีเฟรช subjects เฉพาะหลักสูตร -------
  const refreshSubjectsFor = async (curriculumId: string): Promise<void> => {
    const allLinks = await getSubjectCurriculumAll();
    const ids = (Array.isArray(allLinks) ? allLinks : [])
      .map((x) => x as unknown as Record<string, unknown>)
      .filter(
        (rec) =>
          pickString(
            rec,
            ["curriculum_id", "CurriculumID", "major_id", "MajorID"],
            ""
          ) === curriculumId
      )
      .map((rec) =>
        pickString(
          rec,
          ["subject_id", "SubjectID", "subject_code", "SubjectCode"],
          ""
        )
      )
      .filter(Boolean);

    setData((prev) =>
      prev.map((it) =>
        it.id === curriculumId ? { ...it, subjectIds: ids } : it
      )
    );
  };

  // ------- ฟังก์ชันแก้ไขแถว -------
  const edit = (record: DataType) => {
    form.setFieldsValue({
      name: record.name,
      credit: record.credit,
      startYear: record.startYear,
      facultyId: record.facultyId,
      subjectIds: record.subjectIds,
    });
    setEditingKey(record.key);
  };

  const cancel = () => setEditingKey("");

  const save = async (key: React.Key) => {
    try {
      const row = (await form.validateFields()) as Partial<DataType>;
      const current = data.find((d) => d.key === key);
      if (!current) return;

      const patch: CurriculumUpdateDTO = {
        curriculum_name: (row.name ?? current.name) || undefined,
        total_credit: row.credit ?? current.credit ?? undefined,
        start_year: row.startYear ?? current.startYear ?? undefined,
        faculty_id: (row.facultyId ?? current.facultyId) || undefined,
      };
      (Object.keys(patch) as (keyof CurriculumUpdateDTO)[]).forEach((k) => {
        if (patch[k] === undefined) delete patch[k];
      });
      if (Object.keys(patch).length > 0)
        await updateCurriculum(current.id, patch);

      const nextSubjects = asStringArray(row.subjectIds ?? current.subjectIds);
      const prevSubjects = current.subjectIds ?? [];

      const toAdd = nextSubjects.filter((id) => !prevSubjects.includes(id));
      const toDel = prevSubjects.filter((id) => !nextSubjects.includes(id));

      if (toAdd.length > 0) {
        await Promise.all(
          toAdd.map((sid) =>
            createSubjectCurriculum({
              SubjectID: String(sid),
              CurriculumID: String(current.id),
            })
          )
        );
      }
      if (toDel.length > 0) {
        await Promise.all(
          toDel.map((sid) =>
            deleteSubjectCurriculumByPair({
              subjectId: String(sid),
              curriculumId: String(current.id),
            })
          )
        );
      }

      await refreshSubjectsFor(current.id);

      setData((prev) =>
        prev.map((it) =>
          it.key === key
            ? {
                ...it,
                name: patch.curriculum_name ?? it.name,
                credit: (patch.total_credit as number | undefined) ?? it.credit,
                startYear:
                  (patch.start_year as number | undefined) ?? it.startYear,
                facultyId: patch.faculty_id ?? it.facultyId,
              }
            : it
        )
      );

      setEditingKey("");
      message.success("บันทึกสำเร็จ");
    } catch (err) {
      console.error(err);
      message.error("บันทึกไม่สำเร็จ");
    }
  };

  // ลบหลักสูตร (ทั้งแถว)
  const handleDelete = async (key: React.Key) => {
    const target = data.find((d) => d.key === key);
    if (!target) return;
    try {
      await deleteCurriculum(target.id);
      setData((prev) => prev.filter((item) => item.key !== key));
      message.success("ลบสำเร็จ");
    } catch (err) {
      console.error(err);
      message.error("ลบไม่สำเร็จ");
    }
  };

  // ==================== ฟังก์ชันเฉพาะคอลัมน์ Book ====================
  const openChangeBookModal = (record: DataType) => {
    setBookModal({ open: true, target: record, value: "" });
  };

  const handleRegisterBook = async () => {
    const target = bookModal.target;
    if (!target) return;
    const raw = (bookModal.value || "").trim();

    const serverPath = coerceToServerPath(raw);
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
      await registerBookByPath(serverPath, target.id);
      message.success("บันทึกเอกสารสำเร็จ");
      setBookModal({ open: false, value: "" });
      await loadAll();
    } catch (e) {
      console.error(e);
      message.error("บันทึกเอกสารไม่สำเร็จ");
    } finally {
      setBookModal((s) => ({ ...s, submitting: false }));
    }
  };

  const filteredData = useMemo(
    () =>
      data.filter(
        (item) =>
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (facultyMap[item.facultyId] || "")
            .toLowerCase()
            .includes(searchText.toLowerCase())
      ),
    [data, facultyMap, searchText]
  );

  // ------- คอลัมน์ตาราง -------
  const columns: EditableColumnType[] = [
    { title: "ชื่อหลักสูตร", dataIndex: "name", width: 260, editable: true },
    { title: "หน่วยกิจรวม", dataIndex: "credit", width: 140, editable: true },
    { title: "ปีที่เริ่มหลักสูตร", dataIndex: "startYear", width: 160, editable: true },
    {
      title: "คณะ",
      dataIndex: "facultyId",
      width: 220,
      editable: true,
      render: (facultyId: string) => facultyMap[facultyId] || "-",
    },
    {
      title: "รายวิชา",
      dataIndex: "subjectIds",
      width: 320,
      editable: true,
      render: (ids: string[]) =>
        (ids || []).map((id) => subjectMap[id] || id).join(", "),
    },

    // ------------- Book Column -------------
    {
      title: "เล่มหลักสูตร",
      dataIndex: "bookPath",
      width: 360,
      render: (_: string | undefined, record: DataType) => {
        const previewUrl =
          typeof record.bookId === "number" && record.bookId > 0
            ? getBookPreviewUrl(record.bookId)
            : undefined;

        const editing = isEditing(record);

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* ยังไม่แก้ไข → ปุ่ม 'ดูหลักสูตร' / กำลังแก้ไข → ปุ่ม 'เปลี่ยน' */}
            {editing ? (
              <Button size="small" onClick={() => openChangeBookModal(record)}>
                เปลี่ยน
              </Button>
            ) : (
              <Button
                size="small"
                disabled={!previewUrl}
                onClick={() =>
                  previewUrl &&
                  window.open(previewUrl, "_blank", "noopener,noreferrer")
                }
              >
                ดูหลักสูตร
              </Button>
            )}

            {/* ชื่อไฟล์ (ถ้ามี) */}
            <span style={{ color: "#888" }}>{baseName(record.bookPath)}</span>
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
            <Typography.Link
              onClick={() => save(record.key)}
              style={{ marginInlineEnd: 8, fontSize: 12 }}
            >
              Save
            </Typography.Link>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <a style={{ fontSize: 12 }}>Cancel</a>
            </Popconfirm>
          </span>
        ) : (
          <Typography.Link
            disabled={editingKey !== ""}
            onClick={() => edit(record)}
          >
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
        <Popconfirm
          title="Sure to delete?"
          onConfirm={() => handleDelete(record.key)}
        >
          <a>Delete</a>
        </Popconfirm>
      ),
    },
  ];

  // ----- แยกชนิดคอลัมน์ที่เป็น data column -----
  type DataColumn = Extract<
    ColumnsType<DataType>[number],
    ColumnType<DataType>
  > & {
    editable?: boolean;
  };

  const isDataColumn = (
    col: ColumnsType<DataType>[number]
  ): col is DataColumn => (col as ColumnType<DataType>).dataIndex !== undefined;

  // ----- ผูก onCell สำหรับ editable -----
  const mergedColumns: ColumnsType<DataType> = columns.map((col) => {
    if (!isDataColumn(col) || !col.editable) return col;

    const getInputType = (dataIndex: keyof DataType) =>
      dataIndex === "credit" || dataIndex === "startYear"
        ? "number"
        : dataIndex === "facultyId"
        ? "select"
        : dataIndex === "subjectIds"
        ? "multiselect"
        : "text";

    return {
      ...col,
      onCell: (record: DataType) =>
        ({
          record,
          inputType: getInputType(col.dataIndex as keyof DataType),
          dataIndex: col.dataIndex as keyof DataType,
          title: col.title as React.ReactNode,
          editing: record.key === editingKey,
        } as unknown as React.HTMLAttributes<HTMLTableCellElement>),
    } as ColumnType<DataType>;
  });

  // ====================== 7) Render ======================
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: 24 }}>
        <OptionsCtx.Provider value={{ faculties, subjects }}>
          <Form form={form} component={false}>
            <Input
              placeholder="ค้นหาด้วยชื่อหลักสูตร หรือ คณะ"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ marginBottom: 16, width: 420, height: 40, fontSize: 16 }}
              prefix={<SearchOutlined />}
              allowClear
            />
            <Table<DataType>
              components={{ body: { cell: EditableCell } }}
              bordered
              className="custom-table-header"
              dataSource={filteredData}
              columns={mergedColumns}
              rowKey="key"
              loading={loading}
              pagination={{ onChange: () => setEditingKey("") }}
              rowClassName={(_rec, i) =>
                i % 2 === 0 ? "table-row-light" : "table-row-dark"
              }
              // sticky
              // scroll={{ x: "max-content" }}
              // tableLayout="auto"
            />
          </Form>
        </OptionsCtx.Provider>

        {/* Modal เปลี่ยนไฟล์ (วาง path) */}
        <Modal
          open={bookModal.open}
          title={
            bookModal.target
              ? `เปลี่ยนเอกสาร: ${bookModal.target.name}`
              : "เปลี่ยนเอกสาร"
          }
          okText="บันทึก"
          cancelText="ยกเลิก"
          confirmLoading={bookModal.submitting}
          onOk={handleRegisterBook}
          onCancel={() => setBookModal({ open: false, value: "" })}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Input
              placeholder="file:///C:/.../xxx.pdf หรือ C:\...\xxx.pdf"
              value={bookModal.value}
              onChange={(e) =>
                setBookModal((s) => ({ ...s, value: e.target.value }))
              }
            />
            <Typography.Text type="secondary">
              วาง path ของไฟล์ .pdf ที่อยู่บนเครื่อง Server
            </Typography.Text>
          </div>
        </Modal>

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

export default CHANGE;