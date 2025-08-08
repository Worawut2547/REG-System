import React from 'react';
import { Layout, Table, Cascader, Upload, Button, message } from 'antd';
import type { CascaderProps, TableColumnsType, UploadProps } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
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
      { value: '1', label: '1' },
      { value: '2', label: '2' },
      { value: '3', label: '3' },
    ],
  };
});

const onChange: CascaderProps<Option>['onChange'] = (value) => {
  console.log('เลือกปี/เทอม:', value);
};

interface DataType {
  key: string;
  courseCode: string;
  courseName: string;
  credit: number;
  amount: number;
}

const columns: TableColumnsType<DataType> = [
  {
    title: 'รหัสวิชา',
    dataIndex: 'courseCode',
    key: 'courseCode',
  },
  {
    title: 'ชื่อรายวิชา',
    dataIndex: 'courseName',
    key: 'courseName',
  },
  {
    title: 'หน่วยกิต',
    dataIndex: 'credit',
    key: 'credit',
  },
  {
    title: 'จำนวนเงิน',
    dataIndex: 'amount',
    key: 'amount',
  },
];

const data: DataType[] = [];

const summary = () => (
  <Table.Summary.Row>
    <Table.Summary.Cell index={0} colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold' }}>
      รวม
    </Table.Summary.Cell>
    <Table.Summary.Cell index={2} style={{ fontWeight: 'bold' }}>
      0
    </Table.Summary.Cell>
    <Table.Summary.Cell index={3} style={{ fontWeight: 'bold' }}>
      0
    </Table.Summary.Cell>
  </Table.Summary.Row>
);

const uploadProps: UploadProps = {
  beforeUpload: (file) => false, // ไม่อัปโหลดจริง
  onChange(info) {
    if (info.fileList.length > 0) {
      message.success(`อัปโหลดไฟล์ ${info.file.name} สำเร็จ`);
    }
  },
  maxCount: 1,
};

const Payment: React.FC = () => {
  return (
    <Layout style={wrapperStyle}>
      <Header style={headerStyle}>ใบแจ้งยอดชำระ</Header>
      <Content style={contentStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 18,
                color: '#000',
                paddingBottom: 4,
                whiteSpace: 'nowrap',
              }}
            >
              ปีการศึกษา
            </div>
            <Cascader defaultValue={['2568', '1']} options={options} onChange={onChange} />
            <div
              style={{
                fontWeight: 'bold',
                fontSize: 18,
                color: '#cf1322',
                paddingBottom: 4,
                whiteSpace: 'nowrap',
              }}
            >
              มียอดเงินค้างชำระ
            </div>
          </div>
        </div>

        <Table<DataType>
          columns={columns}
          dataSource={data}
          pagination={false}
          summary={summary}
          style={{ marginTop: 12 }}
          bordered
        />

        {/* ช่องทางการชำระเงิน กับ ปุ่มอัปโหลด ใบเสร็จ อยู่แถวเดียวกัน */}
        <div
          style={{
            marginTop: 32,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: 16, maxWidth: '60%' }}>
            กรุณาชำระเงินภายในวันที่ 30 กันยายน 2568
            <br />
            ช่องทางการชำระเงิน
            <br />
            ธนาคารกสิกรไทย เลขที่บัญชี 12356789
            <br />
            ชื่อบัญชี บริษัทจัดหาเงินไม่ จำกัด
          </div>

          <div>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>อัปโหลดใบเสร็จโอนเงิน</Button>
            </Upload>
          </div>
        </div>
      </Content>
      <Footer style={footerStyle}>Footer © 2025</Footer>
    </Layout>
  );
};

export default Payment;
