// src/pages/dashboard/menu/register.tsx
import React from 'react';
import { Layout } from 'antd';
import './graduate.css';           // ถ้าต้องปรับเพิ่มค่อยใส่ในไฟล์นี้ก็ได้

const { Header, Content, Footer } = Layout;

// register.tsx  – only wrapperStyle changed
const wrapperStyle: React.CSSProperties = {
  /* keep your corner-rounding / shadow if you like */
  borderRadius: 8,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',

  /* 👇 stretch full size of parent Content */
  width: '100%',          // fill X
  minHeight: '100vh',     // ใช้พื้นที่เต็มหน้าจอ
  display: 'flex',        // so Header/Content/Footer stack vertically
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  background: '#2e236c',            // ม่วงเข้ม
  color: 'white',
  textAlign: 'center',
  padding: 16,
  fontSize: 20,
};

const contentStyle: React.CSSProperties = {
  background: '#f5f5f5',            // เทาอ่อน
  padding: 24,
  minHeight: 400,
  color: '#333',
  overflowY: 'auto',                // ให้สามารถเลื่อนขึ้นลงได้
};

const footerStyle: React.CSSProperties = {
  background: '#1890ff',            // ฟ้า Ant Design
  color: 'white',
  textAlign: 'center',
  padding: 12,
};

const Graduate: React.FC = () => {
  return (
    <Layout style={wrapperStyle}>
      <Header style={headerStyle}>Header – หน้าแจ้งจบ</Header>
      <Content style={contentStyle}>
        Content – ใส่ฟอร์มลงทะเบียน / ตารางวิชา ฯลฯ ตรงนี้
      </Content>
      <Footer style={footerStyle}>Footer © 2025</Footer>
    </Layout>
  );
};

export default Graduate;
