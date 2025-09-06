import React from 'react';
import { Table, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type CourseTableProps = {
  dataSource: any[];
  limit: number;
  onViewStudents: (course: any) => void;
};

const CourseTable: React.FC<CourseTableProps> = ({ dataSource, limit, onViewStudents }) => {
  const courseColumns: ColumnsType<any> = [
    { title: 'รหัสวิชา', dataIndex: 'code', key: 'code', align: 'center', render: text => <div style={{ textAlign: 'left' }}>{text}</div> },
    { title: 'ชื่อรายวิชา', dataIndex: 'name', key: 'name', align: 'center', render: text => <div style={{ textAlign: 'left' }}>{text}</div> },
    { title: 'อาจารย์ผู้สอน', dataIndex: 'instructor', key: 'instructor', align: 'center', render: text => <div style={{ textAlign: 'left' }}>{text}</div> },
    { title: 'จำนวนนักศึกษา', dataIndex: 'students', key: 'students', align: 'center' },
    { title: 'หน่วยกิต', dataIndex: 'credit', key: 'credit', align: 'center' },
    { title: 'Section', dataIndex: 'section', key: 'section', align: 'center' },
    {
      title: 'รายละเอียด',
      key: 'action',
      align: 'center',
      render: (_: any, record: any) => (
        <Button
          type="link"
          onClick={() => onViewStudents(record)}
          style={{
            backgroundColor: '#f2ffbcff',
            borderColor: 'rgba(223, 228, 155, 1)',
            color: 'black'
          }}
        >
          ดูรายละเอียด
        </Button>
      ),
    },
  ];

  return (
    <Table
      dataSource={dataSource}
      columns={courseColumns}
      pagination={{ pageSize: limit }}
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
                textAlign: props.align || 'center',
                padding: '8px',
                fontSize: '16px',
              }}
            />
          ),
        },
      }}
    />
  );
};

export default CourseTable;
