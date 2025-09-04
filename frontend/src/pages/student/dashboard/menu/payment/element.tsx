import React, { useEffect, useState } from 'react';
import { Layout, Table, Cascader, Upload, Button, message, Spin } from 'antd';
import type { CascaderProps, TableColumnsType, UploadProps } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import './payment.css';

const { Content } = Layout;

interface Option {
  value: string;
  label: string;
  children?: Option[];
}

interface DataType {
  key: string;
  SubjectID: string;
  SubjectName: string;
  credit: number;
  amount: number;
}

interface StudentData {
  fullname: string;
  studentId: string;
  curriculum: string;
  passedCredit: number;
  gpax: number;
}

// ปีการศึกษา + เทอม
const currentYear = 2568;
const numYears = 3;
const options: Option[] = Array.from({ length: numYears }, (_, i) => {
  const year = (currentYear - i).toString();
  return {
    value: year,
    label: year,
    children: [
      { value: '1', label: '1' },
      { value: '2', label: '2' },
      { value: '3', label: '3' },
    ],
  };
});

// ข้อมูล mock
const courses: Record<string, Record<string, DataType[]>> = {
  '2568': {
    '1': [
      { key: '1', SubjectID: 'CS101', SubjectName: 'โปรแกรมมิงเบื้องต้น', credit: 3, amount: 1500 },
      { key: '2', SubjectID: 'CS102', SubjectName: 'โครงสร้างข้อมูล', credit: 4, amount: 2000 },
    ],
    '2': [
      { key: '3', SubjectID: 'CS201', SubjectName: 'ฐานข้อมูล', credit: 3, amount: 1800 },
      { key: '4', SubjectID: 'CS202', SubjectName: 'เครือข่ายคอมพิวเตอร์', credit: 3, amount: 1800 },
    ],
    '3': [
      { key: '5', SubjectID: 'CS301', SubjectName: 'วิศวกรรมซอฟต์แวร์', credit: 3, amount: 2000 },
    ],
  },
  '2567': {
    '1': [
      { key: '6', SubjectID: 'CS101', SubjectName: 'โปรแกรมมิงเบื้องต้น', credit: 3, amount: 1500 },
      { key: '7', SubjectID: 'CS102', SubjectName: 'โครงสร้างข้อมูล', credit: 4, amount: 2000 },
    ],
  },
};

const columns: TableColumnsType<DataType> = [
  { title: 'รหัสวิชา', dataIndex: 'SubjectID', key: 'รหัสวิชา' },
  { title: 'ชื่อรายวิชา', dataIndex: 'SubjectName', key: 'ชื่อรายวิชา' },
  { title: 'หน่วยกิตรายวิชา', dataIndex: 'credit', key: 'หน่วยกิตรายวิชา' },
  { title: 'จำนวนเงิน', dataIndex: 'amount', key: 'จำนวนเงิน' },
];

const uploadProps: UploadProps = {
  beforeUpload: () => false,
  onChange(info) {
    if (info.fileList.length > 0) {
      message.success(`อัปโหลดไฟล์ ${info.file.name} สำเร็จ`);
    }
  },
  maxCount: 1,
};

const mockStudent: StudentData = {
  fullname: 'สมชาย ใจดี',
  studentId: 'B6630652',
  curriculum: 'วิทยาการคอมพิวเตอร์',
  passedCredit: 120,
  gpax: 3.5,
};

// แปลงตัวเลขเป็นอารบิก
const toArabicNumber = (num: number | string) => {
  return String(num).replace(/[๐-๙]/g, d => '0123456789'[parseInt(d, 10)]);
};

const Element: React.FC = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('2568');
  const [selectedTerm, setSelectedTerm] = useState<string>('1');

  useEffect(() => {
    async function fetchStatus() {
      try {
        setLoading(true);
        const result = { status: 'รอชำระเงิน' };
        setStatus(result.status);
      } catch (err) {
        console.error(err);
        setStatus('ไม่สามารถโหลดสถานะได้');
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
    setStudent(mockStudent);
  }, []);

  const handleCascaderChange: CascaderProps<Option>['onChange'] = (value) => {
    if (value && value.length === 2) {
      setSelectedYear(value[0]);
      setSelectedTerm(value[1]);
    }
  };

  const termCourses = courses[selectedYear]?.[selectedTerm] || [];
  const totalCredit = termCourses.reduce((sum, c) => sum + c.credit, 0);
  const totalAmount = termCourses.reduce((sum, c) => sum + c.amount, 0);

  const loadFont = async () => {
    const response = await fetch('/fonts/THSarabunIT๙.ttf');
    if (!response.ok) throw new Error('ไม่สามารถโหลดฟอนต์ได้');
    const buffer = await response.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    return btoa(binary);
  };

  const handleOpenPDF = async () => {
    if (!student) return;

    try {
      const doc = new jsPDF();

      // โหลดฟอนต์
      const fontBase64 = await loadFont();
      doc.addFileToVFS('THSarabunIT๙.ttf', fontBase64);
      doc.addFont('THSarabunIT๙.ttf', 'THSarabunIT', 'normal');
      doc.setFont('THSarabunIT');

      // หัวเรื่อง
      doc.setFontSize(16);
      doc.text('ใบแจ้งยอดชำระ', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`นักศึกษา: ${student.fullname} (${student.studentId})`, 14, 50);
      doc.text(`หลักสูตร: ${student.curriculum}`, 14, 58);
      doc.text(`ปีการศึกษา: ${toArabicNumber(selectedYear)} เทอม: ${toArabicNumber(selectedTerm)}`, 14, 66);

      let y = 80;
      doc.text('รหัสวิชา  ชื่อวิชา                  หน่วยกิต  จำนวนเงิน', 14, y);
      y += 6;

      termCourses.forEach(c => {
        doc.text(
          `${c.SubjectID}  ${c.SubjectName}  ${toArabicNumber(c.credit)}  ${toArabicNumber(c.amount)}`,
          14,
          y
        );
        y += 6;
      });

      y += 6;
      doc.text(
        `รวมหน่วยกิต: ${toArabicNumber(totalCredit)}  รวมจำนวนเงิน: ${toArabicNumber(totalAmount)}`,
        14,
        y
      );

      // Footer
      y += 12;
      doc.text('กรุณาชำระเงินภายในวันที่ 30 กันยายน 2568', 14, y);
      y += 6;
      doc.text('ช่องทางการชำระเงิน', 14, y);
      y += 6;
      doc.text('ธนาคารกสิกรไทย เลขที่บัญชี 12356789', 14, y);
      y += 6;
      doc.text('ชื่อบัญชี บริษัทจัดหาเงินไม่ จำกัด', 14, y);

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      window.open(url);
    } catch (err) {
      console.error('PDF error:', err);
      alert('เกิดข้อผิดพลาดในการสร้าง PDF ดู console');
    }
  };

  return (
    <Content style={{ padding: '24px', background: '#f5f5f5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 18, color: '#000', paddingBottom: 4 }}>ปีการศึกษา</div>
          <Cascader defaultValue={['2568', '1']} options={options} onChange={handleCascaderChange} />
          <div style={{ fontWeight: 'bold', fontSize: 18, color: '#cf1322' }}>
            {loading ? <Spin size="small" /> : status}
          </div>
        </div>
        <Button type="primary" onClick={handleOpenPDF}>ใบแจ้งยอดชำระ</Button>
      </div>

      <Table<DataType>
        columns={columns}
        dataSource={termCourses}
        pagination={false}
        bordered
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={2}><strong>รวม</strong></Table.Summary.Cell>
            <Table.Summary.Cell index={2}><strong>{totalCredit}</strong></Table.Summary.Cell>
            <Table.Summary.Cell index={3}><strong>{totalAmount}</strong></Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', fontSize: 16, maxWidth: '60%' }}>
          กรุณาชำระเงินภายในวันที่ 30 กันยายน 2568
          <br />ช่องทางการชำระเงิน
          <br />ธนาคารกสิกรไทย เลขที่บัญชี 12356789
          <br />ชื่อบัญชี บริษัทจัดหาเงินไม่ จำกัด
        </div>
        <div>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>อัปโหลดใบเสร็จโอนเงิน</Button>
          </Upload>
        </div>
      </div>
    </Content>
  );
};

export default Element;
