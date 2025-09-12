// src/pages/student/dashboard/menu/register/dropcourse.tsx
import React, { useEffect, useState } from "react";
import { Layout, Table, Button, Typography, Card, Popconfirm, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { deleteRegistration, getMyRegistrations } from "../../../../../../services/https/registration/registration";

const { Content } = Layout;
const { Title } = Typography;

type Row = {
  key: string;
  SubjectID: string;
  SubjectName?: string;
  Credit?: number;
  RegistrationID?: number | string;
  InternalID?: number;
};

type Props = { onBack?: () => void, studentId?: string };
const DropCoursePage: React.FC<Props> = ({ onBack, studentId: propStudentId }) => {
  const [studentId] = useState(() => {
    const username = (typeof window !== 'undefined' ? localStorage.getItem('username') : "") || "";
    const sid = (propStudentId && propStudentId.trim()) || username || (typeof window !== 'undefined' ? localStorage.getItem('student_id') : "") || "";
    return String(sid).trim();
  });
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      // ดึงรายการลงทะเบียนของนักศึกษาจาก endpoint โดยตรง (ข้อมูลพื้นฐานเพียงพอสำหรับลบ)
      const regs = await getMyRegistrations(studentId);
      const arr = Array.isArray(regs) ? regs : [];
      const list: Row[] = arr.map((r: any) => ({
        key: String(r.ID ?? r.id ?? `${r.SubjectID}-${r.Date}`),
        SubjectID: String(r.SubjectID ?? r.subject_id ?? ''),
        SubjectName: r.SubjectName ?? undefined,
        Credit: r.Credit ?? undefined,
        RegistrationID: r.RegistrationID ?? r.registration_id,
        InternalID: r.ID ?? r.id,
      }));
      setRows(list);
    } catch (e) {
      console.error(e);
      // กรณีไม่มีรายการ/404 ให้เคลียร์ตารางแทนการแสดงรายการเดิม
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (studentId) reload(); }, [studentId]);

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
              { title: "รหัสวิชา", dataIndex: "SubjectID", key: "SubjectID", width: 160 },
              { title: "ชื่อวิชา", dataIndex: "SubjectName", key: "SubjectName" , width: 320 },
              { title: "หน่วยกิต", dataIndex: "Credit", key: "Credit", width: 120  },
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