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

const Course: React.FC = () => {
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
          <Button
            type="primary"
            style={{
              position: "absolute", // Allow absolute positioning
              top: "27%", // Adjust the distance from the top
              left: "93%", // Center horizontally
              transform: "translateX(-93%)", // Center horizontally exactly
              width: 100,
              height: 30,
              fontSize: 15,
              backgroundColor: "#1890ff",
            }}
            onClick={() => setActive("add")}
          >
            เพิ่มรายวิชา
          </Button>
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

export default Course;
