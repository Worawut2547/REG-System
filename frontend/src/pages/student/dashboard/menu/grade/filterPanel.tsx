import React from 'react';
import { Space, Select } from 'antd';
const { Option } = Select;

interface FilterPanelProps {
  gradeStudent: any[];
  selectedYear: string;
  selectedTerm: string;
  setSelectedYear: (value: string) => void;
  setSelectedTerm: (value: string) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  gradeStudent,
  selectedYear,
  selectedTerm,
  setSelectedYear,
  setSelectedTerm,
}) => {
  const years = [...new Set(gradeStudent.map((r) => r.AcademicYear))];

  return (
    <Space style={{ marginBottom: 10, fontSize: 18, fontWeight: "bold" }}>
      <Space size={8} align="center">
        <span>ปีการศึกษา</span>
        <Select defaultValue={selectedYear} style={{ width: 150 }} onChange={setSelectedYear}>
          <Option value="all">All</Option>
          {years.map((year) => (
            <Option key={year} value={year?.toString() || ""}>{year}</Option>
          ))}
        </Select>
      </Space>

      <Space size={8} align="center" style={{ marginLeft: 30 }}>
        <span>ภาคการศึกษา</span>
        <Select defaultValue={selectedTerm} style={{ width: 150 }} onChange={setSelectedTerm}>
          <Option value="all">All</Option>
          {[1, 2, 3].map((term) => (
            <Option key={term} value={term.toString()}>{term}</Option>
          ))}
        </Select>
      </Space>
    </Space>
  );
};

export default FilterPanel;
