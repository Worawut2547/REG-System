// ====================================================================
// CHANGE.tsx — ดึง/แก้/ลบ "หลักสูตร" + จัดรายการวิชาในหลักสูตร (ไม่ใช้ PK link)
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
  syllabusUrl: string; // book_path
}

// ====== ใช้กำหนดชนิดคอลัมน์ editable ของ AntD Table ======
interface EditableColumnType extends ColumnType<DataType> {
  editable?: boolean;
  inputType?: "number" | "text" | "select" | "multiselect";
}

// ====================== 2) Services (เรียก API) ======================
// NOTE: ปรับ path import ให้ตรงโปรเจ็กต์จริงของคุณ (ตัวพิมพ์เล็ก/ใหญ่ต้องตรง)
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

// ====================== 3) Normalizer / helpers ======================
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

// แปลง curriculum จาก BE → row ของตาราง
const toCurriculumRow = (raw: unknown): DataType => {
  const r = (raw ?? {}) as Record<string, unknown>;
  const subjectList = pickArray(r, ["subjectIds", "subjects"])
    .map(toStringId)
    .filter(Boolean);

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
    syllabusUrl: pickString(r, ["book_path", "syllabusUrl", "url"], ""),
  };
};

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
        getSubjectCurriculumAll(), // ลิงก์ทั้งหมด
      ]);

      setFaculties((Array.isArray(facRes) ? facRes : []).map(toFacultyOpt));
      setSubjects((Array.isArray(subRes) ? subRes : []).map(toSubjectOpt));

      // index: curriculumId -> Set(subjectId)
      // สร้าง index: curriculumId (หรือ majorId) -> Set(subjectId)
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

      // แปลง curriculum → row + เติม subjectIds จาก idx
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

  // ------- วางฟังก์ชันรีเฟรช “ภายใน” component ให้ใช้ setData ได้ -------
  const refreshSubjectsFor = async (curriculumId: string): Promise<void> => {
    const allLinks = await getSubjectCurriculumAll();
    const ids = (Array.isArray(allLinks) ? allLinks : [])
      .map((x) => x as unknown as Record<string, unknown>)
      .filter((rec) => {
        const cid = pickString(
          rec,
          ["curriculum_id", "CurriculumID", "major_id", "MajorID"],
          ""
        );
        return cid === curriculumId;
      })
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
      syllabusUrl: record.syllabusUrl,
    });
    setEditingKey(record.key);
  };

  const cancel = () => setEditingKey("");

  // บันทึกแก้ไข → map เป็น DTO ให้ตรง API แล้วค่อยส่ง
  const save = async (key: React.Key) => {
    try {
      const row = (await form.validateFields()) as Partial<DataType>;
      const current = data.find((d) => d.key === key);
      if (!current) return;

      // ----- 1) อัปเดตฟิลด์ของ Curriculum เอง -----
      const patch: CurriculumUpdateDTO = {
        curriculum_name: (row.name ?? current.name) || undefined,
        total_credit: row.credit ?? current.credit ?? undefined,
        start_year: row.startYear ?? current.startYear ?? undefined,
        faculty_id: (row.facultyId ?? current.facultyId) || undefined,
      };
      (Object.keys(patch) as (keyof CurriculumUpdateDTO)[]).forEach((k) => {
        if (patch[k] === undefined) delete patch[k];
      });
      if (Object.keys(patch).length > 0) {
        await updateCurriculum(current.id, patch);
      }

      // ----- 2) อัปเดตรายวิชา (subject-curriculum links) ด้วย "คู่คีย์" -----
      const nextSubjects = asStringArray(row.subjectIds ?? current.subjectIds);
      const prevSubjects = current.subjectIds ?? [];

      const toAdd = nextSubjects.filter((id) => !prevSubjects.includes(id));
      const toDel = prevSubjects.filter((id) => !nextSubjects.includes(id));

      if (toAdd.length > 0) {
        await Promise.all(
          toAdd.map((sid) =>
            createSubjectCurriculum({
              SubjectID: String(sid),
              CurriculumID: String(current.id), // ถ้า BE ใช้ major_id ให้แก้ service
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

      // ----- 3) รีเฟรชรายวิชาจาก BE แล้วค่อยอัปเดต field อื่นในแถว -----
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
                // ไม่เซ็ต subjectIds ตรงนี้ ปล่อยให้ค่าจาก refreshSubjectsFor ที่เพิ่งอัปเดตทำงาน
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

  // ลบแถวจริงจาก backend + ลบในตาราง
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

  // กรองข้อมูลตามคำค้นหา
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
    {
      title: "Curriculum Name",
      dataIndex: "name",
      width: "20%",
      editable: true,
    },
    {
      title: "Total Credit",
      dataIndex: "credit",
      width: "10%",
      editable: true,
    },
    {
      title: "Start Year",
      dataIndex: "startYear",
      width: "15%",
      editable: true,
    },
    {
      title: "Faculty",
      dataIndex: "facultyId",
      width: "15%",
      editable: true,
      render: (facultyId: string) => facultyMap[facultyId] || "-",
    },
    {
      title: "Subjects",
      dataIndex: "subjectIds",
      width: "20%",
      editable: true,
      render: (ids: string[]) =>
        (ids || []).map((id) => subjectMap[id] || id).join(", "),
    },
    {
      title: "Book",
      dataIndex: "syllabusUrl",
      width: "10%",
      editable: true,
      render: (url: string) =>
        url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            View
          </a>
        ) : (
          "-"
        ),
    },
    {
      title: "Edit",
      dataIndex: "edit",
      width: "5%",
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
      title: "Delete",
      dataIndex: "delete",
      width: "5%",
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
  > & { editable?: boolean };

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
              placeholder="Search curriculum or faculty"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ marginBottom: 16, width: 320 }}
              prefix={<SearchOutlined />}
              allowClear
            />
            <Table<DataType>
              components={{ body: { cell: EditableCell } }}
              bordered
              dataSource={filteredData}
              columns={mergedColumns}
              rowKey="key"
              loading={loading}
              pagination={{ onChange: () => setEditingKey("") }}
            />
          </Form>
        </OptionsCtx.Provider>
      </Content>
    </Layout>
  );
};

export default CHANGE;
