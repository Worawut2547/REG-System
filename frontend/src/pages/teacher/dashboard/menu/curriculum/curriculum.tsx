// src/pages/dashboard/menu/register.tsx
import { Layout } from "antd";
import SHOW from "./Show.tsx";
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
          Curriculum หลักสูตร
        </div>
      </Header>
      <Content style={contentStyle}>
        <SHOW />
      </Content>
      <Footer style={footerStyle}>Arcana University © 2025</Footer>
    </Layout>
  );
};

export default Curriculum;
