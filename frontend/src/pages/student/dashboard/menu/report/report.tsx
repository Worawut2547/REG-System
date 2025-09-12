import React, { useMemo, useState } from "react";
import { Layout, Button } from "antd";
import SubmitReport from "./SubmitReport";
import CheckStatus from "./CheckStatus";
import "./report.css";

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
  background: "#2e236c",
  color: "white",
  textAlign: "center",
  padding: 16,
  fontSize: 20,
  fontWeight: 700,
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

const ReportPage: React.FC = () => {
  const [active, setActive] = useState<"submit" | "status">("submit");
  // resolve current student id (no hardcoded fallback)
  const studentId = useMemo(() => {
    if (typeof window === "undefined") return "";
    const username = (localStorage.getItem("username") || "").trim();
    const sid = (localStorage.getItem("student_id") || "").trim();
    // Prefer stored student_id; fallback to username
    return sid || username;
  }, []);

  return (
    <Layout style={wrapperStyle}>
      <Header style={headerStyle}>ระบบคำร้อง</Header>
      <Content style={contentStyle}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <Button type={active === "submit" ? "primary" : "default"} onClick={() => setActive("submit")}>
            ส่งคำร้อง
          </Button>
          <Button type={active === "status" ? "primary" : "default"} onClick={() => setActive("status")}>
            ตรวจสอบสถานะ
          </Button>
        </div>

        {active === "submit" ? <SubmitReport studentId={studentId} /> : <CheckStatus studentId={studentId} />}
      </Content>
      <Footer style={footerStyle}>Arcanatech University © 2025</Footer>
    </Layout>
  );
};

export default ReportPage;

