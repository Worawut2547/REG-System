// src/pages/dashboard/menu/StudentScore.tsx
import React, { useEffect, useState } from "react";
import { Divider, Layout, Select, Space, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import "./score.css";

const { Text } = Typography;
const { Header, Content, Footer } = Layout;
const { Option } = Select;

// ------------------------- Type -------------------------
type Score = {
  evaluation: string;
  total: number | string;
  point: number | string;
  cal: number | string;
  net: number | string;
};

type CourseData = {
  course: string;
  scores: Score[];
  summary: { total: number; net: number };
};

type BackendData = Record<string, CourseData[]>; // รูปแบบข้อมูลจาก backend

const studentInfo = {
  id: "B6619602",
  name: "นางสาวรุ่งอรุณ ศรีบัว",
};

// ------------------------- MOCK DATA -------------------------
// ยังใช้ mock data เหมือนเดิมเพื่อรัน UI
const mockData: BackendData = {
  // ปี 2567
  "2567-1": [
    {
      course: "ENG23 3001: COMPUTER NETWORK",
      scores: [
        { evaluation: "Lab", total: 10, point: 10, cal: "10 X 1->(10%)", net: 10 },
        { evaluation: "Midterm", total: 30, point: 27, cal: "27 X 1->(30%)", net: 27 },
      ],
      summary: { total: 40, net: 37 },
    },
    {
      course: "ENG23 4010: MACHINE LEARNING",
      scores: [
        { evaluation: "Project", total: 20, point: 18, cal: "18 X 1->(20%)", net: 18 },
        { evaluation: "Final", total: 30, point: 27, cal: "27 X 1->(30%)", net: 27 },
      ],
      summary: { total: 50, net: 45 },
    },
  ],
  "2567-2": [
    {
      course: "ENG23 3010: SOFTWARE ENGINEERING",
      scores: [
        { evaluation: "Assignment", total: 15, point: 14, cal: "14 X 1->(15%)", net: 14 },
        { evaluation: "Final", total: 35, point: 32, cal: "32 X 1->(35%)", net: 32 },
      ],
      summary: { total: 50, net: 46 },
    },
    {
      course: "ENG23 3001: COMPUTER NETWORK",
      scores: [
        { evaluation: "Lab", total: 10, point: 10, cal: "10 X 1->(10%)", net: 10 },
        { evaluation: "Midterm", total: 30, point: 27, cal: "27 X 1->(30%)", net: 27 },
      ],
      summary: { total: 40, net: 37 },
    },
  ],
  "2567-3": [
    {
      course: "ENG23 3020: OPERATING SYSTEM",
      scores: [
        { evaluation: "Quiz", total: 10, point: 9, cal: "9 X 1->(10%)", net: 9 },
        { evaluation: "Midterm", total: 25, point: 23, cal: "23 X 1->(25%)", net: 23 },
      ],
      summary: { total: 35, net: 32 },
    },
  ],

  // ปี 2568
  "2568-1": [
    {
      course: "ENG23 4001: ARTIFICIAL INTELLIGENCE",
      scores: [
        { evaluation: "Assignment", total: 10, point: 9, cal: "9 X 1->(10%)", net: 9 },
        { evaluation: "Midterm", total: 25, point: 23, cal: "23 X 1->(25%)", net: 23 },
      ],
      summary: { total: 35, net: 32 },
    },
    {
      course: "ENG23 3001: COMPUTER NETWORK",
      scores: [
        { evaluation: "Lab", total: 10, point: 10, cal: "10 X 1->(10%)", net: 10 },
        { evaluation: "Midterm", total: 30, point: 27, cal: "27 X 1->(30%)", net: 27 },
      ],
      summary: { total: 40, net: 37 },
    },
    {
      course: "ENG23 4010: MACHINE LEARNING",
      scores: [
        { evaluation: "Project", total: 20, point: 18, cal: "18 X 1->(20%)", net: 18 },
        { evaluation: "Final", total: 30, point: 27, cal: "27 X 1->(30%)", net: 27 },
      ],
      summary: { total: 50, net: 45 },
    },
  ],
  "2568-2": [
    {
      course: "ENG23 4010: MACHINE LEARNING",
      scores: [
        { evaluation: "Project", total: 20, point: 18, cal: "18 X 1->(20%)", net: 18 },
        { evaluation: "Final", total: 30, point: 27, cal: "27 X 1->(30%)", net: 27 },
      ],
      summary: { total: 50, net: 45 },
    },
  ],
};

// ------------------------- Styles -------------------------
const wrapperStyle: React.CSSProperties = {
  borderRadius: 8,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  width: "100%",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const contentStyle: React.CSSProperties = {
  background: "#f5f5f5",
  padding: 24,
  minHeight: 400,
  color: "#333",
  overflowY: "auto",
};

const footerStyle: React.CSSProperties = {
  background: "#1890ff",
  color: "white",
  textAlign: "center",
  padding: 12,
};

// ------------------------- Component -------------------------
const StudentScore: React.FC = () => {
  // ------------------------- State -------------------------
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [backendData, setBackendData] = useState<BackendData>(mockData); // ข้อมูลปี-เทอม
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  const [termOptions, setTermOptions] = useState<string[]>([]);

  // ------------------------- หา year-term ล่าสุด -------------------------
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

  // ------------------------- update options ปีและเทอม -------------------------
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

  // ------------------------- ดึงข้อมูล courses ตามปี-เทอม -------------------------
  const yearTerm = `${selectedYear}-${selectedTerm}`;
  const courses = backendData[yearTerm] ?? [];

  // ------------------------- Columns -------------------------
  const columns: ColumnsType<Score> = [

    {
      title: <div style={{ textAlign: "center" , fontSize: 16}}>Score Evaluation</div>,
      dataIndex: "evaluation",
      key: "evaluation",
      width: 250,
      render: (text: string) => <div style={{ textAlign: "left" }}>{text}</div>,
    },
    { title: "Total", dataIndex: "total", key: "total", width: 80, align: "center" },
    { title: "Point", dataIndex: "point", key: "point", width: 80, align: "center" },
    { title: "Cal", dataIndex: "cal", key: "cal", width: 150, align: "center" },
    { title: "Net Point", dataIndex: "net", key: "net", width: 80, align: "center" },
  ];

  // ------------------------- ตัวอย่างฟังก์ชันเชื่อม backend -------------------------
  /*
    TODO: แทนที่ mockData ด้วย fetch API จริง
    useEffect(() => {
      const fetchScores = async () => {
        try {
          // ตัวอย่าง endpoint API ของ server
          const res = await fetch(`/api/student/${studentInfo.id}/scores`);
          if (!res.ok) throw new Error("Fetch failed");
          const data: BackendData = await res.json(); // ต้อง match type BackendData
          setBackendData(data); // แทนที่ mock data ด้วยข้อมูลจริง
        } catch (err) {
          message.error("ไม่สามารถดึงข้อมูลคะแนนจาก server ได้");
        }
      };

      fetchScores();
    }, []);
  */

  return (
    <Layout style={wrapperStyle}>
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

      <Content style={contentStyle}>
        <div style={{ marginTop: 5, marginBottom: 25, paddingBottom: 8, borderBottom: "2px solid #ccc" }}>
          <Text style={{ fontWeight: "normal", fontSize: 25 }}>
            <Text strong style={{ fontSize: 25 }}>{studentInfo.id}</Text> -
            <Text strong style={{ fontSize: 25 }}> {studentInfo.name}</Text>
          </Text>
        </div>

        <Space style={{ marginBottom: 25, fontSize: 18, fontWeight: "bold" }}>
          <span>ปีการศึกษา</span>
          <Select
            value={selectedYear}
            style={{ width: 150 }}
            onChange={(val) => {
              setSelectedYear(val);
              const terms = Object.keys(backendData)
                .filter(k => k.startsWith(val + "-"))
                .map(k => k.split("-")[1]);
              setSelectedTerm(terms.sort((a, b) => Number(a) - Number(b))[0]);
            }}
          >
            {yearOptions.map(year => <Option key={year} value={year}>{year}</Option>)}
          </Select>

          <span style={{ fontSize: 18, marginLeft: 30 }}>ภาคการศึกษา</span>
          <Select
            value={selectedTerm}
            style={{ width: 150 }}
            onChange={setSelectedTerm}
          >
            {termOptions.map(term => <Option key={term} value={term}>{term}</Option>)}
          </Select>
        </Space>

        {courses.map((courseData, idx) => (
          <div key={idx} style={{ marginBottom: 30, background: "#f5f5f5", borderRadius: 8, padding: 12 }}>
            <h3 style={{ marginBottom: 10, color: "black" }}>{courseData.course}</h3>
            <Table<Score>
              className="course-table"
              dataSource={[
                ...courseData.scores,
                {
                  evaluation: "สรุป",
                  total: courseData.summary.total,
                  point: "-",
                  cal: "-",
                  net: courseData.summary.net,
                },
              ]}
              columns={columns}
              pagination={false}
              rowKey={(record) => record.evaluation}
              size="small"
              bordered
              rowClassName={(record) => (record.evaluation === "สรุป" ? "summary-row no-hover" : "no-hover")}              
              components={{
                header: {
                  cell: (props: any) => (
                    <th
                      {...props}
                      style={{
                        backgroundColor: "#2e236c", // สีพื้นหัวตาราง
                        color: "white",             // สีตัวอักษร
                        textAlign: "center",        // จัดกลาง
                        fontWeight: "bold",         // ตัวหนา
                        fontSize: "16px",           // ขนาดหัวตาราง
                        padding: "8px",
                      }}
                    />
                  ),
                },
              }}
            />
          </div>
        ))}
      </Content>

      <Footer style={footerStyle}>Footer © 2025</Footer>
    </Layout>
  );
};

export default StudentScore;
