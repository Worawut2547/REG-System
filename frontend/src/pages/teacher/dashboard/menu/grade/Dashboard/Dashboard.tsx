import React from "react";
import { Row, Col, Divider } from "antd";
import CourseCard from "../CoursCard/CourseCard";
import YearTermFilter from "../Filter/YearTermFilter";

type Course = {
  code: string;
  name: string;
  color: string;
  credit: number;
  year: number;
  term: number;
};

interface Props {
  courses: Course[];
  year: string;
  term: string;
  setYear: (y: string) => void;
  setTerm: (t: string) => void;
  yearOptions: string[];
  termOptions: string[];
  onSelectCourse: (course: { code: string; name: string }) => void;
}

const TeacherDashboard: React.FC<Props> = ({
  courses,
  year,
  term,
  setYear,
  setTerm,
  yearOptions,
  termOptions,
  onSelectCourse
}) => {
  const filteredCourses = courses.filter(c => String(c.year) === year && String(c.term) === term);

  return (
    <div style={{ padding: 24, maxWidth: 1500, margin: "auto" }}>
      <YearTermFilter
        year={year}
        term={term}
        setYear={setYear}
        setTerm={setTerm}
        yearOptions={yearOptions}
        termOptions={termOptions}
      />

      <Divider />

      <Row gutter={[24, 24]}>
        {filteredCourses.length > 0 ? filteredCourses.map(({ code, name, credit, color }) => (
          <Col key={code} xs={24} sm={12} md={8} lg={8}>
            <CourseCard
              code={code}
              name={name}
              credit={credit}
              color={color}
              onClick={() => onSelectCourse({ code, name })}
            />
          </Col>
        )) : (
          <Col span={24} style={{ textAlign: "center", color: "#888" }}>
            ไม่พบรายวิชาในปีการศึกษา/ภาคเรียนนี้
          </Col>
        )}
      </Row>
    </div>
  );
};

export default TeacherDashboard;