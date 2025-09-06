import React, { useEffect, useState } from "react";
import { Table, Typography, Button, Input, message, Divider, Row, Col, Select } from "antd";
import { getStudentBySubjectID } from "../../../../../../services/https/registration/registration";
import { createGradeStudent } from "../../../../../../services/https/grade/grade"
import { SearchOutlined, EditOutlined } from "@ant-design/icons";
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isEditing, setIsEditing] = useState(false); // <-- state สำหรับ edit mode
  const [originalStudents, setOriginalStudents] = useState<Student[]>([]);

  // ดึงข้อมูลนักศึกษา
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await getStudentBySubjectID(subjectCode);
      const mapped = res.data.map((item: any) => ({
        StudentID: item.StudentID,
        FirstName: item.FirstName,
        LastName: item.LastName,
        Grade: item.Grade ?? "", // ถ้ายังไม่มีเกรด
        SubjectID: subjectCode,
      }));
      setStudents(mapped);
    } catch (err) {
      console.error(err);
      message.error("ไม่สามารถโหลดข้อมูลนักศึกษาได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [subjectCode]);

  const handleGradeChange = (id: string, value: string) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.StudentID === id ? { ...student, Grade: value } : student
      )
    );
  };

  const handleSubmitAll = async () => {
    setSaving(true);
    try {
      const payload = students.map((s) => ({
        StudentID: s.StudentID,
        Grade: s.Grade,
        SubjectID: s.SubjectID,
      }));

      await createGradeStudent(payload);
      message.success("ส่งเกรดเรียบร้อย");

      //ให้เก็บค่าเดิมที่แก้ไขแล้ว
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      message.error("ส่งเกรดไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter((s) =>
    s.StudentID.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnsType<Student> = [
    {
      title: <div style={{ textAlign: "center" }}>NO.</div>,
      key: "no",
      render: (_: any, __: Student, index: number) => index + 1,
      width: 80,
      align: "center" as const,
    },
    { title: <div style={{ textAlign: "center" }}>รหัสนักศึกษา</div>, dataIndex: "StudentID", key: "id", width: 250 },
    { title: <div style={{ textAlign: "center" }}>ชื่อ</div>, dataIndex: "FirstName", key: "firstname" },
    { title: <div style={{ textAlign: "center" }}>นามสกุล</div>, dataIndex: "LastName", key: "lastname" },
    {
      title: "Grade",
      dataIndex: "Grade",
      key: "grade",
      align: "center",
      render: (_: any, record: Student) => (
        isEditing ? (
          <Select<string>
            value={record.Grade || undefined}
            onChange={(value) => handleGradeChange(record.StudentID, value)}
            placeholder="เลือกเกรด"
            style={{ width: 100 }}
            options={[
              { label: "A", value: "A" },
              { label: "B+", value: "B+" },
              { label: "B", value: "B" },
              { label: "C+", value: "C+" },
              { label: "C", value: "C" },
              { label: "D+", value: "D+" },
              { label: "D", value: "D" },
              { label: "F", value: "F" },
            ]}
            allowClear
          />
        ) : (
          <Text>{record.Grade || "-"}</Text> // ถ้ายังไม่มีเกรด แสดง "-"
        )
      ),
    },
  ];
  return (
    <div style={{ padding: 24, maxWidth: 1500, margin: "auto" }}>
      {/* ปุ่ม Back */}
      <Button onClick={onBack} style={{ marginBottom: 16 }}>
        BACK
      </Button>

      <Title level={3} style={{ marginTop: 8, fontSize: 30, fontWeight: 'bold' }}>
        {subjectCode} - {subjectName}
      </Title>

      <Divider />

      {/* แถบค้นหา */}
      <Row gutter={16} style={{ marginBottom: 25 }}>
        <Col>
          <div style={{ backgroundColor: "#2e236c", padding: "8px 12px", borderRadius: 8, display: "flex", alignItems: "center" }}>
            <Text style={{ color: "white", marginRight: 8 }}>ค้นหาด้วยรหัสนักศึกษา</Text>
            <Input
              placeholder="Search..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 180, height: 32, fontSize: 12, borderRadius: 8, backgroundColor: "white" }}
            />
          </div>
        </Col>

        {/* ปุ่ม Edit Grades */}
        <Col flex="auto" style={{ textAlign: "right", padding: "10px 10px", alignItems: "center" }}>
          {!isEditing && (
            <Button
              type="default"
              onClick={() => {
                setOriginalStudents(students);
                setIsEditing(true)
              }}
              disabled={students.length === 0}
              style={{
                padding: "18px 12px",
                borderRadius: "8px",
                backgroundColor: "#f2ffbcff",
                borderColor: 'rgba(223, 228, 155, 1)'
              }}
            > <EditOutlined />
              Edit Grades
            </Button>
          )}
        </Col>
      </Row>

      {/* ตารางนักศึกษา */}
      <Table
        columns={columns}
        dataSource={filteredStudents}
        rowKey="StudentID"
        loading={loading}
        pagination={false}
        bordered
      />

      {/* ปุ่ม Submit All / Cancel อยู่ด้านล่างตาราง */}
      {isEditing && (
        <div style={{ marginTop: 16, textAlign: "right" }}>
          <Button
            type="primary"
            loading={saving}
            onClick={handleSubmitAll}
            disabled={students.length === 0}
          >
            Submit All
          </Button>
          <Button
            style={{ marginLeft: 8 }}
            onClick={() => {
              setStudents(originalStudents);
              setIsEditing(false)
            }}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );

};

export default StudentGrade;