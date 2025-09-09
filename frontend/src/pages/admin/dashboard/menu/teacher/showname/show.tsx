// src/pages/dashboard/menu/student/showName.tsx
import { useState, useEffect } from 'react';

import { Col, Row, Table, Button, Popconfirm, Card, Select, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import Swal from 'sweetalert2';

import { type FacultyInterface } from '../../../../../../interfaces/Faculty';
import { type MajorInterface } from '../../../../../../interfaces/Major';
import type { TeacherInterface } from '../../../../../../interfaces/Teacher';

import { getFacultyAll } from '../../../../../../services/https/faculty/faculty';
import { getMajorAll } from '../../../../../../services/https/major/major';
import { deleteTeacher, getTeacherAll } from '../../../../../../services/https/teacher/teacher';

const { Option } = Select;
interface ShowStudentPageProps {
  onCreate?: () => void;
}


const columns = (handleDelete: (TeacherID: string) => void): ColumnsType<TeacherInterface> => [
  {title: "ลำดับ", dataIndex: "ID", key: "id"},
  {title: "รหัสอาจารย์", dataIndex: "TeacherID", key: "teacher_id"},
  {title: "ตำเเหน่งทางวิชาการ", dataIndex: "Position", key: "position",},
  {title: "ชื่อ", dataIndex: "FirstName", key: "firstname"},
  {title: "นามสกุล", dataIndex: "LastName", key: "lastname"},
  {title: "อีเมล", dataIndex: "Email", key: "email"},
  {title: "เบอร์โทร", dataIndex: "Phone", key: "phone"},
  
  {title: "สำนักวิชา", dataIndex: "FacultyID", key: "facultyID"},
  {title: "สาขาวิชา", dataIndex: "MajorID", key: "majorID"},
  {
    title: "ลบข้อมูล",
    key: "action",
    render: (_, record) => (
      <Popconfirm
        title="คุณเเน่ใจหรือไม่ที่ลบข้อมูลนนี้ ?"
        okText="ยืนยัน"
        onConfirm={() => handleDelete(record.TeacherID!)}
        cancelText="ยกเลิก"
      >
        <Button type="primary" danger>
          ลบข้อมูล
        </Button>
      </Popconfirm>
    )
  }
];

const ShowTeacherPage: React.FC<ShowStudentPageProps> = ({ onCreate }) => {
  const [teachers, setTeachers] = useState<TeacherInterface[]>([]);
  const [faculties, setFaculties] = useState<FacultyInterface[]>([]);
  const [majors, setMajors] = useState<MajorInterface[]>([]);

  const [searchText, setSearchText] = useState<string>("");
  const [selectedFaculty, setSelectedFaculty] = useState<string | undefined>(undefined);
  const [selectedMajor, setSelectedMajor] = useState<string | undefined>(undefined);

  useEffect(() => {
    Promise.all([
      getTeacherAll(),
      getFacultyAll(),
      getMajorAll(),
    ])
      .then(([teachers, faculties, majors]) => {
        setTeachers(teachers);
        setFaculties(faculties);
        setMajors(majors);
      })
      .catch((error) => {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล:", error);
      });
  }, []);

  const handleDelete = async (TeacherID: string) => {
    try {
      await deleteTeacher(TeacherID)

      // อัปเดต state เอาคนที่ถูกลบออก
      setTeachers(prev => prev.filter(teacher => teacher.TeacherID !== TeacherID));
      Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text: "ลบข้อมูลอาจารย์สำเร็จ",
        confirmButtonColor: "#3085d6",
      })
    }
    catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "ผิดพลาด",
        text: "ลบข้อมูลอาจารย์ไม่สำเร็จ"
      })
    }
  }

  // function การกรองข้อมูล
  const filteredTeacher = teachers.filter(t => {
    const matchSearch =
      t.FirstName?.toLowerCase().includes(searchText.toLowerCase()) ||
      t.TeacherID?.toLowerCase().includes(searchText.toLowerCase());

    const matchFaculty = selectedFaculty ? t.FacultyID === selectedFaculty : true;
    const matchMajor = selectedMajor ? t.MajorID === selectedMajor : true;

    return matchSearch && matchFaculty && matchMajor;
  });

  return (
    <Card
      style={{
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header */}
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <h2 style={{ fontWeight: 600, fontSize: 18, margin: 0, color: "#3B0A57" }}>
            จัดการข้อมูลอาจารย์
          </h2>
        </Col>
        <Col>
          <Button onClick={onCreate} type="primary" icon={<PlusOutlined />}>
            สร้างข้อมูลอาจารย์ใหม่
          </Button>
        </Col>
      </Row>

      {/* Search & Filter */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Input
            placeholder="ค้นหาชื่อ / รหัสอาจารย์"
            prefix={<SearchOutlined />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>
        <Col xs={24} md={6}>
          <Select
            placeholder="เลือกสำนักวิชา"
            allowClear
            style={{ width: "100%" }}
            value={selectedFaculty}
            onChange={(value) => setSelectedFaculty(value)}
          >
            {faculties.map(f => (
              <Option key={f.FacultyID} value={f.FacultyID}>
                {f.FacultyName}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} md={6}>
          <Select
            placeholder="เลือกสาขาวิชา"
            allowClear
            style={{ width: "100%" }}
            value={selectedMajor}
            onChange={(value) => setSelectedMajor(value)}
          >
            {majors
              .filter(m => !selectedFaculty || m.FacultyID === selectedFaculty) //กรองเฉพาะสาขาที่อยู่ในคณะนั้น
              .map(m => (
                <Option key={m.MajorID} value={m.MajorID}>
                  {m.MajorName}
                </Option>
              ))}
          </Select>
        </Col>
      </Row>

      {/* Table */}
      <Table
        rowKey="ID"
        columns={columns(handleDelete)}
        dataSource={filteredTeacher}
        pagination={{ position: ["bottomRight"] }}
        bordered
        size="middle"
        style={{
          width: "100%",
        }}
        scroll={{ x: "max-content" }}
      />
    </Card>
  );
}

export default ShowTeacherPage;