// src/pages/dashboard/menu/register.tsx

import './teacher.css';           // ถ้าต้องปรับเพิ่มค่อยใส่ในไฟล์นี้ก็ได้
import { useState , useEffect } from 'react';
import { Col , Row , Table , Button , Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getTeacherID } from '../../../../../services/https/getAll';
import type { TeacherInterface } from '../../../../../interfaces/Teacher';
import { Link } from 'react-router-dom'

// register.tsx  – only wrapperStyle changed
const wrapperStyle: React.CSSProperties = {
  /* keep your corner-rounding / shadow if you like */
  borderRadius: 8,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',

  /* 👇 stretch full size of parent Content */
  width: '100%',          // fill X
  minHeight: '100vh',     // ใช้พื้นที่เต็มหน้าจอ
  display: 'flex',        // so Header/Content/Footer stack vertically
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  background: '#2e236c',            // ม่วงเข้ม
  color: 'white',
  textAlign: 'center',
  padding: 16,
  fontSize: 20,
};

const contentStyle: React.CSSProperties = {
  background: '#f5f5f5',            // เทาอ่อน
  padding: 24,
  minHeight: 400,
  color: '#333',
  overflowY: 'auto',                // ให้สามารถเลื่อนขึ้นลงได้
};

const footerStyle: React.CSSProperties = {
  background: '#1890ff',            // ฟ้า Ant Design
  color: 'white',
  textAlign: 'center',
  padding: 12,
};


const columns : ColumnsType<TeacherInterface> = [
  {
    title: "ลำดับ",
    dataIndex: "ID",
    key: "id",
  },
  {
    title: "รหัสอาจารย์",
    dataIndex: "Teacher_id",
    key: "teacher_id",
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
    title: "เพศ",
    dataIndex: "Gender",
    key: "gender",
  },
];



export default function ShowTeacherPage() {
  const [teacher , setTeachers] = useState<TeacherInterface[]>([]);
  
  useEffect(() => {
    getTeacherID()
    .then((res) => {
      console.log("ข้อมูลอาจารย์ที่ได้จาก API:", res);
      setTeachers(res)
    })
    .catch((err) => console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล:" , err));
  } , []);

  
  return (
    <>
    <Row gutter = {[16,16]}>
      <Col span = {12}>
          <h2>จัดการข้อมูลนักศึกษา</h2>
      </Col>

      <Col span = {12} style = {{ textAlign: "end" , alignSelf: "center"}}>
        <Space>
          <Link to = "/admin/dashboard/create/teacher">
            <Button type = "primary" icon = {<PlusOutlined />}>
              สร้างข้อมูลอาจารย์ใหม่
            </Button>
          </Link>
        </Space>
      </Col>
    </Row>

    <div style = {{ marginTop: 20}}>
      <Table
        rowKey = "ID"
        columns = {columns}
        dataSource = {teacher}
        style = {{ width: "100%" , overflow: "scroll"}}
      >
      </Table>
    </div>
    </>
  );
}

/*const CreateTeacherProfile: React.FC = () => {

  const [loading , setLoading] = useState(false);
  const onFinish = async (values: TeacherInterface) => {
    setLoading(true);
    try {
      const result = await CreateNameTeacher(values);
      console.log("สร้างข้อมูลอาจารย์สำเร็จ",result);
    }
    catch(error){
      console.log("เกิดข้อผิดพลาด" , error);
    }
    finally{
      setLoading(false);
    }
  }

  return (
    <Layout style={wrapperStyle}>
      <Header style={headerStyle}>Header – หน้าระเบียนประวัติ</Header>
      <Content style={contentStyle}>

      </Content>
      <Footer style={footerStyle}>Footer © 2025</Footer>
    </Layout>
  );
};

export default CreateTeacherProfile;*/
