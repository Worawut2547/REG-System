// src/pages/Grade.tsx
import React, { useState, useEffect } from "react";
import { Layout, Typography, Divider, Select, Space, Spin } from "antd";
import "./grade.css";

// ============================================================
// ดึง component ของ Ant Design
// Layout: Header, Content, Footer
// Typography: สำหรับข้อความ
// Divider: เส้นแบ่ง
// Select, Option: dropdown filter
// Space: จัดช่องว่าง
// Spin: loading spinner
// ============================================================

const { Header, Content, Footer } = Layout;
const { Text } = Typography;
const { Option } = Select;

// ============================================================
// Interface สำหรับ type safety
// ============================================================

interface Course {
  code: string; // รหัสวิชา
  name: string; // ชื่อวิชา
  credit: number; // หน่วยกิต
  grade: string; // เกรด
}

interface Record {
  year: number; // ปีการศึกษา
  term: number; // ภาคการศึกษา
  courses: Course[]; // รายวิชาที่ลง
  gpa: number; // GPA ของเทอม
}

interface Student {
  id: string; // รหัสนักเรียน
  name: string; // ชื่อนักเรียน
  records: Record[]; // ประวัติผลการเรียน
}

// ============================================================
// ฟังก์ชันคำนวณ cumulative GPA
// ============================================================

const getCumulative = (records: Record[], idx: number) => {
  const sliced = records.slice(0, idx + 1);
  // เอาเทอมปัจจุบันและเทอมก่อนหน้า สำหรับคำนวณ GPA สะสม

  const cRegister = sliced.reduce((sum, r) => {
    const termCredits = r.courses.reduce((s, c) => s + c.credit, 0);
    return sum + termCredits;
  }, 0);
  // รวมหน่วยกิตทั้งหมดที่ลงทะเบียนจนถึงเทอมนี้

  const totalGpaEarn = sliced.reduce((sum, r) => {
    const termCredits = r.courses.reduce((s, c) => s + c.credit, 0);
    return sum + r.gpa * termCredits;
  }, 0);
  // รวมผลคูณ GPA * หน่วยกิตของแต่ละเทอม เพื่อคำนวณ GPAX

  const gpax = cRegister ? +(totalGpaEarn / cRegister).toFixed(2) : 0;
  // GPA สะสม (GPAX)

  return { cRegister, gpax };
  // คืนค่า cumulative
};

// ============================================================
// Component ตารางสรุป GPA ต่อเทอม
// ============================================================

interface SummaryTableProps {
  rec: Record; // ข้อมูลเทอมปัจจุบัน
  cumulative: ReturnType<typeof getCumulative>; // ค่า cumulative GPA
}

const SummaryTable: React.FC<SummaryTableProps> = ({ rec, cumulative }) => (
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 14,
      marginTop: 0,
      marginBottom: 30,
      border: "0px solid #ccc",
      tableLayout: "fixed",
      borderBottomLeftRadius: 8,            // มุมบนซ้าย Header
      borderBottomRightRadius: 8,           // มุมบนขวา Header
      overflow: 'hidden',
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", // เงา
    }}
  >
    <colgroup>
      <col style={{ width: "25%" }} />
      <col style={{ width: "25%" }} />
      <col style={{ width: "25%" }} />
      <col style={{ width: "25%" }} />
    </colgroup>
    <thead>
      <tr style={{ textAlign: "center", fontWeight: "bold", background: "#fafafa" }}>
        {/* หัวตารางแบ่ง THIS SEMESTER และ CUMULATIVE */}
        <td colSpan={2} style={{ background: "#c1c7d7ff", borderRight: "1px solid #ccc", padding: 4, borderBottom: "2px solid #ddd" }}>
          THIS SEMESTER
        </td>
        <td colSpan={2} style={{ background: "#b3bdd8ff", padding: 4, borderBottom: "2px solid #ddd" }}>
          CUMULATIVE TO THIS SEMESTER
        </td>
      </tr>
    </thead>
    <tbody>
      <tr style={{ textAlign: "center", background: "#fafafa" }}>
        {/* ข้อมูลหน่วยกิตและ GPA */}
        <td style={{ borderRight: "1px solid #ccc", fontWeight: "normal", padding: 4 }}>
          C.Register<br />
          <span>{rec.courses.reduce((sum, c) => sum + c.credit, 0)}</span>
        </td>
        <td style={{ borderRight: "1px solid #ccc", fontWeight: "normal", padding: 4 }}>
          GPA<br />
          <span>{rec.gpa}</span>
        </td>
        <td style={{ borderRight: "1px solid #ccc", fontWeight: "bold", padding: 4 }}>
          C.Register<br />
          <span style={{ fontWeight: "normal" }}>{cumulative.cRegister}</span>
        </td>
        <td style={{ fontWeight: "bold", padding: 4 }}>
          GPAX<br />
          <span style={{ fontWeight: "normal" }}>{cumulative.gpax}</span>
        </td>
      </tr>
    </tbody>
  </table>
);

// ============================================================
// Main Component Grade
// ============================================================

const Grade: React.FC = () => {
  const [studentData, setStudentData] = useState<Student | null>(null); // ข้อมูลนักเรียน
  const [selectedYear, setSelectedYear] = useState<string>("all"); // filter ปี
  const [selectedTerm, setSelectedTerm] = useState<string>("all"); // filter เทอม

  // ============================================================
  // mock fetch backend
  // ============================================================
  useEffect(() => {
    const mockData: Student = {
      id: "B6619602",
      name: "นางสาวรุ่งอรุณ ศรีบัว",
      records: [
        {
          year: 2566,
          term: 1,
          courses: [
            { code: "ENG25 1010-1", name: "ENGINEERING GRAPHICS I", credit: 2, grade: "A" },
            { code: "IST20 1001-1", name: "DIGITAL LITERACY", credit: 2, grade: "C+" },
            { code: "IST20 1002-1", name: "USE OF APPLICATION PROGRAMS FOR LEARNING", credit: 1, grade: "A" },
            { code: "IST30 1101-1", name: "ENGLISH FOR COMMUNICATION 1 (T)", credit: 3, grade: "S" },
          ],
          gpa: 3.21,
        },
        {
          year: 2566,
          term: 2,
          courses: [
            { code: "ENG20 1010-1", name: "INTRODUCTION TO ENGINEERING PROFESSION", credit: 1, grade: "A" },
            { code: "ENG23 1001-1", name: "COMPUTER PROGRAMMING I", credit: 2, grade: "A" },
            { code: "IST20 1003-1", name: "LIFE SKILLS", credit: 3, grade: "B+" },
            { code: "SCI03 1002-1", name: "CALCULUS II", credit: 4, grade: "B+" },
            { code: "SCI05 1002-1", name: "PHYSICS II", credit: 4, grade: "C+" },
            { code: "SCI05 1192-1", name: "PHYSICS LABORATORY II", credit: 1, grade: "A" },
          ],
          gpa: 3.37,
        },
        {
          year: 2567,
          term: 1,
          courses: [
            { code: "ENG25 1010-1", name: "ENGINEERING GRAPHICS I", credit: 2, grade: "A" },
            { code: "IST20 1001-1", name: "DIGITAL LITERACY", credit: 2, grade: "C+" },
            { code: "IST20 1002-1", name: "USE OF APPLICATION PROGRAMS FOR LEARNING", credit: 1, grade: "A" },
            { code: "IST30 1101-1", name: "ENGLISH FOR COMMUNICATION 1 (T)", credit: 3, grade: "S" },
          ],
          gpa: 3.29,
        },
      ],
    };
    setStudentData(mockData); // เซ็ตข้อมูล mock
    // TODO: แทนที่ mockData ด้วย fetch API จาก backend
    // fetch('/api/student/grades')
    //   .then(res => res.json())
    //   .then(data => { setStudentData(data); setLoading(false); })
    //   .catch(err => console.error(err));
  }, []);

  if (!studentData) return null;

  // ============================================================
  // filter ปี/เทอม
  // ============================================================
  const filteredRecords = studentData.records.filter(
    (rec) =>
      (selectedYear === "all" || rec.year.toString() === selectedYear) &&
      (selectedTerm === "all" || rec.term.toString() === selectedTerm)
  );
  // กรอง record ตาม dropdown

  return (
    <Layout
      style={{
        minHeight: "100vh",
        borderRadius: 8,                      // ขอบมน wrapper
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
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
        รายงานผลการเรียน
      </Header>

      <Content style={{ background: "#f5f5f5", padding: 24, overflowX: "auto" , }}>
        {/* แสดงข้อมูลนักเรียน */}
        <div style={{ marginTop: 5, paddingBottom: 8, borderBottom: "2px solid #ccc", marginBottom: 20 }}>
          <Text style={{ fontWeight: "normal", fontSize: 25 }}>
            <Text strong style={{ fontSize: 25 }}>{studentData.id}</Text> -
            <Text strong style={{ fontSize: 25 }}> {studentData.name}</Text>
          </Text>
        </div>

        {/* Dropdown filter ปีและเทอม */}
        <Space style={{ marginBottom: 20, fontSize: 18, fontWeight: "bold" }}>
          {/* กลุ่มปีการศึกษา */}
          <Space size={8} align="center">
            <span>ปีการศึกษา</span>
            <Select
              defaultValue="all"
              style={{ width: 150 }}
              onChange={setSelectedYear}
            >
              <Option value="all">All</Option>
              {[...new Set(studentData.records.map((r) => r.year))].map((year) => (
                <Option key={year} value={year.toString()}>{year}</Option>
              ))}
            </Select>
          </Space>

          {/* กลุ่มภาคการศึกษา */}
          <Space size={8} align="center" style={{ marginLeft: 30 }}>
            <span>ภาคการศึกษา</span>
            <Select
              defaultValue="all"
              style={{ width: 150 }}
              onChange={setSelectedTerm}
            >
              <Option value="all">All</Option>
              {[1, 2, 3].map((term) => (
                <Option key={term} value={term.toString()}>{term}</Option>
              ))}
            </Select>
          </Space>
        </Space>

        {/* ตารางผลการเรียนต่อเทอม */}
        {filteredRecords.map((rec, idx) => {
          const cumulative = getCumulative(studentData.records, idx);
          // คำนวณ cumulative GPA
          return (
            <div key={`${rec.year}-${rec.term}`}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 0, border: "1px solid #ccc", tableLayout: "fixed", borderTopLeftRadius: 8, borderTopRightRadius: 8, overflow: "hidden",boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)", }}>
                <thead>
                  <tr style={{ background: "#2e236c", color: "white", fontWeight: "bold", textAlign: "center" }}>
                    <th colSpan={5} style={{ padding: 8 }}>ภาคการศึกษาที่ {rec.term}/{rec.year}</th>
                  </tr>
                  <tr style={{ background: "#d9d9f3" }}>
                    <th style={{ padding: 8, textAlign: "center", border: "1px solid #ccc" }}>รหัสวิชา</th>
                    <th colSpan={2} style={{ padding: 8, border: "1px solid #ccc" }}>ชื่อรายวิชา</th>
                    <th style={{ padding: 8, textAlign: "center", border: "1px solid #ccc" }}>หน่วยกิต</th>
                    <th style={{ padding: 8, textAlign: "center", border: "1px solid #ccc" }}>เกรด</th>
                  </tr>
                </thead>
                <tbody>
                  {rec.courses.map((course, cIdx) => (
                    <tr key={cIdx}>
                      <td style={{ textAlign: "left", padding: 4, borderBottom: "1px solid #ddd", borderRight: "1px solid #ccc",  }}>{course.code}</td>
                      <td colSpan={2} style={{ padding: 4, borderBottom: "1px solid #ddd", borderRight: "1px solid #ccc" }}>{course.name}</td>
                      <td style={{ textAlign: "center", padding: 4, borderBottom: "1px solid #ddd", borderRight: "1px solid #ccc" }}>{course.credit}</td>
                      <td style={{ textAlign: "center", padding: 4, borderBottom: "1px solid #ddd" }}>{course.grade}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: "bold" }}>
                    <td colSpan={5} style={{ background: "#e3e3e3ff", padding: 6, borderTop: "2px solid #ddd", borderBottom: "2px solid #ddd", textAlign: "center" }}>
                      ผลการศึกษา: ปกติ
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* ตารางสรุป GPA */}
              <SummaryTable rec={rec} cumulative={cumulative} />
            </div>
          );
        })}

        {/* กรณีไม่พบข้อมูลตาม filter */}
        {filteredRecords.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Text type="secondary">ไม่พบข้อมูลสำหรับปี/ภาคการศึกษาที่เลือก</Text>
          </div>
        )}
      </Content>

      <Footer
        style={{
          background: "#1890ff",
          color: "white",
          textAlign: "center",
          padding: 12,
          borderBottomLeftRadius: 8,          // มุมล่างซ้าย Footer
          borderBottomRightRadius: 8,         // มุมล่างขวา Footer
        }}
      >
        Footer © 2025
      </Footer>
    </Layout>
  );
};

export default Grade;

// ============================================================
// ส่วนที่ต้องแก้ไข/เพิ่มเมื่อเชื่อมกับ backend
// ============================================================
// 1. แทนที่ mock fetch (setTimeout) ด้วย fetch API จริง
//    เช่น fetch('/api/student/grades') และ parse JSON
// 2. ตรวจสอบว่า JSON ที่ backend ส่งตรงตาม interface Student
//    (id, name, records[])
// 3. ถ้า backend ส่ง cumulative GPA มาด้วย สามารถใช้แทน getCumulative
// 4. เพิ่ม error handling กรณี fetch fail
// 5. อาจเพิ่ม auth token หรือ header ตาม security ของ backend
