import React, { useEffect, useState } from "react";
import { Card, Table, Button, message, Popconfirm } from "antd";
//import axios from "axios";
import { api } from "../../../../../services/https/api";

type ReportType = { ReportType_id: string; ReportType_Name?: string; ReportTypeDescription?: string };

const DropType: React.FC = () => {
  const [rows, setRows] = useState<ReportType[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // Trailing slash prevents 301 redirect that can drop the /api prefix
      const res = await api.get(`/report-types/`);
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      message.error(e?.message || "โหลดประเภทคำร้องไม่สำเร็จ");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    try {
      await api.delete(`/report-types/${encodeURIComponent(id)}`);
      message.success("ลบประเภทคำร้องแล้ว");
      await load();
    } catch (e: any) {
      message.error(e?.response?.data?.error || e?.message || "ลบไม่สำเร็จ");
    }
  };

  return (
    <Card title="ลบประเภทคำร้อง" style={{ borderRadius: 8 }}>
      <Table
        rowKey={(r) => r.ReportType_id}
        dataSource={rows}
        loading={loading}
        pagination={{ pageSize: 8 }}
        columns={[
          { title: "รหัส", dataIndex: "ReportType_id", key: "id", width: 140 },
          { title: "ชื่อประเภท", dataIndex: "ReportType_Name", key: "name" },
          { title: "คำอธิบาย", dataIndex: "ReportTypeDescription", key: "desc" },
          { title: "", key: "action", width: 120, render: (_: any, r: ReportType) => (
              <Popconfirm title={`ยืนยันลบ ${r.ReportType_id}?`} onConfirm={() => remove(r.ReportType_id)}>
                <Button danger>ลบ</Button>
              </Popconfirm>
            ) },
        ] as any}
      />
    </Card>
  );
};

export default DropType;
