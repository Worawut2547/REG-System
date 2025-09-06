import React, { useState } from "react";
import { Row, Col, Select, Divider, Card, Typography } from "antd";
import { courses } from "./../score/mockData";

const { Option } = Select;
const { Title, Text } = Typography;

type TeacherDashboardProps = {
  onSelectCourse: (course: { code: string; name: string }) => void;
};

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onSelectCourse }) => {
  const [year, setYear] = useState("2568");
  const [term, setTerm] = useState("1");

  const filteredCourses = courses.filter(
    c => String(c.year) === year && String(c.term) === term
  );

  return (
    <div style={{ padding: 24, maxWidth: 1500, margin: "auto" }}>
      <Row justify="start" align="middle" style={{ marginBottom: 16, gap: 20 }}>
        <Col>
          <Text style={{ fontSize: 18, fontWeight: 500 }}>ปีการศึกษา : </Text>
          <Select value={year} onChange={setYear} style={{ width: 100 }}>
            <Option value="2568">2568</Option>
            <Option value="2567">2567</Option>
            <Option value="2566">2566</Option>
            <Option value="2565">2565</Option>
          </Select>
        </Col>
        <Col>
          <Text style={{ fontSize: 18, fontWeight: 500 }}>ภาคเรียนที่ : </Text>
          <Select value={term} onChange={setTerm} style={{ width: 60 }}>
            <Option value="1">1</Option>
            <Option value="2">2</Option>
            <Option value="3">3</Option>
          </Select>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[24, 24]}>
        {filteredCourses.length > 0 ? (
          filteredCourses.map(({ code, name, credit, color }) => (
            <Col key={code} xs={24} sm={12} md={8} lg={8}>
              <Card
                style={{
                  backgroundColor: color,
                  color: "white",
                  textAlign: "center",
                  width: "100%",
                  height: 250,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
                bodyStyle={{ padding: 50 }}
                hoverable
                onClick={() => onSelectCourse({ code, name })}
              >
                <Title level={3} style={{ color: "white", marginTop: 0 }}>{code}</Title>
                <Title level={3} style={{ color: "white", marginTop: 10 }}>{name}</Title>
                <div style={{ fontWeight: "bold", fontSize: 16, color: "white" }}>
                  {credit} หน่วยกิต
                </div>
              </Card>
            </Col>
          ))
        ) : (
          <Col span={24} style={{ textAlign: "center", color: "#888" }}>
            ไม่พบรายวิชาในปีการศึกษา/ภาคเรียนนี้
          </Col>
        )}
      </Row>
    </div>
  );
};

export default TeacherDashboard;
