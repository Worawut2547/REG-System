// src/pages/student/dashboard/menu/register/register.tsx
import React, { useState } from "react";
import { Layout, Button, Space } from "antd";
import AddCoursePage from "./addcourse/addcourse";
import DropCoursePage from "./dropcourse/dropcourse";


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
  minHeight: 500,
  color: '#333',
  overflowY: 'auto',                // ให้สามารถเลื่อนขึ้นลงได้
};

const footerStyle: React.CSSProperties = {
  background: '#1890ff',            // ฟ้า Ant Design
  color: 'white',
  textAlign: 'center',
  padding: 12,
};


const RegistrationPage: React.FC = () => {
  const [mode, setMode] = useState<"home" | "add" | "drop">("home");
  const studentId = (typeof window !== 'undefined' ? (localStorage.getItem('username') || localStorage.getItem('student_id') || '') : '').trim();

  return (
        <Layout style={wrapperStyle}>
          <Header style={headerStyle}>ระบบลงทะเบียนเรียน</Header>
          <Content style={contentStyle}>
            {mode === "home" ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
            <Space size="large">
              <Button
                type="primary"
                size="large"
                style={{ background: '#1890ff', borderColor: '#1890ff', height: 56, padding: '0 28px', fontSize: 18, borderRadius: 8 }}
                onClick={() => setMode("add")}
              >
                เพิ่มรายวิชา
              </Button>
              <Button
                type="primary"
                danger
                size="large"
                style={{ height: 56, padding: '0 28px', fontSize: 18, borderRadius: 8 }}
                onClick={() => setMode("drop")}
              >
                ลดรายวิชา
              </Button>
            </Space>
          </div>
        ) : mode === "add" ? (
          <AddCoursePage onBack={() => setMode("home")} studentId={studentId} />
        ) : (
          <DropCoursePage onBack={() => setMode("home")} studentId={studentId} />
        )}
          </Content>
          <Footer style={footerStyle}>Arcanatech University © 2025</Footer>
        </Layout>
          );
};
export default RegistrationPage;

