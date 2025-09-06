import { useState, useEffect, useMemo } from 'react';
import { Layout, Typography, Divider } from "antd";
import './grade.css';

import { type GradeStudentInterface } from '../../../../../interfaces/Grade';
import { getGradeStudent } from '../../../../../services/https/grade/grade';
import { calculateSummary } from '../../../../../services/grade/calculateGrade';
import FilterPanel from '../grade/filterPanel';
import CourseTable from '../grade/table';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

const Grade: React.FC = () => {
  const [gradeStudent, setGradeStudent] = useState<GradeStudentInterface[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedTerm, setSelectedTerm] = useState<string>("all");

  useEffect(() => {
    getGradeStudent()
      .then((data) => setGradeStudent(data))
      .catch((err) => console.error(err));
  }, []);

  const groupRecord = useMemo(() => {
    const group: Record<string, GradeStudentInterface[]> = {};
    gradeStudent.forEach((item) => {
      const key = `${item.AcademicYear}-${item.Term}`;
      if (!group[key]) group[key] = [];
      group[key].push(item);
    });
    return group;
  }, [gradeStudent]);

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

  const summaries = useMemo(() => {
    return calculateSummary(filteredRecords.map(([_, records]) => records));
  }, [filteredRecords]);

  return (
    <Layout style={{ width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header
        style={{
          background: "#2e236c",
          color: "white",
          textAlign: "center",
          fontSize: 24,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      >
        รายงานผลการเรียน
      </Header>

      <Content style={{ background: "#f5f5f5", padding: 24, overflowY: "auto" }}>
        <FilterPanel
          gradeStudent={gradeStudent}
          selectedYear={selectedYear}
          selectedTerm={selectedTerm}
          setSelectedYear={setSelectedYear}
          setSelectedTerm={setSelectedTerm}
        />
        < Divider />

        {filteredRecords.length > 0 ? (
          filteredRecords.map(([key, records], idx) => (
            <CourseTable key={key} records={records} summary={summaries[idx]} keyId={key} />
          ))
        ) : (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Typography.Text type="secondary">ไม่พบข้อมูลสำหรับปี/ภาคการศึกษาที่เลือก</Typography.Text>
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
