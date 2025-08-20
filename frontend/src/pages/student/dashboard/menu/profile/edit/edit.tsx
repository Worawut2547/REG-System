// src/pages/dashboard/menu/student/showName.tsx
import { useState, useEffect } from 'react';
import { Col, Row, Table, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getStudentAll } from '../../../../../../services/https/student/student';
import type { StudentInterface } from '../../../../../../interfaces/Student';
interface ShowStudentPageProps {
  onEdit?: () => void;
}


const columns: ColumnsType<StudentInterface> = [
  {
    title: "ลำดับ",
    dataIndex: "ID",
    key: "id",
  },
  {
    title: "รหัสนักศึกษา",
    dataIndex: "StudentID",
    key: "student_id",
  },
  {
    title: "ชื่อ",
    dataIndex: "FirstName",
    key: "firstname",
  },
  {
    title: "นามสกุล",
    dataIndex: "LastName",
    key: "lastname",
  },
  {
    title: "คณะ",
    dataIndex: "FacultyID",
    key: "facultyID",
  },
  {
    title: "สาขา",
    dataIndex: "MajorID",
    key: "majorID",
  },
  {
    title: "อีเมล",
    dataIndex: "Email",
    key: "email",
  },
  {
    title: "เบอร์โทร",
    dataIndex: "Phone",
    key: "phone",
  },
  {
    title: "ระดับทางการศึกษา",
    dataIndex: "Degree",
    key: "degree",
  },
  {
    title: "สถานะทางการศึกษา",
    dataIndex: "StatusStudentID",
    key: "status",
  }
];

const EditStudentPage: React.FC<ShowStudentPageProps> = ({ onEdit }) => {
  const [student, setStudents] = useState<StudentInterface[]>([]);

  useEffect(() => {
    getStudentAll()
      .then((student) => {
        console.log("API response:", student);

        setStudents(student);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <h2>จัดการข้อมูลนักศึกษา</h2>
        </Col>

        <Col span={12} style={{ textAlign: "end", alignSelf: "center" }}>
          <Space>
            <Button onClick={onEdit} type="primary" icon={<PlusOutlined />}>
              สร้างข้อมูลนักศึกษาใหม่
            </Button>
          </Space>
        </Col>
      </Row>

      <div style={{ marginTop: 20 }}>
        <Table
          rowKey="ID"
          columns={columns}
          dataSource={student}
          style={{ width: "100%", overflow: "scroll" }}
        >
        </Table>
      </div>
    </>
  );
}

export default EditStudentPage;
