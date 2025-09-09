import { useEffect, useState } from "react";
import {
  Divider,
  Button,
  Space,
  Upload,
  Avatar,
  Form,
  Input,
  Row,
  Col,
  Typography,
} from "antd";
import { PlusOutlined, UserOutlined, ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";

import { type TeacherInterface } from "../../../../../../interfaces/Teacher";
import { getNameTeacher, updateTeacherProfile } from "../../../../../../services/https/teacher/teacher";
//import "./edit.css";

const { Title, Text } = Typography;

interface ShowNameTeacherProps {
  onBack?: () => void;
}

export const EditTeacherPage: React.FC<ShowNameTeacherProps> = ({ onBack }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [teacher, setTeacher] = useState<TeacherInterface>();
  const [form] = Form.useForm();

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (username) {
      setUsername(username);

      getNameTeacher(username)
        .then((teacher) => {
          setTeacher(teacher);
          form.setFieldsValue({
            Position: teacher.Position,
            FirstName: teacher.FirstName,
            LastName: teacher.LastName,
            Phone: teacher.Phone,
            Email: teacher.Email,
            Address: teacher.Address,
            BirthDay: teacher.BirthDay,
            Nationality: teacher.Nationality,
            Ethnicity: teacher.Ethnicity,
            Religion: teacher.Religion,
          });
        })
        .catch((err) => console.error(err));

      const saveImage = localStorage.getItem(`profileImage_${username}`);
      if (saveImage) {
        setImageUrl(saveImage);
      }
    }
  }, [form]);

  const beforeUpload = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      setImageUrl(base64);
      if (username) {
        localStorage.setItem(`profileImage_${username}`, base64);
      }
    };
    return false;
  };

  const onFinish = async (values: any) => {
    try {
      await updateTeacherProfile(values);
      Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text: "เเก้ไขข้อมูลสำเร็จ",
        confirmButtonColor: "#3085d6",
      });
      if (onBack) onBack();
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการแก้ไขอาจารย์:", error);
      Swal.fire({
        icon: "error",
        title: "ผิดพลาด",
        text: "เเก้ไขข้อมูลไม่สำเร็จ",
      });
    }
  };

  // สไตล์ฟอร์มและ input
  const formItemStyle = {
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#fff",
  };

  const inputStyle = {
    border: "none",
    backgroundColor: "transparent",
    fontSize: 16,
  };

  const labelStyle = {
    fontSize: 16,
    fontWeight: 500,
  };

  return (
    <div style={{ maxWidth: 1100, margin: "auto", padding: "24px 16px" }}>
      <Title level={2} style={{ margin: 0, textAlign: "center", color: "#333" }}>
        แก้ไขข้อมูลนักศึกษา
      </Title>
      <Divider style={{ margin: "16px 0 24px" }} />

      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={teacher}>
        <Row gutter={[32, 32]}>
          {/* Avatar */}
          <Col xs={24} md={8} style={{ textAlign: "center" }}>
            <Upload showUploadList={false} beforeUpload={beforeUpload} accept="image/*">
              <Avatar
                size={230}
                src={imageUrl}
                icon={<UserOutlined />}
                style={{
                  cursor: "pointer",
                  border: "3px solid #1890ff",
                  boxShadow: "0 4px 10px rgba(24, 144, 255, 0.3)",
                }}
              />
              <div
                style={{
                  marginTop: 12,
                  color: "#1890ff",
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: 16,
                }}
              >
                <PlusOutlined /> อัปโหลดรูปโปรไฟล์
              </div>
            </Upload>
          </Col>

          {/* ข้อมูลฟอร์ม */}
          <Col xs={24} md={16}>
            {/* ข้อมูลส่วนตัว */}
            <Title level={4} style={{ marginBottom: 12, color: "#444" }}>
              ข้อมูลส่วนตัว
            </Title>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label={<Text style={labelStyle}>รหัสอาจารย์</Text>} style={formItemStyle}>
                  <Text style={{ color: "#555", fontSize: 16 }}>{teacher?.TeacherID || "-"}</Text>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label={<Text style={labelStyle}>เลขบัตรประชาชน</Text>} style={formItemStyle}>
                  <Text style={{ color: "#555", fontSize: 16 }}>{teacher?.CitizenID || "-"}</Text>
                </Form.Item>
              </Col>

              <Col xs={24} sm={24}>
                <Form.Item label={<Text style={labelStyle}>ตำเเหน่งทางวิชาการ</Text>} style={formItemStyle}>
                  <Text style={{ color: "#555", fontSize: 16 }}>{teacher?.Position || "-"}</Text>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text style={labelStyle}>ชื่อ</Text>}
                  name="FirstName"
                  rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}
                  style={formItemStyle}
                >
                  <Input style={inputStyle} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text style={labelStyle}>นามสกุล</Text>}
                  name="LastName"
                  rules={[{ required: true, message: "กรุณากรอกนามสกุล" }]}
                  style={formItemStyle}
                >
                  <Input style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* ข้อมูลการติดต่อ */}
            <Title level={4} style={{ marginBottom: 12, color: "#444" }}>
              ข้อมูลการติดต่อ
            </Title>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text style={labelStyle}>เบอร์โทร</Text>}
                  name="Phone"
                  rules={[{ required: true, message: "กรุณากรอกเบอร์โทร" }]}
                  style={formItemStyle}
                >
                  <Input style={inputStyle} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text style={labelStyle}>อีเมล</Text>}
                  name="Email"
                  rules={[
                    { required: true, message: "กรุณากรอกอีเมล" },
                    { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
                  ]}
                  style={formItemStyle}
                >
                  <Input style={inputStyle} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  label={<Text style={labelStyle}>ที่อยู่</Text>}
                  name="Address"
                  rules={[{ required: true, message: "กรุณากรอกที่อยู่" }]}
                  style={formItemStyle}
                >
                  <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} style={inputStyle} />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* ข้อมูลอื่น ๆ */}
            <Title level={4} style={{ marginBottom: 12, color: "#444" }}>
              ข้อมูลอื่น ๆ
            </Title>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text style={labelStyle}>สัญชาติ</Text>}
                  name="Nationality"
                  rules={[{ required: true, message: "กรุณากรอกสัญชาติ" }]}
                  style={formItemStyle}
                >
                  <Input style={inputStyle} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text style={labelStyle}>เชื้อชาติ</Text>}
                  name="Ethnicity"
                  rules={[{ required: true, message: "กรุณากรอกเชื้อชาติ" }]}
                  style={formItemStyle}
                >
                  <Input style={inputStyle} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text style={labelStyle}>ศาสนา</Text>}
                  name="Religion"
                  rules={[{ required: true, message: "กรุณากรอกศาสนา" }]}
                  style={formItemStyle}
                >
                  <Input style={inputStyle} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text style={labelStyle}>วันเกิด</Text>}
                  name="BirthDay"
                  rules={[{ required: true, message: "กรุณากรอกวันเกิด" }]}
                  style={formItemStyle}
                >
                  <Input style={inputStyle} />
                </Form.Item>
              </Col>

            </Row>

            <Divider />

            {/* ข้อมูลทางวิชาการ */}
            <Title level={4} style={{ marginBottom: 12, color: "#444" }}>
              ข้อมูลทางวิชาการ
            </Title>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label={<Text style={labelStyle}>คณะ</Text>} style={formItemStyle}>
                  <Text style={{ color: "#555", fontSize: 16 }}>{teacher?.FacultyName || "-"}</Text>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label={<Text style={labelStyle}>สาขา</Text>} style={formItemStyle}>
                  <Text style={{ color: "#555", fontSize: 16 }}>{teacher?.MajorName || "-"}</Text>
                </Form.Item>
              </Col>
            </Row>

            {/* ปุ่ม */}
            <Form.Item style={{ marginTop: 24 }}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  บันทึก
                </Button>
                <Button onClick={onBack} icon={<ArrowLeftOutlined />}>
                  กลับ
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};