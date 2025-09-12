// === Imports ===
import React, { useState } from "react";
import { Layout, Button } from "antd";
import ADD from "./add";
import CHANGE from "./change";


// === Constants/Env ===
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


// === Types/Interfaces ===
type ActiveView = "add" | "change" | null;
// === Handlers ===
const Course: React.FC = () => {
  // สลับหน้าใช้งาน (null = หน้าเลือก, "add" = เพิ่ม, อื่นๆ = เปลี่ยน)
  const [active, setActive] = useState<ActiveView>(null);

  // กดเพื่อเปิดหน้าเพิ่ม
  const handleAddClick = () => setActive("add");
  // กดกลับไปหน้าเลือก
  const handleBack = () => setActive(null);

  // === Render/Main ===
  return (
    <Layout style={wrapperStyle}>
      <Header style={headerStyle}>
        {/* หัวข้อบนสุดของหน้า */}
        <div style={{ color: "white", fontWeight: "bold", justifyContent: "center" }}>
          Subject Management ระบบจัดรายวิชา
        </div>
      </Header>

      <Content style={contentStyle}>
        {/* ตรงนี้เลือกว่าจะโชว์ปุ่ม "เพิ่ม" หรือปุ่ม "กลับ" */}
        {active === null ? (
          <div style={{ position: "relative", height: 10 }}>
            {/* ปุ่มนี้กดแล้วไปหน้าเพิ่ม */}
            <Button
              type="primary"
              style={{
                position: "absolute",
                top: "500%",
                right: "25px",
                transform: "translateY(-50%)",
              }}
              onClick={handleAddClick}
            >
              เพิ่มรายวิชา
            </Button>
          </div>
        ) : (
          // ปุ่มนี้กดแล้วกลับหน้าเลือก
          <Button onClick={handleBack} type="dashed">
            ← กลับ
          </Button>
        )}

        {/* แสดงหน้าเพิ่มเมื่ออยู่โหมด add */}
        {active === "add" && <ADD />}
        {/* ถ้าไม่ได้อยู่หน้า add ให้โชว์หน้าแก้ไข/จัดการ */}
        {active !== "add" && <CHANGE />}
      </Content>

      {/* ท้ายหน้า แสดงเครดิต */}
      <Footer style={footerStyle}>Arcana University © 2025</Footer>
    </Layout>
  );
};


// === Exports ===
export default Course;
