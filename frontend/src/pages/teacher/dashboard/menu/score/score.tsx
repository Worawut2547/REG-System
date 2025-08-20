import React, { useState } from "react";
import { Layout, Select, Row, Col, Card, Typography, Table, Button, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import './score.css';

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
  midterm: number;
  final: number;
  quiz: number;
  homework: number;
};

// ข้อมูลวิชา
const courses: Course[] = [
  { code: "ENG23 3031", name: "System Analysis", students: 115, color: "#1a1440ff" },
  { code: "ENG23 3051", name: "Formal Method", students: 125, color: "#332771ff" },
  { code: "ENG23 3014", name: "Web Application", students: 120, color: "#4c5ba8ff" },
  { code: "ENG23 2011", name: "Database System", students: 175, color: "#2d3685ff" },
];

// ข้อมูลนักศึกษาเริ่มต้น
const studentData: Student[] = [
  { key: 1, id: "B6616052", firstName: "นายวรวุฒิ", lastName: "ทัศน์ทอง", midterm: 0, final: 0, quiz: 0, homework: 0 },
  { key: 2, id: "B6636987", firstName: "มงกี้", lastName: "ดี ลูฟี่", midterm: 0, final: 0, quiz: 0, homework: 0 },
  { key: 3, id: "B6605355", firstName: "ไก่ทอด", lastName: "สมุนไพร", midterm: 0, final: 0, quiz: 0, homework: 0 },
  { key: 4, id: "B6603953", firstName: "ปีเตอร์", lastName: "พาร์คเกอร์", midterm: 0, final: 0, quiz: 0, homework: 0 },
];

// หน้าเลือกวิชา
type TeacherDashboardProps = {
  onSelectCourse: (course: { code: string; name: string }) => void;
};

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onSelectCourse }) => {
  const [year, setYear] = useState("2568");
  const [term, setTerm] = useState("1");

  return (
    <div style={{ padding: 20, maxWidth: 1500, margin: "auto" }}>
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
                width: "100%",
                height: 250,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
              bodyStyle={{ padding: 50 }}
              hoverable
              onClick={() => onSelectCourse({ code, name })}
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

// หน้าแก้ไข/กรอกคะแนน
type StudentScorePageProps = {
  course: { code: string; name: string } | null;
  onBack: () => void;
};

const StudentScorePage: React.FC<StudentScorePageProps> = ({ course, onBack }) => {
  const [filterType, setFilterType] = useState<"all" | "midterm" | "final" | "quiz" | "homework">("all");
  const [searchText, setSearchText] = useState("");
  const [students, setStudents] = useState<Student[]>(studentData);
  const [editingData, setEditingData] = useState<Student[]>([]);
  const [editMode, setEditMode] = useState(false);

  const handleEdit = (key: number, field: keyof Student, value: number | string) => {
    setEditingData(prev =>
      prev.map(s => s.key === key ? { ...s, [field]: Number(value) || 0 } : s)
    );
  };

  const handleSave = () => {
    setStudents(editingData);
    setEditMode(false);
    setEditingData([]);
  };

  const getColumns = (): ColumnsType<Student> => {
    const cols: ColumnsType<Student> = [
      { title: "No.", dataIndex: "key", key: "no", align: "center" },
      { title: "รหัสนักศึกษา", dataIndex: "id", key: "id", align: "center" },
      { title: "ชื่อ", dataIndex: "firstName", key: "firstName", align: "center" },
      { title: "นามสกุล", dataIndex: "lastName", key: "lastName", align: "center" },
    ];

    if (filterType === "all") {
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

  // ไฮไลท์แถวที่ตรงกับ searchText
  const rowClassName = (record: Student) => {
    if (searchText && record.id.toLowerCase().includes(searchText.toLowerCase())) {
      return "highlight-row";
    }
    return "";
  };

  return (
    <div style={{ padding: 10, maxWidth: 1500, margin: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
        <Button onClick={onBack}>BACK</Button>
        {course && (
          <Text style={{ marginLeft: 16, fontWeight: "bold", fontSize: 30}}>
            <Text strong style={{ fontSize: 30 }}>{course.code}</Text> - <Text strong style={{ fontSize: 30 }}>{course.name}</Text>
          </Text>
        )}
      </div>

      <Row align="top" gutter={16} style={{ marginBottom: 10 }}>
        <Col>
          <div style={{ backgroundColor: "#364a96ff", padding: "8px 12px", borderRadius: 6 }}>
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
          <div style={{ backgroundColor: "#364a96ff", padding: "8px 12px", borderRadius: 6 }}>
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

      {filterType !== "all" && !editMode && (
        <Button
          type="primary"
          onClick={() => { setEditMode(true); setEditingData(students); }}
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

      <Table
        dataSource={students} // แสดงทุกคน
        columns={getColumns()}
        pagination={{ pageSize: 10 }}
        bordered
        rowClassName={rowClassName} // ไฮไลท์แถว
      />

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

// หน้า Score หลัก
const Score: React.FC = () => {
  const [view, setView] = useState<"dashboard" | "student-score">("dashboard");
  const [selectedCourse, setSelectedCourse] = useState<{ code: string; name: string } | null>(null);

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

export default Score;
