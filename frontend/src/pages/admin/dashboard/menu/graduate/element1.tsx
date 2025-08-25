import React, { useState } from 'react';
import { Layout, Table, Button, Input } from 'antd';
import type { TableColumnsType } from 'antd';
import CheckGraduate from './check';
import './graduate.css';
const { Content } = Layout;

const contentStyle: React.CSSProperties = {
  background: '#f5f5f5',
  padding: 24,
  minHeight: 400,
  color: '#333',
  overflowY: 'auto',
};

interface GraduateData {
  key: string;
  StudentID: string;
  no: number;
  fullName: string;
  curriculum: string;
  creditCompleted: number;
  gpax: number;
}

const data: GraduateData[] = [
  { key: '1', StudentID: 'B6630652', no: 1, fullName: 'สมชาย ใจดี', curriculum: 'วิทยาการคอมพิวเตอร์', creditCompleted: 120, gpax: 3.50 },
  { key: '2', StudentID: 'B6630653', no: 2, fullName: 'สมหญิง แสนดี', curriculum: 'วิทยาการคอมพิวเตอร์', creditCompleted: 118, gpax: 3.45 },
];

const Element1: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<GraduateData | null>(null);
  const [searchText, setSearchText] = useState('');
  const [verifiedKeys, setVerifiedKeys] = useState<Set<string>>(new Set()); // เก็บ key ของ record ที่ตรวจสอบแล้ว

  const handleVerify = (record: GraduateData) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    if (selectedRecord) {
      setVerifiedKeys(prev => new Set(prev).add(selectedRecord.key));
    }
    setIsModalVisible(false);
    setSelectedRecord(null);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedRecord(null);
  };

  const filteredData = data.filter(item =>
    item.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
    item.StudentID.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: TableColumnsType<GraduateData> = [
    { title: 'ลำดับ', dataIndex: 'no', key: 'no' },
    { title: 'รหัสนักศึกษา', dataIndex: 'StudentID', key: 'StudentID' },
    { title: 'ชื่อ-สกุล', dataIndex: 'fullName', key: 'fullName' },
    { title: 'โครงสร้างหลักสูตร', dataIndex: 'curriculum', key: 'curriculum' },
    { title: 'หน่วยกิตที่ผ่าน', dataIndex: 'creditCompleted', key: 'creditCompleted' },
    { title: 'GPAX', dataIndex: 'gpax', key: 'gpax' },
    {
      title: 'ตรวจสอบ',
      key: 'verify',
      render: (_, record) => {
        const isVerified = verifiedKeys.has(record.key);
        return (
          <Button
            type={isVerified ? 'default' : 'primary'}
            style={isVerified ? { backgroundColor: 'yellow', color: '#000' } : {}}
            onClick={() => !isVerified && handleVerify(record)}
          >
            {isVerified ? 'ตรวจสอบแล้ว' : 'ตรวจสอบ'}
          </Button>
        );
      },
    },
  ];

  return (
    <Content style={contentStyle}>
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="ค้นหา ชื่อหรือรหัสนักศึกษา"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 , height: 50 , fontSize: 14}}
        />
      </div>

      <Table<GraduateData>
        columns={columns}
        dataSource={filteredData}
        pagination={false}
        style={{ marginTop: 12 }}
        bordered
        locale={{ emptyText: 'ไม่มีข้อมูลผู้แจ้งจบ' }}
      />

      <CheckGraduate visible={isModalVisible} record={selectedRecord} onOk={handleOk} onCancel={handleCancel} />
    </Content>
  );
};

export default Element1;
