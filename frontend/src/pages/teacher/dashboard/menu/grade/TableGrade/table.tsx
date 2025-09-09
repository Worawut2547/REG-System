import React, { useEffect, useState } from "react";
import { Table, Typography, Button, Input, message, Row, Col, Divider, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { getStudentBySubjectID } from "../../../../../../services/https/registration/registration";
import { createGradeStudent } from "../../../../../../services/https/grade/grade"
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

type Student = {
  StudentID: string;
  FirstName: string;
  LastName: string;
  Grade: string;
  SubjectID: string;
};

type Props = {
  subjectCode: string;
  subjectName: string;
  onBack: () => void;
};

const StudentGrade: React.FC<Props> = ({ subjectCode, subjectName, onBack }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ดึงข้อมูลนักศึกษา
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await getStudentBySubjectID(subjectCode);
        const mapped = res.map((item: any) => ({
          StudentID: item.StudentID,
          FirstName: item.FirstName,
          LastName: item.LastName,
          Grade: item.Grade ?? "", // ถ้ายังไม่มีเกรด
          SubjectID: subjectCode, // เพิ่ม SubjectID
        }));
        setStudents(mapped);
      } catch (err) {
        console.error("เกิดข้อผิดพลาด", err);
        message.error("ไม่สามารถโหลดข้อมูลนักศึกษาได้");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [subjectCode]);

  // --- Filter นักเรียนด้วย search ---
  const filteredStudents = students.filter((s) =>
    s.StudentID.toLowerCase().includes(searchText.toLowerCase())
  );

  // อัปเดตเกรดใน state เมื่อพิมพ์
  const handleGradeChange = (id: string, value: string) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.StudentID === id ? { ...student, Grade: value } : student
      )
    );
  };

  // ส่งข้อมูลเกรดทั้งหมดไป backend
  const handleSubmitAll = async () => {
    setSaving(true);
    try {
      const payload = students.map((s) => ({
        StudentID: s.StudentID,
        Grade: s.Grade,
        SubjectID: s.SubjectID,
      }));

      await createGradeStudent(payload); // เรียก API จริง
      console.log("Payload to submit:", payload);
      message.success("ส่งเกรดเรียบร้อย");
    } catch (err) {
      console.error(err);
      message.error("ส่งเกรดไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<Student> = [
    {
      title: "ลำดับ",
      key: "no",
      render: (_: any, __: Student, index: number) => index + 1,
      width: 100,
      align: "center" as const,
    },
    { title: "รหัสนักศึกษา", dataIndex: "StudentID", key: "id", width: 250 },
    {
      title: "ชื่อนักศึกษา",
      key: "fullname",
      width: 300,
      render: (_: any, record: Student) => `${record.FirstName} ${record.LastName}`,
    },
    {
      title: "เกรด",
      dataIndex: "Grade",
      key: "grade",
      align: "center",
      render: (_: any, record: Student) => (
      <Select
        value={record.Grade || undefined}
        onChange={(value) => handleGradeChange(record.StudentID, value)}
        style={{
          width: 120,
          textAlign: "center",
        }}
        placeholder="เลือกเกรด"
      >
        {["A", "B+", "B", "C+", "C", "D+", "D", "F"].map((g) => (
          <Select.Option key={g} value={g}>
            {g}
          </Select.Option>
        ))}
      </Select>
    ),
    },
  ];

  return (
    <div >
      <Button onClick={onBack} style={{ marginBottom: 18 }}>
        BACK
      </Button>
      <Title style={{ fontSize: 30 }} level={3}>{subjectCode} - {subjectName}</Title>

      <Divider />

      {/* --- Search --- */}
      <Row gutter={16} align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <div style={{ backgroundColor: "#2e236c", padding: "10px 8px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Text style={{ color: "white", fontSize: 14, fontWeight: "lighter" }}>ค้นหาด้วยรหัสนักศึกษา</Text>
            <Input
              placeholder="Search..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 180, height: 28, fontSize: 12, backgroundColor: "white" }}
            />
          </div>
        </Col>
      </Row>
      <Table bordered
        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)", borderRadius: 18, overflow: "hidden" }}
        columns={columns}
        dataSource={filteredStudents}
        rowKey="StudentID"
        loading={loading}
        pagination={false}
        components={{
          header: {
            cell: (props: any) => (
              <th
                {...props}
                style={{
                  ...props.style,
                  textAlign: "center",  // จัดหัวคอลัมน์ตรงกลาง
                }}
              />
            ),
          },
          body: {
            cell: (props: any) => (
              <td
                {...props}
                style={{
                  ...props.style,
                  paddingTop: 15,   // ปรับความสูงด้านบน
                  paddingBottom: 15, // ปรับความสูงด้านล่าง
                }}
              />
            ),
          },
        }}
      />
      <div style={{ marginTop: 16, textAlign: "right" }}>
        <Button
          type="primary"
          loading={saving}
          onClick={handleSubmitAll}
          disabled={students.length === 0}
        >
          Submit All
        </Button>
      </div>
    </div>
  );
};

export default StudentGrade;