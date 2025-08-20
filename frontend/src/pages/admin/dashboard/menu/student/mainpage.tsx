import { useState } from "react";
import { Layout } from "antd";
import ShowStudentPage  from "./showname/show.tsx";
import CreateStudent from "./create/create.tsx";
const { Header, Content, Footer } = Layout;
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

// Component แม่ – คุม Layout และสลับหน้า
const StudentPage = () => {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <Layout style={wrapperStyle}>
      <Header style={headerStyle}>จัดการนักศึกษา</Header>
      <Content style={contentStyle}>
        {showCreate ? (
          <CreateStudent onBack={() => setShowCreate(false)} />
        ) : (
          <ShowStudentPage onCreate={() => setShowCreate(true)} />
        )}
      </Content>
      <Footer style={footerStyle}>Footer © 2025</Footer>
    </Layout>
  );
};

export default StudentPage;

//----------------------------------------------------------------------------------------------------

// ฟอร์มสร้างนักศึกษา

//----------------------------------------------------------------------------------------------------

