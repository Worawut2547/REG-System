// src/pages/dashboard/menu/check.tsx
import React from 'react';
import { Modal } from 'antd';
import type { DataType } from '../../../../../services/https/bill/bill';

interface CheckProps {
  visible: boolean;
  record: DataType | null;
  onOk: () => void;
  onCancel: () => void;
}

const Check: React.FC<CheckProps> = ({ visible, record, onOk, onCancel }) => {
  return (
    <Modal
      title="ตรวจสอบใบเสร็จรับเงิน"
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
    >
      {record ? (
        <div>
          <p>ชื่อ-สกุล: {record.fullName ?? '-'}</p>
          <p>เลขที่ใบเสร็จ: {record.receiptNo?? '-'}</p>
          <p>วันที่ชำระเงิน: {record.paymentDate?? '-'}</p>
          <p>จำนวนเงินรวม: {record.totalPrice?? '-'}</p>
        </div>
      ) : (
        <p>ไม่มีข้อมูล</p>
      )}
    </Modal>
  );
};

export default Check;
