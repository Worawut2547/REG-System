import { useState, useEffect } from "react";

import { Form, Input, Button, Row, Col, Space, Card, Divider, message, Select, Radio } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";

import type { TeacherInterface } from "../../../../../../interfaces/Teacher";
import { createTeacher } from "../../../../../../services/https/teacher/teacher";

import type { MajorInterface } from "../../../../../../interfaces/Major";
import { getMajorAll } from "../../../../../../services/https/major/major";


import type { FacultyInterface } from "../../../../../../interfaces/Faculty";
import { getFacultyAll } from "../../../../../../services/https/faculty/faculty";

import type { GenderInterface } from "../../../../../../interfaces/Gender";
import { getGenderAll } from "../../../../../../services/https/gender/gender";

import type { PositionInterface } from "../../../../../../interfaces/Position";
import { getPositionAll } from "../../../../../../services/https/position/position";


interface CreateTeacherProps {
  onBack: () => void;
}

const CreateTeacher: React.FC<CreateTeacherProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [allMajors, setAllMajors] = useState<MajorInterface[]>([]);
  const [majorOptions, setMajorOptions] = useState<MajorInterface[]>([]);
  const [facultyOptions, setFacultyOptions] = useState<FacultyInterface[]>([]);
  const [selectFaculty, setSelectFaculty] = useState<string | null>(null)
  const [positionOptions, setPositionOptions] = useState<PositionInterface[]>([]);
  const [genderOptions, setGenderOptions] = useState<GenderInterface[]>([]);


  // เรียก API ดึง field ทั้งหมดเมื่อคอมโพเนนต์ถูกโหลด
  // Promise.all คือ การรอหลาย Promise ให้เสร็จพร้อมกัน เเล้วรวมออกมาเป็น array ตัวเดียว
  // ถ้า Promise ใด ล้มเหลว ก็จะล้มเหลวทั้งหมด
  useEffect(() => {
    Promise.all([
      getMajorAll(),
      getFacultyAll(),
      getPositionAll(),
      getGenderAll()
    ])
      .then(([majors, faculties, position, genders]) => {
        setAllMajors(majors)
        setMajorOptions(majors);
        setFacultyOptions(faculties);
        setPositionOptions(position);
        setGenderOptions(genders);
      })
      .catch((error) => {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล:", error);
        message.error("ไม่สามารถโหลดข้อมูลได้");
      });
  }, []);

  const handleFacultyChange = (value: string) => {
    setSelectFaculty(value);

    // กรองสาขาที่ตรงกับคณะ
    const filteredMajors = allMajors.filter(m => m.FacultyID == value);
    setMajorOptions(filteredMajors);

    setSelectedMajor(null);
  }

  const onFinish = async (values: TeacherInterface) => {
    if (!selectedMajor) {
      message.error("กรุณาเลือกสาขา");
      return;
    }
    console.log("Form values:", values);
    // TODO: เรียก API create student
    setLoading(true);
    try {
      await createTeacher(values);
      Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text: "เพิ่มข้อมูลอาจารย์สำเร็จ",
        confirmButtonColor: "#3085d6",
      });
    }
    catch (error) {
      console.error("เกิดข้อผิดพลาดในการสร้างอาจารย์:", error);
      Swal.fire({
        icon: "error",
        title: "ผิดพลาด",
        text: "ไม่สามารถเพิ่มข้อมูลอาจารย์ได้",
      });
    }
    finally {
      setLoading(false);
      onBack(); // กลับไปยังหน้าก่อนหน้า
    }
  };

  return (
    <Card className="p-6 rounded-2xl shadow-md">
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
        เพิ่มข้อมูลนักศึกษา
      </h2>
      <Divider />

      <Form
        name="create_teacher"
        layout="vertical"
        onFinish={onFinish}
        scrollToFirstError
      >

        {/* ---------------------- Personal Info ---------------------- */}
        <h3 style={{ fontWeight: 500, marginBottom: 8 }}>ข้อมูลส่วนตัว</h3>
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              label="รหัสอาจารย์"
              name="TeacherID"
              rules={[{ required: true, message: "กรุณากรอกรหัสอาจารย์!" }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="เลขบัตรประชาชน"
              name="CitizenID"
              rules={[
                { required: true, message: "กรุณากรอกเลขบัตรประชาชน!" },
                { len: 13, message: "เลขบัตรต้องมี 13 หลัก!" },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="ชื่อ"
              name="FirstName"
              rules={[{ required: true, message: "กรุณากรอกชื่อ!" }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="นามสกุล"
              name="LastName"
              rules={[{ required: true, message: "กรุณากรอกนามสกุล!" }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item
              label="เพศ"
              name="gender_id"
              rules={[{ required: true, message: "กรุณาเลือกเพศ!" }]}
            >
            
              <Radio.Group>
                {genderOptions.map((g) => (
                  <Radio key={g.ID} value={g.ID}>
                    {g.Gender}
                  </Radio>
                ))}
              </Radio.Group>
            
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {/* ---------------------- Contact Info ---------------------- */}
        <h3 style={{ fontWeight: 500, marginBottom: 8 }}>ข้อมูลการติดต่อ</h3>
        <Row gutter={[16, 0]}>
          <Col xs={24}>
            <Form.Item
              label="เบอร์โทรศัพท์"
              name="Phone"
              rules={[
                { required: true, message: "กรุณากรอกเบอร์โทร!" },
                { pattern: /^[0-9]{10}$/, message: "กรุณากรอกเบอร์โทร 10 หลัก!" },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col xs={24}>
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
        </Row>

        <Divider />

        {/* ---------------------- Education Info ---------------------- */}
        <h3 style={{ fontWeight: 500, marginBottom: 8 }}>ข้อมูลการศึกษา</h3>
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              label="ตำเเหน่งทางวิชาการ"
              name="PositionID"
              rules={[{ required: true, message: "กรุณาเลือกตำเเหน่งทางวิชาการ!" }]}
            >
              <Select placeholder="เลือกตำเเหน่งทางวิชาการ" showSearch>
                {positionOptions.map((p) => (
                  <Select.Option key={p.ID} value={p.ID}>
                    {p.Position}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="สำนักวิชา"
              name="FacultyID"
              rules={[{ required: true, message: "กรุณาเลือกสำนักวิชา!" }]}
            >
              <Select
                placeholder="เลือกสำนักวิชา"
                showSearch
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

          <Col xs={24}>
            <Form.Item
              label="สาขาวิชา"
              name="MajorID"
              rules={[{ required: true, message: "กรุณาเลือกสาขาวิชา!" }]}
            >
              <Select
                placeholder="เลือกสาขาวิชา"
                showSearch
                value={selectedMajor ?? undefined}
                onChange={(value) => setSelectedMajor(value)}
              >
                {majorOptions.map((m) => (
                  <Select.Option key={m.MajorID} value={m.MajorID}>
                    {m.MajorName}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* ---------------------- Action Buttons ---------------------- */}
        <Row justify="end">
          <Col>
            <Space style={{ marginTop: 16 }}>
              <Button onClick={onBack}>ยกเลิก</Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<PlusOutlined />}
                loading={loading}
              >
                บันทึกข้อมูล
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );

};

export default CreateTeacher;