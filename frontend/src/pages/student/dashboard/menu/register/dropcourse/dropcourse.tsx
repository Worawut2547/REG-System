// src/pages/student/dashboard/menu/register/dropcourse.tsx
import React, { useEffect, useState } from "react";
import { Layout, Table, Button, Typography, Card, Popconfirm, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { getMyRegistrations, deleteRegistration } from "../../../../../../services/https/registration/registration";
import { getSubjectById } from "../../../../../../services/https/subject/subjects";
import dayjs from "dayjs";

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

  const normalizeDateTeaching = (val?: string) => {
    const s = String(val || "").trim();
    if (!s) return "";
    if (/[A-Za-zก-๙]+:\s*\d{1,2}:\d{2}/.test(s)) {
      return s.includes(",") ? s.split(",").map((p) => p.trim()).filter(Boolean).join("\n") : s;
    }
    return s;
  };

  const scheduleFromStudyTimes = (times?: any[]) => {
    const hhmm = (str?: string) => {
      const t = String(str || "").trim();
      const m = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
      if (m) return `${m[1].padStart(2,'0')}:${m[2]}`;
      return t;
    };
    return (times || [])
      .map((t) => {
        const st = dayjs(t.start_at); const en = dayjs(t.end_at);
        const dayName = st.isValid() ? st.format("dddd") : String(t.day || "");
        const ts = st.isValid() ? st.format("HH:mm") : hhmm(t.start_at);
        const te = en.isValid() ? en.format("HH:mm") : hhmm(t.end_at);
        if (!dayName || !ts || !te) return "";
        return `${dayName}: ${ts}-${te}`;
      })
      .filter(Boolean)
      .join("\n");
  };

  const reload = async () => {
    setLoading(true);
    try {
      const regs = await getMyRegistrations(studentId);
      const list: Row[] = regs.map((r: any) => ({
        key: String(r.ID ?? r.id ?? `${r.SubjectID}-${r.SectionID}-${r.Date}`),
        SubjectID: r.SubjectID ?? r.subject_id,
        SubjectName: r.Subject?.SubjectName ?? r.subject?.subject_name ?? "",
        Credit: r.Subject?.Credit ?? r.subject?.credit ?? undefined,
        SectionID: r.SectionID ?? r.section_id ?? 0,
        Group: r.Section?.Group ?? r.section?.group,
        // Schedule เติมภายหลังจากรายละเอียดวิชา
        Schedule: String(r.Section?.DateTeaching || r.section?.date_teaching || ""),
        RegistrationID: r.RegistrationID ?? r.registration_id,
        InternalID: r.ID ?? r.id,
      }));
      // เติมเวลาเรียนจากรายละเอียดวิชา (Section.DateTeaching) หาก Schedule ยังว่าง
      const uniqueSids = Array.from(new Set(list.map((x) => x.SubjectID).filter(Boolean)));
      const subMap: Record<string, any> = {};
      const details = await Promise.all(uniqueSids.map(async (sid) => {
        try { return await getSubjectById(sid); } catch { return null; }
      }));
      details.forEach((sub, i) => { subMap[uniqueSids[i]] = sub; });

      const enriched = list.map((row) => {
        const sub = subMap[row.SubjectID];
        let sched = String(row.Schedule || "").trim();
        let groupVal: number | undefined = (typeof row.Group === 'number' && row.Group > 0) ? row.Group : undefined;
        if (sub) {
          // match by SectionID; if not found, fallback by Group
          const secExact = (sub.Sections || []).find((s: any) => Number(s.SectionID) === Number(row.SectionID));
          const secByGroup = secExact || (sub.Sections || []).find((s: any) => Number(s.Group) === Number(row.Group));
          const dt = secByGroup?.DateTeaching ? normalizeDateTeaching(secByGroup.DateTeaching) : "";
          const fromTimes = scheduleFromStudyTimes(sub.StudyTimes);
          if (dt) sched = dt; else if (!sched && fromTimes) sched = fromTimes;
          if (!groupVal && secByGroup && typeof secByGroup.Group !== 'undefined') {
            const g = Number(secByGroup.Group);
            if (Number.isFinite(g) && g > 0) groupVal = g;
          }
        }
        return { ...row, Schedule: sched, Group: groupVal ?? row.Group } as Row;
      });

      setRows(enriched);
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
