// src/pages/dashboard/menu/mainpage/mainpage.tsx
import React from "react";
import { Layout, Row, Col, Carousel } from "antd";
import { Link } from "react-router-dom";
import "./mainpage.css";

import {
  BookOutlined,
  ContactsOutlined,
  SolutionOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";

const { Header, Content, Footer } = Layout;

const textSlides = [
  { title: "ARCANATECH UNIVERSITY", l1: "MAGIC", and: "AND", l3: "SCIENCE", caption: "THE NAME" },
  { title: "WELCOME TO", l1: "REGISTRATION", and: "AND", l3: "CURRICULUM", caption: "PORTAL" },
  { title: "DIGITAL TECHNOLOGY", l1: "LEARN", and: "AND", l3: "CREATE", caption: "TOGETHER" },
];

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
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: 72,
  padding: 0,
  fontSize: 20,
  fontWeight: "bold",
  lineHeight: 1.2,
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

const Tile: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
  <Link to={to} className="menu-tile" role="button" tabIndex={0}>
    <div className="menu-icon">{icon}</div>
    <div className="menu-label">{label}</div>
  </Link>
);

const MainPage: React.FC = () => {
  return (
    <Layout style={wrapperStyle}>
      <Header style={headerStyle}>Wellcome to Arcanatech University</Header>

      <Content style={contentStyle}>
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8}>
            {/* ✅ เปลี่ยนให้ลิงก์ไปที่ query tab */}
            <Tile to="?tab=teacher" icon={<ContactsOutlined />} label="อาจารย์" />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Tile to="?tab=score" icon={<SolutionOutlined />} label="คะแนน" />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Tile to="?tab=report" icon={<ExclamationCircleOutlined />} label="คำร้อง" />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Tile to="?tab=course" icon={<BookOutlined />} label="วิชาที่เปิดสอน" />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Tile to="?tab=student" icon={<UserOutlined />} label="ระเบียนประวัติ" />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Tile to="?tab=curriculum" icon={<ApartmentOutlined />} label="หลักสูตร" />
          </Col>
        </Row>

        {/* ---------- TEXT CAROUSEL ---------- */}
        <div className="hero-wrap">
          <Carousel autoplay autoplaySpeed={3000} pauseOnHover dots arrows>
            {textSlides.map((s, idx) => (
              <div key={idx} className={`hero-slide text-slide theme-${(idx % 3) + 1}`}>
                <div className="text-slide-inner">
                  <div className="uni">{s.title}</div>
                  <div className="line1">{s.l1}</div>
                  <div className="and">{s.and}</div>
                  <div className="line3">{s.l3}</div>
                  <div className="caption">{s.caption}</div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>
        {/* ----------------------------------- */}
      </Content>

      <Footer style={footerStyle}>Arcana University © 2025</Footer>
    </Layout>
  );
};

export default MainPage;
