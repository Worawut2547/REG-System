// src/pages/dashboard/menu/studentScore/FilterPanel.tsx
import React from "react";
import { Space, Select } from "antd";

const { Option } = Select;

interface FilterPanelProps {
  selectedYear: string;
  selectedTerm: string;
  setSelectedYear: (val: string) => void;
  setSelectedTerm: (val: string) => void;
  yearOptions: string[];
  termOptions: string[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  selectedYear,
  selectedTerm,
  setSelectedYear,
  setSelectedTerm,
  yearOptions,
  termOptions,
}) => {
  return (
    <Space style={{ marginBottom: 10, fontSize: 18, fontWeight: "bold" }}>
      <span>ปีการศึกษา</span>
      <Select
        value={selectedYear}
        style={{ width: 150 }}
        onChange={(val) => {
          setSelectedYear(val);
          setSelectedTerm(""); // reset term เมื่อเปลี่ยนปี
        }}
      >
        {yearOptions.map((year) => (
          <Option key={year} value={year}>
            {year}
          </Option>
        ))}
      </Select>

      <span style={{ fontSize: 18, marginLeft: 30 }}>ภาคการศึกษา</span>
      <Select
        value={selectedTerm}
        style={{ width: 150 }}
        onChange={setSelectedTerm}
      >
        {termOptions.map((term) => (
          <Option key={term} value={term}>
            {term}
          </Option>
        ))}
      </Select>
    </Space>
  );
};

export default FilterPanel;
