import React, { useEffect, useState } from 'react';
import { Layout, Table, Cascader, Upload, Button, message, Spin } from 'antd';
import type { CascaderProps, TableColumnsType, UploadProps } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import './payment.css';
import logo from '../../../../../assets/logo.png';
import { getBillByStudentID, uploadReceipt } from '../../../../../services/https/bill/bill';

const { Content } = Layout;

type APISubject = {
  academicYear: number;
  term: number;
  subject_id: string;
  subject_name: string;
  credit: number;
  status?: string; // status ของแต่ละเทอมจาก backend
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

const toArabicNumber = (num: number | string) => {
  return String(num).replace(/[๐-๙]/g, d => '0123456789'[parseInt(d, 10)]);
};

const PaymentPage: React.FC = () => {
  const [subjects, setSubjects] = useState<APISubject[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [statusMap, setStatusMap] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const setBillID = useState<number | null>(null)[1];


  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const data: {
          id: number;
          subjects: APISubject[];
          statusMap?: { [key: string]: string };
        } = await getBillByStudentID();

        setSubjects(data.subjects || []);
        setBillID(data.id || null);

        // ✅ ใช้ statusMap จาก backend โดยตรง
        setStatusMap(data.statusMap || {});

        // เลือกปีล่าสุด และเทอมแรกของปีนั้น
        const years = Array.from(new Set(data.subjects.map(s => String(s.academicYear)))).sort().reverse();
        if (years.length > 0) setSelectedYear(years[0]);

        const terms = Array.from(
          new Set(data.subjects.filter(s => String(s.academicYear) === years[0]).map(s => String(s.term)))
        ).sort((a, b) => Number(b) - Number(a)); // เทอมใหม่สุดก่อน
        if (terms.length > 0) setSelectedTerm(terms[0]);

      } catch (err) {
        console.error('Error fetching bill data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  // Handle Cascader change
  const handleCascaderChange: CascaderProps['onChange'] = value => {
    if (value && value.length === 2) {
      setSelectedYear(String(value[0]));
      setSelectedTerm(String(value[1]));
    }
  };

  const yearOptions = Array.from(new Set(subjects.map(s => String(s.academicYear))))
    .sort((a, b) => Number(b) - Number(a)); // ปีใหม่สุดก่อน

  const cascaderOptions = yearOptions.map(year => {
    const terms = Array.from(
      new Set(subjects.filter(s => String(s.academicYear) === year).map(s => String(s.term)))
    ).sort((a, b) => Number(b) - Number(a)); // เทอมใหม่สุดก่อน
    return {
      value: year,
      label: year,
      children: terms.map(term => ({ value: term, label: term })),
    };
  });


  const termSubjects = subjects
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

  // Upload
  const uploadProps: UploadProps = {
    beforeUpload: file => {
      setSelectedFile(file as File);
      return false;
    },
    onRemove: () => setSelectedFile(null),
    maxCount: 1,
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedYear || !selectedTerm) {
      message.warning('กรุณาเลือกไฟล์และปี/เทอมก่อนอัปโหลด');
      return;
    }

    try {
      const studentID = localStorage.getItem('username');
      if (!studentID) throw new Error('ไม่พบ Student ID');

      await uploadReceipt(studentID, selectedFile, Number(selectedYear), Number(selectedTerm));

      // อัปเดต status ของเทอมที่อัปโหลด
      const key = `${selectedYear}-${selectedTerm}`;
      setStatusMap(prev => ({
        ...prev,
        [key]: 'รอตรวจสอบ',
      }));

      setSelectedFile(null);
      message.success({
        content: 'อัปโหลดใบเสร็จเรียบร้อยแล้ว',
        duration: 2,
        style: { marginTop: '20vh', fontSize: '16px' },
      });
    } catch (err) {
      console.error(err);
      message.error({
        content: 'อัปโหลดใบเสร็จไม่สำเร็จ',
        duration: 2,
        style: { marginTop: '20vh', fontSize: '16px' },
      });
    }
  };

  // Load font for PDF
  const loadFont = async () => {
    const response = await fetch('/fonts/Sarabun-Regular.ttf');
    if (!response.ok) throw new Error('โหลดฟอนต์ไม่สำเร็จ');
    const buffer = await response.arrayBuffer();
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    return btoa(binary);
  };

  // Generate PDF
  const handleOpenPDF = async () => {
    if (termSubjects.length === 0) {
      message.warning('ไม่มีข้อมูลรายวิชาให้สร้าง PDF');
      return;
    }
    const doc = new jsPDF();
    const fontBase64 = await loadFont();
    doc.addFileToVFS('Sarabun-Regular.ttf', fontBase64);
    doc.addFont('Sarabun-Regular.ttf', 'THSarabun', 'normal');
    doc.setFont('THSarabun');

    doc.addImage(logo, 'PNG', 14, 10, 30, 30);
    doc.setFontSize(16);
    doc.setFont('bold');
    doc.text('ARCANATECH UNIVERSITY', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Payment', 105, 30, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('normal');
    doc.text(`Academic Year: ${toArabicNumber(selectedYear)}    Term: ${toArabicNumber(selectedTerm)}`, 14, 50);

    let startY = 60;
    const colX = { code: 14, name: 40, credit: 140, amount: 160 };

    doc.setFont('bold');
    doc.setFillColor(230, 230, 230);
    doc.rect(14, startY - 4, 180, 8, 'F');
    doc.text('Subject Code', colX.code, startY);
    doc.text('Subject Name', colX.name, startY);
    doc.text('Credit', colX.credit, startY, { align: 'right' });
    doc.text('Amount', colX.amount, startY, { align: 'right' });

    doc.setLineWidth(0.5);
    doc.line(14, startY + 2, 194, startY + 2);

    startY += 10;
    doc.setFont('normal');
    termSubjects.forEach(item => {
      doc.text(item.SubjectID, colX.code, startY);
      doc.text(item.SubjectName, colX.name, startY);
      doc.text(toArabicNumber(item.credit), colX.credit, startY, { align: 'right' });
      doc.text(toArabicNumber(item.amount), colX.amount, startY, { align: 'right' });
      startY += 8;
    });

    startY += 4;
    doc.setFont('bold');
    doc.text(`Total Credit: ${toArabicNumber(totalCredit)}    Total Price: ${toArabicNumber(totalAmount)}`, colX.name, startY);

    startY += 6;
    doc.setLineWidth(0.5);
    doc.line(14, startY, 194, startY);

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
  };

  return (
    <Content style={{ padding: '24px', background: '#f5f5f5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 18, color: '#000', paddingBottom: 4 }}>ปีการศึกษา</div>
          <Cascader
            options={cascaderOptions}
            value={selectedYear && selectedTerm ? [selectedYear, selectedTerm] : undefined}
            onChange={handleCascaderChange}
            placeholder="เลือกปีการศึกษา / เทอม"
          />
          {loading ? (
            <Spin size="small" style={{ marginLeft: 8 }} />
          ) : (
            <div style={{
              fontWeight: 'bold',
              fontSize: 18,
              color:
                statusMap[`${selectedYear}-${selectedTerm}`] === 'รอตรวจสอบ' ? '#fa8c16' :
                  statusMap[`${selectedYear}-${selectedTerm}`] === 'ชำระแล้ว' ? '#52c41a' :
                    '#cf1322',
              marginLeft: 8,
            }}>
              {statusMap[`${selectedYear}-${selectedTerm}`] || 'ค้างชำระ'}
            </div>
          )}
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
            <Button icon={<UploadOutlined />}>เลือกไฟล์ใบเสร็จ</Button>
          </Upload>
          <Button type="primary" style={{ marginLeft: 8 }} onClick={handleUpload} disabled={!selectedFile}>
            อัปโหลดใบเสร็จ
          </Button>
        </div>
      </div>
    </Content>
  );
};

export default PaymentPage;
