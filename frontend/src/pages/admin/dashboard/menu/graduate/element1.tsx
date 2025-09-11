import React, { useEffect, useState } from 'react';
import { Layout, Table, Button, Input, message, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import CheckGraduate from './check';
import './graduate.css';
import type { GraduationInterface } from '../../../../../interfaces/Graduation';
import { getAllGraduations, updateGraduation } from '../../../../../services/https/graduation/graduation';

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAllGraduations();

      // map backend field ให้ตรงกับ GraduationInterface
      const mappedData: GraduationInterface[] = res.map(item => ({
        id: item.id,
        StudentID: item.StudentID,
        fullName: item.fullName,
        curriculum: item.curriculum,
        totalCredits: item.totalCredits ?? 0,
        GPAX: item.GPAX,
        statusStudent: item.statusStudent,
        reason: item.reason ?? '',
        Date: item.Date ? new Date(item.Date) : undefined,
      }));

      setData(mappedData);
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
      await updateGraduation(selectedRecord.id, status, reason);
      message.success('อัปเดตสถานะสำเร็จ');
      setIsModalVisible(false);
      setSelectedRecord(null);

      // update state ของ record ล่าสุดทันทีโดยไม่ต้อง fetch ใหม่
      setData(prev =>
        prev.map(item =>
          item.id === selectedRecord?.id
            ? {
              ...item,
              statusStudent: status === '30' ? 'อนุมัติสำเร็จการศึกษา' : 'ไม่อนุมัติให้สำเร็จการศึกษา',
              reason: reason ?? '',
              isVerified: true, // ✅ เพิ่มบรรทัดนี้
            }
            : item
        )
      );

    } catch (err) {
      message.error('ไม่สามารถอัปเดตสถานะได้');
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedRecord(null);
  };

  // filter และ sort ให้แถวตรวจสอบแล้วอยู่ด้านล่าง
  const filteredData = data
    .filter(item =>
      item.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.StudentID.toLowerCase().includes(searchText.toLowerCase())
    )
    .sort((a, b) => {
      const aChecked = a.statusStudent !== 'แจ้งจบการศึกษา';
      const bChecked = b.statusStudent !== 'แจ้งจบการศึกษา';
      if (aChecked === bChecked) return 0;
      return aChecked ? 1 : -1;
    });

  const columns: TableColumnsType<GraduationInterface> = [
    { title: 'ลำดับ', key: 'index', render: (_, __, index) => index + 1, width: 60 },
    { title: 'รหัสนักศึกษา', dataIndex: 'StudentID', key: 'StudentID' },
    { title: 'ชื่อ-สกุล', dataIndex: 'fullName', key: 'fullName' },
    { title: 'หลักสูตร', dataIndex: 'curriculum', key: 'curriculum' },
    { title: 'หน่วยกิตรวม', dataIndex: 'totalCredits', key: 'totalCredits' },
    { title: 'GPA', dataIndex: 'GPAX', key: 'GPAX' },
    { title: 'สถานะ', dataIndex: 'statusStudent', key: 'statusStudent' },
    { title: 'เหตุผลปฏิเสธ', dataIndex: 'reason', key: 'reason' },
    {
      title: 'ตรวจสอบ',
      key: 'verify',
      render: (_, record) => {
        // หา element ล่าสุดของนักศึกษาคนนี้
        const latestGraduation = data
          .filter(d => d.StudentID === record.StudentID)
          .sort((a, b) => Number(b.id) - Number(a.id))[0]; // เอา id ล่าสุด

        const isLatest = latestGraduation ? latestGraduation.id === record.id : false;

        if (isLatest && record.statusStudent === 'แจ้งจบการศึกษา') {
          return <Button type="primary" onClick={() => handleVerify(record)}>ตรวจสอบ</Button>;
        } else {
          return <Tag color="green">ตรวจสอบแล้ว</Tag>;
        }
      },
    }

  ];

  return (
    <Content style={contentStyle}>
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="ค้นหา ชื่อหรือรหัสนักศึกษา"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
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