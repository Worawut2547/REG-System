import React from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type StudentTableProps = {
  studentData: any[];
  section: number; // เป็นตัวเลข
};

const StudentTable: React.FC<StudentTableProps> = ({ studentData, section }) => {

  const studentColumns: ColumnsType<any> = [
    { title: 'รหัสนิสิต', dataIndex: 'studentId', key: 'studentId', width: 120, render: text => <div style={{ textAlign: 'left' }}>{text}</div> },
    { title: 'ชื่อ', dataIndex: 'firstName', key: 'firstName', width: 150, render: text => <div style={{ textAlign: 'left' }}>{text}</div> },
    { title: 'นามสกุล', dataIndex: 'lastName', key: 'lastName', width: 150, render: text => <div style={{ textAlign: 'left' }}>{text}</div> },
    { title: 'สำนักวิชา', dataIndex: 'faculty', key: 'faculty', width: 180, render: text => <div style={{ textAlign: 'center' }}>{text}</div> },
    { title: 'สาขา', dataIndex: 'major', key: 'major', width: 150, render: text => <div style={{ textAlign: 'center' }}>{text}</div> },
    {
      title: 'Total Score (100%)',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      render: (score: number | undefined) => (
        <div style={{ textAlign: 'center' }}>
          {score ?? '-'}
        </div>
      ),
    }
  ];

  return (
    <Table
      dataSource={studentData}
      columns={studentColumns}
      bordered
      pagination={false}
      scroll={{ x: 900 }}
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
                fontSize: '16px'
              }}
            />
          ),
        },
      }}
    />
  );
};

export default StudentTable;
