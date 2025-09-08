import React, { useState, useEffect } from 'react';
import { Modal, Radio, Input, Form } from 'antd';
import type { GraduationInterface } from '../../../../../interfaces/Graduation';

interface CheckGraduateProps {
  visible: boolean;
  record: GraduationInterface | null;
  onOk: (status: string, reason?: string) => void;
  onCancel: () => void;
}

const CheckGraduate: React.FC<CheckGraduateProps> = ({ visible, record, onOk, onCancel }) => {
  const [status, setStatus] = useState('30'); // 30=อนุมัติ, 40=ไม่อนุมัติ
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (record) {
      setStatus(record.statusStudent === 'อนุมัติ' ? '30' : '40');
      setReason(record.reason || '');
    }
  }, [record]);

  const handleOk = () => {
    if (status === '40' && !reason.trim()) {
      return; // ต้องกรอกเหตุผล
    }
    onOk(status, reason);
  };

  return (
    <Modal
      title={`ตรวจสอบคำขอจบ: ${record?.fullName}`}
      visible={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText="บันทึก"
      cancelText="ยกเลิก"
    >
      <Form layout="vertical">
        <Form.Item label="สถานะ">
          <Radio.Group onChange={e => setStatus(e.target.value)} value={status}>
            <Radio value="30">อนุมัติ</Radio>
            <Radio value="40">ไม่อนุมัติ</Radio>
          </Radio.Group>
        </Form.Item>

        {status === '40' && (
          <Form.Item label="เหตุผลปฏิเสธ">
            <Input.TextArea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="ระบุเหตุผลปฏิเสธ"
              rows={3}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default CheckGraduate;
