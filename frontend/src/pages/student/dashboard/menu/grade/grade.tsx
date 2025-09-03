// src/pages/dashboard/menu/register.tsx
import { useState, useEffect, useMemo } from 'react';
import { Layout, Typography, Select, Space } from "antd";
import './grade.css';

import { type GradeStudentInterface } from '../../../../../interfaces/Grade';
import { getGradeStudent } from '../../../../../services/https/grade/grade';
import { calculateSummary } from '../../../../../services/grade/calculateGrade';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;
const { Option } = Select;

interface SummaryTableProps {
  summary: {
    termCredits: number;
    termGPA: number;
    cumulativeCredits: number;
    cumulativeGPA: number;
  };
}

const SummaryTable: React.FC<SummaryTableProps> = ({ summary }) => (
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
        <td style={{ borderRight: "1px solid #ccc", fontWeight: "normal", padding: 4 }}>
          C.Register<br />
          <span>
            {summary.termCredits}
          </span>
        </td>

        <td style={{ borderRight: "1px solid #ccc", fontWeight: "normal", padding: 4 }}>
          GPA <br />
          <span>
            {summary.termGPA}
          </span>
        </td>

        <td style={{ borderRight: "1px solid #ccc", fontWeight: "bold", padding: 4 }}>
          C.Register<br />
          <span style={{ fontWeight: "normal" }}>
            {summary.cumulativeCredits}
          </span>
        </td>

        <td style={{ fontWeight: "bold", padding: 4 }}>
          GPAX<br />
          <span style={{ fontWeight: "normal" }}>
            {summary.cumulativeGPA}
          </span>
        </td>
      </tr>
    </tbody>
  </table >
);

const Grade: React.FC = () => {
  const [gradeStudent, setGradeStudent] = useState<GradeStudentInterface[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedTerm, setSelectedTerm] = useState<string>("all");

  useEffect(() => {
    getGradeStudent()
      .then((gradeStudent) => {
        console.log("API grade student response:", gradeStudent);
        setGradeStudent(gradeStudent);
      })
      .catch((err) => console.error(err));
  }, []);

  // จัดกลุ่มข้อมูลตามปี/เทอม
  const groupRecord = useMemo(() => {
    const group: Record<string, GradeStudentInterface[]> = {};
    gradeStudent.forEach((item) => {
      const key = `${item.AcademicYear}-${item.Term}`;
      if (!group[key]) group[key] = [];
      group[key].push(item);
    });
    return group;
  }, [gradeStudent]);

  // Filter ตามปีเเละเทอม
  const filteredRecords = useMemo(() => {
    return Object.entries(groupRecord)
      .filter(([key, _]) => {
        const [year, term] = key.split("-");
        const matchYear = selectedYear === "all" || selectedYear === year;
        const matchTerm = selectedTerm === "all" || selectedTerm === term;
        return matchYear && matchTerm;
      })
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [groupRecord, selectedYear, selectedTerm]);

  // คำนวณ summary สำหรับแต่ละเทอม
  const summaries = useMemo(() => {
    return calculateSummary(filteredRecords.map(([_, records]) => records));
  }, [filteredRecords]);

  return (
    <Layout style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header style={{ background: "#2e236c", color: "white", textAlign: "center", padding: 16, fontSize: 20 }}>
        หน้าเกรด
      </Header>

      <Content style={{ background: "#f5f5f5", padding: 24, overflowY: "auto" }}>
        {/* Filter */}
        <Space style={{ marginBottom: 20, fontSize: 18, fontWeight: "bold" }}>
          <Space size={8} align="center">
            <span>ปีการศึกษา</span>
            <Select
              defaultValue="all"
              style={{ width: 150 }}
              onChange={setSelectedYear}
            >
              <Option value="all">All</Option>
              {[...new Set(gradeStudent.map((r) => r.AcademicYear))].map((year) => (
                <Option key={year} value={year?.toString() || ""}>{year}</Option>
              ))}
            </Select>
          </Space>

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

        {/* ตารางแสดงผล */}
        {filteredRecords.length > 0 ? (
          filteredRecords.map(([key, records], idx) => {
            const [year, term] = key.split("-");
            return (
              <div key={key} style={{ marginBottom: 30 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, border: "1px solid #ccc", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)" }}>
                  <thead>
                    <tr style={{ background: "#2e236c", color: "white", textAlign: "center" }}>
                      <th colSpan={5} style={{ padding: 8 }}>ภาคการศึกษาที่ {term}/{year}</th>
                    </tr>
                    <tr style={{ background: "#d9d9f3" }}>
                      <th style={{ padding: 8, textAlign: "center", border: "1px solid #ccc" }}>รหัสวิชา</th>
                      <th colSpan={2} style={{ padding: 8, border: "1px solid #ccc" }}>ชื่อรายวิชา</th>
                      <th style={{ padding: 8, textAlign: "center", border: "1px solid #ccc" }}>หน่วยกิต</th>
                      <th style={{ padding: 8, textAlign: "center", border: "1px solid #ccc" }}>เกรด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((course, cIdx) => (
                      <tr key={cIdx}>
                        <td style={{ padding: 4, borderBottom: "1px solid #ddd", borderRight: "1px solid #ccc" }}>{course.SubjectID}</td>
                        <td colSpan={2} style={{ padding: 4, borderBottom: "1px solid #ddd", borderRight: "1px solid #ccc" }}>{course.SubjectName}</td>
                        <td style={{ textAlign: "center", padding: 4, borderBottom: "1px solid #ddd", borderRight: "1px solid #ccc" }}>{course.Credit}</td>
                        <td style={{ textAlign: "center", padding: 4, borderBottom: "1px solid #ddd" }}>{course.Grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* แสดง SummaryTable */}
                <SummaryTable summary={summaries[idx]} />
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Text type="secondary">ไม่พบข้อมูลสำหรับปี/ภาคการศึกษาที่เลือก</Text>
          </div>
        )}
      </Content>

      <Footer style={{ background: "#1890ff", color: "white", textAlign: "center", padding: 12 }}>
        Footer © 2025
      </Footer>
    </Layout>
  );
};

export default Grade;