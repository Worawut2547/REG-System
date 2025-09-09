// --- StudentScorePage.tsx ---
import React, { useEffect, useState } from "react";
import { Table, Button, Input, Row, Col, Typography, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { getStudentBySubjectID } from "../../../../../../services/https/registration/registration";
import { createScoreStudent } from "../../../../../../services/https/score/score";
import type { ScoreInterface } from "../../../../../../interfaces/Score";

const { Title, Text } = Typography;

type Props = {
  subjectCode: string;
  subjectName: string;
  onBack: () => void;
};

const StudentScorePage: React.FC<Props> = ({ subjectCode, subjectName, onBack }) => {
  const [students, setStudents] = useState<ScoreInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [fullScore, setFullScore] = useState<number>(0);
  const [scoreList, setScoreList] = useState<string>("");

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await getStudentBySubjectID(subjectCode);
        const mapped: ScoreInterface[] = res.map((item: any) => ({
          ID: item.ID,
          StudentID: item.StudentID,
          StudentName: `${item.FirstName} ${item.LastName}`,
          SubjectID: subjectCode,
          Score: item.Score ?? 0,
          FullScore: item.FullScore ?? 0,
          List: item.List ?? "",
        }));
        setStudents(mapped);

        // ตั้งค่าเริ่มต้น FullScore และ List จากข้อมูลตัวแรก
        if (mapped.length > 0) {
          setFullScore(mapped[0].FullScore ?? 0);
          setScoreList(mapped[0].List ?? "");
        }
      } catch (err) {
        console.error("โหลดข้อมูลผิดพลาด:", err);
        message.error("ไม่สามารถโหลดข้อมูลนักศึกษาได้");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [subjectCode]);

  // --- Update คะแนนนักเรียนเฉพาะคน ---
  const handleScoreChange = (studentId: string, value: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.StudentID === studentId ? { ...s, Score: Number(value) } : s))
    );
  };

  // --- Update FullScore ทุกคน ---
  const handleFullScoreChange = (value: string) => {
    const num = Number(value) || 0;
    setFullScore(num);
    setStudents(prev => prev.map(s => ({ ...s, FullScore: num })));
  };

  // --- Update List ทุกคน ---
  const handleListChange = (value: string) => {
    setScoreList(value);
    setStudents(prev => prev.map(s => ({ ...s, List: value })));
  };

  // --- Filter นักเรียนด้วย search ---
  const filteredStudents = students.filter((s) =>
    s.StudentID.toLowerCase().includes(searchText.toLowerCase())
  );

  // --- Submit ---
  const handleSubmitAll = async () => {
    setSaving(true);
    try {
      const payload: ScoreInterface[] = students.map((s) => ({
        ID: s.ID,
        StudentID: s.StudentID,
        StudentName: s.StudentName ?? "",
        SubjectID: s.SubjectID ?? "",
        Score: s.Score ?? 0,
        FullScore: s.FullScore ?? 0,
        List: s.List ?? "",
        SubjectName: s.SubjectName,
        Credit: s.Credit,
      }));
      await createScoreStudent(payload);
      message.success("บันทึกคะแนนเรียบร้อย");
    } catch (err) {
      console.error(err);
      message.error("บันทึกคะแนนไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  // --- Table Columns ---
  const columns = [
    {
      title: "ลำดับ",
      key: "no",
      render: (_: any, __: ScoreInterface, index: number) => index + 1,
      align: "center" as const,
    },
    { title: "รหัสนักศึกษา", dataIndex: "StudentID", key: "studentid" },
    { title: "ชื่อ-นามสกุล", dataIndex: "StudentName", key: "studentname" },
    {
      title: "คะแนน",
      dataIndex: "Score",
      key: "score",
      render: (_: any, record: ScoreInterface) => (
        <Input
          type="number"
          value={record.Score}
          onChange={(e) => handleScoreChange(record.StudentID!, e.target.value)}
          style={{ width: 100, textAlign: "center" }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Button onClick={onBack} style={{ marginBottom: 16 }}>ย้อนกลับ</Button>
      <Title level={3}>{subjectCode} - {subjectName}</Title>

      {/* --- Search --- */}
      <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <div style={{ backgroundColor: "#2e236c", padding: "4px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <Text style={{ color: "white", fontSize: 12 }}>ค้นหาด้วยรหัสนักศึกษา</Text>
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

      {/* --- FullScore & List --- */}
      <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <div style={{ backgroundColor: "#2e236c", padding: "4px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <Text style={{ color: "white", fontSize: 12 }}>คะแนนเต็ม</Text>
            <Input
              type="number"
              value={fullScore}
              onChange={(e) => handleFullScoreChange(e.target.value)}
              style={{ width: 80, height: 28, fontSize: 12 }}
            />
          </div>
        </Col>
        <Col>
          <div style={{ backgroundColor: "#2e236c", padding: "4px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <Text style={{ color: "white", fontSize: 12 }}>ประเภท</Text>
            <Input
              value={scoreList}
              onChange={(e) => handleListChange(e.target.value)}
              style={{ width: 120, height: 28, fontSize: 12 }}
            />
          </div>
        </Col>
      </Row>

      {/* --- Table --- */}
      <Table
        dataSource={filteredStudents}
        columns={columns}
        rowKey="StudentID"
        loading={loading}
        pagination={false}
      />

      <div style={{ marginTop: 16, textAlign: "right" }}>
        <Button type="primary" onClick={handleSubmitAll} loading={saving}>Submit All</Button>
      </div>
    </div>
  );
};

export default StudentScorePage;
