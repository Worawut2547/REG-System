import { useState, useEffect } from "react";

import { Form, Input, Button, Row, Col, Space, Card, Divider, message, Select, Radio } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";

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
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [allMajors, setAllMajors] = useState<MajorInterface[]>([]);
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
        setAllMajors(majors)
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

    // กรองสาขาที่ตรงกับคณะ
    const filteredMajors = allMajors.filter(m => m.FacultyID == value);
    setMajorOptions(filteredMajors);

    setSelectedMajor(null);
  }

  const onFinish = async (values: StudentInterface) => {
    if (!selectedMajor) {
      message.error("กรุณาเลือกสาขา");
      return;
    }
    // TODO: เรียก API create student
    setLoading(true);
    try {
      await createStudent(values);
      Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text: "เพิ่มข้อมูลนักศึกษาสำเร็จ",
        confirmButtonColor: "#3085d6",
      });
    }
    catch (error) {
      console.error("เกิดข้อผิดพลาดในการสร้างนักศึกษา:", error);
      Swal.fire({
        icon: "error",
        title: "ผิดพลาด",
        text: "ไม่สามารถเพิ่มข้อมูลนักศึกษาได้",
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
        name="create_student"
        layout="vertical"
        onFinish={onFinish}
        scrollToFirstError
      >

        {/* ---------------------- Personal Info ---------------------- */}
        <h3 style={{ fontWeight: 500, marginBottom: 8 }}>ข้อมูลส่วนตัว</h3>
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              label="รหัสนักศึกษา"
              name="StudentID"
              rules={[{ required: true, message: "กรุณากรอกรหัสนักศึกษา!" }]}
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
              label="ระดับการศึกษา"
              name="DegreeID"
              rules={[{ required: true, message: "กรุณาเลือกระดับการศึกษา!" }]}
            >
              <Select placeholder="เลือกระดับการศึกษา" showSearch>
                {degreeOptions.map((d) => (
                  <Select.Option key={d.DegreeID} value={d.DegreeID}>
                    {d.Degree}
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

export default CreateStudent;
