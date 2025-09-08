import React, { useEffect, useState } from 'react';
import { Layout, Table, Button, Input, message } from 'antd';
import type { TableColumnsType } from 'antd';
import CheckGraduate from './check';
import './graduate.css';
import type { GraduationInterface } from '../../../../../interfaces/Graduation';
import { getAllGraduations, updateGraduations } from '../../../../../services/https/graduation/graduation';

const { Content } = Layout;

const contentStyle: React.CSSProperties = {
  background: '#f5f5f5',
  padding: 24,
  minHeight: 400,
  color: '#333',
  overflowY: 'auto',
};

const Element1: React.FC = () => {
  const [data, setData] = useState<GraduationInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<GraduationInterface | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // โหลดข้อมูลทั้งหมด
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAllGraduations();
      setData(res);
    } catch (err) {
      message.error('ไม่สามารถดึงข้อมูลผู้แจ้งจบได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = (record: GraduationInterface) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  const handleOk = async (status: string, reason?: string) => {
  if (!selectedRecord) return;

  try {
    await updateGraduations(selectedRecord.id, {
      GraduationID: selectedRecord.id,
      StatusStudent: status,
      RejectReason: reason,
    });
    message.success('อัปเดตสถานะสำเร็จ');
    setIsModalVisible(false);
    setSelectedRecord(null);
    fetchData(); // refresh table
  } catch (err) {
    message.error('ไม่สามารถอัปเดตสถานะได้');
  }
};


  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedRecord(null);
  };

  const filteredData = data.filter(item =>
    item.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
    item.StudentID.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: TableColumnsType<GraduationInterface> = [
    { title: 'รหัสนักศึกษา', dataIndex: 'StudentID', key: 'StudentID' },
    { title: 'ชื่อ-สกุล', dataIndex: 'fullName', key: 'fullName' },
    { title: 'โครงสร้างหลักสูตร', dataIndex: 'curriculum', key: 'curriculum' },
    { title: 'สถานะ', dataIndex: 'statusStudent', key: 'statusStudent' },
    { title: 'เหตุผลปฏิเสธ', dataIndex: 'reason', key: 'reason' },
    {
      title: 'ตรวจสอบ',
      key: 'verify',
      render: (_, record) => (
        <Button type="primary" onClick={() => handleVerify(record)}>
          ตรวจสอบ
        </Button>
      ),
    },
  ];

  return (
    <Content style={contentStyle}>
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="ค้นหา ชื่อหรือรหัสนักศึกษา"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300, height: 50, fontSize: 14 }}
        />
      </div>

      <Table<GraduationInterface>
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={false}
        rowKey="id"
        style={{ marginTop: 12 }}
        bordered
        locale={{ emptyText: 'ไม่มีข้อมูลผู้แจ้งจบ' }}
      />

      <CheckGraduate
        visible={isModalVisible}
        record={selectedRecord}
        onOk={handleOk}
        onCancel={handleCancel}
      />
    </Content>
  );
};

export default Element1;
