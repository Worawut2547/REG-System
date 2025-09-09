// src/pages/dashboard/menu/register.tsx

import React, { useState } from "react";
import { Layout, Button } from "antd";
import ADD from "./add";
import CHANGE from "./change";
const { Header, Content, Footer } = Layout;

const wrapperStyle: React.CSSProperties = {
  borderRadius: 8,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  width: "100%",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};
const headerStyle: React.CSSProperties = {
  height: 64,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#2e236c",
  color: "white",
  padding: "0 16px",
  fontSize: 20,
  zIndex: 1000,
};
const contentStyle: React.CSSProperties = {
  background: "#f5f5f5",
  padding: 24,
  minHeight: 400,
  color: "#333",
  overflowY: "auto",
};
const footerStyle: React.CSSProperties = {
  background: "#1890ff",
  color: "white",
  textAlign: "center",
  padding: 12,
};

const Curriculum: React.FC = () => {
  const [active, setActive] = useState<"add" | "change" | null>(null);

  return (
    <Layout style={wrapperStyle}>
      <Header style={headerStyle}>
        <div
          style={{
            color: "white",
            fontWeight: "bold",
            justifyContent: "center",
          }}
        >
          Curriculum ระบบจัดการหลักสูตร
        </div>
      </Header>
      <Content style={contentStyle}>
        {active === null ? (
          <div style={{ position: "relative", height: 10 }}>
            <Button
              type="primary"
              style={{
                position: "absolute",
                top: "500%", // ขยับลงครึ่งนึง
                right: "25px", // ชิดขวา 10px
                transform: "translateY(-50%)", // จัดกึ่งกลางแนวตั้งพอดี
              }}
              onClick={() => setActive("add")}
            >
              เพิ่มหลักสูตร
            </Button>
          </div>
        ) : (
          // Show BACK button
          <Button onClick={() => setActive(null)} type="dashed">
            ← กลับ
          </Button>
        )}

        {/* Only show ADD if active is "add", hide CHANGE */}
        {active === "add" && <ADD />}

        {/* CHANGE component is always available but hidden when active is "add" */}
        {active !== "add" && <CHANGE />}
      </Content>
      <Footer style={footerStyle}>Arcana University © 2025</Footer>
    </Layout>
  );
};

export default Curriculum;
