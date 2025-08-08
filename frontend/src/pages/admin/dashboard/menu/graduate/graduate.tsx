// src/pages/dashboard/menu/register.tsx
import React from 'react';
import { Layout, Table,  Button, message } from 'antd';
import type { TableColumnsType } from 'antd';
import './graduate.css'; // ถ้ามีไฟล์ CSS ใหม่เปลี่ยนชื่อได้

const { Header, Content, Footer } = Layout;

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

interface GraduateData {
  key: string;
  no: number;
  fullName: string;
  curriculum: string;
  creditCompleted: number;
  gpax: number;
}

const data: GraduateData[] = []; // ยังไม่มีข้อมูล
{/*
    key: '1',
    no: 1,
    fullName: 'สมชาย ใจดี',
    curriculum: 'วิทยาการคอมพิวเตอร์',
    creditCompleted: 120,
    gpax: 3.50,*/}
const handleVerify = (record: GraduateData) => {
  message.success(`ตรวจสอบข้อมูลของ ${record.fullName} เรียบร้อย`);
};

const columns: TableColumnsType<GraduateData> = [
  {
    title: 'ลำดับ',
    dataIndex: 'no',
    key: 'no',
  },
  {
    title: 'ชื่อ-สกุล',
    dataIndex: 'fullName',
    key: 'fullName',
  },
  {
    title: 'โครงสร้างหลักสูตร',
    dataIndex: 'curriculum',
    key: 'curriculum',
  },
  {
    title: 'หน่วยกิตที่ผ่าน',
    dataIndex: 'creditCompleted',
    key: 'creditCompleted',
  },
  {
    title: 'GPAX',
    dataIndex: 'gpax',
    key: 'gpax',
  },
  {
    title: 'ตรวจสอบ',
    key: 'verify',
    render: (_, record) => (
      <Button type="primary" onClick={() => handleVerify(record)}>
        ตรวจสอบ
      </Button>
    ),
  },
];

const GraduatePage: React.FC = () => {
  return (
    <Layout style={wrapperStyle}>
      <Header style={headerStyle}>หน้าตรวจสอบจบการศึกษา</Header>
      <Content style={contentStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        </div>

        <Table<GraduateData>
          columns={columns}
          dataSource={data}
          pagination={false}
          style={{ marginTop: 12 }}
          bordered
          locale={{ emptyText: 'ไม่มีข้อมูลผู้แจ้งจบ' }}
        />
      </Content>
      <Footer style={footerStyle}>Footer © 2025</Footer>
    </Layout>
  );
};

export default GraduatePage;
