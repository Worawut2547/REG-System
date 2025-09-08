// src/pages/AdminReportPage.tsx (simplified hub)
import React, { useState } from "react";
import { Layout, Button } from "antd";
import AddType from "./addtype";
import DropType from "./droptype";
import StudentRequests from "./studentrequests";
import "./report.css";

const { Header, Content, Footer } = Layout;

type View = "list" | "addtype" | "droptype";

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

const AdminReportPage: React.FC = () => {
  const [view, setView] = useState<View>("list");

  return (

    <Layout style={wrapperStyle}>
          <Header style={headerStyle}>ระบบคำร้อง</Header>
          <Content style={contentStyle}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <Button type={view === "list" ? "primary" : "default"} onClick={() => setView("list")}>รายการคำร้องที่ส่งให้ฉัน</Button>
          <Button type={view === "addtype" ? "primary" : "default"} onClick={() => setView("addtype")}>เพิ่มประเภทคำร้อง</Button>
          <Button type={view === "droptype" ? "primary" : "default"} onClick={() => setView("droptype")}>ลบประเภทคำร้อง</Button>
        </div>

        {view === "list" && (
          <div className="rq-center">
            <div className="rq-container">
              <div className="rq-panel">
                  <div className="rq-tab" />
                </div>
                <StudentRequests />
            </div>
          </div>
        )}

        {view === "addtype" && (
          <div className="rq-center"><div className="rq-container"><AddType /></div></div>
        )}
        {view === "droptype" && (
          <div className="rq-center"><div className="rq-container"><DropType /></div></div>
        )}
          </Content>
          <Footer style={footerStyle}>Arcanatech University © 2025</Footer>
        </Layout>
  );
};

export default AdminReportPage;
