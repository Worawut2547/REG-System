import React from "react";
import { Row, Col, Select, Typography } from "antd";

const { Option } = Select;
const { Text } = Typography;

type Props = {
  year: string;
  term: string;
  setYear: (y: string) => void;
  setTerm: (t: string) => void;
  yearOptions: string[];
  termOptions: string[];
};

const YearTermFilter: React.FC<Props> = ({ year, term, setYear, setTerm, yearOptions, termOptions }) => (
  <Row style={{ marginBottom: 16, gap: 20 }}>
    <Col>
      <Text strong>ปีการศึกษา:</Text>
      <Select value={year} onChange={setYear} style={{ width: 100 }}>
        {yearOptions.map(y => <Option key={y} value={y}>{y}</Option>)}
      </Select>
    </Col>
    <Col>
      <Text strong>ภาคเรียนที่:</Text>
      <Select value={term} onChange={setTerm} style={{ width: 60 }}>
        {termOptions.map(t => <Option key={t} value={t}>{t}</Option>)}
      </Select>
    </Col>
  </Row>
);

export default YearTermFilter;