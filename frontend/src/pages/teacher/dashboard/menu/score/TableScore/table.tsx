// --- StudentScorePage.tsx ---
import React, { useEffect, useState } from "react";
import { Table, Button, Input, Row, Col, Typography, message, Divider, Modal, Select, InputNumber } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { getStudentBySubjectID } from "../../../../../../services/https/registration/registration";
import { createScoreStudent } from "../../../../../../services/https/score/score";
import type { ScoreInterface } from "../../../../../../interfaces/Score";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;
const { Option } = Select;

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
  const [scoreCategories, setScoreCategories] = useState<string[]>([]);
  const [categoryFullScores, setCategoryFullScores] = useState<Record<string, number>>({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalCategory, setModalCategory] = useState("");
  const [modalFullScore, setModalFullScore] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState("Main");
  const [submittedCategories, setSubmittedCategories] = useState<string[]>([]);

  // --- Fetch students ---
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await getStudentBySubjectID(subjectCode);
        const mapped = res.map((item: any) => {
          // If item.Scores exists and has at least one score, use the first as main
          const mainScore = (item.Scores && item.Scores.length > 0)
            ? item.Scores[0]
            : { Score: 0, FullScore: 0, List: "Main" };
          return {
            ID: item.ID,
            StudentID: item.StudentID,
            StudentName: `${item.FirstName} ${item.LastName}`,
            SubjectID: subjectCode,
            Score: mainScore.Score ?? 0,
            FullScore: mainScore.FullScore ?? 0,
            List: mainScore.List ?? "Main",
            Scores: (item.Scores ?? []).map((score: any) => ({
              Score: score.Score ?? 0,
              FullScore: score.FullScore ?? 0,
              List: score.List ?? "",
            })),
          };
        });
        setStudents(mapped);
      } catch (err) {
        console.error("โหลดข้อมูลผิดพลาด:", err);
        message.error("ไม่สามารถโหลดข้อมูลนักศึกษาได้");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [subjectCode]);

  const filteredStudents = students.filter((s) =>
    s.StudentID.toLowerCase().includes(searchText.toLowerCase())
  );

  // --- Modal Handlers ---
  const showModal = () => setIsModalVisible(true);
  const handleModalCancel = () => setIsModalVisible(false);

  const handleModalSubmit = () => {
    if (!modalCategory) {
      message.error("กรุณากรอกชื่อประเภท");
      return;
    }
    if (scoreCategories.includes(modalCategory)) {
      message.error("ประเภทนี้มีอยู่แล้ว");
      return;
    }

    setScoreCategories(prev => [...prev, modalCategory]);
    setCategoryFullScores(prev => ({ ...prev, [modalCategory]: modalFullScore }));
    setIsModalVisible(false);
    setSelectedCategory(modalCategory);
    setModalCategory("");
    setModalFullScore(0);
  };

  // --- Submit Category ---
  const handleSubmitCategory = async () => {
    setSaving(true);
    try {
      const payload = students
        .filter(s => Array.isArray(s.Scores) && s.Scores.some(sc => sc.List === selectedCategory))
        .map(s => {
          const sc = Array.isArray(s.Scores)
            ? s.Scores.find(sc => sc.List === selectedCategory)
            : undefined;

          if (!sc) return null;

          return {
            ID: s.ID,
            StudentID: s.StudentID,
            StudentName: s.StudentName,
            SubjectID: s.SubjectID,
            Score: sc.Score,
            FullScore: categoryFullScores[selectedCategory] ?? sc.FullScore,
            List: sc.List,
            Scores: s.Scores,
          } as ScoreInterface;
        })
        .filter((item): item is ScoreInterface => item !== null);

      await createScoreStudent(payload);

      message.success(`บันทึกคะแนน ${selectedCategory} เรียบร้อย`);
      setSubmittedCategories(prev => [...prev, selectedCategory]);
      setSelectedCategory("Main");
    } catch (err) {
      console.error(err);
      message.error("บันทึกคะแนนไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  // --- Columns ---
  const mainColumns: ColumnsType<ScoreInterface> = [
    { title: "ลำดับ", key: "no", width: 80, render: (_: any, __: ScoreInterface, index: number) => index + 1, align: "center" },
    { title: "รหัสนักศึกษา", dataIndex: "StudentID", key: "studentid", width: 200 },
    { title: "ชื่อนักศึกษา", dataIndex: "StudentName", key: "studentname", width: 250 },
    ...scoreCategories.map(cat => ({
      title: cat,
      key: cat,
      align: "center" as const,
      render: (_: any, record: ScoreInterface) => {
        const sc = Array.isArray(record.Scores) ? record.Scores.find(s => s.List === cat) : undefined;
        return sc ? sc.Score : "-";
      },
    })),
  ];

  const categoryColumns: ColumnsType<ScoreInterface> = [
    ...mainColumns.slice(0, 3),
    {
      title: selectedCategory,
      key: selectedCategory,
      align: "center" as const,
      render: (_: any, record: ScoreInterface) => {
        const sc = Array.isArray(record.Scores) ? record.Scores.find(s => s.List === selectedCategory) : undefined;
        const isSubmitted = submittedCategories.includes(selectedCategory);

        return (
          <InputNumber
            defaultValue={sc ? sc.Score : 0}   // ใช้ defaultValue แทน value
            disabled={isSubmitted}
            onChange={(newValue) => {
              const newScore = Number(newValue ?? 0);
              setStudents(prev =>
                prev.map(s => {
                  if (s.StudentID === record.StudentID) {
                    if (!Array.isArray(s.Scores)) s.Scores = [];
                    const existing = s.Scores.find(sc => sc.List === selectedCategory);
                    if (existing) {
                      existing.Score = newScore;
                      existing.FullScore = categoryFullScores[selectedCategory] ?? existing.FullScore;
                    } else {
                      s.Scores.push({
                        Score: newScore,
                        FullScore: categoryFullScores[selectedCategory] ?? 0,
                        List: selectedCategory,
                      });
                    }
                  }
                  return s;
                })
              );
            }}
            style={{ width: 120, textAlign: "center" }}
            min={0}
            max={categoryFullScores[selectedCategory] ?? 100}
          />
        );
      }
    },
  ];

  const displayedColumns =
    selectedCategory === "Main" ? mainColumns : categoryColumns;

  return (
    <div >
      <Button onClick={onBack} style={{ marginBottom: 16 }}>BACK</Button>
      <Title style={{ fontSize: 30 }} level={3}>{subjectCode} - {subjectName}</Title>

      <Divider />

      {/* --- Search --- */}
      <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <div style={{ backgroundColor: "#2e236c", padding: "10px 8px", borderRadius: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Text style={{ color: "white", fontSize: 14 }}>ค้นหาด้วยรหัสนักศึกษา</Text>
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

      {/* --- Controls --- */}
      <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Button type="primary" onClick={showModal}>เพิ่มประเภทคะแนนใหม่</Button>
        </Col>
        <Col>
          <Select value={selectedCategory} style={{ width: 200 }} onChange={setSelectedCategory}>
            <Option value="Main">หน้าหลัก</Option>
            {scoreCategories.map(cat => <Option key={cat} value={cat}>{cat}</Option>)}
          </Select>
        </Col>
        {selectedCategory !== "Main" && !submittedCategories.includes(selectedCategory) && (
          <Col>
            <Button type="primary" onClick={handleSubmitCategory} loading={saving}>
              Submit {selectedCategory}
            </Button>
          </Col>
        )}
      </Row>

      {/* --- Modal --- */}
      <Modal
        title="เพิ่มประเภทคะแนน"
        visible={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        okText="เพิ่ม"
        cancelText="ยกเลิก"
      >
        <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Text>ชื่อประเภท</Text>
            <Input
              value={modalCategory}
              onChange={(e) => setModalCategory(e.target.value)}
              placeholder="เช่น Quiz, Midterm"
            />
          </Col>
          <Col span={12}>
            <Text>คะแนนเต็ม (%)</Text>
            <Input
              type="number"
              value={modalFullScore}
              onChange={(e) => setModalFullScore(Number(e.target.value))}
              placeholder="100"
            />
          </Col>
        </Row>
      </Modal>

      {/* --- Table --- */}
      <Table
        bordered
        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)", borderRadius: 18, overflow: "hidden" }}
        dataSource={filteredStudents}
        columns={displayedColumns}
        rowKey="StudentID"
        loading={loading}
        pagination={false}
        components={{
          header: {
            cell: (props: any) => (
              <th {...props} style={{ ...props.style, textAlign: "center" }} />
            ),
          },
          body: {
            cell: (props: any) => (
              <td {...props} style={{ ...props.style, paddingTop: 15, paddingBottom: 15 }} />
            ),
          },
        }}
      />
    </div>
  );
};

export default StudentScorePage;