// src/pages/dashboard/menu/studentScore/StudentScore.tsx
import React, { useEffect, useState } from "react";
import { Layout, Typography, Space, Select, Divider } from "antd";
import type { BackendData } from "./mockData";
import mockData from "./mockData";
import FilterPanel from "./filterPanel";
import CourseTable from "./table";
import "./score.css";

const { Header, Content, Footer } = Layout;
const StudentScore: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [backendData, setBackendData] = useState<BackendData>(mockData);
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  const [termOptions, setTermOptions] = useState<string[]>([]);

  useEffect(() => {
    const yearsTerms = Object.keys(backendData);
    if (yearsTerms.length === 0) return;

    const latestYearTerm = yearsTerms.sort((a, b) => {
      const [yearA, termA] = a.split("-").map(Number);
      const [yearB, termB] = b.split("-").map(Number);
      if (yearA !== yearB) return yearB - yearA;
      return termB - termA;
    })[0];

    setSelectedYear(latestYearTerm.split("-")[0]);
    setSelectedTerm(latestYearTerm.split("-")[1]);
  }, [backendData]);

  useEffect(() => {
    const years = Array.from(new Set(Object.keys(backendData).map(k => k.split("-")[0])));
    setYearOptions(years);

    const terms = Array.from(
      new Set(
        Object.keys(backendData)
          .filter(k => k.startsWith(selectedYear + "-"))
          .map(k => k.split("-")[1])
      )
    );
    setTermOptions(terms);
  }, [backendData, selectedYear]);

  const yearTerm = `${selectedYear}-${selectedTerm}`;
  const courses = backendData[yearTerm] ?? [];

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
            backendData={backendData}
            yearOptions={yearOptions}
            termOptions={termOptions}
          />
          < Divider />
          <CourseTable courses={courses} />
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
