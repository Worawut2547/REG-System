// ===========================
//  นำเข้า Library / Components
// ===========================
import React, { useState, useEffect } from "react"; // React และ Hook
import { Layout, Select, Row, Col, Card, Typography, Table, Button, Input } from "antd"; // UI library Ant Design
import { SearchOutlined } from "@ant-design/icons"; // ไอคอน search
import type { ColumnsType } from "antd/es/table"; // Type ของ Table (TypeScript)
import './score.css'; // CSS สำหรับหน้าคะแนน

const { Header, Content, Footer } = Layout; // แยก component ของ Layout
const { Option } = Select; // ใช้ Select Option
const { Title, Text } = Typography; // ตัวอักษรใหญ่ / ตัวธรรมดา

// ===========================
//  Type (โครงสร้างข้อมูล)
// ===========================
type Course = { // ข้อมูลรายวิชา
  code: string; // รหัสวิชา
  name: string; // ชื่อวิชา
  students: number; // จำนวนคน
  color: string; // สีของการ์ด
};

type Student = { // ข้อมูลนักศึกษา
  key: number; // ใช้สำหรับ React Table
  id: string; // รหัสนักศึกษา
  firstName: string; // ชื่อ
  lastName: string; // นามสกุล
  midterm: number; // คะแนนกลางภาค
  final: number; // คะแนนปลายภาค
  quiz: number; // คะแนน quiz
  homework: number; // คะแนนการบ้าน
};

// ===========================
//  ข้อมูลตัวอย่าง (Mock Data)
// ===========================
const courses: Course[] = [ // รายวิชาทดสอบ
  { code: "ENG23 3031", name: "System Analysis", students: 115, color: "#1a1440ff" },
  { code: "ENG23 3051", name: "Formal Method", students: 125, color: "#332771ff" },
  { code: "ENG23 3014", name: "Web Application", students: 120, color: "#4c5ba8ff" },
  { code: "ENG23 2011", name: "Database System", students: 175, color: "#2d3685ff" },
];

const studentData: Student[] = [ // ข้อมูลนักศึกษาเริ่มต้น
  { key: 1, id: "B6616052", firstName: "นายวรวุฒิ", lastName: "ทัศน์ทอง", midterm: 0, final: 0, quiz: 0, homework: 0 },
  { key: 2, id: "B6636987", firstName: "มงกี้", lastName: "ดี ลูฟี่", midterm: 0, final: 0, quiz: 0, homework: 0 },
  { key: 3, id: "B6605355", firstName: "ไก่ทอด", lastName: "สมุนไพร", midterm: 0, final: 0, quiz: 0, homework: 0 },
  { key: 4, id: "B6603953", firstName: "ปีเตอร์", lastName: "พาร์คเกอร์", midterm: 0, final: 0, quiz: 0, homework: 0 },
];

// ===========================
//  Fetch Students (รอเชื่อม backend)
// ===========================
const fetchStudents = async (courseCode: string) => {
  try {
    // TODO: เชื่อม backend จริง
    // const response = await fetch(`/api/students?course=${courseCode}`);
    // const data: Student[] = await response.json();
    // return data;

    // ตอนนี้ใช้ mock data
    return [
      { key: 1, id: "B6616052", firstName: "นายวรวุฒิ", lastName: "ทัศน์ทอง", midterm: 20, final: 30, quiz: 10, homework: 15 },
      { key: 2, id: "B6636987", firstName: "มงกี้", lastName: "ดี ลูฟี่", midterm: 15, final: 25, quiz: 8, homework: 20 },
      { key: 3, id: "B6605355", firstName: "ไก่ทอด", lastName: "สมุนไพร", midterm: 10, final: 20, quiz: 15, homework: 10 },
      { key: 4, id: "B6603953", firstName: "ปีเตอร์", lastName: "พาร์คเกอร์", midterm: 5, final: 10, quiz: 8, homework: 25 },
    ];
  } catch (error) {
    console.error("Error fetching students:", error);
    return [];
  }
};

// ===========================
//  TeacherDashboard Component
// ===========================
type TeacherDashboardProps = { // props สำหรับ dashboard
  onSelectCourse: (course: { code: string; name: string }) => void; // เมื่อคลิกวิชา
};

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onSelectCourse }) => {
  const [year, setYear] = useState("2568"); // ปีการศึกษา
  const [term, setTerm] = useState("1"); // เทอม

  return (
    <div style={{ padding: 20, maxWidth: 1500, margin: "auto" }}>
      {/* เลือกปี และ เทอม */}
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

      {/* ชื่ออาจารย์ */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 5 }}>
        <Col>
          <Title level={3} style={{ marginTop: 20, marginBottom: 30, fontWeight: "bold" }}>
            รองศาสตราจารย์ ดร.สมชาย ใจดี
          </Title>
        </Col>
      </Row>

      {/* การ์ดรายวิชา */}
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
                justifyContent: "center",
              }}
              bodyStyle={{ padding: 50 }}
              hoverable
              onClick={() => onSelectCourse({ code, name })} // คลิกเพื่อไปหน้า student-score
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
//  StudentScorePage Component
// ===========================
type StudentScorePageProps = {
  course: { code: string; name: string } | null; // วิชาที่เลือก
  onBack: () => void; // กลับ dashboard
};

const StudentScorePage: React.FC<StudentScorePageProps> = ({ course, onBack }) => {
  const [filterType, setFilterType] = useState<"all" | "midterm" | "final" | "quiz" | "homework">("all"); // เลือก column
  const [searchText, setSearchText] = useState(""); // search รหัสนักศึกษา
  const [students, setStudents] = useState<Student[]>([]); // ข้อมูลนักศึกษา
  const [editingData, setEditingData] = useState<Student[]>([]); // ข้อมูลที่แก้ไข
  const [editMode, setEditMode] = useState(false); // edit mode on/off

  useEffect(() => {
    const loadStudents = async () => {
      if (course) {
        const data = await fetchStudents(course.code); // โหลดนักศึกษา
        setStudents(data);
      }
    };
    loadStudents();
  }, [course]);

  // filter รหัสนักศึกษา
  const filteredStudents = students.filter(s =>
    s.id.toLowerCase().includes(searchText.toLowerCase())
  );

  // แก้ไขคะแนน
  const handleEdit = (key: number, field: keyof Student, value: number | string) => {
    setEditingData(prev =>
      prev.map(s => s.key === key ? { ...s, [field]: Number(value) || 0 } : s)
    );
  };

  // บันทึกคะแนน
  const handleSave = async () => {
    // TODO: ส่ง backend
    setStudents(prev =>
      prev.map(s => {
        const updated = editingData.find(e => e.key === s.key);
        return updated ? updated : s;
      })
    );
    setEditMode(false);
    setEditingData([]);
  };

  // สร้าง column Table ตาม filterType
  const getColumns = (): ColumnsType<Student> => {
    const cols: ColumnsType<Student> = [
      { title: "No.", dataIndex: "key", key: "no", align: "center" },
      { title: "รหัสนักศึกษา", dataIndex: "id", key: "id", align: "center" },
      { title: "ชื่อ", dataIndex: "firstName", key: "firstName", align: "center" },
      { title: "นามสกุล", dataIndex: "lastName", key: "lastName", align: "center" },
    ];

    if (filterType === "all") {
      // เพิ่ม column คะแนนทั้งหมด
      cols.push(
        { title: "Midterm", dataIndex: "midterm", key: "midterm", align: "center", render: (_, record) =>
            editMode ? <Input type="number" value={editingData.find(d => d.key === record.key)?.midterm} onChange={e => handleEdit(record.key, "midterm", e.target.value)} /> : record.midterm },
        { title: "Final", dataIndex: "final", key: "final", align: "center", render: (_, record) =>
            editMode ? <Input type="number" value={editingData.find(d => d.key === record.key)?.final} onChange={e => handleEdit(record.key, "final", e.target.value)} /> : record.final },
        { title: "Quiz", dataIndex: "quiz", key: "quiz", align: "center", render: (_, record) =>
            editMode ? <Input type="number" value={editingData.find(d => d.key === record.key)?.quiz} onChange={e => handleEdit(record.key, "quiz", e.target.value)} /> : record.quiz },
        { title: "Homework", dataIndex: "homework", key: "homework", align: "center", render: (_, record) =>
            editMode ? <Input type="number" value={editingData.find(d => d.key === record.key)?.homework} onChange={e => handleEdit(record.key, "homework", e.target.value)} /> : record.homework },
        { title: "Total (100%)", key: "total", align: "center", render: (_, record) => {
            const data = editMode ? editingData.find(d => d.key === record.key) || record : record;
            return data.midterm + data.final + data.quiz + data.homework;
          }
        }
      );
    } else {
      const field = filterType as keyof Student;
      cols.push({
        title: filterType.charAt(0).toUpperCase() + filterType.slice(1),
        dataIndex: field,
        key: field,
        align: "center",
        render: (_, record) =>
          editMode ? <Input type="number" value={editingData.find(d => d.key === record.key)?.[field]} onChange={e => handleEdit(record.key, field, e.target.value)} /> : record[field]
      });
    }

    return cols;
  };

  return (
    <div style={{ padding: 10, maxWidth: 1500, margin: "auto" }}>  
      <Button onClick={onBack}>BACK</Button>
      {course && (
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <Text style={{ fontWeight: "bold", fontSize: 30 }}>
            <Text strong style={{ fontSize: 30 }}>{course.code}</Text> - 
            <Text strong style={{ fontSize: 30 }}> {course.name}</Text>
          </Text>
        </div>
      )}

      {/* filter / search */}
      <Row align="top" gutter={16} style={{ marginBottom: 20 }}>
        <Col>
          <div style={{ backgroundColor: "#2e236c", padding: "8px 12px", borderRadius: 6 }}>
            <Text style={{ color: "white", marginRight: 8 }}>ประเภท</Text>
            <Select value={filterType} onChange={setFilterType} style={{ width: 150 }}>
              <Option value="all">All</Option>
              <Option value="midterm">Midterm</Option>
              <Option value="final">Final</Option>
              <Option value="quiz">Quiz</Option>
              <Option value="homework">Homework</Option>
            </Select>
          </div>
        </Col>
        <Col>
          <div style={{ backgroundColor: "#2e236c", padding: "8px 12px", borderRadius: 6 }}>
            <Text style={{ color: "white", marginRight: 8 }}>ค้นหาด้วยรหัสนักศึกษา</Text>
            <Input
              placeholder="Search..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 180, height: 32, fontSize: 12}}
            />
          </div>
        </Col>
      </Row>

      {/* ปุ่ม edit */}
      {filterType !== "all" && !editMode && (
        <Button
          type="primary"
          onClick={() => { 
            setEditMode(true); 
            setEditingData(searchText ? filteredStudents : students); 
          }}
          style={{
            width: "100%",
            padding: "23px 0",
            fontWeight: "bold",
            marginTop: 10,
            marginBottom: 5,
            background: "#efd219ff",
            color: "black"
          }}
        >
          + แก้ไขคะแนน
        </Button>
      )}

      {/* ตารางคะแนน */}
      <Table
        dataSource={filteredStudents}
        columns={getColumns()}
        pagination={{ pageSize: 50 }}
        bordered
      />

      {/* ปุ่ม save */}
      {editMode && (
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <Button 
            type="primary" 
            onClick={handleSave}
            style={{
              width: "100%",
              padding: "23px 0",
              fontWeight: "bold",
              background: "#097141ff",
              color: "white",
              marginTop: 10,
            }}
          >
            บันทึกคะแนน
          </Button>
        </div>
      )}
    </div>
  );
};

// ===========================
//  Score Component (หน้าหลัก)
// ===========================
const Score: React.FC = () => {
  const [view, setView] = useState<"dashboard" | "student-score">("dashboard"); // สลับหน้า
  const [selectedCourse, setSelectedCourse] = useState<{ code: string; name: string } | null>(null); // วิชาที่เลือก

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#2e236c", color: "white", textAlign: "center", fontSize: 24 }}>
        กรอกคะแนนรายวิชา
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

export default Score; // export component
