// src/pages/student/dashboard/menu/register/dropcourse.tsx
import React, { useEffect, useState } from "react";
import { Layout, Table, Button, Typography, Card, Popconfirm, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { deleteRegistration } from "../../../../../../services/https/registration/registration";
import { getNameStudent } from "../../../../../../services/https/student/student";
import { getSubjectById } from "../../../../../../services/https/subject/subjects";

const { Content } = Layout;
const { Title } = Typography;

type Row = {
  key: string;
  SubjectID: string;
  SubjectName?: string;
  Credit?: number;
  SectionID: number;
  Group?: number;
  Schedule?: string;
  RegistrationID?: number | string;
  InternalID?: number;
};

type Props = { onBack?: () => void };
const DropCoursePage: React.FC<Props> = ({ onBack }) => {
  const [studentId] = useState(() => localStorage.getItem("student_id") || "B6616052");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  // แปลงข้อความเวลาเรียนให้ขึ้นบรรทัดใหม่เมื่อมีหลายช่วงเวลา
  const normalizeDateTeaching = (val?: string) => {
    const s = String(val || "").trim();
    if (!s) return "";
    if (s.includes(",")) {
      return s.split(",").map(p => p.trim()).filter(Boolean).join("\n");
    }
    return s;
  };

  const reload = async () => {
    setLoading(true);
    try {
      // ดึงโปรไฟล์นักศึกษาที่มีรายการ Registration (มี ID ครบ) เพื่อให้ลบได้
      const profile = await getNameStudent(studentId);
      const regs = Array.isArray(profile?.Registration) ? profile.Registration : [];
      const uniqueSids = Array.from(new Set(regs.map((r: any) => String(r.SubjectID ?? r.subject_id ?? '')).filter(Boolean)));
      const subMap: Record<string, any> = {};
      for (const sid of uniqueSids) {
        const sidStr = String(sid);
        try {
          subMap[sidStr] = await getSubjectById(sidStr);
        } catch (err) {
          subMap[sidStr] = null;
        }
      }
      const list: Row[] = regs.map((r: any) => {
        const sid = String(r.SubjectID ?? r.subject_id ?? '');
        const sub = subMap[sid];
        let groupVal: number | undefined = r.Section?.Group ?? r.section?.group;
        let sched = String(r.Section?.DateTeaching || r.section?.date_teaching || "").trim();
        if (sub) {
          const secExact = (sub.Sections || []).find((s: any) => Number(s.ID ?? 0) === Number(r.SectionID ?? r.section_id ?? 0));
          const secByGroup = secExact || (sub.Sections || []).find((s: any) => Number(s.Group ?? 0) === Number(groupVal ?? 0));
          const dt = secByGroup?.DateTeaching ? normalizeDateTeaching(String(secByGroup.DateTeaching)) : "";
          if (dt) sched = dt;
          if (!groupVal && secByGroup && typeof secByGroup.Group !== 'undefined') {
            const g = Number(secByGroup.Group);
            if (Number.isFinite(g) && g > 0) groupVal = g;
          }
        }
        return {
          key: String(r.ID ?? r.id ?? `${r.SubjectID}-${r.SectionID}-${r.Date}`),
          SubjectID: r.SubjectID ?? r.subject_id,
          SubjectName: String(sub?.SubjectName ?? ""),
          Credit: sub?.Credit ?? undefined,
          SectionID: r.SectionID ?? r.section_id ?? 0,
          Group: groupVal,
          Schedule: sched,
          RegistrationID: r.RegistrationID ?? r.registration_id,
          InternalID: r.ID ?? r.id,
        } as Row;
      });
      setRows(list);
    } catch (e) {
      console.error(e);
      message.error("โหลดรายการไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const handleDrop = async (row: Row) => {
    const id = row.InternalID ?? row.RegistrationID;
    if (id === undefined || id === null) return message.warning("ไม่พบรหัสการลงทะเบียนของรายการนี้");
    setLoading(true);
    try {
      await deleteRegistration(id);
      message.success("ลดรายวิชาสำเร็จ");
      await reload();
    } catch (e) {
      console.error(e);
      message.error("ลดรายวิชาล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>

      <Content style={{ padding: 24 }}>
        <Card style={{ borderRadius: 12 }}>
          <Title level={5} style={{ marginTop: 0 }}>วิชาที่ลงทะเบียนแล้ว</Title>
          <Table
            columns={[
              { title: "กลุ่ม", dataIndex: "Group", key: "Group", width: 80 },
              { title: "รหัสวิชา", dataIndex: "SubjectID", key: "SubjectID", width: 140 },
              { title: "ชื่อวิชา", dataIndex: "SubjectName", key: "SubjectName" , width: 240 },
              { title: "หน่วยกิต", dataIndex: "Credit", key: "Credit", width: 90  },
              { title: "เวลาเรียน", dataIndex: "Schedule", key: "Schedule", width: 320, render: (t: any) => (<span>{String(t || '').replace(/\n/g, ', ')}</span>) },
              { title: "", key: "remove", width: 80, render: (_: any, r: Row) => (
                  <Popconfirm title="ยืนยันลบรายวิชานี้?" okText="ลบ" cancelText="ยกเลิก" onConfirm={() => handleDrop(r)}>
                    <Button danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                )
              },
            ] as any}
            dataSource={rows}
            rowKey={(r) => (r.InternalID ?? r.RegistrationID ?? r.key) as any}
            bordered
            loading={loading}
            pagination={{ pageSize: 8 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <div>
              {onBack && (
                <Button onClick={onBack}>ย้อนกลับ</Button>
              )}
            </div>
            <div />
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default DropCoursePage;
