import React, { useEffect, useState } from 'react';
import { Table, Cascader, Button, Input, message, Spin, Modal } from 'antd';
import type { TableColumnsType } from 'antd';
import { getAllBills, approveBill } from '../../../../../services/https/bill/bill';
import type { DataType } from '../../../../../services/https/bill/bill';
import { apiUrl } from '../../../../../services/api';

const BillPage: React.FC = () => {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DataType | null>(null);
  const [verifiedKeys, setVerifiedKeys] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [selectedYearTerm, setSelectedYearTerm] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bills = await getAllBills();
        const mappedData: DataType[] = bills.map((bill: any, idx: number) => ({
          key: String(bill.id),
          StudentID: bill.student_id ?? '-',
          no: idx + 1,
          fullName: bill.full_name ?? '-',
          receiptNo: '-',
          paymentDate: bill.date ?? '-',
          year: String(bill.year ?? '-'),
          term: String(bill.term ?? '-'),
          totalPrice: bill.total_price ?? 0,
          filePath: bill.file_path && !bill.file_path.includes('C:\\')
            ? `${apiUrl}/uploads/${bill.file_path}`
            : undefined,
          status: bill.status ?? 'ค้างชำระ',
        }));

        setData(mappedData);

        // กำหนด verifiedKeys ตาม status
        const verified = new Set(
          mappedData.filter(d => d.status === 'ชำระแล้ว').map(d => d.key)
        );
        setVerifiedKeys(verified);

      } catch (err) {
        message.error('ไม่สามารถโหลดข้อมูลบิลนักศึกษาได้');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


  const handleVerify = (record: DataType) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  const handleApprove = async () => {
    if (selectedRecord) {
      try {
        await approveBill(String(selectedRecord.key));
        message.success('อนุมัติใบเสร็จเรียบร้อยแล้ว');

        setData(prev =>
          prev.map(d => d.key === selectedRecord.key ? { ...d, status: 'ชำระแล้ว' } : d)
        );
        setVerifiedKeys(prev => new Set(prev).add(selectedRecord.key));
      } catch (err) {
        message.error('ไม่สามารถอนุมัติใบเสร็จได้');
      }
    }
    setIsModalVisible(false);
    setSelectedRecord(null);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedRecord(null);
  };

  // สร้าง options สำหรับ Cascader ปี/เทอม
  const yearOptions = Array.from(new Set(data.map(d => d.year))).sort().reverse();
  const options = yearOptions.map(year => {
    const terms = Array.from(new Set(data.filter(d => d.year === year).map(d => d.term))).sort();
    return {
      value: year,
      label: year,
      children: terms.map(term => ({ value: term, label: term })),
    };
  });

  // กรองข้อมูลตาม search และ Year/Term
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
    { title: 'วันที่ชำระเงิน', dataIndex: 'paymentDate', key: 'paymentDate' },
    {
      title: 'จำนวนเงินรวม',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (value: number) => value.toLocaleString('th-TH', { style: 'currency', currency: 'THB' }),
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = '#f50';
        if (status === 'รอตรวจสอบ') color = '#faad14';
        if (status === 'ชำระแล้ว') color = '#52c41a';
        return <span style={{ color }}>{status}</span>;
      },
    },
    {
      title: 'ใบเสร็จ',
      key: 'receipt',
      render: (_, record) => (
        record.filePath ? (
          <Button type="link" onClick={() => window.open(record.filePath, "_blank")}>
            ดูใบเสร็จ
          </Button>
        ) : '-'
      ),
    },
    {
      title: 'ตรวจสอบ',
      key: 'verify',
      render: (_, record) => {
        const isVerified = verifiedKeys.has(record.key); // ถ้า verified ให้สีเหลือง
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
    }
  ];

  return (
    <div style={{ background: '#f5f5f5', padding: 24, minHeight: 400 }}>
      {loading ? <Spin /> : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Cascader
              options={options}
              onChange={(value: (string | number)[]) =>
                setSelectedYearTerm(value.filter(v => v != null).map(String))
              }
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
            bordered
            locale={{ emptyText: 'ไม่มีข้อมูลการชำระเงิน' }}
          />

          <Modal
            visible={isModalVisible}
            title="ตรวจสอบใบเสร็จ"
            onOk={handleApprove}
            onCancel={handleCancel}
            width={800}
            okText="อนุมัติ"
          >
            {selectedRecord?.filePath ? (
              <iframe
                src={selectedRecord.filePath ?? undefined}
                title="Preview Bill"
                width="100%"
                height="500px"
                style={{ border: 'none' }}
              />
            ) : <p>ไม่มีใบเสร็จสำหรับบิลนี้ หรือเป็นไฟล์บนเครื่อง local</p>}
          </Modal>
        </>
      )}
    </div>
  );
};

export default BillPage;
