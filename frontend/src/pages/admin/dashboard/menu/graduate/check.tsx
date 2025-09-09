import React, { useState, useEffect } from 'react';
import { Modal, Radio, Input, Form, message } from 'antd';
import type { GraduationInterface } from '../../../../../interfaces/Graduation';

type Props = {
  visible: boolean;
  record: GraduationInterface | null;
  onOk: (status: string, reason?: string) => void;
  onCancel: () => void;
};

const CheckGraduate: React.FC<Props> = ({ visible, record, onOk, onCancel }) => {
  const [status, setStatus] = useState<string>('30'); // default approve
  const [reason, setReason] = useState<string>('');
  const [form] = Form.useForm();

  useEffect(() => {
    if (record) {
      setStatus(record.statusStudent === "ไม่อนุมัติให้สำเร็จการศึกษา" ? '40' : '30');
      setReason(record.reason || '');
      form.resetFields();
    }
  }, [record, form]);

  const handleOk = async () => {
    if (status === '40' && !reason.trim()) {
      message.warning('กรุณากรอกเหตุผลสำหรับการไม่อนุมัติ');
      return;
    }
    onOk(status, reason);
  };

  return (
    <Modal
      title={`ตรวจสอบแจ้งจบ: ${record?.fullName ?? ''}`}
      visible={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText="บันทึก"
      cancelText="ยกเลิก"
    >
      <Form form={form} layout="vertical">
        <Form.Item label="สถานะ">
          <Radio.Group onChange={(e) => setStatus(e.target.value)} value={status}>
            <Radio value="30">อนุมัติสำเร็จการศึกษา</Radio>
            <Radio value="40">ไม่อนุมัติให้สำเร็จการศึกษา</Radio>
          </Radio.Group>
        </Form.Item>

        {status === '40' && (
          <Form.Item label="เหตุผลปฏิเสธ">
            <Input.TextArea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="กรอกเหตุผลปฏิเสธ"
              rows={4}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default CheckGraduate;