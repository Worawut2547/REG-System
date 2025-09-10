// src/pages/dashboard/menu/studentScore/StudentScore.tsx
import React, { useEffect, useState } from "react";
import { Layout, Divider } from "antd";
import FilterPanel from "./filterPanel";
import CourseTable from "./table.tsx";
import { type CourseData } from "./table.tsx";
import { getScoreByStudentID } from "../../../../../services/https/score/score";
import "./score.css";

const { Header, Content, Footer } = Layout;

const StudentScore: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState("2568");
  const [selectedTerm, setSelectedTerm] = useState("1");
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  const [termOptions, setTermOptions] = useState<string[]>([]);

  useEffect(() => {
    getScoreByStudentID().then((res) => {
      // สร้าง options ของปี/เทอม
      const years: string[] = Array.from(new Set(res.map((r: any) => String(r.AcademicYear))));
      setYearOptions(years);

      const terms: string[] = Array.from(new Set(res.map((r: any) => String(r.Term))));
      setTermOptions(terms);

      // map เป็นโครงที่ CourseTable ใช้
      const grouped: { [key: string]: any[] } = {};
      res.forEach((r: any) => {
        const key = r.SubjectName;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r);
      });

      const transformed: CourseData[] = Object.keys(grouped).map((subject) => {
        const records = grouped[subject];
        const scores = records.map((r) => ({
          evaluation: r.List,
          point: r.Score,
          total: r.FullScore,
        }));
        const total = records.reduce((sum, r) => sum + r.Score, 0);
        return {
          course: subject,
          scores,
          summary: { total, net: total },
        };
      });

      setCourses(transformed);
    });
  }, []);

  // filter ตามปี/เทอม
  const filteredCourses = courses.filter((course) => {
    return true; // ตอนนี้ courses ไม่มี field year/term → ต้อง filter จาก raw data
  });

  return (
    <Layout
      style={{
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
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
        รายงานผลคะแนน
      </Header>

      <Content
        style={{
          background: "#f5f5f5",
          padding: 24,
          minHeight: 400,
          color: "#333",
          overflowY: "auto",
        }}
      >
        <FilterPanel
          selectedYear={selectedYear}
          selectedTerm={selectedTerm}
          setSelectedYear={setSelectedYear}
          setSelectedTerm={setSelectedTerm}
          yearOptions={yearOptions}
          termOptions={termOptions}
        />
        <Divider />
        <CourseTable courses={filteredCourses} />
      </Content>

      <Footer
        style={{
          background: "#1890ff",
          color: "white",
          textAlign: "center",
          padding: 12,
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
        }}
      >
        Footer © 2025
      </Footer>
    </Layout>
  );
};

export default StudentScore;
