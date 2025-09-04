// src/pages/dashboard/menu/student/showName.tsx
import { useState, useEffect } from 'react';
import { Col, Row, Table, Button, Space, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getStudentAll, deleteStudent } from '../../../../../../services/https/student/student';
import type { StudentInterface } from '../../../../../../interfaces/Student';
import Swal from 'sweetalert2';
interface ShowStudentPageProps {
  onCreate?: () => void;
}


const columns = (handleDelete: (StudentID: string) => void): ColumnsType<StudentInterface> =>[
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
  },
  {
    title: "ลบข้อมูล",
    key: "action",
    render: (_, record) => (
      <Popconfirm
        title="คุณเเน่ใจหรือไม่ที่ลบข้อมูลนนี้ ?"
        okText="ยืนยัน"
        onConfirm={() => handleDelete(record.StudentID!)}
        cancelText="ยกเลิก"
      >
        <Button type="primary" danger>
          ลบข้อมูล
        </Button>
      </Popconfirm>
    )
  }
];

const ShowStudentPage: React.FC<ShowStudentPageProps> = ({ onCreate }) => {
  const [student, setStudents] = useState<StudentInterface[]>([]);

  useEffect(() => {
    getStudentAll()
      .then((student) => {
        console.log("API response:", student);

        setStudents(student);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleDelete = async (StudentID: string) => {
    try {
      await deleteStudent(StudentID)
      
      // อัปเดต state เอาคนที่ถูกลบออก
      setStudents(prev => prev.filter(student => student.StudentID !== StudentID));
      Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text: "ลบข้อมูลนักศึกษาสำเร็จ",
        confirmButtonColor: "#3085d6",
      })
    }
    catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "ผิดพลาด",
        text: "ลบข้อมูลนักศึกษาไม่สำเร็จ"
      })
    }
  }
  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <h2>จัดการข้อมูลนักศึกษา</h2>
        </Col>

        <Col span={12} style={{ textAlign: "end", alignSelf: "center" }}>
          <Space>
            <Button onClick={onCreate} type="primary" icon={<PlusOutlined />}>
              สร้างข้อมูลนักศึกษาใหม่
            </Button>
          </Space>
        </Col>
      </Row>

      <div style={{ marginTop: 20 }}>
        <Table
          rowKey="ID"
          columns={columns(handleDelete)}
          dataSource={student}
          style={{ width: "100%", overflow: "scroll" }}
        >
        </Table>
      </div>
    </>
  );
}

export default ShowStudentPage;
