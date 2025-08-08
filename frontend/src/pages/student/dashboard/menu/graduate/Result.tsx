// src/pages/dashboard/menu/register.tsx
import React from 'react';
import { Layout, Button } from 'antd';
import './graduate.css';
import './Result.css'; // Assuming you have a CSS file for Result styles

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
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const footerStyle: React.CSSProperties = {
  background: '#2e236c',
  color: 'white',
  textAlign: 'center',
  padding: 12,
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

const failTextStyle: React.CSSProperties = {
  color: 'red',
  fontWeight: 'bold',
  fontSize: 20,
};

const gridRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '180px 1fr',
  gap: 12,
  alignItems: 'center',
};

const Grade: React.FC = () => {
  const handleGraduationClick = () => {
    alert('แจ้งจบการศึกษาเรียบร้อย');
  };

  return (
    <Layout style={wrapperStyle}>
      <Header style={headerStyle}>แจ้งจบการศึกษา</Header>
      <Content style={contentStyle}>
        <div style={gridRowStyle}>
          <div style={labelStyle}>โครงสร้างหลักสูตร</div>
          <div style={{ ...valueStyle, backgroundColor: '#2e236c', color: 'white' }}>
            {/* Course structure value here */}
          </div>
        </div>


        <div style={gridRowStyle}>
          <div style={labelStyle}>ผลการอนุมัติ</div>
            <div style={{ ...valueStyle, justifyContent: 'flex-start' }}>
              <span style={failTextStyle}>FAIL</span>
            </div>
        </div>

        <div style={gridRowStyle}>
          <div style={labelStyle}>หน่วยกิต</div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ ...valueStyle, backgroundColor: '#d9d9d9', fontWeight: 'bold', minHeight: 'auto' }}>
              หน่วยกิตต่ำสุด : {/* Minimum credit value here */}
            </div>
            <div style={{ ...valueStyle, minHeight: 'auto' , backgroundColor: '#d9d9d9', fontWeight: 'bold' }}>
              หน่วยกิตที่ผ่าน : {/* Credit value here */}
            </div>
          </div>
        </div>

        <div style={gridRowStyle}>
          <div style={labelStyle}>GPAX ที่ได้ </div>
          <div style={{ ...valueStyle, minHeight: 'auto' , backgroundColor: '#d9d9d9', fontWeight: 'bold' }}>
            {/* GPAX value here */}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Button type="primary" size="large" onClick={handleGraduationClick}>
            แจ้งจบการศึกษา
          </Button>
        </div>
      </Content>
      <Footer style={footerStyle}>Footer © 2025</Footer>
    </Layout>
  );
};

export default Grade;
