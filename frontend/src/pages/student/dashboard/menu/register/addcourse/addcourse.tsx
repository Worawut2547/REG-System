// src/pages/student/dashboard/menu/register/addcourse.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Layout, Input, Table, Button, message, Space, Divider, Card, Modal } from "antd";
import { SearchOutlined, DeleteOutlined, SendOutlined } from "@ant-design/icons";

import { getSubjectAll, getSubjectById } from "../../../../../../services/https/subject/subjects";
// import { getNameStudent } from "../../../../../../services/https/student/student"; // ไม่ได้ใช้แล้ว
import { createRegistration, getMyRegistrations } from "../../../../../../services/https/registration/registration";
import type { SubjectInterface } from "../../../../../../interfaces/Subjects";
import type { RegistrationInterface } from "../../../../../../interfaces/Registration";
import AddCourseReview from "./AddCourseReview";

const { Content } = Layout;

// ✅ ไม่ใช้ Section อีกต่อไป
type Step = "select" | "review" | "done";

// ลดฟิลด์ให้เหลือเท่าที่ต้องใช้ (ไม่พึ่ง section/schedule)
type BasketRow = {
  key: string;
  SubjectID: string;
  SubjectName?: string;
  Credit?: number;
  SemesterID?: number; // เพิ่ม SemesterID มาด้วย
};

type Props = { onBack?: () => void, studentId?: string };

const AddCoursePage: React.FC<Props> = ({ onBack, studentId: propStudentId }) => {
  const [studentId] = useState(() => {
    const username = (typeof window !== 'undefined' ? localStorage.getItem('username') : "") || "";
    const sid = (propStudentId && propStudentId.trim()) || username || (typeof window !== 'undefined' ? localStorage.getItem('student_id') : "") || "";
    return String(sid).trim();
  });

  const [step, setStep] = useState<Step>("select");
  const [codeInput, setCodeInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [basket, setBasket] = useState<BasketRow[]>([]);
  const [myRows, setMyRows] = useState<BasketRow[]>([]);
  const [, setMyLoading] = useState(false);

  // modal browse subjects
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseRows, setBrowseRows] = useState<SubjectInterface[]>([]);
  const [browseQuery, setBrowseQuery] = useState("");

  const columnsBasket = useMemo(
    () => [
      { title: "รหัสวิชา", dataIndex: "SubjectID", key: "SubjectID", width: 140 },
      { title: "ชื่อวิชา", dataIndex: "SubjectName", key: "SubjectName", width: 320 },
      { title: "หน่วยกิต", dataIndex: "Credit", key: "Credit", width: 100 },
      {
        key: "remove",
        width: 80,
        render: (_: any, record: BasketRow) => (
          <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleRemove(record.key)}>
            ลบ
          </Button>
        ),
      },
    ],
    [basket]
  );

  const isRegistered = (sid: string) =>
    myRows.some((r) => (r.SubjectID || "").toUpperCase() === sid.toUpperCase());

  // ✅ เลือกวิชาแบบไม่ผ่านกลุ่ม/เวลา
  const addSubjectToBasket = (sub: SubjectInterface) => {
    const sid = String(sub.SubjectID || "").toUpperCase();
    if (!sid) return message.warning("ไม่พบรหัสวิชา");
    if (basket.some((b) => b.SubjectID.toUpperCase() === sid))
      return message.info(`เลือกรหัสวิชา ${sid} ไว้แล้วในตะกร้า`);
    if (isRegistered(sid))
      return message.info(`วิชา ${sid} ถูกลงทะเบียนแล้ว`);

    setBasket((prev) => [
      ...prev,
      {
        key: sid,
        SubjectID: sid,
        SubjectName: sub.SubjectName,
        Credit: sub.Credit,
        SemesterID: sub.SemesterID,
      },
    ]);
  };

  const handleSearch = async (value?: string) => {
    const code = (typeof value === "string" ? value : codeInput).trim().toUpperCase();
    setCodeInput(code);
    if (!code) return message.warning("กรุณากรอกรหัสวิชา");

    setLoading(true);
    try {
      const sub = await getSubjectById(code);
      if (!sub) {
        message.warning(`ไม่พบวิชา ${code} ในระบบ`);
        await openBrowseSubjects();
        return;
      }
      addSubjectToBasket(sub as SubjectInterface);
      setCodeInput("");
    } catch (e) {
      console.error(e);
      message.error("โหลดข้อมูลวิชาไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (key: string) =>
    setBasket((prev) => prev.filter((b) => b.key !== key));

  const goReview = () => {
    if (basket.length === 0) return message.warning("ยังไม่ได้เลือกวิชา");
    setStep("review");
  };

  // ✅ ส่งลงทะเบียนโดยไม่มี SectionID
  const submitBulk = async () => {
    setLoading(true);
    try {
      for (const it of basket) {
        const payload: RegistrationInterface = {
          Date: new Date().toISOString(),
          StudentID: studentId,
          SubjectID: it.SubjectID,
          SemesterID: it.SemesterID, // ค่าตายตัวก่อน (ต้องมีค่า)
          
          // SectionID: undefined // ตัดออก
        } as any;
        await createRegistration(payload);
      }
      message.success("ลงทะเบียนสำเร็จ");
      setBasket([]);
      await reloadMyList();
      setStep("select");
    } catch (e) {
      console.error(e);
      message.error("บันทึกล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (basket.length === 0) return message.warning("ยังไม่ได้เลือกวิชา");
    // ✅ ไม่ตรวจชนตาราง เพราะไม่มีข้อมูลเวลาแล้ว เหลือแค่กันวิชาซ้ำ
    const dup = basket.filter((b) => isRegistered(b.SubjectID));
    if (dup.length > 0) {
      message.error(`พบวิชาซ้ำ: ${dup.map((d) => d.SubjectID).join(", ")}`);
      return;
    }
    await submitBulk();
  };

  const reloadMyList = async () => {
    setMyLoading(true);
    try {
      const regs = await getMyRegistrations(studentId);
      const baseRows: BasketRow[] = (Array.isArray(regs) ? regs : []).map((r: any) => ({
        key: String(r.ID ?? r.id ?? `${r.SubjectID}-${r.Date}`),
        SubjectID: String(r.SubjectID ?? r.subject_id ?? ''),
        SubjectName: r.SubjectName ?? undefined,
        Credit: r.Credit ?? undefined,
      }));
      setMyRows(baseRows);
    } catch (e) {
      console.error(e);
    } finally {
      setMyLoading(false);
    }
  };

  useEffect(() => { if (studentId) reloadMyList(); }, [studentId]);

  const openBrowseSubjects = async () => {
    setBrowseLoading(true);
    try {
      const list = await getSubjectAll();
      setBrowseRows(list);
      setBrowseOpen(true);
    } catch (e) {
      console.error(e);
      message.error("โหลดรายการวิชาไม่สำเร็จ");
    } finally {
      setBrowseLoading(false);
    }
  };

  const pickFromBrowse = async (sid: string) => {
    if (isRegistered(sid)) {
      message.info(`วิชา ${sid} ถูกลงทะเบียนแล้ว`);
      return;
    }
    try {
      const sub = await getSubjectById(sid);
      if (!sub) return message.warning(`ไม่พบวิชา ${sid}`);
      addSubjectToBasket(sub as SubjectInterface);
      setBrowseOpen(false);
    } catch (e) {
      console.error(e);
      message.error("โหลดข้อมูลวิชาไม่สำเร็จ");
    }
  };

  const filteredBrowseRows = useMemo(() => {
    const q = browseQuery.trim().toLowerCase();
    if (!q) return browseRows;
    return browseRows.filter((s) =>
      [s.SubjectID, s.SubjectName].join(" ").toLowerCase().includes(q)
    );
  }, [browseRows, browseQuery]);

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Content style={{ padding: 24 }}>
        {step === "select" && (
          <Card style={{ borderRadius: 12 }}>
            <Space
              align="center"
              style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
              size="large"
            >
              <Input.Search
                prefix={<SearchOutlined />}
                placeholder="กรอกรหัสวิชา"
                style={{ width: 420 }}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                onSearch={handleSearch}
                enterButton="ค้นหา"
                loading={loading}
                allowClear
              />
              <Button onClick={openBrowseSubjects}>ดูรหัสวิชาทั้งหมด</Button>
            </Space>
            <Divider />
            <Table
              columns={columnsBasket as any}
              dataSource={basket}
              rowKey="key"
              bordered
              pagination={false}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 16,
              }}
            >
              <div>{onBack && <Button onClick={onBack}>ย้อนกลับ</Button>}</div>
              <div>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  disabled={basket.length === 0}
                  onClick={goReview}
                >
                  ยืนยันรายวิชา
                </Button>
              </div>
            </div>
          </Card>
        )}
        {step === "review" && (
          <AddCourseReview
            rows={basket as any} // รูปแบบเรียบง่ายขึ้น (ไม่มี section/blocks)
            loading={loading}
            onBack={() => setStep("select")}
            onSubmit={handleConfirmSubmit}
            registeredRows={myRows as any}
          />
        )}
      </Content>

      {/* Modal ดูรหัสวิชาทั้งหมด */}
      <Modal
        title="เลือกรหัสวิชาจากรายการ"
        open={browseOpen}
        onCancel={() => setBrowseOpen(false)}
        footer={null}
        width={720}
      >
        <Space
          style={{ marginBottom: 12, width: "100%", justifyContent: "space-between" }}
        >
          <Input.Search
            placeholder="ค้นหา: รหัสวิชา / ชื่อวิชา"
            allowClear
            style={{ width: 360 }}
            onChange={(e) => setBrowseQuery(e.target.value)}
          />
        </Space>
        <Table
          dataSource={filteredBrowseRows}
          loading={browseLoading}
          rowKey={(r: SubjectInterface) => String(r.SubjectID || r.SubjectName || "")}
          pagination={{ pageSize: 8 }}
          columns={[
            { title: "รหัสวิชา", dataIndex: "SubjectID", key: "SubjectID", width: 140 },
            { title: "ชื่อวิชา", dataIndex: "SubjectName", key: "SubjectName" },
            { title: "หน่วยกิต", dataIndex: "Credit", key: "Credit", width: 100 },
            {
              title: "",
              key: "action",
              width: 120,
              render: (_: any, rec: SubjectInterface) => {
                const sid = String(rec.SubjectID || "");
                const inBasket = basket.some((b) => b.SubjectID === sid);
                const disabled = !sid || isRegistered(sid) || inBasket;
                return (
                  <Button type="link" onClick={() => pickFromBrowse(sid)} disabled={disabled}>
                    เลือกวิชานี้
                  </Button>
                );
              },
            },
          ] as any}
        />
      </Modal>
    </Layout>
  );
};

export default AddCoursePage;
