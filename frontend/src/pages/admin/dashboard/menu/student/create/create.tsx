import { useState, useEffect } from "react";

import { Form, Input, Button, Row, Col, Space, Card, Divider, message, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";


import type { StudentInterface } from "../../../../../../interfaces/Student";
import { createStudent } from "../../../../../../services/https/student/student";


import type { MajorInterface } from "../../../../../../interfaces/Major";
import { getMajorAll } from "../../../../../../services/https/major/major";


import type { FacultyInterface } from "../../../../../../interfaces/Faculty";
import { getFacultyAll } from "../../../../../../services/https/faculty/faculty";


import type { DegreeInterface } from "../../../../../../interfaces/Degree";
import { getDegreeAll } from "../../../../../../services/https/degree/degree";

import type { GenderInterface } from "../../../../../../interfaces/Gender";
import { getGenderAll } from "../../../../../../services/https/gender/gender";

interface CreateStudentProps {
  onBack: () => void;
}

const CreateStudent: React.FC<CreateStudentProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);

  const [majorOptions, setMajorOptions] = useState<MajorInterface[]>([]);
  const [facultyOptions, setFacultyOptions] = useState<FacultyInterface[]>([]);
  const [selectFaculty, setSelectFaculty] = useState<string | null>(null)
  const [degreeOptions, setDegreeOptions] = useState<DegreeInterface[]>([]);
  const [genderOptions, setGenderOptions] = useState<GenderInterface[]>([]);


  // เรียก API ดึง field ทั้งหมดเมื่อคอมโพเนนต์ถูกโหลด
  // Promise.all คือ การรอหลาย Promise ให้เสร็จพร้อมกัน เเล้วรวมออกมาเป็น array ตัวเดียว
  // ถ้า Promise ใด ล้มเหลว ก็จะล้มเหลวทั้งหมด
  useEffect(() => {
    Promise.all([
      getMajorAll(),
      getFacultyAll(),
      getDegreeAll(),
      getGenderAll()
    ])
      .then(([majors, faculties, degrees, genders]) => {
        setMajorOptions(majors);
        setFacultyOptions(faculties);
        setDegreeOptions(degrees);
        setGenderOptions(genders);
      })
      .catch((error) => {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล:", error);
        message.error("ไม่สามารถโหลดข้อมูลได้");
      });
  }, []);

  const handleFacultyChange = (value: string) => {
    setSelectFaculty(value);

    // เมื่อเลือก Faculty ให้ดึง Major ที่ตรงกับ Faculty นั้น
    const faculty = facultyOptions.find(f => f.FacultyID === value);
    setMajorOptions(faculty?.Majors || []);
  }

  const onFinish = async (values: StudentInterface) => {
    console.log("Form values:", values);
    // TODO: เรียก API create student
    setLoading(true);
    try {
      await createStudent(values);
      message.success("สร้างข้อมูลนักศึกษาเรียบร้อยแล้ว");
    }
    catch (error) {
      console.error("เกิดข้อผิดพลาดในการสร้างนักศึกษา:", error);
      message.error("เกิดข้อผิดพลาดในการสร้างนักศึกษา");
    }
    finally {
      setLoading(false);
      onBack(); // กลับไปยังหน้าก่อนหน้า
    }
  };

  return (
    <Card>
      <h2>เพิ่มข้อมูลนักศึกษา</h2>
      <Divider />
      <Form name="create_student" layout="vertical" onFinish={onFinish}>
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="รหัสนักศึกษา"
              name="StudentID"
              rules={[{ required: true, message: "กรุณากรอกรหัสนักศึกษา!" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="ชื่อ"
              name="FirstName"
              rules={[{ required: true, message: "กรุณากรอกชื่อ!" }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="นามสกุล"
              name="LastName"
              rules={[{ required: true, message: "กรุณากรอกนามสกุล!" }]}
            >
              <Input />
            </Form.Item>
          </Col>

          {/* Gender */}
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="เพศ"
              name="gender_id"
              rules={[{ required: true, message: "กรุณาเลือกเพศ!" }]}
            >
              <Select placeholder="เลือกเพศ">
                {genderOptions.map((g) => (
                  <Select.Option key={g.ID} value={g.ID}>
                    {g.Gender}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="เลขบัตรประชาชน"
              name="CitizenID"
              rules={[{ required: true, message: "กรุณากรอกเลขบัตรประชาชน!" }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="เบอร์โทร"
              name="Phone"
              rules={[{ required: true, message: "กรุณากรอกเบอร์โทร!" }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="อีเมล"
              name="Email"
              rules={[
                { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง!" },
                { required: true, message: "กรุณากรอกอีเมล!" },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>

          {/* Degree */}

          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="ระดับการศึกษา"
              name="DegreeID"
              rules={[{ required: true, message: "กรุณาเลือกระดับการศึกษา!" }]}
            >
              <Select placeholder="เลือกระดับการศึกษา">
                {degreeOptions.map((d) => (
                  <Select.Option key={d.DegreeID} value={d.DegreeID}>
                    {d.Degree}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Faculty */}
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="คณะ"
              name="FacultyID"
              rules={[{ required: true, message: "กรุณาเลือกคณะ!" }]}
            >
              <Select placeholder="เลือกคณะ"
                value={selectFaculty}
                onChange={handleFacultyChange}
              >
                {facultyOptions.map((f) => (
                  <Select.Option key={f.FacultyID} value={f.FacultyID}>
                    {f.FacultyName}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Major */}
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="สาขา"
              name="MajorID"
              rules={[{ required: true, message: "กรุณาเลือกสาขา!" }]}
            >
              <Select placeholder="เลือกสาขา">
                {majorOptions.map((m) => (
                  <Select.Option key={m.MajorID} value={m.MajorID}>
                    {m.MajorName}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row justify="end">
          <Col>
            <Space style={{ marginTop: 16 }}>
              <Button type="default" onClick={onBack}>
                ยกเลิก
              </Button>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={loading}>
                ยืนยัน
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default CreateStudent;