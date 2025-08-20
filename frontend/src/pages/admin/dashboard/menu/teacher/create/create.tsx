// src/pages/dashboard/menu/register.tsx
import { useState, useEffect } from 'react';
import { Form, Input, Button, Row, Col, Space, Card, Divider, message, Select } from 'antd';
import { PlusOutlined } from "@ant-design/icons";


import { type TeacherInterface } from '../../../../../../interfaces/Teacher';
import { createTeacher } from '../../../../../../services/https/teacher/teacher';

import { type MajorInterface } from '../../../../../../interfaces/Major';
import { getMajorAll } from '../../../../../../services/https/major/major';

import { type FacultyInterface } from '../../../../../../interfaces/Faculty';
import { getFacultyAll } from '../../../../../../services/https/faculty/faculty';

import { type PositionInterface } from '../../../../../../interfaces/Position';
import { getPositionAll } from '../../../../../../services/https/position/position';

import { type GenderInterface } from '../../../../../../interfaces/Gender';
import { getGenderAll } from '../../../../../../services/https/gender/gender';


interface CreateTeacherProps {
  onBack: () => void;
}

const CreateTeacher: React.FC<CreateTeacherProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);

  const [facultyOptions, setFacultyOptions] = useState<FacultyInterface[]>([]);
  const [selectFaculty, setSelectFaculty] = useState<string | null>(null);

  const [majorOptions, setMajorOptions] = useState<MajorInterface[]>([]);
  const [positionOptions, setPositionOptions] = useState<PositionInterface[]>([]);

  const [genderOptions , setGenderOptions] = useState<GenderInterface[]>([]);


  // เรียก API ดึง field ทั้งหมดเมื่อคอมโพเนนต์ถูกโหลด
  // Promise.all คือ การรอหลาย Promise ให้เสร็จพร้อมกัน เเล้วรวมออกมาเป็น array ตัวเดียว
  // ถ้า Promise ใด ล้มเหลว ก็จะล้มเหลวทั้งหมด
  useEffect(() => {
    Promise.all([
      getFacultyAll(),
      getMajorAll(),
      getPositionAll(),
      getGenderAll(),
    ])
      .then(([faculties, majors, positions , genders]) => {
        setFacultyOptions(faculties);
        setMajorOptions(majors);
        setPositionOptions(positions);
        setGenderOptions(genders);
      })
      .catch((error) => {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล:", error);
        message.error("ไม่สามารถโหลดข้อมูลได้");
      })
  }, []);

  const handleFacultyChange = (value: string) => {
    setSelectFaculty(value);

    // เมื่อเลือก Faculty ให้ดึง Major ที่ตรงกับ Faculty นั้น
    const faculty = facultyOptions.find(f => f.FacultyID === value);
    setMajorOptions(faculty?.Majors || []);
  }


  const onFinish = async (values: TeacherInterface) => {
    console.log("Form values:", values);

    setLoading(true);
    try {
      await createTeacher(values);
      message.success("สร้างข้อมูลอาจารย์เรียบร้อยแล้ว");
    }
    catch (error) {
      console.error("เกิดข้อผิดพลาดในการสร้างอาจารย์:", error);
      message.error("เกิดข้อผิดพลาดในการสร้างอาจารย์");
    }
    finally {
      setLoading(false);
      onBack();
    }
  }

  return (
    <Card>
      <h2>เพิ่มข้อมูลอาจารย์</h2>
      <Divider />
      <Form name="create_teacher" layout="vertical" onFinish={onFinish}>
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="รหัสประจำตัว"
              name="TeacherID"
              rules={[{ required: true, message: "กรุณากรอกรหัสประจำตัว!" }]}
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

          {/* Position */}

          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="ตำเเหน่งทางวิชาการ"
              name="PositionID"
              rules={[{ required: true, message: "กรุณาเลือกตำเเหน่งทางวิชาการ!" }]}
            >
              <Select placeholder="เลือกตำเเหน่งทางวิชาการ">
                {positionOptions.map((p) => (
                  <Select.Option key={p.ID} value={p.ID}>
                    {p.Position}
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

export default CreateTeacher;
