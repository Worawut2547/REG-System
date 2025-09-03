// ===========================
// ScoreGrade.tsx
// ===========================
import React, { useState, useEffect } from "react";
import { Layout, Select, Row, Col, Card, Typography, Table, Input, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import './grade.css';

const { Header, Content, Footer } = Layout;
const { Option } = Select;
const { Title, Text } = Typography;

type Course = { code: string; name: string; students: number; color: string; year: string; term: string };
type Student = { key: number; id: string; firstName: string; lastName: string; total: number; grade: string };

const getGrade = (score: number) => {
  if (score >= 80) return "A";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "D+";
  if (score >= 50) return "D";
  return "F";
};

const gradeOptions = ["A", "B+", "B", "C+", "C", "D+", "D", "F"];

// Mock รายวิชา
const courses: Course[] = [
  { code: "ENG23 3031", name: "System Analysis", students: 115, color: "#1a1440ff", year: "2568", term: "1" },
  { code: "ENG23 3051", name: "Formal Method", students: 125, color: "#332771ff", year: "2568", term: "1" },
  { code: "ENG23 3014", name: "Web Application", students: 120, color: "#4c5ba8ff", year: "2568", term: "2" },
  { code: "ENG23 2011", name: "Database System", students: 175, color: "#2d3685ff", year: "2567", term: "2" },
];

// Mock นักศึกษา
const fetchStudents = async (courseCode: string) => [
  { key: 1, id: "B6616052", firstName: "นายวรวุฒิ", lastName: "ทัศน์ทอง", total: 85, grade: getGrade(85) },
  { key: 2, id: "B6636987", firstName: "มงกี้", lastName: "ดี ลูฟี่", total: 73, grade: getGrade(73) },
  { key: 3, id: "B6605355", firstName: "ไก่ทอด", lastName: "สมุนไพร", total: 66, grade: getGrade(66) },
  { key: 4, id: "B6603953", firstName: "ปีเตอร์", lastName: "พาร์คเกอร์", total: 48, grade: getGrade(48) },
];

// ===========================
// TeacherDashboard
// ===========================
type TeacherDashboardProps = { onSelectCourse: (course: { code: string; name: string }) => void };

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onSelectCourse }) => {
  const [year, setYear] = useState("2568");
  const [term, setTerm] = useState("1");

  const filteredCourses = courses.filter(c => c.year === year && c.term === term);

  return (
    <div style={{ padding: 20, maxWidth: 1500, margin: "auto" }}>
      <Row justify="start" align="middle" style={{ marginBottom: 20, gap: 50 }}>
        <Col>
          <Text strong style={{ fontSize: 18 }}>ปีการศึกษา</Text>
          <Select value={year} onChange={setYear} style={{ width: 100, marginLeft: 8 }}>
            <Option value="2568">2568</Option>
            <Option value="2567">2567</Option>
            <Option value="2566">2566</Option>
            <Option value="2565">2565</Option>
          </Select>
        </Col>
        <Col>
          <Text strong style={{ fontSize: 18 }}>ภาคเรียนที่</Text>
          <Select value={term} onChange={setTerm} style={{ width: 60, marginLeft: 8 }}>
            <Option value="1">1</Option>
            <Option value="2">2</Option>
            <Option value="3">3</Option>
          </Select>
        </Col>
      </Row>

      {/* ชื่ออาจารย์ */}
      <Row justify="start" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={3} style={{ marginTop: 10, marginBottom: 10, fontWeight: "bold" }}>
            รองศาสตราจารย์ ดร.สมชาย ใจดี
          </Title>
        </Col>
      </Row>

      {/* การ์ดคอร์ส */}
      <Row gutter={[40, 40]}>
        {filteredCourses.length > 0 ? (
          filteredCourses.map(({ code, name, color }) => ( // เอา students ออก
            <Col key={code} xs={24} sm={12} md={12} lg={8}>
              <Card
                style={{
                  backgroundColor: color,
                  color: "white",
                  textAlign: "center",
                  height: 200,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
                bodyStyle={{ padding: 20 }}
                hoverable
                onClick={() => onSelectCourse({ code, name })}
              >
                <Title level={4} style={{ color: "white", fontWeight: 'Bold' }}>{code}</Title>
                <Title level={5} style={{ color: "white", marginTop: 8, fontSize: 20, fontWeight: 'Bold' }}>{name}</Title>
              </Card>
            </Col>
          ))
        ) : (
          <Col span={24} style={{ textAlign: "center", marginTop: 50 }}>
            <Text style={{ fontSize: 16, color: "#888" }}>ไม่มีรายวิชาในปี/เทอมที่เลือก</Text>
          </Col>
        )}
      </Row>
    </div>
  );
};

// ===========================
// StudentGradePage
// ===========================
type StudentGradePageProps = { course: { code: string; name: string } | null; onBack: () => void };

const StudentGradePage: React.FC<StudentGradePageProps> = ({ course, onBack }) => {
  const [searchText, setSearchText] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editingData, setEditingData] = useState<Student[]>([]);

  useEffect(() => {
    const loadStudents = async () => {
      if (course) {
        const data = await fetchStudents(course.code);
        setStudents(data);
      }
    };
    loadStudents();
  }, [course]);

  const filteredStudents = (editMode ? editingData : students).filter(s =>
    s.id.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSave = () => {
    setStudents(editingData);
    setEditMode(false);
  };

  const handleScoreChange = (value: string, key: number) => {
    const newValue = Number(value);
    if (isNaN(newValue) || newValue < 0 || newValue > 100) return;
    setEditingData(prev =>
      prev.map(student => student.key === key ? { ...student, total: newValue, grade: getGrade(newValue) } : student)
    );
  };

  const handleGradeChange = (value: string, key: number) => {
    setEditingData(prev =>
      prev.map(student => student.key === key ? { ...student, grade: value } : student)
    );
  };

  const columns: ColumnsType<Student> = [
    { title: "No.", dataIndex: "key", key: "no", align: "center" },
    { title: "รหัสนักศึกษา", dataIndex: "id", key: "id", align: "center" },
    { title: "ชื่อ", dataIndex: "firstName", key: "firstName", align: "center" },
    { title: "นามสกุล", dataIndex: "lastName", key: "lastName", align: "center" },
    {
      title: "Total (100%)",
      dataIndex: "total",
      key: "total",
      align: "center",
      render: (text, record) =>
        editMode ? (
          <Input
            type="number"
            min={0}
            max={100}
            value={record.total}
            onChange={e => handleScoreChange(e.target.value, record.key)}
            style={{ width: 80, textAlign: "center" }}
          />
        ) : text
    },
    {
      title: "Grade",
      dataIndex: "grade",
      key: "grade",
      align: "center",
      render: (text, record) =>
        editMode ? (
          <Select
            value={record.grade}
            onChange={value => handleGradeChange(value, record.key)}
            style={{ width: 80 }}
          >
            {gradeOptions.map(g => <Option key={g} value={g}>{g}</Option>)}
          </Select>
        ) : text
    }
  ];

  return (
    <div style={{ padding: 10, maxWidth: 1500, margin: "auto" }}>
      <Button onClick={onBack}>BACK</Button>
      {course && (
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <Text style={{ fontWeight: "bold", fontSize: 30 }}>{course.code} - {course.name}</Text>
        </div>
      )}

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

      {!editMode && (
        <Button
          type="primary"
          onClick={() => { setEditMode(true); setEditingData(filteredStudents.length > 0 ? filteredStudents : students); }}
          style={{ width: "100%", padding: "23px 0", fontWeight: "bold", marginTop: 10, marginBottom: 5, background: "#efd219ff", color: "black", border: "none" }}
        >
          + แก้ไขคะแนนและผลการเรียน
        </Button>
      )}

      <Table dataSource={filteredStudents} columns={columns} pagination={{ pageSize: 50 }} bordered />

      {editMode && (
        <Button
          type="primary"
          onClick={handleSave}
          style={{ width: "100%", padding: "23px 0", fontWeight: "bold", background: "#097141ff", color: "white", marginTop: 10, border: "none" }}
        >
          บันทึกคะแนนและผลการเรียน
        </Button>
      )}
    </div>
  );
};

// ===========================
// Main Component
// ===========================
const ScoreGrade: React.FC = () => {
  const [view, setView] = useState<"dashboard" | "student-grade">("dashboard");
  const [selectedCourse, setSelectedCourse] = useState<{ code: string; name: string } | null>(null);

  return (
    <Layout style={{ minHeight: "100vh", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", overflow: "hidden" }}>
      <Header style={{ background: "#2e236c", color: "white", textAlign: "center", fontSize: 24, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
        กรอกผลการเรียนรายวิชา
      </Header>

      <Content style={{ background: "#f5f5f5", padding: 24 }}>
        {view === "dashboard" && (
          <TeacherDashboard onSelectCourse={(course) => { setSelectedCourse(course); setView("student-grade"); }} />
        )}
        {view === "student-grade" && selectedCourse && (
          <StudentGradePage course={selectedCourse} onBack={() => setView("dashboard")} />
        )}
      </Content>

      <Footer style={{ background: "#1890ff", color: "white", textAlign: "center", borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
        Footer © 2025
      </Footer>
    </Layout>
  );
};

export default ScoreGrade;
