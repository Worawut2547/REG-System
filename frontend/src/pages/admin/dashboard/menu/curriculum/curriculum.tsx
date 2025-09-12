// === Imports ===
import React, { useState } from "react";
import { Layout, Button } from "antd";
import ADD from "./add";
import CHANGE from "./change";

// === Constants/Env ===
const { Header, Content, Footer } = Layout;

// === Styles ===
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

// === Component ===
const Curriculum: React.FC = () => {
  const [active, setActive] = useState<"add" | "change" | null>(null); // สลับหน้า (null=หน้าเลือก, add=เพิ่มหลักสูตร, change=แก้ไข)

  return (
    <Layout style={wrapperStyle}>
      <Header style={headerStyle}>
        {/* หัวข้อบนสุดของหน้า */}
        <div style={{ color: "white", fontWeight: "bold", justifyContent: "center" }}>
          Curriculum ระบบจัดการหลักสูตร
        </div>
      </Header>

      <Content style={contentStyle}>
        {/* ถ้ายังไม่เลือกหน้า → โชว์ปุ่มเข้าหน้าเพิ่ม */}
        {active === null ? (
          <div style={{ position: "relative", height: 10 }}>
            {/* ปุ่มนี้กดแล้วไปหน้าเพิ่มหลักสูตร */}
            <Button
              type="primary"
              style={{
                position: "absolute",
                top: "500%", // ตรึงปุ่มไว้ล่าง ๆ ของบล็อกนี้
                right: "25px",
                transform: "translateY(-50%)",
              }}
              onClick={() => setActive("add")}
            >
              เพิ่มหลักสูตร
            </Button>
          </div>
        ) : (
          // ปุ่มกลับไปหน้าเลือก
          <Button onClick={() => setActive(null)} type="dashed">
            ← กลับ
          </Button>
        )}

        {/* ถ้าอยู่โหมดเพิ่ม ให้แสดงฟอร์มเพิ่ม */}
        {active === "add" && <ADD />}
        {/* ถ้าไม่ใช่โหมดเพิ่ม (รวมถึง null หลังจากกดกลับ) ให้แสดงหน้าเปลี่ยน/จัดการ */}
        {active !== "add" && <CHANGE />}
      </Content>

      {/* ท้ายหน้า/เครดิต */}
      <Footer style={footerStyle}>Arcana University © 2025</Footer>
    </Layout>
  );
};

// === Export ===
export default Curriculum;
