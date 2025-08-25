// ====================================================================
// AddSubject.tsx — เพิ่ม/แสดงรายวิชา + แสดงช่วงเวลาเรียนจากหลังบ้านจริง
// - โหลดคณะ/สาขา + รายวิชาทั้งหมด
// - บันทึกรายวิชาแล้วบันทึกเวลาต่อ (subject_study_time)
// - ดึง times ต่อวิชาเพื่อแสดงในตาราง (เผื่อ /subjects ไม่แนบมา)
// - ช่องค้นหา (ชื่อวิชา/รหัสวิชา/คณะ/สาขา)
// - จัดรูปแบบเวลาเป็นแท็ก แล้วขึ้นบรรทัดใหม่ทุกๆ 5 รายการ
// - หลังบันทึกสำเร็จ: แสดงข้อความ + reset ฟอร์ม + รีเฟรชตาราง
// - ไม่มี any + มีคอมเมนต์
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

// ชนิดข้อมูลในโปรเจ็กต์ของคุณ
import { type SubjectInterface } from "../../../../../interfaces/Subjects";
import { type SubjectStudyTimeInterface } from "../../../../../interfaces/SubjectsStudyTime";

// services ที่มีอยู่แล้ว
import {
  createSubject,
  getSubjectAll,
} from "../../../../../services/https/subject/subjects";
import {
  addStudyTime,
  getStudyTimesBySubject, // ใช้ดึง times ต่อวิชาเพื่อแสดงผลจริง
} from "../../../../../services/https/subjectstudytime/subjectsstudytime";
import { getFacultyAll } from "../../../../../services/https/faculty/faculty";
import { getMajorAll } from "../../../../../services/https/major/major";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

/* -----------------------------------------
 * Types สำหรับ option ของคณะ/สาขา
 * ----------------------------------------- */
type Faculty = { id: string; name: string };
type Major = { id: string; name: string; facultyId?: string };

/* -----------------------------------------
 * รูปแบบ API response (รองรับหลายเคสคีย์)
 * ----------------------------------------- */
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
  credit?: number | string; Credit?: number | string;   // <-- เพิ่ม Credit
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

/* -----------------------------------------
 * แถวที่ใช้ในตาราง (สืบทอดจาก SubjectInterface)
 * มี schedule + formattedSchedule เพิ่ม
 * ----------------------------------------- */
interface SubjectRow extends SubjectInterface {
  schedule: SubjectStudyTimeInterface[];
  formattedSchedule?: string[];
}

/* -----------------------------------------
 * ค่าที่ฟอร์มส่ง (extend จาก SubjectInterface)
 * schedule เก็บเป็นคู่ [start, end] ของ dayjs
 * ----------------------------------------- */
interface FormValues extends SubjectInterface {
  SubjectID: string;
  schedule: [dayjs.Dayjs, dayjs.Dayjs][];
}

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
 * ตัวช่วย: แบ่งอาเรย์เป็นกลุ่มละ n ชิ้น
 * ใช้จัด schedule ให้ขึ้นบรรทัดทุก 5 ชิ้น
 * ----------------------------------------- */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/* ====================================================================
 * Component
 * ==================================================================== */
const ADD: React.FC = () => {
  const [form] = Form.useForm<FormValues>();

  // lists
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);

  // UI state
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ค่าค้นหาในตาราง
  const [query, setQuery] = useState<string>("");

  // ใช้กรองสาขาตามคณะที่เลือก
  const selectedFacultyId = Form.useWatch("FacultyID", form);

  /* -----------------------------------------
   * โหลดคณะ
   * ----------------------------------------- */
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

  /* -----------------------------------------
   * โหลดสาขา
   * ----------------------------------------- */
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

  /* -----------------------------------------
   * โหลดรายวิชา:
   * 1) ดึงรายการวิชา
   * 2) map ค่าเบื้องต้น
   * 3) ดึง times ของแต่ละวิชาจากหลังบ้านจริง (กันเคส /subjects ไม่ส่งเวลามา)
   * ----------------------------------------- */
  const fetchSubjects = async () => {
    try {
      const data = await getSubjectAll();
      const arr = (Array.isArray(data) ? data : []) as SubjectAPI[];

      // map เบื้องต้น (ยังไม่ใส่ times)
      const base: SubjectRow[] = arr.map((s) => ({
        SubjectID: s.subject_id ?? s.subjectId ?? s.SubjectID ?? s.id ?? "",
        SubjectName:
          s.subject_name ?? s.subjectName ?? s.SubjectName ?? s.name ?? "",
        Credit: Number(s.credit ?? s.Credit ?? 0), // แปลงเป็นตัวเลขแน่ๆ กันค่าซ้ำ/ผิดประเภท

        // ใส่ค่า default ไว้ก่อน
        schedule: [],
        formattedSchedule: [],

        FacultyID: s.faculty_id ?? s.facultyId ?? s.FacultyID ?? "",
        FacultyName: s.faculty_name ?? s.facultyName ?? s.FacultyName,
        MajorID: s.major_id ?? s.majorId ?? s.MajorID ?? "",
        MajorName: s.major_name ?? s.majorName ?? s.MajorName,
      }));

      // ดึง times ต่อวิชาแบบขนาน
      // ดึง times ต่อวิชาแบบขนาน (กัน undefined ด้วยการ narrow ก่อน)
      const withTimes: SubjectRow[] = await Promise.all(
        base.map(async (row) => {
          const sid = row.SubjectID?.trim(); // sid: string | undefined
          if (!sid) {
            // ไม่มี SubjectID ก็ข้ามการดึงเวลา
            return row;
          }

          try {
            const times = await getStudyTimesBySubject(sid); // sid เป็น string แน่นอนแล้ว
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

  /* -----------------------------------------
   * โหลดข้อมูลเริ่มต้น
   * ----------------------------------------- */
  useEffect(() => {
    fetchFaculties();
    fetchMajors();
    fetchSubjects();
  }, []);

  /* -----------------------------------------
   * กรองสาขาตามคณะที่เลือก
   * ----------------------------------------- */
  const filteredMajors = useMemo(() => {
    if (!selectedFacultyId) return majors;
    return majors.filter(
      (m) => !m.facultyId || m.facultyId === selectedFacultyId
    );
  }, [majors, selectedFacultyId]);

  /* -----------------------------------------
   * กรองรายการตารางจากช่องค้นหา
   * คีย์เวิร์ดค้นหา: ชื่อวิชา/รหัส/คณะ/สาขา (ไม่สนตัวพิมพ์)
   * ----------------------------------------- */
  const tableRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter((s) => {
      const fields = [
        s.SubjectName ?? "",
        s.SubjectID ?? "",
        s.FacultyName ?? "",
        s.MajorName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return fields.includes(q);
    });
  }, [subjects, query]);

  /* -----------------------------------------
   * บันทึกรายวิชา + บันทึกเวลา + reset + รีเฟรช
   * ----------------------------------------- */
  const onFinish = async (values: FormValues) => {
    setSubmitting(true);

    const payload: SubjectInterface = {
      SubjectID: values.SubjectID,
      SubjectName: values.SubjectName,
      Credit: Number(values.Credit),
      MajorID: values.MajorID,
      FacultyID: values.FacultyID,
    };

    try {
      // 1) สร้างวิชา
      const created = await createSubject(payload);

      const subjectId =
        (created as SubjectInterface & { subject_id?: string }).subject_id ??
        created.SubjectID ??
        values.SubjectID;

      if (!subjectId) throw new Error("Missing subject_id from response");

      // 2) เพิ่มช่วงเวลาเรียนทั้งหมด (ตามที่เลือก)
      const ranges = values.schedule || [];
      await Promise.all(
        ranges.map((range) =>
          addStudyTime(String(subjectId), {
            start: range[0].format("YYYY-MM-DD HH:mm"),
            end: range[1].format("YYYY-MM-DD HH:mm"),
          })
        )
      );

      // 3) แจ้งสำเร็จ + reset + รีเฟรช
      message.success("บันทึกรายวิชาสำเร็จ");
      form.resetFields();
      form.setFieldsValue({ schedule: [] } as Partial<FormValues>);
      await fetchSubjects();
    } catch (e) {
      console.error("[SUBMIT] error:", e);
      message.error("เพิ่มรายวิชาไม่สำเร็จ");
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
        {/* -------------------- ฟอร์มเพิ่มรายวิชา -------------------- */}
        <div style={formShell}>
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
            {/* รหัสวิชา */}
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

            {/* ชื่อรายวิชา */}
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

            {/* หน่วยกิต — ใช้ rule type:number + transform ให้เป็นตัวเลข */}
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

            {/* เวลาเรียน — เพิ่มได้หลายช่วงด้วย Form.List */}
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

            {/* เลือกคณะ */}
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

            {/* เลือกสาขา — กรองตามคณะที่เลือก */}
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

            {/* ปุ่มบันทึก */}
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

        {/* -------------------- ค้นหา + ตารางรายวิชาที่เพิ่มแล้ว -------------------- */}
        <div style={{ marginTop: 24, marginBottom: 8 }}>
          <Input.Search
            allowClear
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหา: ชื่อวิชา / รหัสวิชา / คณะ / สาขา"
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
                render: (val: number | string | undefined) => <span>{Number(val ?? 0)}</span>, // กันกรณีเป็น string
              },
              {
                title: "เวลาเรียน",
                dataIndex: "formattedSchedule",
                // แสดงเป็นแท็ก และขึ้นบรรทัดใหม่ทุกๆ 5 รายการ
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
                  (faculties.find((f) => f.id === row.FacultyID)?.name || ""),
              },
              {
                title: "สาขา",
                dataIndex: "MajorName",
                render: (_: unknown, row: SubjectRow) =>
                  row.MajorName ??
                  (majors.find((m) => m.id === row.MajorID)?.name || ""),
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
      </Content>
    </Layout>
  );
};

export default ADD;
