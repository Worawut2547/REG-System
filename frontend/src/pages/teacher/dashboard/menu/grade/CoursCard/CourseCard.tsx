import React from "react";
import { Card, Typography } from "antd";

const { Title, Text } = Typography;

type Props = {
  code: string;
  name: string;
  credit: number;
  color: string;
  onClick: () => void;
};

const CourseCard: React.FC<Props> = ({ code, name, credit, color, onClick }) => (
  <Card
    hoverable
    onClick={onClick}
    style={{
      backgroundColor: color,
      color: "white",
      textAlign: "center",
      width: "100%",
      height: 250,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      borderRadius: 12, // โค้งมน
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)", // เงา
      transition: "transform 0.2s",
    }}
    bodyStyle={{ padding: 50 }}
    onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
    onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
  >
    <Title level={3} style={{ color: "white", margin: 0 }}>{code}</Title>
    <Title level={3} style={{ color: "white", marginTop: 10 }}>{name}</Title>
    <Text style={{ fontWeight: "bold", fontSize: 16, color: "white" }}>
      {credit} หน่วยกิต
    </Text>
  </Card>
);

export default CourseCard;