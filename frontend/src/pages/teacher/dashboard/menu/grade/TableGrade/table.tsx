import React, { useEffect, useState } from "react";
import { Table, Typography, Button, Input, message } from "antd";
import { getStudentBySubjectID } from "../../../../../../services/https/registration/registration";
import { createGradeStudent } from "../../../../../../services/https/grade/grade"

const { Title } = Typography;

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

  // ดึงข้อมูลนักศึกษา
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await getStudentBySubjectID(subjectCode);
        const mapped = res.data.map((item: any) => ({
          StudentID: item.StudentID,
          FirstName: item.FirstName,
          LastName: item.LastName,
          Grade: item.Grade ?? "", // ถ้ายังไม่มีเกรด
          SubjectID: subjectCode, // เพิ่ม SubjectID
        }));
        setStudents(mapped);
      } catch (err) {
        console.error(err);
        message.error("ไม่สามารถโหลดข้อมูลนักศึกษาได้");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [subjectCode]);

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

  const columns = [
    {
      title: "ลำดับ",
      key: "no",
      render: (_: any, __: Student, index: number) => index + 1, // ใช้ index + 1
      width: 60,
      align: "center" as const,
    },
    { title: "รหัสนักศึกษา", dataIndex: "StudentID", key: "id" },
    { title: "ชื่อ", dataIndex: "FirstName", key: "firstname" },
    { title: "นามสกุล", dataIndex: "LastName", key: "lastname" },
    {
      title: "เกรด",
      dataIndex: "Grade",
      key: "grade",
      render: (_: any, record: Student) => (
        <Input
          value={record.Grade}
          onChange={(e) => handleGradeChange(record.StudentID, e.target.value)}
          placeholder="กรอกเกรด"
          style={{
            width: 80,
            textAlign: "center",
            borderRadius: 6,
            padding: "4px 8px",
            border: "1px solid #d9d9d9",
          }}
          maxLength={2}
        />
      ),
    },
  ];

  return (
    <div>
      <Button onClick={onBack} style={{ marginBottom: 16 }}>
        ย้อนกลับ
      </Button>
      <Title level={3}>{subjectCode} - {subjectName}</Title>
      <Table
        columns={columns}
        dataSource={students}
        rowKey="StudentID"
        loading={loading}
        pagination={false}
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
