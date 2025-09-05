import React, { useMemo } from "react";
import { Card, Space, Button, Typography, Divider, Table } from "antd";

const { Title, Text } = Typography;

export type BasketRow = {
  key: string;
  SubjectID: string;
  SubjectName?: string;
  Credit?: number;
  SectionID: number;
  Group?: number;
  Schedule?: string;
  Blocks?: { day: string; start: number; end: number; label: string }[];
};

type Props = {
  rows: BasketRow[];
  loading?: boolean;
  onBack: () => void;
  onSubmit: () => void;
  // รายวิชาที่ลงทะเบียนแล้วของนักศึกษา (ใช้ตรวจชน)
  registeredRows?: BasketRow[];
};

const AddCourseReview: React.FC<Props> = ({ rows, loading, onBack, onSubmit, registeredRows = [] }) => {
  // helper: แปลงข้อความเวลาเป็นบล็อกเพื่อใช้ตรวจชน
  const parseScheduleToBlocks = (text?: string) => {
    const lines = String(text || "").split(/\n|,/).map((s) => s.trim()).filter(Boolean);
    type Block = { day: string; start: number; end: number; label: string };
    const blocks: Block[] = [];
    for (const line of lines) {
      const m = line.match(/^([A-Za-zก-๙]+)\s*:\s*(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
      if (!m) continue;
      const day = m[1];
      const h1 = parseInt(m[2], 10), n1 = parseInt(m[3], 10);
      const h2 = parseInt(m[4], 10), n2 = parseInt(m[5], 10);
      const start = h1 * 60 + n1; const end = h2 * 60 + n2;
      if (end > start) blocks.push({ day, start, end, label: line });
    }
    return blocks;
  };

  // คำนวณว่ารายการใดในตะกร้ามีตารางชนกันบ้าง (ภายในตะกร้า)
  const conflictKeys = useMemo(() => {
    const keys = new Set<string>();
    const expanded = rows.map((r) => ({
      key: r.key,
      blocks: (r.Blocks && r.Blocks.length > 0) ? r.Blocks : parseScheduleToBlocks(r.Schedule),
    }));
    for (let i = 0; i < expanded.length; i++) {
      for (let j = i + 1; j < expanded.length; j++) {
        const A = expanded[i].blocks || [];
        const B = expanded[j].blocks || [];
        for (const a of A) {
          for (const b of B) {
            if ((a.day || "").toLowerCase() !== (b.day || "").toLowerCase()) continue;
            const overlap = a.start < b.end && b.start < a.end;
            if (overlap) {
              keys.add(rows[i].key);
              keys.add(rows[j].key);
            }
          }
        }
      }
    }
    return keys;
  }, [rows]);

  // ตรวจชนกับรายวิชาที่ลงทะเบียนแล้ว
  const conflictWithRegisteredKeys = useMemo(() => {
    const keys = new Set<string>();
    const regBlocks = (registeredRows || []).flatMap((r) => {
      const src = (r.Blocks && r.Blocks.length > 0) ? r.Blocks : parseScheduleToBlocks(r.Schedule);
      return (src || []).map((b) => ({ ownerKey: r.key, ...b }));
    });
    for (const r of rows) {
      const blocks = (r.Blocks && r.Blocks.length > 0) ? r.Blocks : parseScheduleToBlocks(r.Schedule);
      for (const a of (blocks || [])) {
        for (const b of regBlocks) {
          if ((a.day || "").toLowerCase() !== String(b.day || "").toLowerCase()) continue;
          const overlap = a.start < b.end && b.start < a.end;
          if (overlap) keys.add(r.key);
        }
      }
    }
    return keys;
  }, [rows, registeredRows]);
  const totalCredit = rows.reduce((sum, b) => sum + (b.Credit || 0), 0);
  const columns = [
    { title: "กลุ่ม", dataIndex: "Group", key: "Group", width: 80 },
    { title: "รหัสวิชา", dataIndex: "SubjectID", key: "SubjectID", width: 120 },
    { title: "ชื่อวิชา", dataIndex: "SubjectName", key: "SubjectName" , width: 240 },
    { title: "หน่วยกิต", dataIndex: "Credit", key: "Credit", width: 80  },
    { title: "เวลาเรียน", dataIndex: "Schedule", key: "Schedule", width: 260, render: (t: any) => (<span style={{ whiteSpace: 'pre-line' }}>{String(t || '')}</span>) },
    { title: "หมายเหตุ", key: "remark", width: 220, render: (_: any, rec: BasketRow) => {
        const conflicted = conflictKeys.has(rec.key) || conflictWithRegisteredKeys.has(rec.key);
        return (
          <span style={{ color: conflicted ? '#cf1322' : undefined }}>
            {conflicted ? 'ตารางเรียนทับซ้อน' : '-'}
          </span>
        );
      } },
  ] as any;

  return (
    <Card style={{ borderRadius: 12, marginTop: 16 }}> 
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <Title level={5} style={{ margin: 0 }}>ตรวจสอบวิชาที่เลือก</Title>
        <Text>หน่วยกิตรวม: <b>{totalCredit}</b></Text>
      </Space>
      <Divider />
      <Table columns={columns} dataSource={rows} rowKey="key" bordered pagination={false} />
      <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: 16 }}>
        <Button onClick={onBack}>ย้อนกลับ</Button>
        <Button type="primary" loading={loading} onClick={onSubmit}>ยืนยันการลงทะเบียน</Button>
      </Space>
    </Card>
  );
};

export default AddCourseReview;
