// src/pages/dashboard/menu/register.tsx
import React from 'react';
import { Layout, Table, Cascader, Button, message } from 'antd';
import type { CascaderProps, TableColumnsType } from 'antd';
import './payment.css';

const { Header, Content, Footer } = Layout;

const wrapperStyle: React.CSSProperties = {
  borderRadius: 8,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  width: '100%',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  background: '#2e236c',
  color: 'white',
  textAlign: 'center',
  padding: 16,
  fontSize: 20,
};

const contentStyle: React.CSSProperties = {
  background: '#f5f5f5',
  padding: 24,
  minHeight: 400,
  color: '#333',
  overflowY: 'auto',
};

const footerStyle: React.CSSProperties = {
  background: '#1890ff',
  color: 'white',
  textAlign: 'center',
  padding: 12,
};

interface Option {
  value: string;
  label: string;
  children?: Option[];
}

const currentYear = 2568;
const numYears = 10;

const options: Option[] = Array.from({ length: numYears }, (_, i) => {
  const year = (currentYear - i).toString();
  return {
    value: year,
    label: `${year}`,
    children: [
      { value: '1', label: ' 1' },
      { value: '2', label: ' 2' },
      { value: '3', label: ' 3' },
    ],
  };
});

const onChange: CascaderProps<Option>['onChange'] = (value) => {
  console.log('เลือกปี/เทอม:', value);
};

interface DataType {
  key: string;
  no: number;
  fullName: string;
  receiptNo: string;
  paymentDate: string;
} 

const data: DataType[] = []; // ไม่มีข้อมูล

const handleVerify = (record: DataType) => {
  message.info(`กำลังตรวจสอบใบเสร็จของ ${record.fullName}`);
};

const columns: TableColumnsType<DataType> = [
  {
    title: 'ลำดับ',
    dataIndex: 'no',
    key: 'no',
  },
  {
    title: 'ชื่อ-สกุล',
    dataIndex: 'fullName',
    key: 'fullName',
  },
  {
    title: 'เลขที่ใบเสร็จรับเงิน',
    dataIndex: 'receiptNo',
    key: 'receiptNo',
  },
  {
    title: 'วันที่ชำระเงิน',
    dataIndex: 'paymentDate',
    key: 'paymentDate',
  },
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

const Payment: React.FC = () => {
  return (
    <Layout style={wrapperStyle}>
      <Header style={headerStyle}>ใบแจ้งยอดชำระ</Header>
      <Content style={contentStyle}>
        <div
          style={{
            fontWeight: '600',
            fontSize: 18,
            color: '#000',
            marginBottom: 8,
            display: 'inline-block',
            paddingBottom: 4,
          }}
        >
          ปีการศึกษา
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <Cascader defaultValue={['เลือกปีการศึกษา']} options={options} onChange={onChange} />
        </div>

        <Table<DataType>
          columns={columns}
          dataSource={data}
          pagination={false}
          style={{ marginTop: 12 }}
          bordered
          locale={{ emptyText: 'ไม่มีข้อมูลการชำระเงิน' }}
        />
      </Content>
      <Footer style={footerStyle}>Footer © 2025</Footer>
    </Layout>
  );
};

export default Payment;
