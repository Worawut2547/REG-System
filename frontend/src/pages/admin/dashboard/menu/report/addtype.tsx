import React, { useState } from "react";
import { Card, Input, Button, Space, message, Typography } from "antd";
import axios from "axios";
import { apiUrl } from "../../../../../services/api";

type Props = { onBack?: () => void };

const AddType: React.FC<Props> = ({ onBack }) => {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!id.trim() || !name.trim()) return message.warning("กรอกรหัสและชื่อประเภทคำร้อง");
    setSaving(true);
    try {
      const payload = { ReportType_id: id.trim(), ReportType_Name: name.trim(), ReportTypeDescription: desc.trim() };
      await axios.post(`${apiUrl}/report-types`, payload, { headers: { 'Content-Type': 'application/json' } });
      message.success("เพิ่มประเภทคำร้องเรียบร้อย");
      setId(""); setName(""); setDesc("");
      onBack?.();
    } catch (e: any) {
      message.error(e?.response?.data?.error || e?.message || "เพิ่มประเภทไม่สำเร็จ");
    } finally { setSaving(false); }
  };

  return (
    <Card title="เพิ่มประเภทคำร้อง" style={{ borderRadius: 8 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Typography.Text strong>รหัสประเภทคำร้อง</Typography.Text>
          <Input placeholder="เช่น RT03" value={id} onChange={(e) => setId(e.target.value)} maxLength={16} />
        </div>
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
