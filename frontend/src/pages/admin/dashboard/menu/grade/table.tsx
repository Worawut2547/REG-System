// src/pages/dashboard/menu/StudentTable.tsx
import React from 'react';
import { Table , Button} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { mockCourses } from './mockData';

type StudentTableProps = {
  studentData: any[];
  selectedCourseKey: string | null;
  onBack: () => void; // ต้องประกาศ onBack ด้วย
};

const getGrade = (score: number) => {
  if (score >= 80) return 'A';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'D+';
  if (score >= 50) return 'D';
  return 'F';
};

const StudentTable: React.FC<StudentTableProps> = ({ studentData, selectedCourseKey, onBack }) => {

  const studentColumns: ColumnsType<any> = [
    { title: 'รหัสนิสิต', dataIndex: 'studentId', key: 'studentId', width: 120, align: 'left', render: text => <div style={{ textAlign: 'left' }}>{text}</div> },
    { title: 'ชื่อ', dataIndex: 'firstName', key: 'firstName', width: 150, align: 'left', render: text => <div style={{ textAlign: 'left' }}>{text}</div> },
    { title: 'นามสกุล', dataIndex: 'lastName', key: 'lastName', width: 150, align: 'left', render: text => <div style={{ textAlign: 'left' }}>{text}</div> },
    { title: 'สำนักวิชา', dataIndex: 'faculty', key: 'faculty', width: 180, align: 'center', render: text => <div style={{ textAlign: 'center' }}>{text}</div> },
    { title: 'สาขา', dataIndex: 'major', key: 'major', width: 150, align: 'center', render: text => <div style={{ textAlign: 'center' }}>{text}</div> },
    {
      title: 'Grade', dataIndex: 'score', key: 'grade', width: 120, align: 'center', render: score => {
        if (score === undefined) return '-';
        return <div style={{ textAlign: 'center' }}>{getGrade(score)}</div>;
      }
    },
  ];

  const course = mockCourses.find(c => `${c.code}-${c.section}` === selectedCourseKey);

  return (
    <>
      {/* ปุ่มย้อนกลับ */}
    <Button 
      onClick={onBack} 
      style={{ marginBottom: 20 }}
    >
      BACK
    </Button>
      
      <div style={{ fontWeight: 'bold', fontSize: 30, marginBottom: 20 }}>
        {course ? `${course.code} - ${course.name}  (Section ${course.section})` : selectedCourseKey}
      </div>

      <Table
        dataSource={studentData}
        columns={studentColumns}
        pagination={false}
        scroll={{ x: 800 }}
        bordered
        components={{
          header: {
            cell: (props: any) => (
              <th
                {...props}
                style={{
                  backgroundColor: '#c1c7d7ff',
                  color: 'black',
                  textAlign: 'center',
                  padding: '8px',
                  fontSize: '16px',
                }}
              />
            ),
          },
        }}
      />
    </>
  );
};

export default StudentTable;
