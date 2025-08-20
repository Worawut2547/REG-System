import React, { useState } from "react";
import { Layout, Select, Row, Col, Card, Typography, Table, Button, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import './grade.css';

const { Header, Content, Footer } = Layout;
const { Option } = Select;
const { Title, Text } = Typography;

// Type ของข้อมูลวิชา
type Course = {
  code: string;
  name: string;
  students: number;
  color: string;
};

// Type ของข้อมูลนักศึกษา
type Student = {
  key: number;
  id: string;
  firstName: string;
  lastName: string;
  score: number;
  total: number;
};

// ข้อมูลวิชา
const courses: Course[] = [
  { code: "ENG23 3031", name: "System Analysis", students: 115, color: "#1a1440ff" },
  { code: "ENG23 3051", name: "Formal Method", students: 125, color: "#332771ff" },
  { code: "ENG23 3014", name: "Web Application", students: 120, color: "#4c5ba8ff" },
  { code: "ENG23 2011", name: "Database System", students: 175, color: "#2d3685ff" },
];

// ข้อมูลนักศึกษา
const studentData: Student[] = [
  { key: 1, id: "B6616052", firstName: "นายวรวุฒิ", lastName: "ทัศน์ทอง", score: 30, total: 30 },
  { key: 2, id: "B6636987", firstName: "มงกี้", lastName: "ดี ลูฟี่", score: 25, total: 30 },
  { key: 3, id: "B6605355", firstName: "ไก่ทอด", lastName: "สมุนไพร", score: 26.63, total: 30 },
  { key: 4, id: "B6603953", firstName: "ปีเตอร์", lastName: "พาร์คเกอร์", score: 19.32, total: 30 },
];

// Props ของ TeacherDashboard
type TeacherDashboardProps = {
  onSelectCourse: (course: { code: string; name: string }) => void;
};

// หน้าเลือกวิชา
const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onSelectCourse }) => {
  const [year, setYear] = useState("2567");
  const [term, setTerm] = useState("3");

  return (
    <div style={{ padding: 20, maxWidth: 1500, margin: "auto" }}>
      <Row justify="start" align="middle" style={{ marginBottom: 5, gap: 50 }}>
        <Col>
          <Text strong style={{ marginRight: 8, fontSize: 18 }}>ปีการศึกษา</Text>
          <Select value={year} onChange={setYear} style={{ width: 100 }}>
            <Option value="2567">2567</Option>
            <Option value="2566">2566</Option>
            <Option value="2565">2565</Option>
          </Select>
        </Col>
        <Col>
          <Text strong style={{ marginRight: 8, fontSize: 18 }}>ภาคเรียนที่</Text>
          <Select value={term} onChange={setTerm} style={{ width: 60 }}>
            <Option value="1">1</Option>
            <Option value="2">2</Option>
            <Option value="3">3</Option>
          </Select>
        </Col>
      </Row>

      <Row justify="space-between" align="middle" style={{ marginBottom: 5 }}>
        <Col>
          <Title level={3} style={{ marginTop: 15, marginBottom: 30, fontWeight: "bold" }}>รองศาสตราจารย์ ดร.สมชาย ใจดี</Title>
        </Col>
      </Row>
      
      <Row gutter={[40, 40]}>
        {courses.map(({ code, name, students, color }) => (
          <Col key={code} xs={24} sm={12} md={12} lg={12}>
            <Card
              style={{ 
                backgroundColor: color, 
                color: "white", 
                textAlign: "center",
                width: "100%",       // กำหนดความกว้างเต็มคอลัมน์
                height: 250,         // ปรับความสูงเพิ่มจากเดิม (50 padding + ข้อความ) 
                display: "flex",     // จัดให้องค์ประกอบในการ์ดจัดแนวกลางแนวตั้ง
                flexDirection: "column",
                justifyContent: "center",
              }}
              bodyStyle={{ padding: 50 }}
              hoverable
              onClick={() => onSelectCourse({ code, name })}
            >
              <Title level={3} style={{ color: "white", marginTop: 0 }}>
                {code}
              </Title>
              <Title level={3} style={{ color: "white", marginTop: 10 }}>
                {name}
              </Title>
              <Text style={{ fontWeight: "bold", fontSize: 16, color: "white" }}>
                {students} คน
              </Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

// Props ของ StudentScorePage
type StudentScorePageProps = {
  course: { code: string; name: string } | null;
  onBack: () => void;
};

// หน้าใส่ผลการเรียนนักศึกษา
const StudentScorePage: React.FC<StudentScorePageProps> = ({ course, onBack }) => {
  const [searchText, setSearchText] = useState("");

  const columns: ColumnsType<Student> = [
    { title: "No.", dataIndex: "key", key: "no", align: "center" },
    { title: "รหัสนักศึกษา", dataIndex: "id", key: "id", align: "center" },
    { title: "ชื่อ", dataIndex: "firstName", key: "firstName", align: "center" },
    { title: "นามสกุล", dataIndex: "lastName", key: "lastName", align: "center" },
    { title: "คะแนน", dataIndex: "score", key: "score", align: "center" },
    { title: "คะแนนทั้งหมด", dataIndex: "total", key: "total", align: "center" },
    {
      title: "",
      key: "action",
      align: "center",
      render: () => <Button type="primary">แก้ไขคะแนน</Button>,
    },
  ];

  return (
    <div style={{ padding: 10, maxWidth: 1500, margin: "auto" }}> {/**/}
        <Button onClick={onBack}>BACK</Button>
      <div style={{ display: "flex",marginTop: 20, marginBottom: 20 }}> {/*แก้ไข-ชื่อรายวิชา-*/ }
        {course && (
          <Text style={{ marginLeft: 0, fontWeight: "bold", fontSize: 30}}>
            <Text strong style={{ fontSize: 30 }}>{course.code}</Text> - <Text strong style={{ fontSize: 30 }}>{course.name}</Text>
          </Text>
        )}
      </div>

      <Row align="middle" gutter={16} style={{ marginBottom: 30 }}>
        <Col>
          <div style={{ backgroundColor: "#2e236c", padding: "8px 12px", borderRadius: 6 }}>
            <Text style={{ color: "white", marginRight: 8}}>ประเภท</Text>
            <Select defaultValue="กลางภาค" style={{ width: 120 }}>
              <Option value="กลางภาค">กลางภาค</Option>
              <Option value="ปลายภาค">ปลายภาค</Option>
            </Select>
          </div>
        </Col>
        
        <Col>
          <div style={{ backgroundColor: "#2e236c", padding: "8px 12px", borderRadius: 6 }}>
            <Text style={{ color: "white", marginRight: 8 }}>ค้นหาด้วยรหัสนักศึกษา</Text>
            <Input
              placeholder="ค้นหา..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 180, height: 32, fontSize: 12}}
            />
          </div>
        </Col>
      </Row>

      <Table dataSource={studentData} columns={columns} pagination={false} bordered />

      <div style={{ textAlign: "center", marginTop: 20, }}>
        <Button style={{ backgroundColor: "#ffcc00", padding: "25px 12px", width:900, border: "none", fontWeight: "bold" }}>
          + เพิ่มคะแนน
        </Button>
      </div>
    </div>
  );
};

// หน้า Score หลัก
const Score: React.FC = () => {
  const [view, setView] = useState<"dashboard" | "student-score">("dashboard");
  const [selectedCourse, setSelectedCourse] = useState<{ code: string; name: string } | null>(null);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#2e236c", color: "white", textAlign: "center", fontSize: 24 }}>
        กรอกผลการเรียนรายวิชา
      </Header>
      <Content style={{ background: "#f5f5f5", padding: 24 }}>
        {view === "dashboard" && (
          <TeacherDashboard
            onSelectCourse={(course) => {
              setSelectedCourse(course);
              setView("student-score");
            }}
          />
        )}
        {view === "student-score" && selectedCourse && (
          <StudentScorePage
            course={selectedCourse}
            onBack={() => setView("dashboard")}
          />
        )}
      </Content>
      <Footer style={{ background: "#1890ff", color: "white", textAlign: "center" }}>
        Footer © 2025
      </Footer>
    </Layout>
  );
};

export default Score;
