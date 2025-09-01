// src/pages/dashboard/menu/register.tsx
import { useState } from "react";
import {
  Layout,
  Form,
  Input,
  InputNumber,
  Button,
  Table,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import "./grade.css";
import { createGradeStudent } from "../../../../../services/https/student/grade";
import type { GradeStudentInterface } from "../../../../../interfaces/Grade";

const { Header, Content, Footer } = Layout;

const wrapperStyle: React.CSSProperties = {
  borderRadius: 8,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  width: "100%",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};
const headerStyle: React.CSSProperties = {
  background: "#2e236c",
  color: "white",
  textAlign: "center",
  padding: 16,
  fontSize: 20,
};
const contentStyle: React.CSSProperties = {
  background: "#f5f5f5",
  padding: 24,
  minHeight: 400,
  color: "#333",
  overflowY: "auto",
};
const footerStyle: React.CSSProperties = {
  background: "#1890ff",
  color: "white",
  textAlign: "center",
  padding: 12,
};

const Grade: React.FC = () => {
  const [grades, setGrades] = useState<GradeStudentInterface[]>([]);
  const [form] = Form.useForm();

  // Column ของตาราง
  const columns: ColumnsType<GradeStudentInterface> = [
    { title: "ลำดับ", key: "index", render: (_text, _record, index) => index + 1, },
    { title: "SubjectID", dataIndex: "SubjectID", key: "SubjectID" },
    { title: "TotalScore", dataIndex: "TotalScore", key: "TotalScore" },
    { title: "Grade", dataIndex: "Grade", key: "Grade" },
    { title: "StudentID", dataIndex: "StudentID", key: "StudentID" },
  ];

  // โหลดข้อมูลจาก API
  /*useEffect(() => {
    getGradeStudent()
      .then((gradeStudent) => {
        console.log("API grade student response:", gradeStudent);
        setGrades(gradeStudent);
      })
      .catch((err) => console.error(err));
  }, []);*/

  // ฟังก์ชันเพิ่มข้อมูลใหม่
  const handleAdd = (values: any) => {
    const newGrade = {
      SubjectID: values.SubjectID,
      TotalScore: values.TotalScore,
      Grade: values.Grade,
      StudentID: values.StudentID,
    };
    setGrades([...grades, newGrade]);
    form.resetFields();
    message.success("เพิ่มข้อมูลสำเร็จ!");
  };

  // ฟังก์ชันส่งข้อมูลทั้งหมดไป backend
  const handleSubmitAll = async () => {
    try {
      await createGradeStudent(grades);
      message.success("add grade object success");
    }
    catch(error){
      console.error("เกิดข้อผิดพลาดในการสร้างเกรดนักศึกษา:", error);
      message.error("เกิดข้อผิดพลาดในการสร้างเกรดนักศึกษา");
    }

  };

  return (
    <Layout style={wrapperStyle}>
      <Header style={headerStyle}>Header – หน้าเกรด</Header>
      <Content style={contentStyle}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleAdd}
          style={{ marginBottom: 20 }}
        >
          <Form.Item
            name="SubjectID"
            rules={[{ required: true, message: "กรอก SubjectID!" }]}
          >
            <Input placeholder="SubjectID" />
          </Form.Item>
          <Form.Item
            name="TotalScore"
            rules={[{ required: true, message: "กรอกคะแนน!" }]}
          >
            <InputNumber placeholder="คะแนน" step={0.01} />
          </Form.Item>
          <Form.Item
            name="Grade"
            rules={[{ required: true, message: "กรอกเกรด!" }]}
          >
            <Input placeholder="เกรด" />
          </Form.Item>
          <Form.Item
            name="StudentID"
            rules={[{ required: true, message: "กรอก StudentID!" }]}
          >
            <Input placeholder="StudentID" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              เพิ่ม
            </Button>
          </Form.Item>
        </Form>

        <Table
          dataSource={grades}
          columns={columns}
          rowKey={(record) => record.StudentID + record.SubjectID}
          pagination={false}
          style={{ marginBottom: 20 }}
        />

        {grades.length > 0 && (
          <Button type="primary" onClick={handleSubmitAll}>
            ส่งข้อมูลทั้งหมด
          </Button>
        )}
      </Content>
      <Footer style={footerStyle}>Footer © 2025</Footer>
    </Layout>
  );
};

export default Grade;
