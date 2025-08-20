import { useState, useEffect } from 'react';
import { Col, Row, Table, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getTeacherAll } from '../../../../../../services/https/teacher/teacher';
import type { TeacherInterface } from '../../../../../../interfaces/Teacher';

interface ShowTeacherPageProps {
  onCreate?: () => void;
}

const columns: ColumnsType<TeacherInterface> = [
  {
    title: "ลำดับ",
    dataIndex: "ID",
    key: "id",
  },
  {
    title: "รหัสประจำตัว",
    dataIndex: "TeacherID",
    key: "teacher_id",
  },
  {
    title: "ตำเเหน่งทางวิชาการ",
    dataIndex: "Position",
    key: "position",
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
    title: "เบอร์โทรศัพท์",
    dataIndex: "Phone",
    key: "phone",
  },
  {
    title: "อีเมล",
    dataIndex: "Email",
    key: "email",
  },
];

const ShowTeacherPage: React.FC<ShowTeacherPageProps> = ({ onCreate }) => {
  const [teacher, setTeachers] = useState<TeacherInterface[]>([]);

  useEffect(() => {
    getTeacherAll()
      .then((teacher) => {
        console.log("API teacher response:", teacher);
        setTeachers(teacher);
      })
      .catch((err) => console.error(err));
  }, []);


  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <h2>จัดการข้อมูลอาจารย์</h2>
        </Col>

        <Col span={12} style={{ textAlign: "end", alignSelf: "center" }}>
          <Space>
            <Button onClick={onCreate} type="primary" icon={<PlusOutlined />} >
              สร้างข้อมูลอาจารย์ใหม่
            </Button>
          </Space>
        </Col>
      </Row>

      <div style={{ marginTop: 20 }}>
        <Table
          rowKey="ID"
          columns={columns}
          dataSource={teacher}
          style={{ width: "100%", overflow: "scroll" }}
        >
        </Table>
      </div>
    </>
  );
}

export default ShowTeacherPage;
