// src/pages/teacher/dashboard/menu/report/report.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Layout, Card, Table, Tag, Button, Modal, Typography, message, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { apiUrl } from "../../../../../services/api";
import "./report.css";

const { Header, Content, Footer } = Layout;
const { Text, Title } = Typography;

type AnyObj = Record<string, any>;

// register.tsx  – only wrapperStyle changed
const wrapperStyle: React.CSSProperties = {
  /* keep your corner-rounding / shadow if you like */
  borderRadius: 8,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',

  /* 👇 stretch full size of parent Content */
  width: '100%',          // fill X
  minHeight: '100vh',     // ใช้พื้นที่เต็มหน้าจอ
  display: 'flex',        // so Header/Content/Footer stack vertically
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  background: '#2e236c',            // ม่วงเข้ม
  color: 'white',
  textAlign: 'center',
  padding: 16,
  fontSize: 20,
};

const contentStyle: React.CSSProperties = {
  background: '#f5f5f5',            // เทาอ่อน
  padding: 24,
  minHeight: 400,
  color: '#333',
  overflowY: 'auto',                // ให้สามารถเลื่อนขึ้นลงได้
};

const footerStyle: React.CSSProperties = {
  background: '#1890ff',            // ฟ้า Ant Design
  color: 'white',
  textAlign: 'center',
  padding: 12,
};

// Helpers
const toApi = (p: string) => (!p ? "" : p.startsWith("http") ? p : p.startsWith("/") ? `${apiUrl}${p}` : `${apiUrl}/${p}`);
const pickDate = (r: AnyObj): Date | null => {
  const s = r.Submittion_date || r.Submission_date || r.submittion_date || r.created_at || r.Created_at || r.CreatedAt;
  if (!s) return null;
  const d = new Date(s);
  return isNaN(+d) ? null : d;
};
const fmtDate = (d: Date | null) => (d ? d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "-");
const pickStatus = (r: AnyObj): string => r.Status || r.ReportStatus || r.status || "รอดำเนินการ";
const normalizeAttachments = (a: any): AnyObj[] => (!a ? [] : Array.isArray(a) ? a : Array.isArray(a.attachments) ? a.attachments : [a]);
const attName = (a: AnyObj) => a.File_Name || a.file_name || a.Attachment_File_Name || a.Attachment_id || a.attachment_id || "ไฟล์แนบ";
const attPath = (a: AnyObj) => a.File_Path || a.file_path || a.Attachment_File_Path || "";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiUrl}${path}`, init);
  const isJSON = res.headers.get("content-type")?.includes("application/json");
  if (!res.ok) {
    const body = isJSON ? await res.json().catch(() => ({})) : await res.text();
    throw new Error((isJSON ? (body as any)?.error : (body as string)) || `HTTP ${res.status}`);
  }
  return (isJSON ? await res.json() : ((await res.text()) as T)) as T;
}

const TeacherReport: React.FC = () => {
  // ตัวช่วยหา reviewer ของผู้ใช้ปัจจุบัน
  const candidates = useMemo(() => {
    if (typeof window === "undefined") return [] as string[];
    return Array.from(new Set([
      localStorage.getItem("reviewer_id"),
      localStorage.getItem("username"),
      localStorage.getItem("teacher_id"),
      localStorage.getItem("email"),
    ].filter(Boolean).map((s) => s!.trim())));
  }, []);

  const [rows, setRows] = useState<AnyObj[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<AnyObj | null>(null);
  const [atts, setAtts] = useState<AnyObj[]>([]);
  const [attLoading, setAttLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // หา reviewer_id
        let rid = localStorage.getItem("reviewer_id") || "";
        if (!rid && candidates.length) {
          for (const cand of candidates) {
            try {
              const r = await http<{ reviewer_id: string }>(`/reviewers/by-username/${encodeURIComponent(cand)}`);
              if (r?.reviewer_id) { rid = r.reviewer_id; localStorage.setItem("reviewer_id", rid); break; }
            } catch {}
          }
        }

        // ดึงรายการของ reviewer
        let list: AnyObj[] = [];
        if (rid) {
          try { list = await http<AnyObj[]>(`/reviewers/${encodeURIComponent(rid)}/reports`); } catch {}
        }
        if (!list?.length) {
          // fallback: ผู้ใช้บทบาท teacher ทั้งหมด
          try { list = await http<AnyObj[]>(`/reports/?role=teacher`); } catch {}
        }
        if (!list?.length) {
          // fallback สุดท้าย: ดึงทั้งหมดแล้วกรองด้วย username ปัจจุบัน
          try {
            const all = await http<AnyObj[]>(`/reports/`);
            const lowers = candidates.map((s) => s.toLowerCase());
            list = (all || []).filter((r) => {
              if (rid && (r.Reviewer_id === rid || r.reviewer_id === rid)) return true;
              const u = r?.Reviewer?.User?.Username || r?.Reviewer?.user?.username || "";
              return u && lowers.includes(String(u).toLowerCase());
            });
          } catch {}
        }

        const ordered = [...(list || [])].sort((a, b) => (pickDate(b)?.getTime() ?? 0) - (pickDate(a)?.getTime() ?? 0));
        setRows(ordered);
      } catch (e: any) {
        message.error(e?.message || "โหลดข้อมูลล้มเหลว");
      } finally { setLoading(false); }
    })();
  }, [candidates]);

  const columns: ColumnsType<AnyObj> = [
    { title: "เรื่อง", key: "type", render: (_: any, r: AnyObj) => r?.ReportType?.ReportType_Name ?? r?.ReportType_id ?? "-" },
    { title: "จาก", key: "from", render: (_: any, r: AnyObj) => r.StudentID || r.student_id || "-", width: 160 },
    {
      title: "วันที่ยื่น", key: "date", width: 200, sorter: (a, b) => (pickDate(a)?.getTime() ?? 0) - (pickDate(b)?.getTime() ?? 0), defaultSortOrder: "descend",
      render: (_: any, r: AnyObj) => fmtDate(pickDate(r)),
    },
    { title: "สถานะ", key: "status", width: 140, render: (_: any, r: AnyObj) => {
      const s = pickStatus(r); const color = s === "อนุมัติ" ? "green" : s === "ไม่อนุมัติ" ? "red" : "gold"; return <Tag color={color}>{s}</Tag>;
    }},
    { title: "รายละเอียดทั้งหมด", key: "action", width: 160, render: (_: any, r: AnyObj) => (<Button type="link" onClick={() => openModal(r)}>ดูรายละเอียด</Button>) },
  ];

  const openModal = async (r: AnyObj) => {
    setSel(r); setOpen(true);
    const pre = normalizeAttachments(r.Attachments || r.attachments || r.Attachment);
    if (pre.length) { setAtts(pre); return; }
    setAttLoading(true);
    try {
      const id = r.Report_id || r.report_id;
      const one = await http<AnyObj>(`/reports/${encodeURIComponent(String(id))}`);
      setAtts(normalizeAttachments(one?.Attachments || one?.attachments || one?.Attachment));
    } catch { setAtts([]); } finally { setAttLoading(false); }
  };

  const changeStatus = async (status: string) => {
    if (!sel) return;
    const id = sel.Report_id || sel.report_id;
    setSaving(true);
    try {
      await http(`/reports/${encodeURIComponent(String(id))}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      setRows(prev => prev.map(r => (String(r.Report_id || r.report_id) === String(id) ? { ...r, Status: status } : r)));
      message.success("อัปเดตสถานะสำเร็จ");
      setOpen(false); setSel(null);
    } catch (e: any) {
      message.error(e?.message || "อัปเดตสถานะไม่สำเร็จ");
    } finally { setSaving(false); }
  };

  return (

    <Layout style={wrapperStyle}>
          <Header style={headerStyle}>ระบบคำร้อง</Header>
          <Content style={contentStyle}>
            <Card title="รายการคำร้องที่ส่งให้ฉัน" style={{ borderRadius: 8 }}>
          <Table rowKey={(r) => r.Report_id || r.report_id} columns={columns as any} dataSource={rows} loading={loading} pagination={{ pageSize: 6 }} />
        </Card>

        <Modal open={open} onCancel={() => setOpen(false)} footer={null} centered title="รายละเอียดคำร้อง">
          {sel && (
            <div>
              <Title level={5} style={{ marginBottom: 4 }}>{sel.ReportType?.ReportType_Name ?? sel.ReportType_id ?? "-"}</Title>
              <div style={{ marginBottom: 6 }}><Text type="secondary">จาก: </Text><Text>{sel.StudentID || sel.student_id || "-"}</Text></div>
              <div style={{ marginBottom: 6 }}><Text type="secondary">วันที่ยื่น: </Text><Text>{fmtDate(pickDate(sel))}</Text></div>
              <div style={{ marginBottom: 10 }}><Text type="secondary">รายละเอียด: </Text><div>{sel.Report_details || sel.report_details || "-"}</div></div>
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary">ไฟล์แนบ: </Text>
                {attLoading ? (<span style={{ marginLeft: 8 }}><Spin size="small" /></span>) : (atts.length === 0 ? (<Text>—</Text>) : (
                  <ul style={{ marginTop: 8 }}>
                    {atts.map((a, i) => {
                      const href = toApi(attPath(a));
                      return (
                        <li key={a.attachment_id || a.Attachment_id || String(i)}>
                          {href ? <a href={href} target="_blank" rel="noreferrer">{attName(a)}</a> : <span>{attName(a)}</span>}
                        </li>
                      );
                    })}
                  </ul>
                ))}
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Button disabled={saving} onClick={() => changeStatus("ไม่อนุมัติ")}>
                  ไม่อนุมัติ
                </Button>
                <Button type="primary" disabled={saving} onClick={() => changeStatus("อนุมัติ")}>
                  อนุมัติ
                </Button>
              </div>
            </div>
          )}
        </Modal>
          </Content>
          <Footer style={footerStyle}>Footer © 2025</Footer>
        </Layout>

  );
};

export default TeacherReport;
