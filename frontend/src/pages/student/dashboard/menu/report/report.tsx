import React, { useEffect, useMemo, useState } from "react";
import { Layout, Select, Card, Button, Upload, Input, Modal, message, Typography, Table, Tag, Space } from "antd";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import "./report.css";

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

type AnyObj = Record<string, any>;
type Option = { value: string; label: string };

// แปลงวันที่จากหลายคีย์
function pickDate(r: AnyObj): Date | null {
  const cand =
    r.Submittion_date ||
    r.ReportSubmission_date ||
    r.Submission_date ||
    r.created_at ||
    r.CreatedAt ||
    r.Created_at;
  if (!cand) return null;
  const d = new Date(cand);
  return isNaN(+d) ? null : d;
}
function pickStatus(r: AnyObj): string {
  return r.Status ?? r.ReportStatus ?? r.status ?? "รอดำเนินการ";
}
function normalize(r: AnyObj) {
  return {
    ...r,
    _date: pickDate(r),
    _status: pickStatus(r),
  };
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  const isJSON = res.headers.get("content-type")?.includes("application/json");
  if (!res.ok) {
    const body = isJSON ? await res.json().catch(() => ({})) : await res.text();
    throw new Error((isJSON ? (body as any)?.error : (body as string)) || `HTTP ${res.status}`);
  }
  return (isJSON ? await res.json() : ((await res.text()) as T)) as T;
}

const ReportPage: React.FC = () => {
  const studentId =
    (typeof window !== "undefined" && (localStorage.getItem("studentId") || localStorage.getItem("username"))) ||
    "";

  const [typeOptions, setTypeOptions] = useState<Option[]>([]);
  const [reviewerOptions, setReviewerOptions] = useState<Option[]>([]);
  const reviewerMap = useMemo(() => Object.fromEntries(reviewerOptions.map((o) => [o.value, o.label] as const)), [reviewerOptions]);

  const [requestType, setRequestType] = useState<string>();
  const [assignee, setAssignee] = useState<string>();
  const [details, setDetails] = useState<string>("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [rows, setRows] = useState<AnyObj[]>([]);
  const [loading, setLoading] = useState(false);

  const uploadProps: UploadProps = {
    beforeUpload: () => false,
    onChange: (info) => setFileList(info.fileList),
    multiple: false,
    fileList,
    listType: "text",
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const rtypes = await http<any[]>(`/report-types`);
      setTypeOptions((rtypes || []).map((t: any) => ({ value: t.ReportType_id, label: t.ReportType_Name ?? t.ReportType_id })));

      const reviewers = await http<any[]>(`/reviewers`);
      setReviewerOptions(reviewers || []);

      // เส้นทางฝั่ง backend: /students/reports/:sid
      const history = await http<any[]>(`/students/reports/${encodeURIComponent(studentId)}`);
      setRows((history || []).map(normalize));
    } catch (e: any) {
      message.error(e?.message || "โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const columns = useMemo(
    () => [
      {
        title: "วันที่ยื่น",
        dataIndex: "_date",
        key: "date",
        sorter: (a: AnyObj, b: AnyObj) => (a._date?.getTime() ?? 0) - (b._date?.getTime() ?? 0),
        defaultSortOrder: "descend" as const,
        render: (d: Date | null) => (d ? d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "-"),
        width: 200,
      },
      {
        title: "ประเภท",
        key: "type",
        render: (_: any, r: AnyObj) => r?.ReportType?.ReportType_Name ?? r?.ReportType_id ?? "-",
        width: 220,
      },
      {
        title: "ผู้พิจารณา",
        key: "reviewer",
        render: (_: any, r: AnyObj) => reviewerMap[r?.Reviewer_id] ?? r?.Reviewer?.User?.Username ?? "-",
        width: 220,
      },
      {
        title: "สถานะ",
        dataIndex: "_status",
        key: "status",
        render: (s: string) => <Tag color={s === "อนุมัติ" ? "green" : s === "ไม่อนุมัติ" ? "red" : "gold"}>{s}</Tag>,
        width: 140,
      },
      { title: "เรื่อง", dataIndex: "Report_details", key: "details", ellipsis: true },
    ],
    [reviewerMap]
  );

  const handleSubmitClick = () => {
    if (!requestType) return message.warning("กรุณาเลือกประเภทคำร้อง");
    if (!assignee) return message.warning("กรุณาเลือกผู้รับผิดชอบ");
    if (!details.trim()) return message.warning("กรุณากรอกรายละเอียดคำร้อง");
    setConfirmOpen(true);
  };

  const handleConfirmOk = async () => {
    try {
      const form = new FormData();
      form.append("student_id", studentId);
      form.append("report_type_id", requestType!);
      form.append("reviewer_id", assignee!);
      form.append("details", details);
      const file = fileList[0]?.originFileObj as File | undefined;
      if (file) form.append("file", file);

      await http(`/reports/`, { method: "POST", body: form });
      message.success("ส่งคำร้องเรียบร้อย");

      setConfirmOpen(false);
      setRequestType(undefined);
      setAssignee(undefined);
      setDetails("");
      setFileList([]);

      await fetchAll();
    } catch (e: any) {
      message.error(e?.message || "ส่งคำร้องไม่สำเร็จ");
    }
  };

  return (
    <Layout style={{ borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header style={{ background: "#2e236c", color: "white", textAlign: "center", padding: 16, fontSize: 20, fontWeight: "bold" }}>
        ระบบคำร้อง
      </Header>

      <Content style={{ background: "#f5f5f5", padding: 24, minHeight: 400, color: "#333", overflowY: "auto" }}>
        <div style={{ display: "flex", gap: 100, flexWrap: "wrap", justifyContent: "center" }}>
          <Select style={{ width: 260 }} placeholder="เลือกคำร้อง" options={typeOptions} value={requestType} onChange={setRequestType} />
          <Select style={{ width: 260 }} placeholder="เลือกผู้รับผิดชอบ" options={reviewerOptions} value={assignee} onChange={setAssignee} />
        </div>

        <Card title="รายละเอียดคำร้อง" style={{ marginTop: 24 }}>
          <Input.TextArea rows={4} placeholder="กรุณาใส่รายละเอียดคำร้องของคุณที่นี่" style={{ marginBottom: 20, backgroundColor: "white" }} value={details} onChange={(e) => setDetails(e.target.value)} />
          <p>คุณสามารถแนบไฟล์ที่เกี่ยวข้องได้ที่นี่...</p>
          <Upload {...uploadProps}><Button>เลือกไฟล์</Button></Upload>
        </Card>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
          <Space>
            <Button onClick={() => { setRequestType(undefined); setAssignee(undefined); setDetails(""); setFileList([]); }}>ล้างฟอร์ม</Button>
            <Button type="primary" onClick={handleSubmitClick}>ส่งคำร้อง</Button>
          </Space>
        </div>

        <Card title="ประวัติคำร้องของฉัน" style={{ marginTop: 24 }}>
          <Table
            rowKey={(r: AnyObj) => r.Report_id ?? JSON.stringify(r)}
            dataSource={rows}
            columns={columns as any}
            loading={loading}
            pagination={{ pageSize: 5 }}
          />
        </Card>
      </Content>

      <Footer style={{ background: "#1890ff", color: "white", textAlign: "center", padding: 12 }}>
        Footer © 2025
      </Footer>

      <Modal
        title="ยืนยันการส่งคำร้อง"
        open={confirmOpen}
        onOk={handleConfirmOk}
        onCancel={() => setConfirmOpen(false)}
        okText="ยืนยันส่ง"
        cancelText="ตรวจแก้"
        centered
        destroyOnClose
        maskClosable={false}
        closable={false}
      >
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6 }}><Text strong>ประเภทคำร้อง: </Text><Text>{typeOptions.find((o) => o.value === requestType)?.label ?? "-"}</Text></div>
          <div style={{ marginBottom: 6 }}><Text strong>ผู้รับผิดชอบ: </Text><Text>{reviewerOptions.find((o) => o.value === assignee)?.label ?? "-"}</Text></div>
          <div style={{ marginBottom: 6 }}><Text strong>รายละเอียด: </Text><Text>{details.length > 180 ? details.slice(0, 180) + "…" : details || "-"}</Text></div>
          <div><Text strong>ไฟล์แนบ: </Text><Text>{fileList.length === 0 ? "—" : `${fileList.length} ไฟล์ (${fileList.map((f) => f.name).join(", ")})`}</Text></div>
        </div>
      </Modal>
    </Layout>
  );
};

export default ReportPage;
