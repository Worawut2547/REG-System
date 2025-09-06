import React from 'react';

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
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      overflow: 'hidden',
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
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
        <td style={{ borderRight: "1px solid #ccc", fontWeight: "normal", padding: 4 }}>C.Register<br /><span>{summary.termCredits}</span></td>
        <td style={{ borderRight: "1px solid #ccc", fontWeight: "normal", padding: 4 }}>GPA <br /><span>{summary.termGPA}</span></td>
        <td style={{ borderRight: "1px solid #ccc", fontWeight: "bold", padding: 4 }}>C.Register<br /><span style={{ fontWeight: "normal" }}>{summary.cumulativeCredits}</span></td>
        <td style={{ fontWeight: "bold", padding: 4 }}>GPAX<br /><span style={{ fontWeight: "normal" }}>{summary.cumulativeGPA}</span></td>
      </tr>
    </tbody>
  </table>
);

export default SummaryTable;
