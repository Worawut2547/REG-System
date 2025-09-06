// src/pages/dashboard/menu/Grade.tsx
import React, { useState } from 'react';
import { Layout } from 'antd';
import Dashboard from './dashboard';
import StudentTable from './table';
import './grade.css';

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
const contentStyle: React.CSSProperties = {
  background: '#f5f5f5',
  padding: 24,
  minHeight: 400,
  color: '#333',
  overflowY: 'auto',
};
const footerStyle: React.CSSProperties = { background: '#1890ff', color: 'white', textAlign: 'center', padding: 12 };

const Grade: React.FC = () => {
  const [viewingDetails, setViewingDetails] = useState(false);
  const [selectedCourseKey, setSelectedCourseKey] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<any[]>([]);

  const handleViewStudents = (courseKey: string) => {
    import('./mockData').then(({ mockStudents }) => {
      setSelectedCourseKey(courseKey);
      setStudentData(mockStudents[courseKey] || []);
      setViewingDetails(true);
    });
  };

  const handleBack = () => {
    setViewingDetails(false);
    setSelectedCourseKey(null);
    setStudentData([]);
  };

  return (
    <Layout style={wrapperStyle}>
      <Header
        style={{
          background: "#2e236c",
          color: "white",
          textAlign: "center",
          fontSize: 24,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      >
        ตรวจสอบผลการเรียนนักศึกษา
      </Header>
      <Content style={contentStyle}>
        {viewingDetails ? (
          <StudentTable
            studentData={studentData}
            selectedCourseKey={selectedCourseKey}
            onBack={handleBack}
          />
        ) : (
          <Dashboard onViewStudents={handleViewStudents} />
        )}
      </Content>
      <Footer style={footerStyle}>Footer © 2025</Footer>
    </Layout>
  );
};

export default Grade;
