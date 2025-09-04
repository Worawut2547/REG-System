import React from "react";
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
};

type Props = {
  rows: BasketRow[];
  loading?: boolean;
  onBack: () => void;
  onSubmit: () => void;
};

const AddCourseReview: React.FC<Props> = ({ rows, loading, onBack, onSubmit }) => {
  const totalCredit = rows.reduce((sum, b) => sum + (b.Credit || 0), 0);
  const columns = [
    { title: "กลุ่ม", dataIndex: "Group", key: "Group", width: 80 },
    { title: "รหัสวิชา", dataIndex: "SubjectID", key: "SubjectID", width: 120 },
    { title: "ชื่อวิชา", dataIndex: "SubjectName", key: "SubjectName" , width: 240 },
    { title: "หน่วยกิต", dataIndex: "Credit", key: "Credit", width: 80  },
    { title: "เวลาเรียน", dataIndex: "Schedule", key: "Schedule", width: 260, render: (t: any) => (<span style={{ whiteSpace: 'pre-line' }}>{String(t || '')}</span>) },
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

