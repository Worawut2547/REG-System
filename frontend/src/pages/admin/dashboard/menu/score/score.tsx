// src/pages/dashboard/menu/Register.tsx
import React, { useState } from 'react';
import { Layout, Row, Col, Select, Input, Button } from 'antd';
import CourseTable from './dashboard';
import StudentTable from './table';
import { mockCourses, mockStudents } from './mockData';
import './score.css';

const { Header, Content, Footer } = Layout;
const { Option } = Select;

const wrapperStyle: React.CSSProperties = {
  borderRadius: 8,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  width: '100%',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
};
const headerStyle: React.CSSProperties = { background: '#2e236c', color: 'white', textAlign: 'center', fontSize: 20 };
const contentStyle: React.CSSProperties = { background: '#f5f5f5', padding: 24, minHeight: 400, color: '#333', overflowY: 'auto' };
const footerStyle: React.CSSProperties = { background: '#1890ff', color: 'white', textAlign: 'center', padding: 12 };

const Register: React.FC = () => {
  const [category, setCategory] = useState('ทั้งหมด');
  const [department, setDepartment] = useState('ทั้งหมด');
  const [limit, setLimit] = useState(25);
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [selectedCourseKey, setSelectedCourseKey] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<any[]>([]);
  const [viewingDetails, setViewingDetails] = useState(false);

  const currentYear = 2568;
  const currentTerm = 1;

  const handleSearch = () => {
    let filtered = mockCourses;
    if (category !== 'ทั้งหมด') filtered = filtered.filter(c => c.category === category);
    if (department !== 'ทั้งหมด') filtered = filtered.filter(c => c.department === department);
    if (searchCode) filtered = filtered.filter(c => c.code.toLowerCase().includes(searchCode.toLowerCase()));
    if (searchName) filtered = filtered.filter(c => c.name.toLowerCase().includes(searchName.toLowerCase()));
    setDataSource(filtered);
  };

  const handleViewStudents = (course: any) => {
    const key = `${course.code}-${course.section}`;
    setSelectedCourseKey(key);
    setStudentData(mockStudents[key] || []);
    setViewingDetails(true);
  };

  const handleBack = () => {
    setViewingDetails(false);
    setSelectedCourseKey(null);
    setStudentData([]);
  };

  if (viewingDetails) {
    return (
      <Layout style={wrapperStyle}>
        <Header style={{ ...headerStyle, fontSize: 24 }}>ตรวจสอบคะแนนนักศึกษา</Header>
        <Content style={contentStyle}>
          <Button onClick={handleBack} style={{ marginBottom: 20 }}>BACK</Button>
          <div style={{ fontWeight: 'bold', fontSize: 30, marginBottom: 20 }}>
            {(() => {
              const course = mockCourses.find(c => `${c.code}-${c.section}` === selectedCourseKey);
              return course ? `${course.code} - ${course.name}  (Section ${course.section})` : selectedCourseKey;
            })()}
          </div>
          <StudentTable
            studentData={studentData}
            section={(() => {
              const course = mockCourses.find(c => `${c.code}-${c.section}` === selectedCourseKey);
              return course ? Number(course.section) : 1; // ถ้าไม่เจอ ใช้ 1 เป็น default
            })()}
          />
        </Content>
        <Footer style={footerStyle}>Footer © 2025</Footer>
      </Layout>
    );
  }

  return (
    <Layout style={wrapperStyle}>
      <Header style={{ ...headerStyle, fontSize: 24 }}>ตรวจสอบคะแนนนักศึกษา</Header>
      <Content style={contentStyle}>
        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
          <Col span={6}>ขั้นที่ 1: หมวดวิชา</Col>
          <Col span={6}>
            <Select value={category} onChange={setCategory} style={{ width: '100%' }}>
              <Option value="ทั้งหมด">ทั้งหมด</Option>
              <Option value="รายวิชาที่เปิดสอน">รายวิชาที่เปิดสอน ปีการศึกษา {currentYear}/{currentTerm}</Option>
            </Select>
          </Col>
        </Row>

        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
          <Col span={6}>ขั้นที่ 2: หน่วยงานเจ้าของรายวิชา</Col>
          <Col span={6}>
            <Select value={department} onChange={setDepartment} style={{ width: '100%' }}>
              <Option value="ทั้งหมด">ทั้งหมด</Option>
              <Option value="สำนักวิทยาศาสตร์">สำนักวิทยาศาสตร์</Option>
              <Option value="สำนักเทคโนโลยีสังคม">สำนักเทคโนโลยีสังคม</Option>
              <Option value="สำนักวิศวกรรมศาสตร์">สำนักวิศวกรรมศาสตร์</Option>
            </Select>
          </Col>
        </Row>

        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
          <Col span={6}>ขั้นที่ 3: จำนวนรายการที่ได้จากการค้นหาไม่เกิน</Col>
          <Col span={6}>
            <Select value={limit} onChange={setLimit} style={{ width: '100%' }}>
              <Option value={25}>25</Option>
              <Option value={50}>50</Option>
              <Option value={100}>100</Option>
              <Option value={200}>200</Option>
            </Select>
          </Col>
        </Row>

        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
          <Col span={6}>ขั้นที่ 4: รหัส/ชื่อวิชา</Col>
          <Col span={12}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Input placeholder="รหัสวิชา" value={searchCode} onChange={e => setSearchCode(e.target.value)} style={{ flex: 1, height: '25px' }} />
              <span style={{ margin: '0 8px', fontSize: '16px', fontWeight: 'bold' }}>:</span>
              <Input placeholder="ชื่อรายวิชา" value={searchName} onChange={e => setSearchName(e.target.value)} style={{ flex: 1, height: '25px' }} />
            </div>
          </Col>
          <Col span={4}>
            <Button type="primary" onClick={handleSearch} style={{ backgroundColor: '#2e236c', color: 'white' }}>ค้นหา</Button>
          </Col>
        </Row>

        <hr style={{ margin: '24px 0' }} />
        <CourseTable dataSource={dataSource} limit={limit} onViewStudents={handleViewStudents} />
      </Content>
      <Footer style={footerStyle}>Footer © 2025</Footer>
    </Layout>
  );
};

export default Register;
