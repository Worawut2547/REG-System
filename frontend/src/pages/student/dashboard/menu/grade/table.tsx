// src/components/grade/CourseTable.tsx
import React from 'react';
import SummaryTable from './summaryTable';

interface CourseTableProps {
  records: any[];
  summary: any;
  keyId: string;
}

const CourseTable: React.FC<CourseTableProps> = ({ records, summary, keyId }) => {
  const [year, term] = keyId.split("-");
 
  return (
    <div style={{ marginBottom: 30 }}>
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

      <SummaryTable summary={summary} />
    </div>
  );
};

export default CourseTable;
