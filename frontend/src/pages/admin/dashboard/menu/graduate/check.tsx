// src/pages/dashboard/menu/checkGraduate.tsx
import React from 'react';
import { Modal } from 'antd';

interface GraduateRecord {
  fullName: string;
  curriculum: string;
  creditCompleted: number;
  gpax: number;
}

interface CheckGraduateProps {
  visible: boolean;
  record: GraduateRecord | null;
  onOk: () => void;
  onCancel: () => void;
}

const CheckGraduate: React.FC<CheckGraduateProps> = ({ visible, record, onOk, onCancel }) => {
  return (
    <Modal
      title="ตรวจสอบข้อมูลผู้แจ้งจบ"
      visible={visible}
      onOk={onOk}
      onCancel={onCancel}
    >
      {record ? (
        <div>
          <p>ชื่อ-สกุล: {record.fullName}</p>
          <p>โครงสร้างหลักสูตร: {record.curriculum}</p>
          <p>หน่วยกิตที่ผ่าน: {record.creditCompleted}</p>
          <p>GPAX: {record.gpax}</p>
        </div>
      ) : (
        <p>ไม่มีข้อมูล</p>
      )}
    </Modal>
  );
};

export default CheckGraduate;
