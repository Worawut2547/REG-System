// src/pages/dashboard/menu/studentScore/CourseTable.tsx
import React from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { CourseData, Score } from "./mockData";

interface CourseTableProps {
  courses: CourseData[];
}

const columns: ColumnsType<Score> = [
  {
    title: <div style={{ textAlign: "center", fontSize: 16 }}>Score Evaluation</div>,
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

const CourseTable: React.FC<CourseTableProps> = ({ courses }) => {
  return (
    <>
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
            rowClassName={(record) =>
              record.evaluation === "สรุป" ? "summary-row no-hover" : "no-hover"
            }
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
                    }}
                  />
                ),
              },
            }}
          />
        </div>
      ))}
    </>
  );
};

export default CourseTable;
