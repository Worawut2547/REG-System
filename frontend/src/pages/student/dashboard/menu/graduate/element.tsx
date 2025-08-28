import React, { useEffect, useState } from 'react';
import { Layout, Button, Spin, Result } from 'antd';
import { SmileOutlined } from '@ant-design/icons';

import './graduate.css';

const { Content } = Layout;

const contentStyle: React.CSSProperties = {
  background: '#f5f5f5',
  padding: 24,
  minHeight: 400,
  color: '#333',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const labelStyle: React.CSSProperties = {
  backgroundColor: '#2e236c',
  color: 'white',
  fontWeight: 'bold',
  padding: '12px 16px',
  textAlign: 'right',
  borderRadius: '4px',
  userSelect: 'none',
};

const valueStyle: React.CSSProperties = {
  backgroundColor: '#f0f2f5',
  padding: '12px 16px',
  borderRadius: '4px',
  minHeight: 40,
  display: 'flex',
  alignItems: 'center',
};

const gridRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '180px 1fr',
  gap: 12,
  alignItems: 'center',
};

type GraduateData = {
  fullname: string;
  studentId: string;
  courseStructure: string;
  passedCredit: number;
  gpax: number;
};

const Element: React.FC = () => {
  const [data, setData] = useState<GraduateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [graduated, setGraduated] = useState(false); // ✅ state เช็คว่ากดแจ้งจบแล้ว

  useEffect(() => {
    setTimeout(() => {
      const result = {
        Student_name: 'สมชาย ใจดี',
        Student_id: 'B6630652',
        Curriculum_id: 'วิทยาการคอมพิวเตอร์',
        PassedCredit: 120,
        GPAX: 3.5,
      };

      const mappedData: GraduateData = {
        fullname: result.Student_name,
        studentId: result.Student_id,
        courseStructure: result.Curriculum_id,
        passedCredit: result.PassedCredit,
        gpax: result.GPAX,
      };

      setData(mappedData);
      setLoading(false);
    }, 1000);
  }, []);

  const handleGraduationClick = () => {
    setGraduated(true); // เปลี่ยน state เป็น true → แสดง Result
  };

  if (loading)
    return (
      <Spin
        tip="กำลังโหลดข้อมูล..."
        style={{ margin: '100px auto', display: 'block' }}
      />
    );

  // ✅ ถ้ากดแจ้งจบแล้ว
  if (graduated) {
    return (
      <Content style={contentStyle}>
        <Result
          icon={<SmileOutlined />}
          title="🎓 แจ้งจบการศึกษาสำเร็จแล้ว!"
          extra={<Button type="primary" onClick={() => setGraduated(false)}>กลับหน้าหลัก</Button>}
        />
      </Content>
    );
  }

  // แสดงข้อมูลนักศึกษาเดิม
  return (
    <Content style={contentStyle}>
      <div style={gridRowStyle}>
        <div style={labelStyle}>ชื่อ-นามสกุล</div>
        <div style={valueStyle}>{data?.fullname}</div>
      </div>

      <div style={gridRowStyle}>
        <div style={labelStyle}>รหัสนักศึกษา</div>
        <div style={valueStyle}>{data?.studentId}</div>
      </div>

      <div style={gridRowStyle}>
        <div style={labelStyle}>โครงสร้างหลักสูตร</div>
        <div style={{ ...valueStyle, backgroundColor: '#2e236c', color: 'white' }}>
          {data?.courseStructure}
        </div>
      </div>

      <div style={gridRowStyle}>
        <div style={labelStyle}>หน่วยกิตที่ผ่าน</div>
        <div style={valueStyle}>{data?.passedCredit}</div>
      </div>

      <div style={gridRowStyle}>
        <div style={labelStyle}>GPAX ที่ได้</div>
        <div
          style={{
            ...valueStyle,
            minHeight: 'auto',
            backgroundColor: '#d9d9d9',
            fontWeight: 'bold',
          }}
        >
          {data?.gpax}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <Button type="primary" size="large" onClick={handleGraduationClick}>
          แจ้งจบการศึกษา
        </Button>
      </div>
    </Content>
  );
};

export default Element;
