import React, { useState } from "react";
import { Card, Input, Button, Space, message, Typography } from "antd";
//import axios from "axios";
import { api } from "../../../../../services/https/api";

type Props = { onBack?: () => void };

const AddType: React.FC<Props> = ({ onBack }) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) return message.warning("กรอกชื่อประเภทคำร้อง");
    setSaving(true);
    try {
      // ไม่ส่ง ReportType_id เพื่อให้หลังบ้าน gen ให้อัตโนมัติ
      const payload = { ReportType_Name: name.trim(), ReportTypeDescription: desc.trim() } as any;
      // Use trailing slash to avoid dev proxy losing /api due to redirect
      await api.post(`/report-types/`, payload, { headers: { 'Content-Type': 'application/json' } });
      message.success("เพิ่มประเภทคำร้องเรียบร้อย");
      setName(""); setDesc("");
      onBack?.();
    } catch (e: any) {
      message.error(e?.response?.data?.error || e?.message || "เพิ่มประเภทไม่สำเร็จ");
    } finally { setSaving(false); }
  };

  return (
    <Card title="เพิ่มประเภทคำร้อง" style={{ borderRadius: 8 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Typography.Text strong>ชื่อประเภทคำร้อง</Typography.Text>
          <Input placeholder="เช่น ขอยื่นคำร้องทั่วไป" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Typography.Text strong>คำอธิบาย</Typography.Text>
          <Input.TextArea rows={3} placeholder="อธิบายเพิ่มเติม (ไม่บังคับ)" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button type="primary" onClick={submit} loading={saving}>บันทึก</Button>
        </div>
      </Space>
    </Card>
  );
};

export default AddType;
