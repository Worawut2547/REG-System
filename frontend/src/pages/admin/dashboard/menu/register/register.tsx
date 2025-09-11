// src/pages/dashboard/menu/register.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Layout, Input, Button, Table, Space, message, Typography, Card, Modal } from 'antd';
import './register.css';
import { getSubjectAll, getSubjectById } from '../../../../../services/https/subject/subjects';
import type { SubjectInterface } from '../../../../../interfaces/Subjects';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const wrapperStyle: React.CSSProperties = {
  borderRadius: 8,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  width: '100%',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  background: '#2e236c',
  color: 'white',
  textAlign: 'center',
  padding: 16,
  fontSize: 20,
};

const contentStyle: React.CSSProperties = {
  background: '#f5f5f5',
  padding: 24,
  minHeight: 400,
  color: '#333',
  overflowY: 'auto',
};

const footerStyle: React.CSSProperties = {
  background: '#1890ff',
  color: 'white',
  textAlign: 'center',
  padding: 12,
};

const Register: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectInterface[]>([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<SubjectInterface | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const list = await getSubjectAll();
      setSubjects(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      message.error('โหลดรายวิชาไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter((s) =>
      [s.SubjectID, s.SubjectName, s.MajorName, s.FacultyName]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [subjects, query]);

  const viewDetail = async (sid: string) => {
    setDetailLoading(true);
    try {
      const s = await getSubjectById(sid);
      if (!s) return message.warning('ไม่พบข้อมูลวิชา');
      setDetail(s as SubjectInterface);
      setDetailOpen(true);
    } catch (e) {
      console.error(e);
      message.error('โหลดรายละเอียดวิชาไม่สำเร็จ');
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    { title: 'รหัสวิชา', dataIndex: 'SubjectID', key: 'SubjectID', width: 140 },
    { title: 'ชื่อวิชา', dataIndex: 'SubjectName', key: 'SubjectName' },
    { title: 'หน่วยกิต', dataIndex: 'Credit', key: 'Credit', width: 100 },
    {
      title: '',
      key: 'action',
      width: 140,
      render: (_: any, rec: SubjectInterface) => (
        <Button type="link" onClick={() => viewDetail(String(rec.SubjectID || ''))}>
          ดูรายละเอียด
        </Button>
      ),
    },
  ];

  return (
    <Layout style={wrapperStyle}>
      <Header style={headerStyle}>ลงทะเบียน</Header>
      <Content style={contentStyle}>
        <Card style={{ borderRadius: 8, marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Title level={4} style={{ margin: 0 }}>
              รายวิชาทั้งหมด
            </Title>
            <Input.Search
              placeholder="ค้นหา: รหัสวิชา / ชื่อวิชา / คณะ / สาขา"
              allowClear
              onChange={(e) => setQuery(e.target.value)}
            />
            <Table
              rowKey={(r) => String(r.SubjectID || r.SubjectName || '')}
              loading={loading}
              dataSource={filtered}
              columns={columns as any}
              pagination={{ pageSize: 10 }}
              bordered
            />
          </Space>
        </Card>
      </Content>
      <Footer style={footerStyle}>Arcanatech University © 2025</Footer>

      <Modal
        title={detail ? `${detail.SubjectID} — ${detail.SubjectName}` : 'รายละเอียดวิชา'}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        confirmLoading={detailLoading}
      >
        {detail ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text><b>รหัสวิชา:</b> {detail.SubjectID}</Text>
            <Text><b>ชื่อวิชา:</b> {detail.SubjectName}</Text>
            <Text><b>หน่วยกิต:</b> {detail.Credit}</Text>
            {detail.FacultyName && <Text><b>คณะ:</b> {detail.FacultyName}</Text>}
            {detail.MajorName && <Text><b>สาขา:</b> {detail.MajorName}</Text>}
            {detail.TeacherID && <Text><b>อาจารย์:</b> {detail.TeacherID}</Text>}
            {detail.SemesterID != null && <Text><b>ภาคการศึกษา (ID):</b> {String(detail.SemesterID)}</Text>}
          </Space>
        ) : (
          <Text>ไม่พบข้อมูล</Text>
        )}
      </Modal>
    </Layout>
  );
};

export default Register;
