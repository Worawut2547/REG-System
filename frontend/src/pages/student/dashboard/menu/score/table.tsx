// src/pages/dashboard/menu/studentScore/CourseTable.tsx
import React from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";

export interface Score {
  evaluation: string;
  total: number | string; // จะใช้เก็บ FullScore
  point: number | string; // คะแนนจริง
}

export interface CourseData {
  course: string;
  scores: Score[];
  summary: {
    total: number; // รวมคะแนนจริง
    net: number;   // รวมคะแนนเต็ม
  };
}

interface CourseTableProps {
  courses: CourseData[];
}

const columns: ColumnsType<Score> = [
  {
    title: (
      <div style={{ textAlign: "center", fontSize: 16 }}>Score Evaluation</div>
    ),
    dataIndex: "evaluation",
    key: "evaluation",
    width: 250,
    render: (text: string) => <div style={{ textAlign: "left" }}>{text}</div>,
  },
  {
    title: "Total",
    dataIndex: "total",
    key: "total",
    width: 80,
    align: "center",
    render: (text, record) =>
      record.evaluation === "สรุป" ? record.total : text, // แสดง FullScore ของแต่ละประเภท
  },
  {
    title: "Point",
    dataIndex: "point",
    key: "point",
    width: 80,
    align: "center",
  },
];

const CourseTable: React.FC<CourseTableProps> = ({ courses }) => {
  return (
    <>
      {courses.map((courseData, idx) => (
        <div
          key={idx}
          style={{
            marginBottom: 30,
            background: "#f5f5f5",
            borderRadius: 8, // มุมรวมทั้งหมดของ box
            fontSize: 18,
          }}
        >
          <h3 style={{ marginBottom: 10, color: "black" }}>{courseData.course} {}</h3>
          <Table<Score>
            className="course-table"
            dataSource={[
              ...courseData.scores.map((s) => ({
                evaluation: s.evaluation,
                total: s.total,
                point: s.point,
              })),
              {
                evaluation: "สรุป",
                total: courseData.summary.net,
                point: courseData.summary.total,
              },
            ]}
            columns={columns}
            pagination={false}
            rowKey={(record) => record.evaluation}
            size="small"
            bordered
            components={{
              header: {
                cell: (props: any) => (
                  <th
                    {...props}
                    style={{
                      backgroundColor: "#2e236c",
                      color: "white",
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: "16px",
                      padding: "8px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  />
                ),
              },
              body: {
                row: (rowProps: any) => {
                  const isSummary = rowProps['data-row-key'] === "สรุป";
                  return (
                    <tr
                      {...rowProps}
                      style={{
                        ...rowProps.style,
                        backgroundColor: isSummary ? "#e7e8edff" : undefined,
                        fontWeight: isSummary ? "bold" : undefined,
                        borderBottomLeftRadius: isSummary ? 8 : 0,
                        borderBottomRightRadius: isSummary ? 8 : 0,
                        boxShadow: isSummary ? "0 5px 8px rgba(0,0,0,0.1)" : undefined,
                      }}
                    />
                  );
                },
              },
            }}
          />
        </div>
      ))}
    </>
  );
};

export default CourseTable;