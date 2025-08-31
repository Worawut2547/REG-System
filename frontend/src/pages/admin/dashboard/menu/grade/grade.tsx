// src/pages/dashboard/menu/register.tsx
import React, { useState } from 'react';
import { Layout, Select, Input, Button, Table, Row, Col } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import './grade.css';

const { Header, Content, Footer } = Layout;
const { Option } = Select;

// ----------------------------
// Styles
// ----------------------------
const wrapperStyle: React.CSSProperties = {
  borderRadius: 8,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  width: '100%',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};
const contentStyle: React.CSSProperties = {
  background: '#f5f5f5',
  padding: 24,
  minHeight: 400,
  color: '#333',
  overflowY: 'auto',
};
const footerStyle: React.CSSProperties = { background: '#1890ff', color: 'white', textAlign: 'center', padding: 12 };

// ----------------------------
// Mock Data
// ----------------------------
const mockCourses = [
  { key: 1, code: 'CSE101', name: 'Introduction to Computer Science', category: 'รายวิชาที่เปิดสอน', students: 45, credit: 3, section: 1, department: 'สำนักวิศวกรรมศาสตร์', instructor: 'รศ. ดร. ปรีชา วิศวกร', confirmedBy: 'รศ. ดร. ปรีชา วิศวกร', confirmedDate: '26/08/2568' },
  { key: 2, code: 'MAT201', name: 'Calculus II', category: 'รายวิชาที่เปิดสอน', students: 60, credit: 4, section: 2, department: 'สำนักวิทยาศาสตร์', instructor: 'ผศ. ดร. อมร คำนวณผล', confirmedBy: 'ผศ. ดร. อมร คำนวณผล', confirmedDate: '26/08/2568' },
  { key: 3, code: 'ENG101', name: 'English for Science', category: 'รายวิชาที่เปิดสอน', students: 40, credit: 2, section: 3, department: 'สำนักเทคโนโลยีสังคม', instructor: 'อ. ศิริพร ภาษาไทย' },
];

const mockStudents: Record<string, any[]> = {
  'CSE101-1': [
    { key: 1, studentId: '60001', firstName: 'สมชาย', lastName: 'ใจดี', score: 100, faculty: 'วิศวกรรมศาสตร์', major: 'คอมพิวเตอร์' },
    { key: 2, studentId: '60002', firstName: 'สมหญิง', lastName: 'แสนดี', score: 99, faculty: 'วิศวกรรมศาสตร์', major: 'คอมพิวเตอร์' },
  ],
  'MAT201-2': [
    { key: 1, studentId: '60101', firstName: 'วิทยา', lastName: 'เก่งคณิต', score: 80, faculty: 'วิทยาศาสตร์', major: 'คณิตศาสตร์' },
  ],
  'ENG101-3': [
    { key: 1, studentId: '60201', firstName: 'เอกชัย', lastName: 'ภาษาอังกฤษ', score: 55, faculty: 'เทคโนโลยีสังคม', major: 'ภาษาอังกฤษ' },
  ],
};

// ----------------------------
// Grade Helper
// ----------------------------
const getGrade = (score: number) => {
  if (score >= 80) return 'A';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'D+';
  if (score >= 50) return 'D';
  return 'F';
};

// ----------------------------
// Main Component
// ----------------------------
const Grade: React.FC = () => {
  const [category, setCategory] = useState('ทั้งหมด');
  const [department, setDepartment] = useState('ทั้งหมด');
  const [limit, setLimit] = useState(25);
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [dataSource, setDataSource] = useState<any[]>([]); // ตารางรายวิชาเริ่มว่าง
  const [selectedCourseKey, setSelectedCourseKey] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<any[]>([]);
  const [viewingDetails, setViewingDetails] = useState(false);

  const currentYear = 2568;
  const currentTerm = 1;

  // ----------------------------
  // Columns ตารางรายวิชา
  // ----------------------------
  const courseColumns: ColumnsType<any> = [
    { title: 'รหัสวิชา', dataIndex: 'code', key: 'code', render: (text: string) => <div style={{ textAlign: 'left' }}>{text}</div> },
    { title: 'ชื่อรายวิชา', dataIndex: 'name', key: 'name', render: (text: string) => <div style={{ textAlign: 'left' }}>{text}</div> },
    { title: 'อาจารย์ผู้สอน', dataIndex: 'instructor', key: 'instructor', render: (text: string) => <div style={{ textAlign: 'left' }}>{text}</div> },
    { title: 'จำนวนนักศึกษา', dataIndex: 'students', key: 'students', align: 'center' },
    { title: 'หน่วยกิต', dataIndex: 'credit', key: 'credit', align: 'center' },
    { title: 'Section', dataIndex: 'section', key: 'section', align: 'center' },
    {
      title: 'สถานะการยืนยัน', key: 'status', align: 'center', render: (_: any, record: any) => {
        const confirmed = record.confirmedBy && record.confirmedDate;
        return <span style={{ color: confirmed ? 'green' : 'red', fontWeight: 'bold' }}>{confirmed ? 'ยืนยันแล้ว' : 'รอการยืนยัน'}</span>;
      }
    },
    {
      title: 'รายละเอียด', key: 'action', align: 'center', render: (_: any, record: any) => (
        <Button type="link" onClick={() => handleViewStudents(record)} style={{ backgroundColor: '#f2ffbcff', borderColor: 'rgba(223, 228, 155, 1)', color: 'black' }}>ดูรายละเอียด</Button>
      )
    },
  ];

  // ----------------------------
  // Columns ตารางนิสิต (Grade)
  // ----------------------------

  const studentColumns: ColumnsType<any> = [
    { title: 'รหัสนิสิต', dataIndex: 'studentId', key: 'studentId', width: 120, align: 'left', render: (text: string) => <div style={{ textAlign: 'left' }}>{text}</div> },
    { title: 'ชื่อ', dataIndex: 'firstName', key: 'firstName', width: 150, align: 'left', render: (text: string) => <div style={{ textAlign: 'left' }}>{text}</div> },
    { title: 'นามสกุล', dataIndex: 'lastName', key: 'lastName', width: 150, align: 'left', render: (text: string) => <div style={{ textAlign: 'left' }}>{text}</div> },
    { title: 'สำนักวิชา', dataIndex: 'faculty', key: 'faculty', width: 180, align: 'center', render: (text: string) => <div style={{ textAlign: 'center' }}>{text}</div> },
    { title: 'สาขา', dataIndex: 'major', key: 'major', width: 150, align: 'center', render: (text: string) => <div style={{ textAlign: 'center' }}>{text}</div> },
    {
      title: 'Grade', dataIndex: 'score', key: 'grade', width: 120, align: 'center', render: (score: number) => {
        if (score === undefined) return '-';
        const course = mockCourses.find(c => `${c.code}-${c.section}` === selectedCourseKey);
        const notConfirmed = !course?.confirmedDate || !course?.confirmedBy;
        return <div style={{ textAlign: 'center' }}>{notConfirmed ? '-' : getGrade(score)}</div>;
      }
    },
  ];


  // ----------------------------
  // ค้นหา
  // ----------------------------
  const handleSearch = () => {
    let filtered = mockCourses;
    if (category !== 'ทั้งหมด') filtered = filtered.filter(c => c.category === category);
    if (department !== 'ทั้งหมด') filtered = filtered.filter(c => c.department === department);
    if (searchCode) filtered = filtered.filter(c => c.code.toLowerCase().includes(searchCode.toLowerCase()));
    if (searchName) filtered = filtered.filter(c => c.name.toLowerCase().includes(searchName.toLowerCase()));
    setDataSource(filtered);
  };

  // ----------------------------
  // ดูรายละเอียดนิสิต
  // ----------------------------
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

  // ----------------------------
  // Render Content
  // ----------------------------
  const renderContent = () => {
    if (viewingDetails) {
      return (
        <>
          <Button onClick={handleBack} style={{ marginBottom: 20 }}>BACK</Button>
          <div style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 20 }}>
            {(() => {
              const course = mockCourses.find(c => `${c.code}-${c.section}` === selectedCourseKey);
              return course ? `${course.code} - ${course.name}  (Section ${course.section})` : selectedCourseKey;
            })()}
          </div>
          {(() => {
            const course = mockCourses.find(c => `${c.code}-${c.section}` === selectedCourseKey);
            const confirmedDate = course?.confirmedDate || '-';
            const confirmedBy = course?.confirmedBy || '-';
            const notConfirmed = !course?.confirmedDate || !course?.confirmedBy;
            return course ? (
              <div style={{ fontSize: 18, marginBottom: 20, color: 'black' }}>
                <div style={{ marginBottom: 8 }}>วันที่ยืนยันเกรด: {confirmedDate}</div>
                <div style={{ marginBottom: 8 }}>ผู้ยืนยัน: {confirmedBy}</div>
                {notConfirmed && (
                  <div style={{ fontStyle: 'italic', color: 'red', marginTop: 8, textAlign: 'center' }}>
                    ยังไม่มีการยืนยันคะแนนโดยอาจารย์สำหรับวิชานี้
                  </div>
                )}
              </div>
            ) : null;
          })()}

          <Table
            dataSource={studentData}
            columns={studentColumns}
            pagination={false}       // ปิด pagination
            scroll={{ x: 800 }}      // ถ้าต้องการให้ scroll แนวนอนยังคงอยู่
            bordered
            components={{
              header: {
                cell: (props: any) => (
                  <th
                    {...props}
                    style={{
                      backgroundColor: '#c1c7d7ff',
                      color: 'black',
                      textAlign: 'center', // หัวตารางทั้งหมดชิดกลาง
                      padding: '8px',
                    }}
                  />
                ),
              },
            }}
          />
        </>
      );
    }

    // หน้าแสดงรายวิชา
    return (
      <>
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
              <Option value="สำนักเทคโนโลยีการเกษตร">สำนักเทคโนโลยีการเกษตร</Option>
              <Option value="สำนักแพทยศาสตร์">สำนักแพทยศาสตร์</Option>
              <Option value="สำนักวิศวกรรมศาสตร์">สำนักวิศวกรรมศาสตร์</Option>
              <Option value="สำนักพยาบาลศาสตร์">สำนักพยาบาลศาสตร์</Option>
              <Option value="สำนักทันตแพทยศาสตร์">สำนักทันตแพทยศาสตร์</Option>
              <Option value="สำนักสาธารณสุขศาสตร์">สำนักสาธารณสุขศาสตร์</Option>
              <Option value="สำนักศาสตร์และศิลดิจิทัล">สำนักศาสตร์และศิลดิจิทัล</Option>
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
              <Input
                placeholder="รหัสวิชา"
                value={searchCode}
                style={{ flex: 1, height: '25px', fontSize: '14px', fontWeight: 'normal' }}
                onChange={e => setSearchCode(e.target.value)}
              />
              <span style={{ margin: '0 8px', fontSize: '16px', fontWeight: 'bold' }}>:</span>
              <Input
                placeholder="ชื่อรายวิชา"
                value={searchName}
                style={{ flex: 1, height: '25px', fontSize: '14px', fontWeight: 'normal' }}
                onChange={e => setSearchName(e.target.value)}
              />
            </div>
          </Col>
          <Col span={4}>
            <Button
              type="primary"
              onClick={handleSearch}
              style={{ backgroundColor: '#2e236c', borderColor: '#928fa2ff', color: 'white' }}
            >
              ค้นหา
            </Button>
          </Col>
        </Row>

        <hr style={{ margin: '24px 0' }} />

        <Table
          dataSource={dataSource}
          columns={courseColumns}
          pagination={{ pageSize: limit }}
          scroll={{ x: 800 }}
          bordered
        />
      </>
    );
  };

  // ----------------------------
  // Layout
  // ----------------------------
  return (
    <Layout style={wrapperStyle}>
      <Header
        style={{
          background: "#2e236c",
          color: "white",
          textAlign: "center",
          fontSize: 24,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      >
        ตรวจสอบผลการเรียนนักศึกษา
      </Header>
      <Content style={contentStyle}>
        {renderContent()}
      </Content>
      <Footer style={footerStyle}>Footer © 2025</Footer>
    </Layout>
  );
};

export default Grade;
