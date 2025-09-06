// src/pages/dashboard/menu/Dashboard.tsx
import React, { useState } from 'react';
import { Table, Button, Select, Input, Row, Col } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { mockCourses, mockStudents } from './mockData';

const { Option } = Select;

type DashboardProps = {
  onViewStudents: (courseKey: string) => void;
};

const Dashboard: React.FC<DashboardProps> = ({ onViewStudents }) => {
  const [category, setCategory] = useState('ทั้งหมด');
  const [department, setDepartment] = useState('ทั้งหมด');
  const [limit, setLimit] = useState(25);
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [dataSource, setDataSource] = useState<any[]>([]);

  const currentYear = 2568;
  const currentTerm = 1;

  const courseColumns: ColumnsType<any> = [
    { title: 'รหัสวิชา', dataIndex: 'code', key: 'code', render: text => <div style={{ textAlign: 'left' }}>{text}</div> },
    { title: 'ชื่อรายวิชา', dataIndex: 'name', key: 'name', render: text => <div style={{ textAlign: 'left' }}>{text}</div> },
    { title: 'อาจารย์ผู้สอน', dataIndex: 'instructor', key: 'instructor', render: text => <div style={{ textAlign: 'left' }}>{text}</div> },
    { title: 'จำนวนนักศึกษา', dataIndex: 'students', key: 'students', align: 'center' },
    { title: 'หน่วยกิต', dataIndex: 'credit', key: 'credit', align: 'center' },
    { title: 'Section', dataIndex: 'section', key: 'section', align: 'center' },
    {
      title: 'รายละเอียด', key: 'action', align: 'center', render: (_: any, record: any) => (
        <Button type="link" onClick={() => onViewStudents(`${record.code}-${record.section}`)} style={{ backgroundColor: '#f2ffbcff', borderColor: 'rgba(223, 228, 155, 1)', color: 'black' }}>ดูรายละเอียด</Button>
      )
    },
  ];

  const handleSearch = () => {
    let filtered = mockCourses;
    if (category !== 'ทั้งหมด') filtered = filtered.filter(c => c.category === category);
    if (department !== 'ทั้งหมด') filtered = filtered.filter(c => c.department === department);
    if (searchCode) filtered = filtered.filter(c => c.code.toLowerCase().includes(searchCode.toLowerCase()));
    if (searchName) filtered = filtered.filter(c => c.name.toLowerCase().includes(searchName.toLowerCase()));
    setDataSource(filtered);
  };

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
        components={{
          header: {
            cell: (props: any) => (
              <th
                {...props}
                style={{
                  backgroundColor: '#c1c7d7ff',
                  color: 'black',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  padding: '8px',
                }}
              />
            ),
          },
        }}
      />
    </>
  );
};

export default Dashboard;
