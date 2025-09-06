import React, { useEffect, useState } from "react";
import { Table, Button, Input, Row, Col, Typography, Select, Modal, message, Divider } from "antd";
import { SearchOutlined, EditOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Student } from "./mockData";
import { fetchStudents } from "./mockData";
import './score.css';

const { Text } = Typography;
const { Option } = Select;

type StudentScorePageProps = {
  course: { code: string; name: string } | null;
  onBack: () => void;
  scoreTypes: string[];
  setScoreTypes: React.Dispatch<React.SetStateAction<string[]>>;
};

const StudentScorePage: React.FC<StudentScorePageProps> = ({ course, onBack, scoreTypes, setScoreTypes }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [editingData, setEditingData] = useState<Student[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState<"all" | string>("all");
  const [newTypeName, setNewTypeName] = useState<string>("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [originalStudents, setOriginalStudents] = useState<Student[]>([]);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [typesToDelete, setTypesToDelete] = useState<string[]>([]);


  useEffect(() => {
    const loadStudents = async () => {
      if (course) {
        const data = await fetchStudents(course.code);
        setStudents(data);
      }
    };
    loadStudents();
  }, [course]);

  const filteredStudents = students.filter(s =>
    s.id.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleEdit = (key: number, field: string, value: number | string) => {
    setEditingData(prev =>
      prev.map(s => s.key === key ? { ...s, [field]: Number(value) || 0 } : s)
    );
  };

  const handleSave = () => {
    setStudents(prev =>
      prev.map(s => {
        const updated = editingData.find(e => e.key === s.key);
        return updated ? updated : s;
      })
    );
    setEditMode(false);
    setEditingData([]);
  };

  const handleCancel = () => {
    setStudents(originalStudents);
    setEditMode(false);
  };

  const handleAddType = () => {
    const type = newTypeName.trim();
    if (!type) {
      message.error("กรุณากรอกชื่อประเภทคะแนน");
      return;
    }
    if (scoreTypes.includes(type)) {
      message.warning("ประเภทนี้มีอยู่แล้ว");
      return;
    }
    setScoreTypes(prev => [...prev, type]);
    setNewTypeName("");
    message.success(`เพิ่มประเภทคะแนน "${type}" เรียบร้อย`);
  };

  const handleDeleteType = (type: string) => {
    setScoreTypes(prev => prev.filter(t => t !== type));
    if (filterType === type) setFilterType("all");
    message.success(`ลบประเภท "${type}" เรียบร้อย`);
  };

  const getColumns = (): ColumnsType<Student> => {
    const cols: ColumnsType<Student> = [
      { title: "No.", dataIndex: "key", key: "no", align: "center" },
      { title: "รหัสนักศึกษา", dataIndex: "id", key: "id", align: "center" },
      { title: "ชื่อ", dataIndex: "firstName", key: "firstName", align: "center" },
      { title: "นามสกุล", dataIndex: "lastName", key: "lastName", align: "center" },
    ];

    if (filterType === "all") {
      if (scoreTypes.length === 0) {
        cols.push({ title: "Total", key: "total", align: "center", render: () => "-" });
      } else {
        scoreTypes.forEach(type => {
          cols.push({
            title: type.charAt(0).toUpperCase() + type.slice(1),
            dataIndex: type,
            key: type,
            align: "center",
            render: (_, record) => record[type] || 0
          });
        });
        cols.push({
          title: "Total",
          key: "total",
          align: "center",
          render: (_, record) =>
            scoreTypes.reduce((sum, t) => sum + (record[t] as number || 0), 0)
        });
      }
    } else if (scoreTypes.includes(filterType)) {
      const field = filterType;
      cols.push({
        title: field.charAt(0).toUpperCase() + field.slice(1),
        dataIndex: field,
        key: field,
        align: "center",
        render: (_, record) =>
          editMode ? (
            <Input
              type="number"
              value={editingData.find(d => d.key === record.key)?.[field] || 0}
              onChange={e => handleEdit(record.key, field, e.target.value)}
            />
          ) : record[field] || 0
      });
    }

    return cols;
  };

  return (
    <div style={{ padding: 24, maxWidth: 1500, margin: "auto" }}>

      <Button onClick={onBack}>BACK</Button>
      {course && (
        <div style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: "bold", fontSize: 30 }}>
            <Text style={{ fontSize: 30, fontWeight: 'bold' }}>{course.code}</Text> -
            <Text style={{ fontSize: 30, fontWeight: 'bold' }}> {course.name}</Text>
          </Text>
        </div>
      )}

      <Divider />

      <Col>
        <div style={{ backgroundColor: "#2e236c", padding: "8px 12px", borderRadius: 8, width: 345, marginBottom: 20 }}>
          <Text style={{ color: "white", marginRight: 8 }}>ค้นหาด้วยรหัสนักศึกษา</Text>
          <Input
            placeholder="Search..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 180, height: 32, fontSize: 12, backgroundColor: "white" }}
          />
        </div>
      </Col>

      <Row align="top" gutter={16}>
        <Col>
          <div style={{ backgroundColor: "#2e236c", padding: "8px 12px", borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <Text style={{ color: "white" }}>ประเภท</Text>
            <Select value={filterType} onChange={setFilterType} style={{ width: 150 }}>
              <Option value="all">All</Option>
              {scoreTypes.map(type => (
                <Option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</Option>
              ))}
            </Select>
          </div>
        </Col>
        <Col flex="auto" style={{ textAlign: "left", padding: "10px 10px", alignItems: "center" }}>
          <Button
            type="primary"
            onClick={() => setIsModalVisible(true)}
            style={{
              backgroundColor: "#f2ffbcff",
              borderColor: 'rgba(223, 228, 155, 1)',
              color: "black",
              marginRight: "16px"
            }}
          > <PlusOutlined />
            Add Types
          </Button>
          <Button
            type="default"
            danger
            onClick={() => {
              if (scoreTypes.length === 0) {
                message.info("ยังไม่มีประเภทคะแนนให้ลบ");
                return;
              }
              setIsDeleteModalVisible(true);
            }}
            style={{ backgroundColor: "#ffcccc", color: "black", borderColor: 'rgba(216, 96, 96, 1)', }}
          > <DeleteOutlined />
            Delete Types
          </Button>
        </Col>
      </Row>

      <Modal
        title="เพิ่มประเภทคะแนนใหม่"
        open={isModalVisible}
        onOk={() => {
          handleAddType();
          setIsModalVisible(false);
        }}
        onCancel={() => setIsModalVisible(false)}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
      >
        <Input
          placeholder="กรอกชื่อประเภทคะแนน"
          value={newTypeName}
          onChange={e => setNewTypeName(e.target.value)}
        />
      </Modal>

      <Modal
        title="ลบประเภทคะแนน"
        open={isDeleteModalVisible}
        onOk={() => {
          if (typesToDelete.length === 0) {
            message.warning("กรุณาเลือกประเภทที่ต้องการลบ");
            return;
          }
          setScoreTypes(prev => prev.filter(t => !typesToDelete.includes(t)));
          message.success(`ลบประเภท: ${typesToDelete.join(", ")} เรียบร้อย`);
          setTypesToDelete([]);
          setIsDeleteModalVisible(false);
        }}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setTypesToDelete([]);
        }}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
      >
        {scoreTypes.length > 0 ? (
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="เลือกประเภทคะแนนที่ต้องการลบ"
            value={typesToDelete}
            onChange={setTypesToDelete}
          >
            {scoreTypes.map(type => (
              <Option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Option>
            ))}
          </Select>
        ) : (
          <Text>ยังไม่มีประเภทคะแนนให้ลบ</Text>
        )}
      </Modal>
      
      <Col flex="auto" style={{ textAlign: "right", padding: "10px 10px", alignItems: "center" }}>
        {filterType !== "all" && !editMode && (
          <Button
            type="primary"
            onClick={() => {
              setEditMode(true);
              setEditingData(searchText ? filteredStudents : students);
            }}
            style={{
              padding: "18px 12px",
              borderRadius: "8px",
              backgroundColor: "#f2ffbcff",
              borderColor: 'rgba(223, 228, 155, 1)',
              color: "black",
            }}
          > <EditOutlined />
            Edit Score
          </Button>
        )}
      </Col>

      <Table
        dataSource={filteredStudents}
        columns={getColumns()}
        pagination={{ pageSize: 50 }}
        bordered
      />

      {editMode && (
        <div style={{ marginTop: 16, textAlign: "right" }}>
          <Button
            type="primary"
            onClick={handleSave}
            style={{ padding: "18px 12px", borderRadius: "8px" }}
            disabled={students.length === 0}
          >
            Submit All
          </Button>
          <Button
            onClick={handleCancel}
            style={{ padding: "18px 12px", borderRadius: "8px", marginLeft: 8, color: "black" }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default StudentScorePage;
