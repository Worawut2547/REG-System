// src/pages/dashboard/menu/check.tsx
import React from 'react';
import { Modal } from 'antd';

interface CheckProps {
  visible: boolean;
  record: {
    fullName: string;
    receiptNo: string;
    paymentDate: string;
  } | null;
  onOk: () => void;
  onCancel: () => void;
}

const Check: React.FC<CheckProps> = ({ visible, record, onOk, onCancel }) => {
  return (
    <Modal
      title="ตรวจสอบใบเสร็จรับเงิน"
      visible={visible}
      onOk={onOk}
      onCancel={onCancel}
    >
      {record ? (
        <div>
          <p>ชื่อ-สกุล: {record.fullName}</p>
          <p>เลขที่ใบเสร็จ: {record.receiptNo}</p>
          <p>วันที่ชำระเงิน: {record.paymentDate}</p>
        </div>
      ) : (
        <p>ไม่มีข้อมูล</p>
      )}
    </Modal>
  );
};

export default Check;
