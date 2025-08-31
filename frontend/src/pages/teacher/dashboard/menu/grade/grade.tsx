// ===========================
// นำเข้า Library / Components ที่จำเป็น
// ===========================
import React, { useState, useEffect } from "react"; // React core + hook สำหรับ state และ lifecycle
import { Layout, Select, Row, Col, Card, Typography, Table, Input, Button } from "antd"; 
// นำเข้า UI Component ของ Ant Design: Layout, Select, Row/Col (grid), Card, Typography, Table, Input, Button
import { SearchOutlined } from "@ant-design/icons"; // ไอคอนสำหรับ search
import type { ColumnsType } from "antd/es/table"; // Type สำหรับกำหนด column ของ Table
import './grade.css'; // CSS สำหรับตกแต่งหน้าตา (สามารถปรับเองได้)

// ===========================
// ตั้งค่า shortcut ของ Component
// ===========================
const { Header, Content, Footer } = Layout; // ใช้ Header, Content, Footer ของ Layout
const { Option } = Select; // Option ของ Select
const { Title, Text } = Typography; // Title และ Text ของ Typography

// ===========================
// ----- Types -----
// ===========================
// กำหนดโครงสร้างข้อมูลเพื่อให้ TypeScript รู้ว่าข้อมูลเป็นแบบไหน
type Course = { 
  code: string;  // รหัสวิชา เช่น "ENG23 3031"
  name: string;  // ชื่อวิชา
  students: number; // จำนวนนักศึกษาในวิชา
  color: string; // สีประจำวิชา ใช้กับ Card
};

type Student = { 
  key: number;       // ลำดับในตาราง (ใช้เป็น unique key)
  id: string;        // รหัสนักศึกษา
  firstName: string; // ชื่อ
  lastName: string;  // นามสกุล
  total: number;     // คะแนนรวม
};

// ===========================
// ----- ฟังก์ชันคำนวณเกรด -----
// ===========================
const getGrade = (score: number): string => {
  // รับคะแนนรวม และคืนค่าเกรดเป็น string
  if (score >= 80) return "A";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "D+";
  if (score >= 50) return "D";
  return "F";
};

// ===========================
// ----- ข้อมูล mock รายวิชา -----
// ===========================
const courses: Course[] = [
  { code: "ENG23 3031", name: "System Analysis", students: 115, color: "#1a1440ff" },
  { code: "ENG23 3051", name: "Formal Method", students: 125, color: "#332771ff" },
  { code: "ENG23 3014", name: "Web Application", students: 120, color: "#4c5ba8ff" },
  { code: "ENG23 2011", name: "Database System", students: 175, color: "#2d3685ff" },
];
// เป็นข้อมูลจำลองสำหรับใช้แสดงบน Dashboard ก่อนเชื่อม API จริง

// ===========================
// ----- ฟังก์ชัน Fetch ข้อมูลนักศึกษา -----
// ===========================
const fetchStudents = async (courseCode: string) => {
  try {
    // ถ้าเชื่อม backend จริง สามารถเรียก API แบบนี้
    // const response = await fetch(`https://myapi.com/students?course=${courseCode}`);
    // const data: Student[] = await response.json();
    // return data;

    // ตอนนี้ใช้ mock data แทน
    return [
      { key: 1, id: "B6616052", firstName: "นายวรวุฒิ", lastName: "ทัศน์ทอง", total: 85 },
      { key: 2, id: "B6636987", firstName: "มงกี้", lastName: "ดี ลูฟี่", total: 73 },
      { key: 3, id: "B6605355", firstName: "ไก่ทอด", lastName: "สมุนไพร", total: 66 },
      { key: 4, id: "B6603953", firstName: "ปีเตอร์", lastName: "พาร์คเกอร์", total: 48 },
    ];
  } catch (error) {
    console.error("Error fetching students:", error);
    return []; // ถ้า fetch ไม่ได้ คืนค่าเป็น array ว่าง
  }
};

// ===========================
// ----- TeacherDashboard Component -----
// ===========================
type TeacherDashboardProps = { 
  onSelectCourse: (course: { code: string; name: string }) => void 
};
// เป็น props ที่ส่งฟังก์ชันจากหน้า Score เพื่อบอกว่าผู้ใช้เลือกวิชาไหน

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onSelectCourse }) => {
  const [year, setYear] = useState("2568"); // ปีการศึกษาเริ่มต้น
  const [term, setTerm] = useState("1");   // ภาคเรียนเริ่มต้น

  return (
    <div style={{ padding: 20, maxWidth: 1500, margin: "auto" }}>
      {/* เลือกปีการศึกษา และภาคเรียน */}
      <Row justify="start" align="middle" style={{ marginBottom: 5, gap: 50 }}>
        <Col>
          <Text strong style={{ marginRight: 8, fontSize: 18 }}>ปีการศึกษา</Text>
          <Select value={year} onChange={setYear} style={{ width: 100 }}>
            <Option value="2568">2568</Option>
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

      {/* แสดงชื่ออาจารย์ */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 5 }}>
        <Col>
          <Title level={3} style={{ marginTop: 20, marginBottom: 30, fontWeight: "bold" }}>
            รองศาสตราจารย์ ดร.สมชาย ใจดี
          </Title>
        </Col>
      </Row>

      {/* แสดงรายวิชาเป็น Card */}
      <Row gutter={[40, 40]}>
        {courses.map(({ code, name, students, color }) => (
          <Col key={code} xs={24} sm={12} md={12} lg={12}>
            <Card
              style={{ 
                backgroundColor: color, 
                color: "white", 
                textAlign: "center", 
                width: "100%", 
                height: 250, 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "center" 
              }}
              bodyStyle={{ padding: 50 }}
              hoverable
              onClick={() => onSelectCourse({ code, name })} // เมื่อคลิก ส่ง course ขึ้น parent
            >
              <Title level={3} style={{ color: "white", marginTop: 0 }}>{code}</Title>
              <Title level={3} style={{ color: "white", marginTop: 10 }}>{name}</Title>
              <Text style={{ fontWeight: "bold", fontSize: 16, color: "white" }}>{students} คน</Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

// ===========================
// ----- StudentGradePage Component -----
// ===========================
type StudentGradePageProps = { 
  course: { code: string; name: string } | null; 
  onBack: () => void 
};

const StudentGradePage: React.FC<StudentGradePageProps> = ({ course, onBack }) => {
  const [searchText, setSearchText] = useState(""); // สำหรับค้นหานักศึกษา
  const [students, setStudents] = useState<Student[]>([]); // เก็บข้อมูลนักศึกษา

  // โหลดข้อมูลนักศึกษาจาก backend เมื่อ component mount หรือ course เปลี่ยน
  useEffect(() => {
    const loadStudents = async () => {
      if (course) {
        const data = await fetchStudents(course.code); // ดึงข้อมูลตามรหัสวิชา
        setStudents(data);
      }
    };
    loadStudents();
  }, [course]);

  // กรองนักศึกษาตาม search text
  const filteredStudents = students.filter(s =>
    s.id.toLowerCase().includes(searchText.toLowerCase())
  );

  // กำหนด column ของ Table
  const columns: ColumnsType<Student> = [
    { title: "No.", dataIndex: "key", key: "no", align: "center" },
    { title: "รหัสนักศึกษา", dataIndex: "id", key: "id", align: "center" },
    { title: "ชื่อ", dataIndex: "firstName", key: "firstName", align: "center" },
    { title: "นามสกุล", dataIndex: "lastName", key: "lastName", align: "center" },
    { title: "Total (100%)", dataIndex: "total", key: "total", align: "center" },
    { title: "Grade", key: "grade", align: "center", render: (_, record) => getGrade(record.total) } // ใช้ฟังก์ชัน getGrade
  ];

  return (
    <div style={{ padding: 10, maxWidth: 1500, margin: "auto" }}>
      {/* ปุ่มกลับไปหน้า Dashboard */}
      <Button onClick={onBack}>BACK</Button>

      {/* แสดงชื่อวิชา */}
      {course && (
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <Text style={{ fontWeight: "bold", fontSize: 30 }}>
            <Text strong style={{ fontSize: 30 }}>{course.code}</Text> -
            <Text strong style={{ fontSize: 30 }}> {course.name}</Text>
          </Text>
        </div>
      )}

      {/* แถบค้นหา */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col>
          <div style={{ backgroundColor: "#2e236c", padding: "8px 12px", borderRadius: 6 }}>
            <Text style={{ color: "white", marginRight: 8 }}>ค้นหาด้วยรหัสนักศึกษา</Text>
            <Input
              placeholder="ค้นหา..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 180, height: 32, fontSize: 12 }}
            />
          </div>
        </Col>
      </Row>

      {/* ตารางแสดงข้อมูลนักศึกษา */}
      <Table
        dataSource={filteredStudents}
        columns={columns}
        pagination={{ pageSize: 50 }} // กำหนดจำนวนแถวต่อหน้า
        bordered
      />
    </div>
  );
};

// ===========================
// ----- Main Score Component -----
// ===========================
const Score: React.FC = () => {
  const [view, setView] = useState<"dashboard" | "student-grade">("dashboard");
  const [selectedCourse, setSelectedCourse] = useState<{ code: string; name: string } | null>(null);

  return (
    <Layout
      style={{
        minHeight: "100vh",
        borderRadius: 8,                      // ขอบมน wrapper
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Header
        style={{
          background: "#2e236c",
          color: "white",
          textAlign: "center",
          fontSize: 24,
          borderTopLeftRadius: 8,            // มุมบนซ้าย Header
          borderTopRightRadius: 8,           // มุมบนขวา Header
        }}
      >
        กรอกผลการเรียนรายวิชา
      </Header>

      {/* Content */}
      <Content
        style={{
          background: "#f5f5f5",
          padding: 24,
        }}
      >
        {view === "dashboard" && (
          <TeacherDashboard
            onSelectCourse={(course) => {
              setSelectedCourse(course);
              setView("student-grade");
            }}
          />
        )}
        {view === "student-grade" && selectedCourse && (
          <StudentGradePage
            course={selectedCourse}
            onBack={() => setView("dashboard")}
          />
        )}
      </Content>

      {/* Footer */}
      <Footer
        style={{
          background: "#1890ff",
          color: "white",
          textAlign: "center",
          borderBottomLeftRadius: 8,          // มุมล่างซ้าย Footer
          borderBottomRightRadius: 8,         // มุมล่างขวา Footer
        }}
      >
        Footer © 2025
      </Footer>
    </Layout>
  );
};


export default Score; // ส่งออก component Score เป็น default
