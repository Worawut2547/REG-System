import React, { useEffect, useState } from 'react';
import { Layout, Table, Cascader, Upload, Button, message, Spin } from 'antd';
import type { CascaderProps, TableColumnsType, UploadProps } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import './payment.css';
import logo from '../../../../../assets/logo.png'
import { getBillByStudentID } from '../../../../../services/https/bill/bill';

const { Content } = Layout;

type APISubject = {
  academicYear: number;
  term: number;
  subject_id: string;
  subject_name: string;
  credit: number;
};

type DataType = {
  key: string;
  SubjectID: string;
  SubjectName: string;
  credit: number;
  amount: number;
};

const pricePerCredit = 800;

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


// แปลงตัวเลขเป็นอารบิก
const toArabicNumber = (num: number | string) => {
  return String(num).replace(/[๐-๙]/g, d => '0123456789'[parseInt(d, 10)]);
};

const PaymentPage: React.FC = () => {
  const [subjects, setSubjects] = useState<APISubject[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data: { subjects: APISubject[] } = await getBillByStudentID();
        setSubjects(data.subjects || []);

        // เเยกปี
        const years = Array.from(
          new Set(
            data.subjects
              .map(s => String(s.academicYear))
          )
        ).sort().reverse();
        if (years.length > 0) setSelectedYear(years[0] as string);
        const selectedYear = years[0] || "";
        setSelectedYear(selectedYear);

        // เเยกเทอม
        const terms = Array.from(
          new Set(
            data.subjects
              .filter(s => String(s.academicYear) === years[0])
              .map(s => String(s.term))
          )
        ).sort();
        if (terms.length > 0) setSelectedTerm(terms[0] as string);
        const selectedTerm = terms[0] || "";
        setSelectedTerm(selectedTerm);
      }
      catch (err) {
        console.error(err);
        setStatus('ไม่สามารถโหลดรายวิชาได้ได้');
      }
      finally {
        setLoading(false);
      }
    }
    fetchSubjects();
  }, []);

  const handleCascaderChange: CascaderProps['onChange'] = (value) => {
    if (value && value.length === 2) {
      setSelectedYear(String(value[0]));
      setSelectedTerm(String(value[1]));
    }
  };

  const yearOptions = Array.from(
    new Set(
      subjects.map(s => String(s.academicYear))
    )
  ).sort().reverse();

  const options = yearOptions.map(year => {
    const terms = Array.from(
      new Set(
        subjects.filter(s => String(s.academicYear) === year)
          .map(s => String(s.term))
      )
    ).sort();
    return {
      value: year,
      label: year,
      children: terms.map(term => ({ value: term, label: term }))
    };
  });

  // filter รายวิชาเฉพาะปี/เทอม ที่เลือก
  const termSubjects: DataType[] = subjects
    .filter(s => String(s.academicYear) === selectedYear && String(s.term) === selectedTerm)
    .map((s, idx) => ({
      key: String(idx + 1),
      SubjectID: s.subject_id,
      SubjectName: s.subject_name,
      credit: s.credit,
      amount: s.credit * pricePerCredit,
    }));

  const totalCredit = termSubjects.reduce((sum, s) => sum + s.credit, 0);
  const totalAmount = termSubjects.reduce((sum, s) => sum + s.amount, 0);

  const loadFont = async () => {
    const response = await fetch('/fonts/Sarabun-Regular.ttf');
    if (!response.ok) throw new Error('โหลดฟอนต์ไม่สำเร็จ');
    const buffer = await response.arrayBuffer();
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    return btoa(binary);
  };

  const handleOpenPDF = async () => {
    if (termSubjects.length === 0) {
      message.warning('ไม่มีข้อมูลรายวิชาให้สร้าง PDF');
      return;
    }

    const doc = new jsPDF();

    // โหลด fonts
    const fontBase64 = await loadFont();
    doc.addFileToVFS('Sarabun-Regular.ttf', fontBase64);
    doc.addFont('Sarabun-Regular.ttf', 'THSarabun', 'normal');
    doc.setFont('THSarabun');

    // โลโก้มหาวิทยาลัย
    doc.addImage(logo, 'PNG', 14, 10, 30, 30);

    // ชื่อมหาวิทยาลัย + ใบแจ้งยอดชำระ
    doc.setFontSize(16);
    doc.setFont('bold');
    doc.text('ARCANATECH UNIVERSITY', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Payment', 105, 30, { align: 'center' });

    // ข้อมูลปีการศึกษา
    doc.setFontSize(12);
    doc.setFont('normal');
    doc.text(`Academic Year: ${toArabicNumber(selectedYear)}    Term: ${toArabicNumber(selectedTerm)}`, 14, 50);

    // ตารางข้อมูล
    let startY = 60;
    const colX = { code: 14, name: 40, credit: 140, amount: 160 };

    // Header table
    doc.setFont('bold');
    doc.setFillColor(230, 230, 230); // สี background header
    doc.rect(14, startY - 4, 180, 8, 'F'); // background
    doc.text('Subject Code', colX.code, startY);
    doc.text('Subject Name', colX.name, startY);
    doc.text('Credit', colX.credit, startY, { align: 'right' });
    doc.text('Amount', colX.amount, startY, { align: 'right' });

    // เส้นใต้ header
    doc.setLineWidth(0.5);
    doc.line(14, startY + 2, 194, startY + 2);

    // รายวิชา
    startY += 10;
    doc.setFont('normal');
    termSubjects.forEach(item => {
      doc.text(item.SubjectID, colX.code, startY);
      doc.text(item.SubjectName, colX.name, startY);
      doc.text(toArabicNumber(item.credit), colX.credit, startY, { align: 'right' });
      doc.text(toArabicNumber(item.amount), colX.amount, startY, { align: 'right' });
      startY += 8;
    });

    // รวมหน่วยกิต / จำนวนเงิน
    startY += 4;
    doc.setFont('bold');
    doc.text(
      `Total Credit: ${toArabicNumber(totalCredit)}    Total Price: ${toArabicNumber(totalAmount)}`,
      colX.name,
      startY
    );

    // เส้นแบ่งก่อน footer
    startY += 6;
    doc.setLineWidth(0.5);
    doc.line(14, startY, 194, startY);

    // Footer
    startY += 6;
    doc.setFont('normal');
    doc.text('Please pay by September 30, 2025.', 14, startY);
    startY += 6;
    doc.text('Payment channels', 14, startY);
    startY += 6;
    doc.text('Kasikorn Bank, account number 12356789', 14, startY);
    startY += 6;
    doc.text('Account Name: Unlimited Financing Company', 14, startY);

    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    window.open(url);

    // ดาวน์โหลด PDF
    //doc.save(`ใบแจ้งยอดชำระ_${selectedYear}_เทอม${selectedTerm}.pdf`);
  };

  return (
    <Content style={{ padding: '24px', background: '#f5f5f5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 18, color: '#000', paddingBottom: 4 }}>ปีการศึกษา</div>
          <Cascader
            options={options}
            value={selectedYear && selectedTerm ? [selectedYear, selectedTerm] : undefined}
            onChange={handleCascaderChange}
            placeholder="เลือกปีการศึกษา / เทอม"
          />
          <div style={{ fontWeight: 'bold', fontSize: 18, color: '#cf1322' }}>
            {loading ? <Spin size="small" /> : status}
          </div>
        </div>
        <Button type="primary" onClick={handleOpenPDF}>ใบแจ้งยอดชำระ</Button>
      </div>

      <Table<DataType>
        columns={columns}
        dataSource={termSubjects}
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

export default PaymentPage;