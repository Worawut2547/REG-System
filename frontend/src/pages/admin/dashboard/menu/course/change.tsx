// ====================================================================
// ChangeSubject.tsx — แก้ไข/ลบรายวิชา + จัดการช่วงเวลาเรียนจาก backend จริง
// ====================================================================

import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Typography,
  Popconfirm,
  Table,
  Tag,
  Modal,
  DatePicker,
  Space,
  message,
} from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import dayjs from "dayjs";
import { SearchOutlined, FieldTimeOutlined } from "@ant-design/icons";

import { type SubjectInterface } from "../../../../../interfaces/Subjects";
import { type SubjectStudyTimeInterface } from "../../../../../interfaces/SubjectsStudyTime";

import {
  getSubjectAll,
  updateSubject,
  deleteSubject,
} from "../../../../../services/https/subject/subjects";

import {
  getStudyTimesBySubject,
  addStudyTime,
  updateStudyTime,
  deleteStudyTime,
} from "../../../../../services/https/subjectstudytime/subjectsstudytime";
import { getFacultyAll } from "../../../../../services/https/faculty/faculty";
import { getMajorAll } from "../../../../../services/https/major/major";

const { Content } = Layout;

const { Option } = Select;

/* ---------- Option types ---------- */
type Faculty = { id: string; name: string };
type Major = { id: string; name: string; facultyId?: string };

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
  study_times?: SubjectTimeAPI[];
  schedule?: SubjectTimeAPI[];
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

/* ---------- Modal state for times ---------- */
type TimeRow = { id?: number; start: dayjs.Dayjs; end: dayjs.Dayjs };
type TimesModalState = {
  visible: boolean;
  subjectId?: string;
  subjectName?: string;
  original: SubjectStudyTimeInterface[];
  rows: TimeRow[];
};

const CHANGE: React.FC = () => {
  const [form] = Form.useForm();
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState<string>("");

  const [editingKey, setEditingKey] = useState<string>("");

  const [timesModal, setTimesModal] = useState<TimesModalState>({
    visible: false,
    subjectId: undefined,
    subjectName: undefined,
    original: [],
    rows: [],
  });

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
        schedule: [],
        formattedSchedule: [],
        FacultyID: s.faculty_id ?? s.facultyId ?? s.FacultyID ?? "",
        FacultyName: s.faculty_name ?? s.facultyName ?? s.FacultyName,
        MajorID: s.major_id ?? s.majorId ?? s.MajorID ?? "",
        MajorName: s.major_name ?? s.majorName ?? s.MajorName,
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

  /* ---------- inline edit (id/name/credit/major) ---------- */
  const isEditing = (record: SubjectRow) =>
    (record.SubjectID ?? "") === editingKey;

  const edit = (record: SubjectRow) => {
    form.setFieldsValue({
      SubjectID: record.SubjectID, // [CHANGE: SubjectID] ตั้งค่าให้แก้ไขได้
      SubjectName: record.SubjectName,
      Credit: Number(record.Credit ?? 0),
      MajorID: record.MajorID ?? "",
    });
    setEditingKey(record.SubjectID ?? "");
  };

  const cancel = () => setEditingKey("");

  const save = async (key: string) => {
    try {
      // [CHANGE: SubjectID] รวม SubjectID ใน validateFields เพื่ออ่านค่ารหัสใหม่
      const row = (await form.validateFields()) as Pick<
        SubjectInterface,
        "SubjectName" | "Credit" | "MajorID" | "SubjectID"
      >;

      const newId = String(row.SubjectID ?? "").trim(); // รหัสใหม่ (ถ้ามีการแก้)
      setSubmitting(true);

      // [CHANGE: SubjectID] ถ้ารหัสเปลี่ยน ส่งทั้ง subject_id และ new_subject_id
      // เพื่อรองรับหลายรูปแบบ backend (อันที่ไม่รองรับจะถูกเพิกเฉย)
      await updateSubject(key, {
        subject_name: row.SubjectName ?? "",
        credit: Number(row.Credit ?? 0),
        major_id: row.MajorID ?? "",
        ...(newId && newId !== key
          ? { subject_id: newId, new_subject_id: newId }
          : {}),
      });

      message.success("บันทึกการแก้ไขวิชาสำเร็จ");
      setEditingKey("");
      fetchSubjects();
    } catch (err) {
      console.error("save error:", err);
      message.error("บันทึกการแก้ไขไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (key: string) => {
    try {
      setSubmitting(true);
      await deleteSubject(key);
      message.success("ลบรายวิชาสำเร็จ");
      fetchSubjects();
    } catch (err) {
      console.error("delete error:", err);
      message.error("ลบรายวิชาไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- times modal ---------- */
  const openTimesModal = async (row: SubjectRow) => {
    const sid = row.SubjectID?.trim();
    if (!sid) return;

    try {
      const times = await getStudyTimesBySubject(sid);
      const rows: TimeRow[] = times.map((t) => ({
        id: typeof t.ID === "number" ? t.ID : Number(t.ID),
        start: dayjs(t.StartAt, "YYYY-MM-DD HH:mm"),
        end: dayjs(t.EndAt, "YYYY-MM-DD HH:mm"),
      }));

      setTimesModal({
        visible: true,
        subjectId: sid,
        subjectName: row.SubjectName,
        original: times,
        rows,
      });
    } catch (err) {
      console.error("openTimesModal error:", err);
      message.error("ไม่สามารถโหลดเวลาเรียนได้");
    }
  };

  const addTimeRow = () => {
    setTimesModal((s) => ({
      ...s,
      rows: [...s.rows, { start: dayjs(), end: dayjs().add(1, "hour") }],
    }));
  };

  const updateTimeRow = (idx: number, range: [dayjs.Dayjs, dayjs.Dayjs]) => {
    setTimesModal((s) => {
      const next = [...s.rows];
      next[idx] = { ...next[idx], start: range[0], end: range[1] };
      return { ...s, rows: next };
    });
  };

  const removeTimeRow = (idx: number) => {
    setTimesModal((s) => {
      const next = [...s.rows];
      next.splice(idx, 1);
      return { ...s, rows: next };
    });
  };

  const closeTimesModal = () =>
    setTimesModal({
      visible: false,
      subjectId: undefined,
      subjectName: undefined,
      original: [],
      rows: [],
    });

  const saveTimesModal = async () => {
    const sid = timesModal.subjectId;
    if (!sid) return;

    try {
      setSubmitting(true);

      const origById = new Map<number, SubjectStudyTimeInterface>();
      timesModal.original.forEach((t) => {
        const idNum = typeof t.ID === "number" ? t.ID : Number(t.ID);
        if (Number.isFinite(idNum)) origById.set(idNum, t);
      });

      const currentIds = new Set(
        timesModal.rows
          .map((r) => r.id)
          .filter((v): v is number => typeof v === "number")
      );

      const deletes: Promise<void>[] = [];
      origById.forEach((_val, id) => {
        if (!currentIds.has(id)) {
          deletes.push(deleteStudyTime(sid, id));
        }
      });

      const upserts: Promise<unknown>[] = [];
      for (const r of timesModal.rows) {
        const startStr = r.start.format("YYYY-MM-DD HH:mm");
        const endStr = r.end.format("YYYY-MM-DD HH:mm");

        if (typeof r.id === "number" && origById.has(r.id)) {
          const orig = origById.get(r.id)!;
          const changed = orig.StartAt !== startStr || orig.EndAt !== endStr;
          if (changed) {
            upserts.push(
              updateStudyTime(sid, r.id, { start: startStr, end: endStr })
            );
          }
        } else {
          upserts.push(addStudyTime(sid, { start: startStr, end: endStr }));
        }
      }

      await Promise.all([...deletes, ...upserts]);
      message.success("บันทึกเวลาเรียนสำเร็จ");
      closeTimesModal();
      fetchSubjects();
    } catch (err) {
      console.error("saveTimesModal error:", err);
      message.error("บันทึกเวลาเรียนไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Editable columns ---------- */
  interface EditableColumnType extends ColumnType<SubjectRow> {
    editable?: boolean;
    inputType?: "number" | "text" | "select";
  }

  const columns: EditableColumnType[] = [
    {
      title: "รหัสวิชา",
      dataIndex: "SubjectID",
      width: "10%",
      editable: true, // [CHANGE: SubjectID] ทำให้คอลัมน์นี้แก้ไขได้
      inputType: "text", // [CHANGE: SubjectID] ใช้กล่องข้อความ
    },
    {
      title: "ชื่อรายวิชา",
      dataIndex: "SubjectName",
      editable: true,
      inputType: "text",
      width: "20%",
    },
    {
      title: "หน่วยกิต",
      dataIndex: "Credit",
      editable: true,
      inputType: "number",
      width: 100,
      render: (val: number | string | undefined) => (
        <span>{Number(val ?? 0)}</span>
      ),
    },
    {
      title: "คณะ",
      dataIndex: "FacultyName",
      render: (_: unknown, row: SubjectRow) =>
        row.FacultyName ??
        (faculties.find((f) => f.id === row.FacultyID)?.name || ""),
      width: 160,
    },
    {
      title: "สาขา",
      dataIndex: "MajorName",
      editable: true,
      inputType: "select",
      width: 200,
      render: (_: unknown, row: SubjectRow) =>
        row.MajorName ?? (majors.find((m) => m.id === row.MajorID)?.name || ""),
    },
    {
      title: "เวลาเรียน",
      dataIndex: "formattedSchedule",
      width: 320,
      render: (formatted?: string[], row?: SubjectRow) => {
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
            <Button
              size="small"
              icon={<FieldTimeOutlined />}
              style={{ marginTop: 8 }}
              onClick={() => row && openTimesModal(row)}
              disabled={!row?.SubjectID}
            >
              แก้ไขเวลา
            </Button>
          </div>
        );
      },
    },
    {
      title: "แก้ไข",
      dataIndex: "edit",
      width: "5%",
      render: (_: unknown, record: SubjectRow) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Typography.Link
              onClick={() => save(record.SubjectID ?? "")}
              style={{ marginInlineEnd: 8 }}
            >
              บันทึก
            </Typography.Link>
            <Popconfirm title="ยกเลิกการแก้ไข?" onConfirm={cancel}>
              <a>ยกเลิก</a>
            </Popconfirm>
          </span>
        ) : (
          <Typography.Link
            disabled={editingKey !== ""}
            onClick={() => edit(record)}
          >
            แก้ไข
          </Typography.Link>
        );
      },
    },
    {
      title: "ลบ",
      dataIndex: "delete",
      width: 80,
      render: (_: unknown, record: SubjectRow) => (
        <Popconfirm
          title="ยืนยันลบรายวิชา?"
          onConfirm={() => handleDelete(record.SubjectID ?? "")}
        >
          <a>ลบ</a>
        </Popconfirm>
      ),
    },
  ];

  // บอก TS ว่า onCell จะส่ง props เพิ่มเติมให้กับ EditableCell
  type EditableCellProps = {
    editing: boolean;
    dataIndex: string;
    columnTitle?: ColumnType<SubjectRow>["title"]; // ✅ รับได้ทั้ง ReactNode หรือ function
    inputType: "number" | "text" | "select";
    record: SubjectRow;
    index?: number;
    children?: React.ReactNode;
  } & React.TdHTMLAttributes<HTMLTableCellElement>;

  const mergedColumns: ColumnsType<SubjectRow> = columns.map((col) => {
    if (!("editable" in col) || !col.editable) return col;

    return {
      ...col,
      onCell: (record: SubjectRow): EditableCellProps => ({
        record,
        inputType: col.inputType ?? "text",
        dataIndex: String(col.dataIndex ?? ""),
        columnTitle: col.title,
        editing: isEditing(record),
      }),
    };
  });

  // EditableCell ที่รับ props ตรงกับ onCell (ไม่มี any)
  const EditableCell: React.FC<EditableCellProps> = ({
    editing,
    dataIndex,
    inputType,
    record,
    children,
    ...rest
  }) => {
    let inputNode: React.ReactNode = <Input />;

    if (inputType === "number") {
      inputNode = <InputNumber min={1} max={5} style={{ width: 80 }} />;
    } else if (inputType === "select") {
      inputNode = (
        <Select
          style={{ minWidth: 180 }}
          defaultValue={record.MajorID}
          onChange={(val) => form.setFieldValue("MajorID", val)}
        >
          {majors.map((m) => (
            <Option key={m.id} value={m.id}>
              {m.name}
            </Option>
          ))}
        </Select>
      );
    }

    // map dataIndex ของคอลัมน์ -> ชื่อฟิลด์ที่ใช้ในฟอร์ม
    const nameMap: Record<string, string> = {
      SubjectID: "SubjectID", // [CHANGE: SubjectID] ให้ฟอร์มคุมรหัสวิชา
      SubjectName: "SubjectName",
      Credit: "Credit",
      MajorName: "MajorID", // แก้ผ่าน MajorID (ส่ง id)
      MajorID: "MajorID",
    };
    const fieldName = nameMap[dataIndex] ?? dataIndex;

    return (
      <td {...rest}>
        {editing ? (
          <Form.Item
            name={fieldName}
            style={{ margin: 0 }}
            rules={
              fieldName === "SubjectName"
                ? [{ required: true, message: `กรุณากรอกชื่อวิชา` }]
                : fieldName === "Credit"
                ? [
                    { required: true, message: "กรุณากรอกหน่วยกิต" },
                    {
                      type: "number",
                      min: 1,
                      max: 5,
                      message: "หน่วยกิตต้องเป็น 1–5",
                      transform: (v) => Number(v),
                    },
                  ]
                : fieldName === "MajorID"
                ? [{ required: true, message: "กรุณาเลือกสาขา" }]
                : fieldName === "SubjectID"
                ? [
                    // [VALIDATE: SubjectID] ต้องกรอกรหัส
                    { required: true, message: "กรุณากรอกรหัสวิชา" },
                    // [VALIDATE: SubjectID] รูปแบบอนุญาต A–Z, a–z, 0–9, และขีดกลาง
                    {
                      pattern: /^[A-Za-z0-9-]+$/,
                      message: "ใช้ได้เฉพาะตัวอักษร/ตัวเลข/ขีดกลาง (-)",
                    },
                    // [VALIDATE: SubjectID] เช็คไม่ให้ซ้ำกับรายวิชาอื่น
                    {
                      validator: async (_rule, value) => {
                        const v = String(value ?? "").trim();
                        if (!v) return;
                        const isSame = v === (record.SubjectID ?? "").trim();
                        if (isSame) return;
                        const duplicated = subjects.some(
                          (s) => (s.SubjectID ?? "").trim() === v
                        );
                        if (duplicated) {
                          throw new Error("รหัสวิชานี้มีอยู่แล้ว");
                        }
                      },
                    },
                  ]
                : undefined
            }
          >
            {inputNode}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: 24 }}>
        {/* Search */}
        <Input
          placeholder="ค้นหา: รหัสวิชา / ชื่อวิชา / คณะ / สาขา"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginBottom: 16, width: 420, height: 40, fontSize: 16 }}
          prefix={<SearchOutlined />}
          allowClear
        />

        {/* Table */}
        <Form form={form} component={false}>
          <Table<SubjectRow>
            components={{ body: { cell: EditableCell } }}
            dataSource={tableRows}
            columns={mergedColumns}
            rowKey="SubjectID"
            pagination={{ onChange: cancel }}
            loading={submitting || loadingFaculties || loadingMajors}
            className="custom-table-header"
            rowClassName={(_rec, i) =>
              i % 2 === 0 ? "table-row-light" : "table-row-dark"
            }
          />
        </Form>

        {/* Modal จัดการเวลา */}
        <Modal
          title={`จัดการเวลาเรียน: ${timesModal.subjectName ?? ""}`}
          open={timesModal.visible}
          onCancel={closeTimesModal}
          onOk={saveTimesModal}
          okText="บันทึก"
          confirmLoading={submitting}
          destroyOnClose
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {timesModal.rows.map((r, idx) => (
              <Space key={idx} align="baseline">
                <DatePicker.RangePicker
                  format="YYYY-MM-DD HH:mm"
                  showTime
                  value={[r.start, r.end]}
                  onChange={(val) => {
                    if (val && val[0] && val[1]) {
                      updateTimeRow(idx, [val[0], val[1]]);
                    }
                  }}
                />
                <Button danger onClick={() => removeTimeRow(idx)}>
                  ลบ
                </Button>
              </Space>
            ))}

            <Button type="dashed" onClick={addTimeRow}>
              เพิ่มช่วงเวลา
            </Button>
          </div>
        </Modal>

        {/* Styles */}
        <style>{`
          .table-row-light { background-color: #dad1d1ff; }
          .table-row-dark  { background-color: #dad1d1ff; }

          .custom-table-header .ant-table-thead > tr > th {
            background: #2e236c;
            color: #fff;
            font-weight: bold;
            font-size: 13px;
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
        `}</style>
      </Content>
    </Layout>
  );
};

export default CHANGE;
