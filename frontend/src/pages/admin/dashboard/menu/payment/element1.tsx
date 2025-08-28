import React, { useState } from 'react';
import { Table, Cascader, Button, Input } from 'antd';
import type { CascaderProps, TableColumnsType } from 'antd';
import Check from './check1'; // import modal
import './payment.css';

interface Option { value: string; label: string; children?: Option[] }
interface DataType { 
  key: string;
  StudentID: string;
  no: number; 
  fullName: string;
  receiptNo: string; 
  paymentDate: string;
  year: string;   // ปีการศึกษา
  term: string;   // เทอม
}

const currentYear = 2568;
const numYears = 3;

// สร้าง options สำหรับ Cascader ปี/เทอม
const options: Option[] = Array.from({ length: numYears }, (_, i) => {
  const year = (currentYear - i).toString();
  return { 
    value: year, 
    label: `${year}`, 
    children: [
      { value: '1', label: '1' }, 
      { value: '2', label: '2' }, 
      { value: '3', label: '3' }
    ] 
  };
});

// ตัวอย่างข้อมูล
const data: DataType[] = [
  { key: '1', StudentID: 'B6630652', no: 1, fullName: 'นาย ก ข', receiptNo: '1234567890', paymentDate: '01/09/2566', year: '2568', term: '1' },
  { key: '2', StudentID: 'B6630653', no: 2, fullName: 'นางสาว ค ง', receiptNo: '0987654321', paymentDate: '02/09/2566', year: '2568', term: '2' },
  { key: '3', StudentID: 'B6630654', no: 3, fullName: 'นาย จ ฉ', receiptNo: '1122334455', paymentDate: '03/09/2566', year: '2567', term: '1' },
];

const contentStyle: React.CSSProperties = { background: '#f5f5f5', padding: 24, minHeight: 400, color: '#333', overflowY: 'auto' };

const Element1: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DataType | null>(null);
  const [verifiedKeys, setVerifiedKeys] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [selectedYearTerm, setSelectedYearTerm] = useState<string[]>([]);

  const handleVerify = (record: DataType) => {
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

  // กรองข้อมูลตาม search text และปี/เทอมที่เลือก
  const filteredData = data.filter(item => {
    const matchesSearch = item.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
                          item.StudentID.toLowerCase().includes(searchText.toLowerCase()) ||
                          item.receiptNo.includes(searchText);

    const matchesYearTerm = selectedYearTerm.length === 0 || 
                            (item.year === selectedYearTerm[0] && item.term === selectedYearTerm[1]);

    return matchesSearch && matchesYearTerm;
  });

  const columns: TableColumnsType<DataType> = [
    { title: 'ลำดับ', dataIndex: 'no', key: 'no' },
    { title: 'รหัสนักศึกษา', dataIndex: 'StudentID', key: 'StudentID' },
    { title: 'ชื่อ-สกุล', dataIndex: 'fullName', key: 'fullName' },
    { title: 'เลขที่ใบเสร็จรับเงิน', dataIndex: 'receiptNo', key: 'receiptNo' },
    { title: 'วันที่ชำระเงิน', dataIndex: 'paymentDate', key: 'paymentDate' },
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
    <div style={contentStyle}>
      {/* Row ของ Cascader + Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Cascader
          options={options}
          onChange={(value) => setSelectedYearTerm(value)}
          placeholder="เลือกปีการศึกษา/เทอม"
        />

        <Input
          placeholder="ค้นหา ชื่อ รหัสนักศึกษาหรือเลขที่ใบเสร็จ"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300, height: 50, fontSize: 14 }}
        />
      </div>

      <Table<DataType>
        columns={columns}
        dataSource={filteredData}
        pagination={false}
        style={{ marginTop: 12 }}
        bordered
        locale={{ emptyText: 'ไม่มีข้อมูลการชำระเงิน' }}
      />

      {/* เรียกใช้งาน Check modal */}
      <Check visible={isModalVisible} record={selectedRecord} onOk={handleOk} onCancel={handleCancel} />
    </div>
  );
};

export default Element1;
